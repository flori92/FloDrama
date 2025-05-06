/**
 * Script de test pour le webhook Discord
 */

const https = require('https');
const url = require('url');

// URL du webhook Discord
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1369299449515344043/-IuKhR1YTJp0qNxItturnMQKXIMAYsygu-o-U5iGMr64zjlcmJvfmsok7qzfeaYm26Cz';

// Fonction pour envoyer une requête HTTP
function sendRequest(webhookUrl, payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(webhookUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            statusCode: res.statusCode,
            data
          });
        } else {
          reject(new Error(`Erreur HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(payload);
    req.end();
  });
}

// Fonction pour envoyer un message de test
async function sendTestMessage() {
  console.log('Envoi du message de test au webhook Discord...');
  
  const timestamp = new Date().toISOString();
  
  // Créer le payload avec différents types de messages
  const payload = JSON.stringify({
    embeds: [
      {
        title: '✅ Test de Succès - FloDrama Scraping',
        description: 'Ceci est un exemple de message de succès qui sera envoyé lorsque le scraping se déroule correctement.',
        color: 0x00FF00, // Vert
        fields: [
          {
            name: 'Sources scrapées',
            value: '8/8 (100%)',
            inline: true
          },
          {
            name: 'Éléments récupérés',
            value: '800',
            inline: true
          },
          {
            name: 'Données mockées',
            value: '0 (0%)',
            inline: true
          }
        ],
        timestamp,
        footer: {
          text: 'FloDrama Scraping Monitor'
        }
      },
      {
        title: '⚠️ Test d\'Avertissement - FloDrama Scraping',
        description: 'Ceci est un exemple de message d\'avertissement qui sera envoyé lorsque des problèmes mineurs sont détectés.',
        color: 0xFFAA00, // Orange
        fields: [
          {
            name: 'Sources scrapées',
            value: '7/8 (87.5%)',
            inline: true
          },
          {
            name: 'Éléments récupérés',
            value: '750',
            inline: true
          },
          {
            name: 'Données mockées',
            value: '150 (20%)',
            inline: true
          }
        ],
        timestamp,
        footer: {
          text: 'FloDrama Scraping Monitor'
        }
      },
      {
        title: '❌ Test d\'Erreur - FloDrama Scraping',
        description: 'Ceci est un exemple de message d\'erreur qui sera envoyé lorsque des problèmes critiques sont détectés.',
        color: 0xFF0000, // Rouge
        fields: [
          {
            name: 'Sources scrapées',
            value: '3/8 (37.5%)',
            inline: true
          },
          {
            name: 'Éléments récupérés',
            value: '300',
            inline: true
          },
          {
            name: 'Données mockées',
            value: '300 (100%)',
            inline: true
          }
        ],
        timestamp,
        footer: {
          text: 'FloDrama Scraping Monitor'
        }
      }
    ]
  });
  
  try {
    const response = await sendRequest(DISCORD_WEBHOOK_URL, payload);
    console.log(`Message envoyé avec succès! Code de statut: ${response.statusCode}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message: ${error.message}`);
    return false;
  }
}

// Exécuter le test
sendTestMessage()
  .then(success => {
    if (success) {
      console.log('Test terminé avec succès. Vérifiez votre canal Discord pour voir les messages.');
    } else {
      console.error('Le test a échoué. Vérifiez l\'URL du webhook et réessayez.');
    }
  })
  .catch(error => {
    console.error('Erreur non gérée:', error);
  });
