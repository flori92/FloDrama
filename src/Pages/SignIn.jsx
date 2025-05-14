import React from "react";
import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fade } from "react-reveal";
import Loader from "../components/Loader/Loader";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithGoogle,
  createTestAccount as createTestAccountFn
} from "../Cloudflare/CloudflareAuth";
import { setDoc, doc, getDoc } from "../Cloudflare/CloudflareDB";
import { db } from "../Cloudflare/CloudflareDB";
import { AuthContext } from "../Context/UserContext";

// Utilisation des images depuis le dossier public avec paramètre anti-cache
const timestamp = new Date().getTime();
const GoogleLogo = `/images/GoogleLogo.png?v=${timestamp}`;
const WelcomePageBanner = `/images/WelcomePageBanner.png?v=${timestamp}`;

function SignIn() {
  const { User, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ErrorMessage, setErrorMessage] = useState("");
  const [loader, setLoader] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoader(true);

    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Utilisateur connecté
        const { user } = userCredential;
        console.log(user);
        if (user != null) {
          navigate("/");
        }
      })
      .catch((error) => {
        const { code, message } = error;
        setErrorMessage(message);
        alert(message);
        console.log("Connexion à FloDrama : merci de ne pas utiliser vos identifiants personnels pour ce démonstrateur");
        setLoader(false);
      });
  };

  const loginWithGoogle = async (e) => {
    e.preventDefault();
    setLoader(true);
    
    try {
      // Utilisation de notre nouvelle implémentation d'authentification Google
      const result = await signInWithGoogle();
      
      // Vérifier si l'authentification a réussi
      if (result && result.user) {
        console.log("Authentification Google réussie", result.user);
        // Rediriger vers la page d'accueil
        navigate("/");
      } else {
        // La redirection est gérée par signInWithGoogle si nous sommes en mode API
        // Mais en mode local, nous devons gérer la redirection manuellement
        setLoader(false);
      }
    } catch (error) {
      console.error("Erreur lors de l'authentification Google:", error);
      setErrorMessage(error.message || "Erreur lors de la connexion avec Google");
      alert("Erreur de connexion avec Google. Veuillez réessayer.");
      setLoader(false);
    }
  };
  
  // Fonction pour créer un compte de test
  const handleCreateTestAccount = async () => {
    try {
      setLoader(true);
      const { email, password } = await createTestAccountFn();
      
      // Afficher les informations du compte de test
      alert(`Compte de test créé avec succès!\nEmail: ${email}\nMot de passe: ${password}\n\nCes informations ne seront affichées qu'une seule fois.`);
      
      // Connexion automatique avec le compte de test
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la création du compte de test:", error);
      setErrorMessage(error.message || "Erreur lors de la création du compte de test");
      setLoader(false);
    }
  };

  return (
    <section
      className="h-[100vh] bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${WelcomePageBanner})`,
      }}
    >
      {/* Overlay avec effet de flou */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      
      <div className="relative h-[100vh] flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        {/* Conteneur Glass Morphism */}
        <div className="w-full sm:max-w-lg backdrop-blur-md bg-white/10 rounded-xl shadow-2xl sm:my-0 md:mt-0 xl:p-0 border border-white/20 overflow-hidden">
          {/* Effet de lumière en haut */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-flodrama-fuchsia/30 rounded-full blur-3xl pointer-events-none"></div>
          {/* Effet de lumière en bas */}
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-flodrama-blue/30 rounded-full blur-3xl pointer-events-none"></div>
          
          <Fade>
            <div>
              <div className="relative p-6 space-y-4 md:space-y-6 sm:p-12 z-10">
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl">
                  Connectez-vous à votre compte
                </h1>
                <div className="relative overflow-hidden rounded-xl p-4 text-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-flodrama-blue/20 to-flodrama-fuchsia/20 backdrop-blur-sm border border-white/20"></div>
                  <h1 className="relative text-white text-2xl font-bold">
                    Bienvenue sur FloDrama
                  </h1>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 md:space-y-6"
                  action="#"
                >
                  <div>
                    <label
                      for="email"
                      className="block mb-2 text-sm font-medium text-white dark:text-white"
                    >
                      Votre email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="username"
                      className={
                        ErrorMessage
                          ? "bg-stone-700 text-white sm:text-sm rounded-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-2 border-flodrama-fuchsia dark:placeholder-white dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 placeholder:text-white"
                          : "bg-stone-700 text-white sm:text-sm rounded-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:placeholder-white dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 placeholder:text-white"
                      }
                      placeholder="name@email.com"
                      required=""
                      onChange={(e) => setEmail(e.target.value)}
                    ></input>
                  </div>
                  <div>
                    <label
                      for="password"
                      className="block mb-2 text-sm font-medium text-white dark:text-white"
                    >
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="bg-white/5 backdrop-blur-sm text-white sm:text-sm rounded-lg border border-white/10 focus:ring-flodrama-fuchsia/50 focus:border-flodrama-fuchsia/50 block w-full p-3 placeholder:text-white/60 shadow-inner"
                      required=""
                      onChange={(e) => setPassword(e.target.value)}
                    ></input>
                  </div>
                  <div>
                    {ErrorMessage && (
                      <div className="relative overflow-hidden rounded-xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-flodrama-fuchsia/20 backdrop-blur-sm border border-white/20 animate-pulse"></div>
                        <h1 className="relative flex items-center text-white font-bold p-4 text-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6 mr-2 text-red-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                            />
                          </svg>
                          {ErrorMessage}
                        </h1>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="remember"
                          aria-describedby="remember"
                          type="checkbox"
                          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                          required=""
                        ></input>
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          for="remember"
                          className="text-gray-500 dark:text-gray-300"
                        >
                          Se souvenir de moi
                        </label>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={`relative w-full text-white overflow-hidden ${
                      loader
                        ? `bg-white/10`
                        : `bg-gradient-to-r from-flodrama-blue/40 to-flodrama-fuchsia/40 hover:from-flodrama-blue/60 hover:to-flodrama-fuchsia/60`
                    } backdrop-blur-md transition-all duration-300 ease-in-out font-medium rounded-lg border border-white/20 text-sm px-5 py-3 text-center shadow-lg`}
                  >
                    {/* Effet de brillance */}
                    <span className="absolute inset-0 overflow-hidden rounded-lg">
                      <span className="absolute -translate-x-full hover:translate-x-full transition-all duration-1000 ease-in-out top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                    </span>
                    <span className="relative z-10">
                      {loader ? <Loader /> : `Connexion`}
                    </span>
                  </button>
                  
                  <button
                    onClick={loginWithGoogle}
                    className={`relative flex justify-center items-center w-full text-white overflow-hidden ${
                      loader
                        ? `bg-white/10`
                        : `bg-gradient-to-r from-flodrama-blue/40 to-flodrama-fuchsia/40 hover:from-flodrama-blue/60 hover:to-flodrama-fuchsia/60`
                    } backdrop-blur-md transition-all duration-300 ease-in-out font-medium rounded-lg border border-white/20 text-sm px-5 py-3 text-center shadow-lg mb-2`}
                  >
                    {/* Effet de brillance */}
                    <span className="absolute inset-0 overflow-hidden rounded-lg">
                      <span className="absolute -translate-x-full hover:translate-x-full transition-all duration-1000 ease-in-out top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                    </span>
                    <span className="relative z-10 flex items-center justify-center">
                      {loader ? (
                        <Loader />
                      ) : (
                        <>
                          <img className="w-6 h-6 mr-2" src={GoogleLogo} alt="Logo Google"></img>
                          <p>Connexion avec Google</p>
                        </>
                      )}
                    </span>
                  </button>
                  

                  <div className="relative overflow-hidden rounded-lg p-4 mt-4 text-center">
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10"></div>
                    <p className="relative text-sm font-light text-white/80">
                      Vous n'avez pas encore de compte ?{" "}
                      <Link
                        className="font-medium text-flodrama-fuchsia hover:text-white transition-colors duration-300"
                        to={"/signup"}
                      >
                        S'inscrire
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </Fade>
        </div>
      </div>
    </section>
  );
}

export default SignIn;
