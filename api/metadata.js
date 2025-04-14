// API de métadonnées pour FloDrama
// Cette API remplace le service AWS DynamoDB pour les métadonnées

import fs from 'fs';
import path from 'path';

/**
 * Gestionnaire de l'API de métadonnées
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 */
export default function handler(req, res) {
  try {
    // Chemin vers le fichier de métadonnées
    const metadataPath = path.join(process.cwd(), 'public', 'data', 'metadata.json');
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({
        error: 'Fichier de métadonnées non trouvé',
        message: 'Le fichier de métadonnées n\'existe pas sur le serveur'
      });
    }
    
    // Lire le fichier de métadonnées
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    // Si un ID est spécifié dans la requête, retourner uniquement cet élément
    if (req.query.id) {
      const item = metadata.items.find(item => item.id === req.query.id);
      
      if (!item) {
        return res.status(404).json({
          error: 'Élément non trouvé',
          message: `Aucun élément avec l'ID ${req.query.id} n'a été trouvé`
        });
      }
      
      return res.status(200).json(item);
    }
    
    // Si une catégorie est spécifiée, filtrer les éléments
    if (req.query.category) {
      const filteredItems = metadata.items.filter(item => item.category === req.query.category);
      
      return res.status(200).json({
        items: filteredItems,
        count: filteredItems.length,
        category: req.query.category
      });
    }
    
    // Si aucun paramètre n'est spécifié, retourner toutes les métadonnées
    return res.status(200).json(metadata);
  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées:', error);
    
    return res.status(500).json({
      error: 'Erreur serveur',
      message: 'Une erreur est survenue lors de la récupération des métadonnées'
    });
  }
}
