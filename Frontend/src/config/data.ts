// src/config/data.ts

// Détection plus robuste de l'environnement local
const IS_LOCAL = typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || 
   window.location.hostname === "127.0.0.1" ||
   window.location.hostname.startsWith("192.168."));

// Log pour debug
if (typeof window !== "undefined") {
  console.log("FloDrama - Environnement:", {
    hostname: window.location.hostname,
    isLocal: IS_LOCAL,
    baseUrl: IS_LOCAL ? "/data/" : "https://flodrama-exported-data.s3.eu-west-3.amazonaws.com/"
  });
}

export const BASE_DATA_URL = IS_LOCAL
  ? "/data/"
  : "https://flodrama-exported-data.s3.eu-west-3.amazonaws.com/";

export const SEARCH_INDEX_URL = IS_LOCAL
  ? "/recherche/index.txt"
  : "https://flodrama-exported-data.s3.eu-west-3.amazonaws.com/index.txt";
