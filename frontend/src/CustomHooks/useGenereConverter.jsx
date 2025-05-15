import { genresList } from "../../Constants/Constance";

const useGenereConverter = () => {
  const convertGenere = (genreIds) => {
    // Vérifier si genreIds est défini
    if (!genreIds || !Array.isArray(genreIds)) {
      return ["Drame", "Action"]; // Valeurs par défaut pour les contenus sans genres
    }
    
    const genresConvertedList = [];
    genreIds
      .slice(0, 3)
      .map((genreId) =>
        genresList
          .filter((el) => el.id === genreId)
          .map((el) => genresConvertedList.push(el.name))
      );

    // Si aucun genre n'a été trouvé, retourner des valeurs par défaut
    return genresConvertedList.length > 0 ? genresConvertedList : ["Drame", "Action"];
  };

  return { convertGenere };
};

export default useGenereConverter;
