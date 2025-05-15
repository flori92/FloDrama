import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../../utils/auth";
import { AuthContext } from "../../Context/UserContext";

// Page de callback OAuth Google : récupère le JWT dans l'URL, le stocke, connecte l'utilisateur
export default function OAuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setToken(token);
      // Synchronise l'utilisateur dans le contexte
      refreshUser().then(() => {
        navigate("/");
      });
    } else {
      // Pas de token : erreur OAuth
      alert("Erreur lors de la connexion OAuth Google.");
      navigate("/signin");
    }
  }, [navigate, refreshUser]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-xl font-bold mb-4">Connexion en cours...</div>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-flodrama-fuchsia"></div>
    </div>
  );
}
