export async function fetchTMDB(endpoint: string, env: any) {
  const url = `https://api.themoviedb.org/3${endpoint}`;
  const token = env.TMDB_TOKEN;
  if (!token) {
    return { error: "Token TMDB manquant dans les variables d'environnement", data: null };
  }
  const res = await fetch(url, {
    headers: {
      "accept": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  if (!res.ok) {
    return { error: `Erreur TMDB: ${res.statusText}`, data: null };
  }
  const data = await res.json();
  return { error: null, data };
}
