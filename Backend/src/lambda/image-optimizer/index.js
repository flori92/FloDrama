'use strict';

const AWS = require('aws-sdk');
const Sharp = require('sharp');

// Configuration des tailles d'images prédéfinies
const ALLOWED_DIMENSIONS = {
  thumbnail: { width: 200, height: 200 },
  small: { width: 400, height: 300 },
  medium: { width: 800, height: 600 },
  large: { width: 1200, height: 900 },
  hero: { width: 1920, height: 1080 }
};

// Extensions d'images supportées
const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

exports.handler = async (event) => {
  const { request } = event.Records[0].cf;
  
  try {
    // Vérifier si la requête concerne une image
    const uri = request.uri;
    const extension = uri.split('.').pop().toLowerCase();
    
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      // Pas une image supportée, continuer sans modification
      return request;
    }
    
    // Analyser les paramètres de requête
    const params = new URLSearchParams(request.querystring);
    
    // Extraire les paramètres d'optimisation
    const width = parseInt(params.get('w')) || null;
    const height = parseInt(params.get('h')) || null;
    const quality = parseInt(params.get('q')) || 80;
    const format = params.get('fmt') || extension;
    const blur = params.get('blur') ? parseInt(params.get('blur')) : null;
    const preset = params.get('preset');
    
    // Si aucun paramètre d'optimisation n'est spécifié, continuer sans modification
    if (!width && !height && !blur && !preset && format === extension && quality === 80) {
      return request;
    }
    
    // Utiliser un preset si spécifié
    let targetWidth = width;
    let targetHeight = height;
    
    if (preset && ALLOWED_DIMENSIONS[preset]) {
      targetWidth = ALLOWED_DIMENSIONS[preset].width;
      targetHeight = ALLOWED_DIMENSIONS[preset].height;
    }
    
    // Limiter les dimensions pour éviter les abus
    if (targetWidth && targetWidth > 2000) targetWidth = 2000;
    if (targetHeight && targetHeight > 2000) targetHeight = 2000;
    
    // Récupérer l'image originale depuis S3
    const s3 = new AWS.S3();
    const bucket = 'flodrama-content-1745269660';
    const key = uri.startsWith('/') ? uri.substring(1) : uri;
    
    const s3Object = await s3.getObject({
      Bucket: bucket,
      Key: key
    }).promise();
    
    // Traiter l'image avec Sharp
    let sharpImage = Sharp(s3Object.Body);
    
    // Redimensionner si nécessaire
    if (targetWidth || targetHeight) {
      sharpImage = sharpImage.resize({
        width: targetWidth,
        height: targetHeight,
        fit: 'cover',
        position: 'center'
      });
    }
    
    // Appliquer un flou si demandé
    if (blur) {
      sharpImage = sharpImage.blur(Math.min(blur, 20)); // Limiter le flou à 20 pour éviter les abus
    }
    
    // Convertir au format demandé
    let outputFormat = format;
    if (!SUPPORTED_EXTENSIONS.includes(outputFormat)) {
      outputFormat = 'jpeg'; // Format par défaut
    }
    
    // Appliquer les options spécifiques au format
    if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
      sharpImage = sharpImage.jpeg({ quality });
    } else if (outputFormat === 'png') {
      sharpImage = sharpImage.png({ quality });
    } else if (outputFormat === 'webp') {
      sharpImage = sharpImage.webp({ quality });
    } else if (outputFormat === 'avif') {
      sharpImage = sharpImage.avif({ quality });
    }
    
    // Générer l'image optimisée
    const optimizedImage = await sharpImage.toBuffer();
    
    // Définir les en-têtes de réponse
    const response = {
      status: '200',
      statusDescription: 'OK',
      headers: {
        'content-type': [
          {
            key: 'Content-Type',
            value: `image/${outputFormat === 'jpg' ? 'jpeg' : outputFormat}`
          }
        ],
        'cache-control': [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
        'content-length': [
          {
            key: 'Content-Length',
            value: optimizedImage.length.toString()
          }
        ],
        'last-modified': [
          {
            key: 'Last-Modified',
            value: s3Object.LastModified.toUTCString()
          }
        ],
        'etag': [
          {
            key: 'ETag',
            value: `"${s3Object.ETag.replace(/"/g, '')}"`
          }
        ]
      },
      body: optimizedImage.toString('base64'),
      bodyEncoding: 'base64'
    };
    
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'optimisation de l\'image:', error);
    
    // En cas d'erreur, continuer avec la requête originale
    return request;
  }
};
