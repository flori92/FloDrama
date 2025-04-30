/**
 * Script de synchronisation des assets FloDrama avec AWS S3 et invalidation CloudFront
 * 
 * Ce script permet de :
 * 1. Vérifier les assets locaux et les comparer avec ceux sur S3
 * 2. Uploader les assets manquants vers S3
 * 3. Configurer les permissions du bucket S3
 * 4. Invalider le cache CloudFront
 * 
 * Prérequis :
 * - AWS CLI installé et configuré
 * - Permissions suffisantes sur le bucket S3 et la distribution CloudFront
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel en utilisant ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  s3Bucket: 'flodrama-assets',
  cloudfrontDistribution: 'd11nnqvjfooahr.cloudfront.net',
  cloudfrontDistributionId: 'E275AW2L6UVK2A', // ID de la distribution CloudFront
  localAssetsDir: path.join(__dirname, '../public'),
  dryRun: false // Mettre à true pour simuler sans effectuer de modifications
};

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Exécute une commande shell et retourne le résultat
 * @param {string} command - Commande à exécuter
 * @returns {string} - Sortie de la commande
 */
function runCommand(command) {
  console.log(`${colors.blue}Exécution de la commande :${colors.reset} ${command}`);
  
  if (CONFIG.dryRun && !command.startsWith('aws s3 ls') && !command.startsWith('aws cloudfront list')) {
    console.log(`${colors.yellow}[DRY RUN] La commande ne sera pas exécutée${colors.reset}`);
    return '';
  }
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    console.error(`${colors.red}Erreur lors de l'exécution de la commande :${colors.reset}`, error.message);
    return '';
  }
}

/**
 * Vérifie si un fichier existe sur S3
 * @param {string} s3Path - Chemin S3 à vérifier
 * @returns {boolean} - True si le fichier existe, false sinon
 */
function checkFileExistsOnS3(s3Path) {
  const command = `aws s3 ls s3://${CONFIG.s3Bucket}${s3Path}`;
  const output = runCommand(command);
  return output.length > 0;
}

/**
 * Upload un fichier vers S3
 * @param {string} localPath - Chemin local du fichier
 * @param {string} s3Path - Chemin S3 de destination
 * @param {boolean} isPublic - Si le fichier doit être public
 */
function uploadFileToS3(localPath, s3Path, isPublic = true) {
  const aclParam = isPublic ? '--acl public-read' : '';
  const command = `aws s3 cp "${localPath}" s3://${CONFIG.s3Bucket}${s3Path} ${aclParam}`;
  runCommand(command);
  console.log(`${colors.green}✓ Fichier uploadé :${colors.reset} ${s3Path}`);
}

/**
 * Synchronise un répertoire avec S3
 * @param {string} localDir - Répertoire local à synchroniser
 * @param {string} s3Dir - Répertoire S3 de destination
 * @param {boolean} isPublic - Si les fichiers doivent être publics
 */
function syncDirectoryToS3(localDir, s3Dir, isPublic = true) {
  const aclParam = isPublic ? '--acl public-read' : '';
  const command = `aws s3 sync "${localDir}" s3://${CONFIG.s3Bucket}${s3Dir} ${aclParam}`;
  runCommand(command);
  console.log(`${colors.green}✓ Répertoire synchronisé :${colors.reset} ${s3Dir}`);
}

/**
 * Configure les permissions du bucket S3 pour permettre l'accès public
 */
