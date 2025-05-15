/**
 * Service de stockage Cloudflare R2 pour FloDrama
 * Remplace les fonctionnalités Firebase Storage
 */

import axios from 'axios';
import { API_BASE_URL, CLOUDFLARE_CONFIG } from './CloudflareConfig';

// URL de base pour le stockage
const STORAGE_API_URL = `${API_BASE_URL}/api/storage`;
const R2_BUCKET_NAME = 'flodrama-storage';

/**
 * Télécharge un fichier vers Cloudflare R2
 * @param {File} file - Le fichier à télécharger
 * @param {string} path - Le chemin de destination dans le bucket R2
 * @param {Function} progressCallback - Callback pour suivre la progression
 * @returns {Promise<string>} - URL du fichier téléchargé
 */
export const uploadFile = async (file, path, progressCallback = null) => {
  try {
    // Récupérer un URL de téléchargement présigné
    const token = localStorage.getItem('flodrama_auth_token');
    const presignedResponse = await axios.post(
      `${STORAGE_API_URL}/presigned-upload`,
      {
        fileName: file.name,
        contentType: file.type,
        path: path
      },
      {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }
    );

    const { uploadUrl, fileKey } = presignedResponse.data;

    // Créer un FormData pour le téléchargement
    const formData = new FormData();
    formData.append('file', file);

    // Configurer la requête avec suivi de progression
    const config = {
      onUploadProgress: (progressEvent) => {
        if (progressCallback) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressCallback(percentCompleted);
        }
      },
      headers: {
        'Content-Type': file.type
      }
    };

    // Télécharger le fichier vers R2
    await axios.put(uploadUrl, file, config);

    // Retourner l'URL publique du fichier
    return getFileURL(fileKey);
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    throw error;
  }
};

/**
 * Obtient l'URL publique d'un fichier stocké dans R2
 * @param {string} fileKey - La clé du fichier dans le bucket R2
 * @returns {string} - URL publique du fichier
 */
export const getFileURL = (fileKey) => {
  return `${API_BASE_URL}/api/storage/${encodeURIComponent(fileKey)}`;
};

/**
 * Supprime un fichier du stockage R2
 * @param {string} fileKey - La clé du fichier à supprimer
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileKey) => {
  try {
    const token = localStorage.getItem('flodrama_auth_token');
    await axios.delete(`${STORAGE_API_URL}/${encodeURIComponent(fileKey)}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    throw error;
  }
};

/**
 * Liste les fichiers dans un dossier du bucket R2
 * @param {string} prefix - Le préfixe (dossier) à lister
 * @returns {Promise<Array>} - Liste des fichiers
 */
export const listFiles = async (prefix) => {
  try {
    const token = localStorage.getItem('flodrama_auth_token');
    const response = await axios.get(`${STORAGE_API_URL}/list`, {
      params: { prefix },
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    return response.data.files;
  } catch (error) {
    console.error('Erreur lors de la liste des fichiers:', error);
    throw error;
  }
};

export default {
  uploadFile,
  getFileURL,
  deleteFile,
  listFiles
};
