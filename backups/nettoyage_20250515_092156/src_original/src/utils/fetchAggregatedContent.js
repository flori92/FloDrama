// Utilitaire pour agréger les contenus de plusieurs endpoints (tendance, récent, etc.)
// Usage : fetchAggregatedContent([url1, url2, ...], {limit})

export async function fetchAggregatedContent(urls, { limit = 24, handleApiResponse } = {}) {
  // handleApiResponse doit être passé pour uniformiser le parsing (cf. FloDramaURLs.js)
  if (!handleApiResponse) {
    throw new Error('fetchAggregatedContent nécessite la fonction handleApiResponse');
  }

  // Effectuer tous les fetchs en parallèle
  const results = await Promise.all(
    urls.map(url =>
      fetch(url)
        .then(r => handleApiResponse(r))
        .catch(() => []) // Ignore les erreurs individuelles
    )
  );

  // Fusionner tous les tableaux de résultats
  let merged = results.flat();

  // Déduplication par id (ou autre clé unique)
  const seen = new Set();
  merged = merged.filter(item => {
    const id = item.id || item._id || item.slug;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  // Limiter le nombre de résultats
  return merged.slice(0, limit);
}
