// api/webhooks/supabase.js
export default async function handler(req, res) {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Récupérer le corps de la requête
    const payload = req.body;
    
    // Vérifier la signature (à implémenter pour la sécurité)
    // const signature = req.headers['x-supabase-signature'];
    // if (!verifySignature(payload, signature)) {
    //   return res.status(401).json({ error: 'Signature invalide' });
    // }

    // Traiter les différents types d'événements
    const { type, table, record, old_record } = payload;
    
    console.log(`Webhook reçu: ${type} sur ${table}`);
    
    // Logique spécifique selon le type d'événement
    switch (type) {
      case 'INSERT':
        // Logique pour les nouvelles insertions
        await handleInsert(table, record);
        break;
      case 'UPDATE':
        // Logique pour les mises à jour
        await handleUpdate(table, record, old_record);
        break;
      case 'DELETE':
        // Logique pour les suppressions
        await handleDelete(table, old_record);
        break;
      default:
        console.log(`Type d'événement non géré: ${type}`);
    }

    // Répondre avec succès
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur dans le webhook Supabase:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

// Fonctions de traitement des événements
async function handleInsert(table, record) {
  // Implémentation spécifique selon la table
  if (table === 'films') {
    // Logique pour les nouveaux films
    console.log(`Nouveau film ajouté: ${record.title}`);
    // Exemple: Invalidation du cache, notification, etc.
  }
}

async function handleUpdate(table, record, old_record) {
  // Implémentation spécifique selon la table
  if (table === 'films') {
    console.log(`Film mis à jour: ${record.title}`);
    // Exemple: Mise à jour du cache, notification, etc.
  }
}

async function handleDelete(table, old_record) {
  // Implémentation spécifique selon la table
  if (table === 'films') {
    console.log(`Film supprimé: ${old_record.title}`);
    // Exemple: Suppression du cache, notification, etc.
  }
}
