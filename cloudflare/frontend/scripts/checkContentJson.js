/**
 * Script de vérification et correction du fichier content.json
 * Vérifie la présence des champs critiques pour chaque entrée du tableau data.
 * Ajoute un placeholder si un champ est manquant ou vide.
 * Génère un nouveau fichier content.fixed.json pour préserver l'original.
 *
 * Champs vérifiés : poster, backdrop, trailer_url, title, description, watch_url
 * Placeholders :
 *   - poster/backdrop : /images/placeholder.jpg ou /images/placeholder-backdrop.jpg
 *   - trailer_url : "/videos/placeholder.mp4"
 *   - title/description : "Titre inconnu" / "Description manquante."
 *   - watch_url : "#"
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '../src/data/content.json');
const OUTPUT_PATH = path.join(__dirname, '../src/data/content.fixed.json');

const PLACEHOLDERS = {
  poster: '/images/placeholder.jpg',
  backdrop: '/images/placeholder-backdrop.jpg',
  trailer_url: '/videos/placeholder.mp4',
  title: 'Titre inconnu',
  description: 'Description manquante.',
  watch_url: '#'
};

function isEmpty(val) {
  return val === undefined || val === null || val === '';
}

function checkAndFixEntry(entry) {
  // Champs pour l'image principale
  if (isEmpty(entry.poster) && isEmpty(entry.posterUrl)) {
    entry.poster = PLACEHOLDERS.poster;
  }
  // Champs pour la bannière/fond
  if (isEmpty(entry.backdrop) && isEmpty(entry.imageUrl)) {
    entry.backdrop = PLACEHOLDERS.backdrop;
  }
  // Trailer vidéo
  if (isEmpty(entry.trailer_url) && isEmpty(entry.trailerUrl)) {
    entry.trailer_url = PLACEHOLDERS.trailer_url;
  }
  // Titre
  if (isEmpty(entry.title)) {
    entry.title = PLACEHOLDERS.title;
  }
  // Description
  if (isEmpty(entry.description)) {
    entry.description = PLACEHOLDERS.description;
  }
  // Lien de visionnage
  if (isEmpty(entry.watch_url)) {
    entry.watch_url = PLACEHOLDERS.watch_url;
  }
  return entry;
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error('Fichier content.json introuvable !');
    process.exit(1);
  }
  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Erreur de parsing JSON :', e.message);
    process.exit(1);
  }
  if (!Array.isArray(data.data)) {
    console.error('Format inattendu : le champ "data" doit être un tableau.');
    process.exit(1);
  }
  let corrections = 0;
  data.data = data.data.map((entry) => {
    const before = JSON.stringify(entry);
    const fixed = checkAndFixEntry(entry);
    if (JSON.stringify(fixed) !== before) corrections++;
    return fixed;
  });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Vérification terminée. Corrections apportées sur ${corrections} entrées.`);
  console.log(`Fichier corrigé écrit dans : ${OUTPUT_PATH}`);
}

main();
