import React from "react";
import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fade } from "react-reveal";
import { ClipLoader } from "react-spinners";
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
      await signInWithGoogle();
      // La redirection est gérée par signInWithGoogle, donc pas besoin de code supplémentaire ici
      
      // Note: Le traitement du retour de Google est géré par un gestionnaire de route séparé
      // qui appellera handleGoogleCallback avec le code d'autorisation
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
      className="h-[100vh] bg-gray-50 dark:bg-gray-900"
      style={{
        background: `linear-gradient(0deg, hsl(0deg 0% 0% / 73%) 0%, hsl(0deg 0% 0% / 73%) 35%),url(${WelcomePageBanner})`,
      }}
    >
      <div className="h-[100vh] flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full bg-[#000000a2] rounded-lg shadow sm:my-0 md:mt-0 sm:max-w-lg xl:p-0 border-2 border-stone-800 lg:border-0">
          <Fade>
            <div>
              <div className="p-6 space-y-4 md:space-y-6 sm:p-12">
                <h1 className="text-xl font-bold leading-tight tracking-tight text-white md:text-2xl dark:text-white">
                  Sign in to your account
                </h1>
                <h1 className="text-white text-2xl p-3 text-center border-2 border-flodrama-fuchsia rounded-sm bg-gradient-to-r from-flodrama-blue/10 to-flodrama-fuchsia/10">
                  Bienvenue sur FloDrama
                </h1>
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
                      Your email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
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
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      placeholder="••••••••"
                      className={
                        ErrorMessage
                          ? "bg-stone-700 text-white sm:text-sm rounded-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-2 border-flodrama-fuchsia dark:bg-gray-700 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 placeholder:text-white"
                          : "bg-stone-700 text-white sm:text-sm rounded-sm focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 placeholder:text-white"
                      }
                      required=""
                      onChange={(e) => setPassword(e.target.value)}
                    ></input>
                  </div>
                  <div>
                    {ErrorMessage && (
                      <h1 className="flex text-white font-bold p-4 bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia rounded text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6 mr-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                          />
                        </svg>
                        {ErrorMessage}
                      </h1>
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
                          Remember me
                        </label>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={`w-full text-white ${
                      loader
                        ? `bg-stone-700`
                        : `bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia hover:from-flodrama-blue/80 hover:to-flodrama-fuchsia/80 focus:ring-4 focus:outline-none focus:ring-primary-300`
                    } transition ease-in-out font-medium rounded-sm text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800`}
                  >
                    {loader ? <ClipLoader color="#ff0000" /> : `Connexion`}
                  </button>
                  <button
                    onClick={loginWithGoogle}
                    className={`flex justify-center items-center w-full text-white ${
                      loader
                        ? `bg-stone-700`
                        : `bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia hover:from-flodrama-fuchsia hover:to-flodrama-blue focus:ring-4 focus:outline-none focus:ring-primary-300`
                    } transition ease-in-out font-medium rounded-sm text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:focus:ring-primary-800 mb-2`}
                  >
                    {loader ? (
                      <ClipLoader color="#ff0000" />
                    ) : (
                      <>
                        <img className="w-8" src={GoogleLogo}></img>{" "}
                        <p className="ml-1">Connexion avec Google</p>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleCreateTestAccount}
                    className={`flex justify-center items-center w-full text-white ${
                      loader
                        ? `bg-stone-700`
                        : `bg-stone-600 hover:bg-stone-700 focus:ring-4 focus:outline-none focus:ring-primary-300`
                    } transition ease-in-out font-medium rounded-sm text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:focus:ring-primary-800`}
                  >
                    {loader ? (
                      <ClipLoader color="#ff0000" />
                    ) : (
                      <p>Créer un compte de test</p>
                    )}
                  </button>
                  <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                    Don’t have an account yet?{" "}
                    <Link
                      className="font-medium text-white hover:underline dark:text-primary-500"
                      to={"/signup"}
                    >
                      Sign up
                    </Link>
                  </p>
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
