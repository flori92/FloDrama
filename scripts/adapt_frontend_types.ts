import fs from 'fs';

const SAMPLE_PATH = './scraping_schema_report.json';
const FRONTEND_TYPE_PATH = '../../frontend/app/services/scraping/index.ts';

function analyzeSchema() {
  const sample = JSON.parse(fs.readFileSync(SAMPLE_PATH, 'utf-8'));
  const fields = new Set<string>();
  sample.forEach(doc => Object.keys(doc).forEach(k => fields.add(k)));
  return Array.from(fields);
}

function updateFrontendTypes(fields: string[]) {
  let content = fs.readFileSync(FRONTEND_TYPE_PATH, 'utf-8');
  // Générer une nouvelle interface ContentItem basée sur les champs détectés
  const newInterface = `export interface ContentItem {\n${fields.map(f => `  ${f}: any;`).join('\n')}\n}`;
  content = content.replace(/export interface ContentItem \{[^}]+\}/, newInterface);
  fs.writeFileSync(FRONTEND_TYPE_PATH, content);
  console.log('Types frontend adaptés automatiquement.');
}

const fields = analyzeSchema();
updateFrontendTypes(fields);
