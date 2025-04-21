import axios from 'axios';

// Service pour gérer les favoris, likes, dislikes, préférences utilisateur
export const getUserPreferences = async (userId: string, token: string) => {
  const res = await axios.get(`/api/recommandations/${userId}/preferences`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateUserPreferences = async (userId: string, updates: any, token: string) => {
  const res = await axios.patch(`/api/recommandations/${userId}/preferences`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const likeContent = async (userId: string, contentId: string, genre: string, token: string) => {
  // PATCH sur notesMoyennes (ou endpoint dédié si dispo)
  return updateUserPreferences(userId, { notesMoyennes: { [genre]: 1 }, favoris: undefined }, token);
};

export const dislikeContent = async (userId: string, contentId: string, genre: string, token: string) => {
  return updateUserPreferences(userId, { notesMoyennes: { [genre]: -1 }, favoris: undefined }, token);
};

export const addToFavorites = async (userId: string, contentId: string, token: string) => {
  return updateUserPreferences(userId, { $addToSet: { favoris: contentId } }, token);
};

export const removeFromFavorites = async (userId: string, contentId: string, token: string) => {
  return updateUserPreferences(userId, { $pull: { favoris: contentId } }, token);
};
