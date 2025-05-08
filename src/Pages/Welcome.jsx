import React from "react";
import { useEffect } from "react";
import Footer from "../componets/Footer/Footer";
import { Fade } from "react-reveal";
import { Link } from "react-router-dom";

// Utilisation des images depuis le dossier public avec paramètre de version pour éviter le cache
const cacheBuster = `?v=${new Date().getTime()}`;
const WelcomePageImage1 = `/images/WelcomePageImage1.png${cacheBuster}`;
const WelcomePageImage2 = `/images/WelcomePageImage2.png${cacheBuster}`;
const WelcomePageImage3 = `/images/WelcomePageImage3.png${cacheBuster}`;
const WelcomePageImage4 = `/images/WelcomePageImage4.png${cacheBuster}`;
const WelcomePageBanner = `/images/WelcomePageBanner.png${cacheBuster}`;

function Welcome() {
  useEffect(() => {
    //alert("This is NOT REAL NETFLIX so don't Enter your REAL CREDENTIALS")
    const image1 = WelcomePageImage1;
  }, []);

  return (
    <div>
      {/*Hero Section*/}
      <div
        style={{
          background: `linear-gradient(0deg, hsl(0deg 0% 0% / 73%) 0%, hsl(0deg 0% 0% / 73%) 35%),url(${WelcomePageBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        className="h-[32rem] w-full sm:h-[65vh] xl:h-[80vh] bg-slate-800 relative"
      >
        <div className="grid content-center justify-center h-full justify-items-center">
          <div className="w-10/12 text-center sm:w-11/12 md:w-40rem">
            <Fade duration={2000}>
              <h1 className="mb-3 text-3xl font-semibold text-center text-white sm:text-4xl md:text-6xl">
                Dramas asiatiques, animes, et films Bollywood illimités.
              </h1>
              <h1 className="mb-4 text-xl text-center text-stone-400 font-light sm:text-2xl">
                Regardez où vous voulez. Annulez quand vous voulez.
              </h1>
              <h1 className="mb-2 text-center text-stone-400 font-light sm:text-xl sm:mb-8">
                Prêt à explorer ? Entrez votre e-mail pour créer ou réactiver votre
                abonnement.
              </h1>
              <div>
                <input
                  placeholder="Adresse e-mail"
                  className="w-full p-2 py-3 rounded-sm sm:py-4 md:py-5 md:w-3/4"
                />
                <Link to={"/signup"}>
                  <button className="px-4 py-2 mt-3 font-medium text-white rounded-sm sm:py-4 md:mt-0 md:pb-5 md:text-xl md:w-1/4 bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia hover:from-flodrama-fuchsia hover:to-flodrama-blue transition-all duration-300">
                    Commencer
                  </button>
                </Link>
              </div>
            </Fade>
          </div>
        </div>
        <div
          style={{
            backgroundImage:
              "linear-gradient(hsl(0deg 0% 0% / 0%), hsl(0deg 0% 0% / 38%), hsl(0deg 0% 7%))",
          }}
          className="absolute bottom-0 w-full h-20"
        ></div>
      </div>

      {/* Section 1 - TV */}
      <section className="py-12 bg-black border-y-8 border-y-zinc-800">
        <Fade>
          <div className="flex justify-center">
            <div className="flex flex-col lg:flex-row lg:items-center lg:w-9/12 max-w-6xl mx-auto">
              <div className="lg:w-1/2 px-6">
                <h1 className="mt-2 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:text-5xl xl:text-6xl">
                  Le meilleur de l'Asie sur grand écran
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:text-2xl">
                  Découvrez nos dramas sur tous vos appareils : Smart TV, PlayStation, Xbox, 
                  Chromecast et bien plus encore.
                </h1>
              </div>
              <div className="lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
                <img className="max-w-full h-auto" src={WelcomePageImage2} alt="TV devices" />
              </div>
            </div>
          </div>
        </Fade>
      </section>

      {/* Section 2 - Download */}
      <section className="py-12 bg-black">
        <Fade>
          <div className="flex justify-center">
            <div className="flex flex-col-reverse lg:flex-row lg:items-center lg:w-9/12 max-w-6xl mx-auto">
              <div className="lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
                <img className="max-w-full h-auto" src={WelcomePageImage1} alt="Download shows" />
              </div>
              <div className="lg:w-1/2 px-6">
                <h1 className="mt-4 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:text-5xl xl:text-6xl">
                  Emportez vos dramas partout avec vous
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:text-2xl">
                  Téléchargez vos séries préférées et plongez dans l'univers asiatique
                  même sans connexion.
                </h1>
              </div>
            </div>
          </div>
        </Fade>
      </section>

      {/* Section 3 - Watch Everywhere */}
      <section className="py-12 bg-black border-y-8 border-y-zinc-800">
        <Fade>
          <div className="flex justify-center">
            <div className="flex flex-col lg:flex-row lg:items-center lg:w-9/12 max-w-6xl mx-auto">
              <div className="lg:w-1/2 px-6">
                <h1 className="mt-4 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:text-5xl xl:text-6xl">
                  Une expérience sans limites
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:text-2xl">
                  Profitez de milliers d'heures de contenu asiatique sur tous vos écrans :
                  smartphone, tablette, ordinateur ou télévision.
                </h1>
              </div>
              <div className="lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
                <img className="max-w-full h-auto" src={WelcomePageImage3} alt="Watch everywhere" />
              </div>
            </div>
          </div>
        </Fade>
      </section>

      {/* Section 4 - Children */}
      <section className="py-12 bg-black">
        <Fade>
          <div className="flex justify-center">
            <div className="flex flex-col-reverse lg:flex-row lg:items-center lg:w-9/12 max-w-6xl mx-auto">
              <div className="lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
                <img className="max-w-full h-auto" src={WelcomePageImage4} alt="Children profiles" />
              </div>
              <div className="lg:w-1/2 px-6">
                <h1 className="mt-4 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:text-5xl xl:text-6xl">
                  Un espace dédié aux plus jeunes
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:text-2xl">
                  Créez des profils enfants pour leur faire découvrir les meilleurs animes et
                  dessins animés asiatiques dans un environnement sécurisé.
                </h1>
              </div>
            </div>
          </div>
        </Fade>
      </section>

      {/* Footer */}
      <Footer></Footer>
    </div>
  );
}

export default Welcome;
