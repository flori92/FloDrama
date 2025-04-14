const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script de sauvegarde automatique pour FloDrama Frontend
 * Suit les directives de développement établies
 */

const BACKUP_DIR = path.join(__dirname, '../backups');
const SRC_DIR = path.join(__dirname, '../src');

// Création du répertoire de sauvegarde s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Génération du nom de sauvegarde avec timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupName = `${timestamp}_backup_frontend`;

// Fonction de sauvegarde
async function createBackup() {
    try {
        // Création de l'archive
        const backupPath = path.join(BACKUP_DIR, backupName);
        execSync(`tar -czf ${backupPath}.tar.gz -C ${SRC_DIR} .`);

        // Vérification des modifications Git
        const gitStatus = execSync('git status --porcelain').toString();
        
        if (gitStatus) {
            // Création d'un commit si des modifications sont détectées
            execSync('git add .');
            execSync(`git commit -m "✨ [SAUVEGARDE] ${backupName}"`);
            
            try {
                // Tentative de push
                execSync('git push origin main');
                console.log('✅ Push réussi vers main');
            } catch (pushError) {
                // Génération du rapport d'erreur en français
                console.error('❌ Erreur lors du push :', pushError.message);
                fs.writeFileSync(
                    path.join(BACKUP_DIR, `${backupName}_error_log.txt`),
                    `Erreur de Push Git\n${new Date().toISOString()}\n\n${pushError.message}`
                );
            }
        }

        console.log(`✅ Sauvegarde créée : ${backupName}`);

        // Nettoyage des anciennes sauvegardes (conservation 30 jours)
        const OLD_BACKUP_LIMIT = 30 * 24 * 60 * 60 * 1000; // 30 jours en millisecondes
        const files = fs.readdirSync(BACKUP_DIR);
        
        files.forEach(file => {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            
            if (Date.now() - stats.mtime.getTime() > OLD_BACKUP_LIMIT) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Ancienne sauvegarde supprimée : ${file}`);
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde :', error.message);
        process.exit(1);
    }
}

// Exécution de la sauvegarde
createBackup();
