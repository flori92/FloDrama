import React from "react";
import { useEffect } from "react";

import Footer from "../componets/Footer/Footer";

// Utilisation des images depuis le dossier public avec paramètre de version pour éviter le cache
const cacheBuster = `?v=${new Date().getTime()}`;
const WelcomePageImage1 = `/images/WelcomePageImage1.png${cacheBuster}`;
const WelcomePageImage2 = `/images/WelcomePageImage2.png${cacheBuster}`;
const WelcomePageImage3 = `/images/WelcomePageImage3.png${cacheBuster}`;
const WelcomePageImage4 = `/images/WelcomePageImage4.png${cacheBuster}`;
const WelcomePageBanner = `/images/WelcomePageBanner.jpg${cacheBuster}`;

import { Fade } from "react-reveal";
import { Link } from "react-router-dom";

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
        ></div>
      </div>

      {/* Section 2 */}
      <section className="bg-black border-y-8 border-y-zinc-800">
        <Fade>
          <div className="flex justify-center md:py-8">
            <div className="lg:flex lg:items-center lg:w-9/12">
              <div>
                <h1 className="mt-2 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:ml-8 lg:text-5xl xl:text-6xl">
                  Enjoy on your TV.
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:ml-8 lg:text-2xl lg:w-9/12">
                  Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV,
                  Blu-ray players and more.
                </h1>
              </div>
              <div className="flex justify-center">
                <img className="" src={WelcomePageImage1} />
              </div>
            </div>
          </div>
        </Fade>
      </section>

      {/* Section 3 */}
      <section className="bg-black">
        <Fade>
          <div className="flex justify-center">
            <div className="flex flex-col-reverse lg:flex-row lg:items-center lg:w-9/12">
              <div className="flex justify-center">
                <img className="" src={WelcomePageImage2} />
              </div>
              <div>
                <h1 className="mx-4 mt-4 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:ml-8 lg:text-5xl xl:text-6xl">
                  Download your shows to watch offline.
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:ml-8 lg:text-2xl lg:w-9/12">
                  Save your favourites easily and always have something to
                  watch.
                </h1>
              </div>
            </div>
          </div>
        </Fade>
      </section>

      {/* Section 4 */}
      <section className="bg-black border-y-8 border-y-zinc-800">
        <Fade>
          <div className="flex justify-center md:py-8">
            <div className="lg:flex lg:items-center lg:w-9/12">
              <div>
                <h1 className="mt-4 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:ml-8 lg:text-5xl xl:text-6xl">
                  Watch everywhere.
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:ml-8 lg:text-2xl lg:w-9/12">
                  Stream unlimited movies and TV shows on your phone, tablet,
                  laptop, and TV.
                </h1>
              </div>
              <div className="flex justify-center">
                <img className="" src={WelcomePageImage3} />
              </div>
            </div>
          </div>
        </Fade>
      </section>

      {/* Section 5 */}
      <section className="bg-black">
        <Fade>
          <div className="flex justify-center">
            <div className="flex flex-col-reverse lg:flex-row lg:items-center lg:w-9/12">
              <div className="flex justify-center">
                <img className="" src={WelcomePageImage4} />
              </div>
              <div>
                <h1 className="mt-4 mb-6 text-4xl font-semibold text-center text-white lg:mt-0 lg:text-left lg:ml-8 lg:text-5xl xl:text-6xl">
                  Create profiles for children.
                </h1>
                <h1 className="m-4 text-center text-stone-400 font-light lg:text-left lg:ml-8 lg:text-2xl lg:w-9/12">
                  Send children on adventures with their favourite characters in
                  a space made just for them—free with your membership.
                </h1>
              </div>
            </div>
          </div>
        </Fade>
      </section>

      {/* Section 6 */}
      <section></section>

      {/* Footer */}
      <Footer></Footer>
    </div>
  );
}

export default Welcome;
