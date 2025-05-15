import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fade } from "react-reveal";
import { AuthContext } from "../Context/UserContext";
import Loader from "../components/Loader/Loader";
// Utilisation de l'image bannière depuis le dossier public avec contournement du cache
const timestamp = new Date().getTime();
const WelcomePageBanner = `/images/WelcomePageImage1.png?v=${timestamp}`;

function SignUp() {
  const { signup } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ErrorMessage, setErrorMessage] = useState("");
  const [loader, setLoader] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);
    setErrorMessage("");
    const res = await signup(email, password, displayName || email.split('@')[0]);
    setLoader(false);
    if (res.success) {
      navigate("/signin");
    } else {
      setErrorMessage(res.error || "Erreur lors de l'inscription");
    }
  };

  return (
    <section
      className="h-[100vh] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${WelcomePageBanner})` }}>


      {/* Overlay avec effet de flou */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div className="relative h-[100vh] flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full sm:max-w-lg backdrop-blur-md bg-white/10 rounded-xl shadow-2xl sm:my-0 md:mt-0 xl:p-0 border border-white/20 overflow-hidden">
          {/* Effet de lumière en haut */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-flodrama-fuchsia/30 rounded-full blur-3xl pointer-events-none"></div>
          {/* Effet de lumière en bas */}
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-flodrama-blue/30 rounded-full blur-3xl pointer-events-none"></div>
          <Fade>
            <div>
              <div className="relative p-6 space-y-4 md:space-y-6 sm:p-12 z-10">
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl">
                  Créer un nouveau compte
                </h1>
                <div className="relative overflow-hidden rounded-xl p-4 text-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-flodrama-blue/20 to-flodrama-fuchsia/20 backdrop-blur-sm border border-white/20"></div>
                  <h1 className="relative text-white text-2xl font-bold">
                    Bienvenue sur FloDrama
                  </h1>
                </div>
                {/* Bouton Google OAuth */}
                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => window.open('https://flodrama-api-prod.florifavi.workers.dev/api/auth/google', '_self')}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-lg border border-white/20 bg-gradient-to-r from-flodrama-blue/40 to-flodrama-fuchsia/40 hover:from-flodrama-blue/60 hover:to-flodrama-fuchsia/60 text-white font-semibold shadow-lg transition-all duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.18 3.23l6.85-6.85C36.42 2.15 30.6 0 24 0 14.82 0 6.71 5.06 2.69 12.44l7.99 6.21C12.23 13.02 17.65 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.56c0-1.64-.15-3.21-.42-4.72H24v9.03h12.42c-.53 2.85-2.13 5.26-4.54 6.89l7.01 5.45C43.89 37.13 46.1 31.28 46.1 24.56z"/><path fill="#FBBC05" d="M10.68 28.65A14.47 14.47 0 019.5 24c0-1.62.28-3.19.78-4.65l-7.99-6.21A23.94 23.94 0 000 24c0 3.77.91 7.35 2.53 10.49l8.15-5.84z"/><path fill="#EA4335" d="M24 48c6.48 0 11.92-2.14 15.89-5.83l-7.01-5.45c-1.94 1.31-4.41 2.09-7.17 2.09-6.34 0-11.73-4.27-13.65-10.02l-8.15 5.84C6.71 42.94 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
                    S'inscrire avec Google
                  </button>
                  <span className="text-xs text-white/60">Vous pouvez créer un compte instantanément avec Google. Si vous avez déjà un compte Google, il sera utilisé pour vous connecter.</span>
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
                      Your email
                    </label>
                    <input
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      name="email"
                      id="email"
                      className={
                        ErrorMessage
                          ? "bg-white/5 backdrop-blur-sm text-white sm:text-sm rounded-lg border border-flodrama-fuchsia/50 focus:ring-flodrama-fuchsia/50 focus:border-flodrama-fuchsia/50 block w-full p-3 placeholder:text-white/60 shadow-inner"
                          : "bg-white/5 backdrop-blur-sm text-white sm:text-sm rounded-lg border border-white/10 focus:ring-flodrama-fuchsia/50 focus:border-flodrama-fuchsia/50 block w-full p-3 placeholder:text-white/60 shadow-inner"
                      }
                      placeholder="name@email.com"
                      required=""
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
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      name="password"
                      id="password"
                      placeholder="••••••••"
                      className={
                        ErrorMessage
                          ? "bg-white/5 backdrop-blur-sm text-white sm:text-sm rounded-lg border border-flodrama-fuchsia/50 focus:ring-flodrama-fuchsia/50 focus:border-flodrama-fuchsia/50 block w-full p-3 placeholder:text-white/60 shadow-inner"
                          : "bg-white/5 backdrop-blur-sm text-white sm:text-sm rounded-lg border border-white/10 focus:ring-flodrama-fuchsia/50 focus:border-flodrama-fuchsia/50 block w-full p-3 placeholder:text-white/60 shadow-inner"
                      }
                      required=""
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
                          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 "
                          required=""
                        ></input>
                      </div>
                      <div className="ml-3 text-sm">
                        <label for="remember" className="text-gray-500">
                          Remember me
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
                      {loader ? <Loader /> : "Créer maintenant"}
                    </span>
                  </button>
                  
                  <div className="relative overflow-hidden rounded-lg p-4 mt-4 text-center">
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10"></div>
                    <p className="relative text-sm font-light text-white/80">
                      Vous avez déjà un compte ?{" "}
                      <Link
                        className="font-medium text-flodrama-blue hover:text-white transition-colors duration-300"
                        to={"/signin"}
                      >
                        Se connecter
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

export default SignUp;
