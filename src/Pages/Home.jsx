import React from "react";
import { useEffect, useState, useContext } from "react";
import Banner from "../componets/Banner/Banner";
import Footer from "../componets/Footer/Footer";
import RowPost from "../componets/RowPost/RowPost";
import {
  dramas,
  animes,
  films,
  bollywood,
  featured,
  trending,
  recent,
  handleApiResponse
} from "../Constants/FloDramaURLs";
import { API_BASE_URL } from "../Cloudflare/CloudflareConfig";
import { AuthContext } from "../Context/UserContext";

function Home() {
  const { User } = useContext(AuthContext);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ne charger l'historique que si l'utilisateur est connecté
    if (User && User.uid) {
      setIsLoading(true);
      // Utiliser la nouvelle API Cloudflare pour récupérer l'historique
      fetch(`${API_BASE_URL}/api/users/${User.uid}/history`)
        .then(response => handleApiResponse(response))
        .then(data => {
          setWatchedMovies(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Erreur lors de la récupération de l'historique:", err);
          setError(err.message);
          setIsLoading(false);
        });
    } else {
      // Si l'utilisateur n'est pas connecté, ne pas charger l'historique
      setWatchedMovies([]);
      setIsLoading(false);
    }
  }, [User]);

  if (error) {
    console.warn("Erreur non bloquante lors du chargement de l'historique:", error);
    // Ne pas bloquer le rendu en cas d'erreur sur l'historique
  }

  return (
    <div>
      <Banner url={featured} useCloudflareApi={true}></Banner>
      <div className="w-[99%] ml-1">
        <RowPost 
          first 
          title="En Tendance" 
          url={trending} 
          key={trending}
          useCloudflareApi={true}
        ></RowPost>
        <RowPost 
          title="Dramas Asiatiques" 
          islarge 
          url={dramas} 
          key={dramas}
          useCloudflareApi={true}
        ></RowPost>
        {!isLoading && watchedMovies && watchedMovies.length > 0 ? (
          <RowPost
            title="Historique"
            movieData={watchedMovies}
            key={"Historique"}
            useCloudflareApi={true}
          ></RowPost>
        ) : null}
        <RowPost
          title="Animes"
          islarge
          url={animes}
          key={animes}
          useCloudflareApi={true}
        ></RowPost>
        <RowPost
          title="Films"
          url={films}
          key={films}
          useCloudflareApi={true}
        ></RowPost>
        <RowPost 
          title="Bollywood" 
          url={bollywood} 
          key={bollywood}
          useCloudflareApi={true}
        ></RowPost>
        <RowPost 
          title="Ajouts Récents" 
          url={recent} 
          key={recent}
          useCloudflareApi={true}
        ></RowPost>
      </div>
      <Footer></Footer>
    </div>
  );
}

export default Home;