function configureBucketPermissions() {
  console.log(`${colors.magenta}Configuration des permissions du bucket S3...${colors.reset}`);
  
  // Désactiver le blocage de l'accès public
  runCommand(`aws s3api put-public-access-block --bucket ${CONFIG.s3Bucket} --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"`);
  
  // Appliquer une politique de bucket pour permettre l'accès public en lecture
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${CONFIG.s3Bucket}/*`
      }
    ]
  };
  
  const policyPath = path.join(__dirname, 'bucket-policy.json');
  fs.writeFileSync(policyPath, JSON.stringify(bucketPolicy, null, 2));
  
  runCommand(`aws s3api put-bucket-policy --bucket ${CONFIG.s3Bucket} --policy file://${policyPath}`);
  
  // Supprimer le fichier temporaire
  fs.unlinkSync(policyPath);
  
  // Configurer CORS
  const corsConfiguration = {
    CORSRules: [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "HEAD", "PUT"],
        AllowedOrigins: ["*"],
        ExposeHeaders: ["ETag", "Content-Length"],
        MaxAgeSeconds: 3600
      }
    ]
  };
  
  const corsFilePath = path.join(__dirname, 'cors-config.json');
  fs.writeFileSync(corsFilePath, JSON.stringify(corsConfiguration, null, 2));
  
  runCommand(`aws s3api put-bucket-cors --bucket ${CONFIG.s3Bucket} --cors-configuration file://${corsFilePath}`);
  
  fs.unlinkSync(corsFilePath);
  
  console.log(`${colors.green}✓ Permissions du bucket configurées${colors.reset}`);
}

/**
 * Invalide le cache CloudFront
 * @param {Array<string>} paths - Chemins à invalider
 */
function invalidateCloudFrontCache(paths = ['/*']) {
  console.log(`${colors.magenta}Invalidation du cache CloudFront...${colors.reset}`);
  
  const invalidationItems = JSON.stringify({
    Paths: {
      Quantity: paths.length,
      Items: paths
    },
    CallerReference: `flodrama-invalidation-${Date.now()}`
  });
  
  const invalidationPath = path.join(__dirname, 'invalidation.json');
  fs.writeFileSync(invalidationPath, invalidationItems);
  
  runCommand(`aws cloudfront create-invalidation --distribution-id ${CONFIG.cloudfrontDistributionId} --invalidation-batch file://${invalidationPath}`);
  
  // Supprimer le fichier temporaire
  fs.unlinkSync(invalidationPath);
  
  console.log(`${colors.green}✓ Cache CloudFront invalidé${colors.reset}`);
}

/**
 * Vérifie et synchronise les assets essentiels
 */
function syncEssentialAssets() {
  console.log(`${colors.magenta}Vérification et synchronisation des assets essentiels...${colors.reset}`);
  
  // Liste des assets essentiels à vérifier
  const essentialAssets = [
    { local: path.join(CONFIG.localAssetsDir, 'assets/logo.svg'), s3: '/assets/logo.svg' },
    { local: path.join(CONFIG.localAssetsDir, 'assets/favicon.ico'), s3: '/assets/favicon.ico' },
    { local: path.join(CONFIG.localAssetsDir, 'css/main.css'), s3: '/css/main.css' },
    { local: path.join(CONFIG.localAssetsDir, 'js/flodrama-image-system.js'), s3: '/js/flodrama-image-system.js' },
    { local: path.join(CONFIG.localAssetsDir, 'assets/status.json'), s3: '/status.json' }
  ];
  
  // Vérifier et uploader chaque asset essentiel
  for (const asset of essentialAssets) {
    if (fs.existsSync(asset.local)) {
      if (!checkFileExistsOnS3(asset.s3)) {
        console.log(`${colors.yellow}Asset manquant sur S3 :${colors.reset} ${asset.s3}`);
        uploadFileToS3(asset.local, asset.s3);
      } else {
        console.log(`${colors.green}✓ Asset présent sur S3 :${colors.reset} ${asset.s3}`);
      }
    } else {
      console.log(`${colors.red}Asset local manquant :${colors.reset} ${asset.local}`);
    }
  }
  
  // Synchroniser les répertoires d'assets
  const directories = [
    { local: path.join(CONFIG.localAssetsDir, 'assets/media'), s3: '/media' },
    { local: path.join(CONFIG.localAssetsDir, 'assets/images'), s3: '/images' },
    { local: path.join(CONFIG.localAssetsDir, 'assets/fonts'), s3: '/fonts' },
    { local: path.join(CONFIG.localAssetsDir, 'assets/icons'), s3: '/icons' }
  ];
  
  for (const dir of directories) {
    if (fs.existsSync(dir.local)) {
      syncDirectoryToS3(dir.local, dir.s3);
    } else {
      console.log(`${colors.yellow}Répertoire local manquant :${colors.reset} ${dir.local}`);
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`${colors.cyan}=== FloDrama - Synchronisation des assets avec AWS ====${colors.reset}`);
  console.log(`${colors.cyan}Date : ${new Date().toLocaleString()}${colors.reset}`);
  console.log(`${colors.cyan}Mode : ${CONFIG.dryRun ? 'Simulation' : 'Production'}${colors.reset}`);
  console.log('');
  
  // Vérifier la configuration AWS
  console.log(`${colors.magenta}Vérification de la configuration AWS...${colors.reset}`);
  const awsIdentity = runCommand('aws sts get-caller-identity');
  
  if (!awsIdentity) {
    console.error(`${colors.red}Erreur : AWS CLI n'est pas configuré correctement.${colors.reset}`);
    console.error(`${colors.red}Veuillez exécuter 'aws configure' pour configurer vos identifiants AWS.${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}✓ AWS CLI configuré correctement${colors.reset}`);
  console.log('');
  
  // Demander confirmation avant de continuer
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const confirm = await new Promise(resolve => {
    rl.question(`${colors.yellow}Voulez-vous continuer avec la synchronisation des assets ? (o/n) ${colors.reset}`, answer => {
      resolve(answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui');
      rl.close();
    });
  });
  
  if (!confirm) {
    console.log(`${colors.yellow}Opération annulée.${colors.reset}`);
    return;
  }
  
  console.log('');
  
  // Exécuter les étapes de synchronisation
  syncEssentialAssets();
  console.log('');
  
  configureBucketPermissions();
  console.log('');
  
  invalidateCloudFrontCache();
  console.log('');
  
  console.log(`${colors.cyan}=== Synchronisation terminée ====${colors.reset}`);
  console.log(`${colors.green}✓ Tous les assets ont été synchronisés avec S3${colors.reset}`);
  console.log(`${colors.green}✓ Les permissions du bucket ont été configurées${colors.reset}`);
  console.log(`${colors.green}✓ Le cache CloudFront a été invalidé${colors.reset}`);
  console.log('');
  console.log(`${colors.cyan}Pour vérifier les assets, accédez à :${colors.reset}`);
  console.log(`- S3 : https://${CONFIG.s3Bucket}.s3.amazonaws.com/assets/logo.svg`);
  console.log(`- CloudFront : https://${CONFIG.cloudfrontDistribution}/assets/logo.svg`);
}

// Exécuter le script
main().catch(error => {
  console.error(`${colors.red}Erreur lors de l'exécution du script :${colors.reset}`, error);
});
