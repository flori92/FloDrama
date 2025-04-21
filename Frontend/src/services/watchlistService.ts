import axios from 'axios';

// Service pour gérer la watchlist et la progression de lecture
export const getWatchlist = async (userId: string, token: string) => {
  const res = await axios.get(`/api/recommandations/${userId}/preferences`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  // On extrait les contenus non terminés de l'historique
  return res.data?.historique?.filter((item: any) => !item.termine) || [];
};

export const updateWatchProgress = async (userId: string, contentId: string, tempsVisionnage: number, termine: boolean, token: string) => {
  // POST /visionnages
  const res = await axios.post(`/api/recommandations/${userId}/visionnages`, {
    contenuId: contentId,
    tempsVisionnage,
    termine
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
