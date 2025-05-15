import React from "react";
import { useEffect } from "react";
import Footer from "../../components/Footer/Footer";
import NavbarWithoutUser from "../../components/Header/NavbarWithoutUser";
import { Fade } from "react-reveal";
import { Link } from "react-router-dom";

// Utilisation des images depuis le dossier public sans paramètre de version pour permettre la mise en cache
const WelcomePageImage1 = `/images/WelcomePageImage1.png`;
const WelcomePageImage2 = `/images/WelcomePageImage2.png`;
const WelcomePageImage3 = `/images/WelcomePageImage3.png`;
const WelcomePageImage4 = `/images/WelcomePageImage4.png`;
const WelcomePageBanner = `/images/WelcomePageBanner.png`;

function Welcome() {
  // Préchargement des images dès le chargement du composant
  useEffect(() => {
    // Précharger les images
    const preloadImages = () => {
      const imageUrls = [WelcomePageImage1, WelcomePageImage2, WelcomePageImage3, WelcomePageImage4, WelcomePageBanner];
      imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    };
    
    preloadImages();
  }, []);

  return (
    <div>
      <NavbarWithoutUser />
      {/*Hero Section*/}
      {/* Précharger l'image de fond pour un affichage immédiat */}
      <link rel="preload" href={WelcomePageBanner} as="image" />
      
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <div className="relative w-full sm:w-2/3 md:max-w-xs">
                {/* Input avec effet de bordure animée plus intense */}
                <div className="absolute -inset-1 bg-gradient-to-r from-flodrama-blue via-flodrama-fuchsia to-flodrama-blue rounded-md opacity-90 blur-md animate-pulse-slow"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-flodrama-fuchsia via-flodrama-blue to-flodrama-fuchsia rounded-md opacity-80 blur-sm animate-pulse"></div>
                <input
                  placeholder="Adresse e-mail"
                  className="relative w-full p-3 bg-black/70 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-flodrama-fuchsia placeholder:text-gray-300 border border-white/10 z-10"
                />
              </div>
              
              <Link to={"/signup"} className="w-full sm:w-auto">
                <div className="relative">
                  {/* Bouton avec effet de bordure animée plus intense */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-flodrama-fuchsia via-flodrama-blue to-flodrama-fuchsia rounded-md opacity-90 blur-md animate-pulse-slow"></div>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-flodrama-blue via-flodrama-fuchsia to-flodrama-blue rounded-md opacity-80 blur-sm animate-pulse"></div>
                  <button className="relative w-full bg-black/70 text-white font-medium py-3 px-6 rounded-md border border-white/10 hover:bg-black/90 hover:shadow-lg hover:shadow-flodrama-fuchsia/50 transition-all duration-300 z-10">
                    Commencer
                  </button>
                </div>
              </Link>
            </div>
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
        <div className="flex justify-center">
          <div className="flex flex-col lg:flex-row lg:items-center lg:w-9/12 max-w-6xl mx-auto">
            <div className="lg:w-1/2 px-6">
              <Fade>
                <h1 className="mt-2 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:text-5xl xl:text-6xl">
                  Le meilleur de l'Asie sur grand écran
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:text-2xl">
                  Découvrez nos dramas sur tous vos appareils : Smart TV, PlayStation, Xbox, 
                  Chromecast et bien plus encore.
                </h1>
              </Fade>
            </div>
            <div className="lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
              <img 
                className="max-w-full h-auto" 
                src={WelcomePageImage2} 
                alt="TV devices" 
                loading="eager" 
                fetchpriority="high" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Download */}
      <section className="py-12 bg-black">
        <div className="flex justify-center">
          <div className="flex flex-col-reverse lg:flex-row lg:items-center lg:w-9/12 max-w-6xl mx-auto">
            <div className="lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
              <img 
                className="max-w-full h-auto" 
                src={WelcomePageImage1} 
                alt="Download shows" 
                loading="eager" 
                fetchpriority="high" 
              />
            </div>
            <div className="lg:w-1/2 px-6">
              <Fade>
                <h1 className="mt-4 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:text-5xl xl:text-6xl">
                  Emportez vos dramas partout avec vous
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:text-2xl">
                  Téléchargez vos séries préférées et plongez dans l'univers asiatique
                  même sans connexion.
                </h1>
              </Fade>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Watch Everywhere */}
      <section className="py-12 bg-black border-y-8 border-y-zinc-800">
        <div className="flex justify-center">
          <div className="flex flex-col lg:flex-row lg:items-center lg:w-9/12 max-w-6xl mx-auto">
            <div className="lg:w-1/2 px-6">
              <Fade>
                <h1 className="mt-4 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:text-5xl xl:text-6xl">
                  Une expérience sans limites
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:text-2xl">
                  Profitez de milliers d'heures de contenu asiatique sur tous vos écrans :
                  smartphone, tablette, ordinateur ou télévision.
                </h1>
              </Fade>
            </div>
            <div className="lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
              <img 
                className="max-w-full h-auto" 
                src={WelcomePageImage3} 
                alt="Watch everywhere" 
                loading="eager" 
                fetchpriority="high" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 - Children */}
      <section className="py-12 bg-black">
        <div className="flex justify-center">
          <div className="flex flex-col-reverse lg:flex-row lg:items-center lg:w-9/12 max-w-6xl mx-auto">
            <div className="lg:w-1/2 flex justify-center items-center mt-8 lg:mt-0">
              <img 
                className="max-w-full h-auto" 
                src={WelcomePageImage4} 
                alt="Children profiles" 
                loading="eager" 
                fetchpriority="high" 
              />
            </div>
            <div className="lg:w-1/2 px-6">
              <Fade>
                <h1 className="mt-4 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:text-5xl xl:text-6xl">
                  Un espace dédié aux plus jeunes
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:text-2xl">
                  Créez des profils enfants pour leur faire découvrir les meilleurs animes et
                  dessins animés asiatiques dans un environnement sécurisé.
                </h1>
              </Fade>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer></Footer>
    </div>
  );
}

export default Welcome;
