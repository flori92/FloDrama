import React, { useState, useEffect, useContext, useRef } from "react";

import { Transition } from "@headlessui/react";
import { Fade } from "react-reveal";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "../../Cloudflare/CloudflareAuth";
import { AuthContext } from "../../Context/UserContext";

function Navbar(props) {
  const { User } = useContext(AuthContext);
  const [profilePic, setProfilePic] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (User != null) {
      setProfilePic(User.photoURL);
    }
    window.addEventListener("scroll", transitionNavBar);
    console.log("Navbar", User);
    return () => {
      window.removeEventListener("scroll", transitionNavBar);
    };
  }, []);
  
  // Effet pour gérer le clic en dehors du menu déroulant des catégories
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setCategoriesOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoriesRef]);
  const [isOpen, setIsOpen] = useState(false);

  const [show, handleShow] = useState(false);
  const transitionNavBar = () => {
    if (window.scrollY > 80) {
      handleShow(true);
    } else {
      handleShow(false);
    }
  };

  const NavBlack = () => {
    handleShow(true);
  };
  const NavTransparent = () => {
    handleShow(false);
  };

  const SignOut = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  return (
    <Fade>
      <header
        className={
          props.playPage
            ? "fixed top-0 z-10 w-full backdrop-blur-sm"
            : "fixed top-0 z-10 w-full"
        }
      >
        <nav
          className={`transition duration-500 ease-in-out  ${
            show && "transition duration-500 ease-in-out bg-black "
          } `}
        >
          <div className="px-4 mx-auto max-w-8xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link to="/">
                    <img
                      className="h-10 cursor-pointer w-32 transition duration-300 ease-in-out hover:opacity-80"
                      src="/flodrama-logo.svg?v=1683576581"
                      alt="FloDrama"
                    />
                  </Link>
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center ml-10 space-x-4">
                    <Link
                      to={"/"}
                      className="py-2 font-medium text-white transition ease-in-out delay-150 rounded-md cursor-pointer hover:text-flodrama-fuchsia lg:px-3 text-m"
                    >
                      Home
                    </Link>

                    {/* Menu déroulant des catégories */}
                    <div className="relative" ref={categoriesRef}>
                      <button
                        onClick={() => setCategoriesOpen(!categoriesOpen)}
                        className="flex items-center py-2 font-medium text-white transition ease-in-out delay-150 rounded-md cursor-pointer hover:text-flodrama-fuchsia lg:px-3 text-m"
                      >
                        Catégories
                        <svg
                          className={`ml-1 w-4 h-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </button>

                      {/* Sous-menu des catégories */}
                      {categoriesOpen && (
                        <div className="absolute left-0 z-10 w-48 py-2 mt-2 bg-black bg-opacity-90 rounded-md shadow-lg border border-gray-700">
                          <Link
                            to="/category/films"
                            className="block px-4 py-2 text-sm text-white hover:bg-flodrama-fuchsia hover:bg-opacity-30"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            Films Populaires
                          </Link>
                          <Link
                            to="/category/dramas"
                            className="block px-4 py-2 text-sm text-white hover:bg-flodrama-fuchsia hover:bg-opacity-30"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            Dramas Coréens
                          </Link>
                          <Link
                            to="/category/animes"
                            className="block px-4 py-2 text-sm text-white hover:bg-flodrama-fuchsia hover:bg-opacity-30"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            Animes
                          </Link>
                          <Link
                            to="/category/bollywood"
                            className="block px-4 py-2 text-sm text-white hover:bg-flodrama-fuchsia hover:bg-opacity-30"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            Films Bollywood
                          </Link>
                          <Link
                            to="/category/trending"
                            className="block px-4 py-2 text-sm text-white hover:bg-flodrama-fuchsia hover:bg-opacity-30"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            Tendances
                          </Link>
                          <Link
                            to="/category/recent"
                            className="block px-4 py-2 text-sm text-white hover:bg-flodrama-fuchsia hover:bg-opacity-30"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            Ajouts Récents
                          </Link>
                        </div>
                      )}
                    </div>

                    <Link
                      to={"/series"}
                      className="py-2 font-medium text-white transition ease-in-out delay-150 rounded-md cursor-pointer hover:text-flodrama-fuchsia lg:px-3 text-m"
                    >
                      Series
                    </Link>

                    <Link
                      to={"/history"}
                      className="py-2 font-medium text-white transition ease-in-out delay-150 rounded-md cursor-pointer hover:text-flodrama-fuchsia lg:px-3 text-m"
                    >
                      History
                    </Link>

                    <Link
                      to={"/liked"}
                      className="py-2 font-medium text-white transition ease-in-out delay-150 rounded-md cursor-pointer hover:text-flodrama-fuchsia lg:px-3 text-m"
                    >
                      Liked
                    </Link>

                    <Link
                      to={"/mylist"}
                      className="py-2 font-medium text-white transition ease-in-out delay-150 rounded-md cursor-pointer hover:text-flodrama-fuchsia lg:px-3 text-m"
                    >
                      My List
                    </Link>
                    
                    <Link to={"/watch-party"}>
                      <a className="py-2 font-medium text-white transition ease-in-out delay-150 rounded-md cursor-pointer hover:text-flodrama-fuchsia lg:px-3 text-m">
                        WatchParty
                      </a>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="ml-auto">
                <div className="flex">
                  {/* Search Icon */}
                  <Link to={"/search"}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="items-center w-10 h-10 pr-4 mt-auto mb-auto text-white hover:text-flodrama-fuchsia cursor-pointer transition-all duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </Link>

                  {User ? (
                    <a className="items-center hidden pr-4 mt-auto mb-auto text-base font-medium text-white transition ease-in-out delay-150 cursor-pointer hover:text-flodrama-fuchsia md:flex">
                      {User.displayName}
                    </a>
                  ) : null}

                  {/* Notification icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="items-center hidden w-10 h-10 pr-4 mt-auto mb-auto text-white cursor-pointer md:flex"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>

                  <div className="group inline-block relative transition ease-in-out delay-300">
                    <Link to={"/profile"}>
                      <img
                        className="h-10 w-10 rounded-full cursor-pointer"
                        src={
                          profilePic
                            ? `${User.photoURL}`
                            : `/images/profile-user-flodrama.png?v=${new Date().getTime()}`
                        }
                        alt="FloDrama"
                      />
                    </Link>
                    <ul class="absolute hidden text-white pt-1 -ml-32 group-hover:block transition ease-in-out delay-150">
                      <li>
                        <Link
                          to={"/profile"}
                          className="cursor-pointer rounded-t bg-stone-900 font-bold hover:border-l-4 hover:bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia border-flodrama-blue py-2 px-4 block whitespace-no-wrap transition ease-in-out delay-150"
                        >
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          to={"/signin"}
                          className="cursor-pointer bg-stone-900 font-semibold hover:border-l-4 hover:bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia border-flodrama-blue py-2 px-4 block whitespace-no-wrap transition ease-in-out delay-150"
                        >
                          Add another User
                        </Link>
                      </li>
                      <li>
                        <a
                          onClick={SignOut}
                          className="cursor-pointer rounded-b bg-stone-900 font-bold hover:border-l-4 hover:bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia border-flodrama-blue py-2 px-4 block whitespace-no-wrap transition ease-in-out delay-150"
                        >
                          Sign Out
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex pl-4 -mr-2 md:hidden">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  type="button"
                  className="inline-flex items-center justify-center p-2 text-gray-400 bg-gray-900 rounded-md hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                  aria-controls="mobile-menu"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {isOpen ? (
                    <svg
                      className="block w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                      onClick={NavTransparent}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="block w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                      onClick={NavBlack}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <Transition
            show={isOpen}
            enter="transition ease-out duration-100 transform"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75 transform"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            {(ref) => (
              <div className="md:hidden" id="mobile-menu">
                <div ref={ref} className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  <Link to={"/"}>
                    <a className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-flodrama-blue hover:bg-opacity-60">
                      Home
                    </a>
                  </Link>

                  {/* Catégories dans le menu mobile */}
                  <div className="px-3 py-2 border-l-4 border-flodrama-fuchsia bg-gray-900 bg-opacity-30">
                    <p className="text-base font-medium text-white mb-2">Catégories</p>
                    
                    <Link to={"/category/films"}>
                      <a className="block px-3 py-1 text-sm font-medium text-gray-300 rounded-md hover:bg-flodrama-fuchsia hover:bg-opacity-30 hover:text-white">
                        Films Populaires
                      </a>
                    </Link>
                    
                    <Link to={"/category/dramas"}>
                      <a className="block px-3 py-1 text-sm font-medium text-gray-300 rounded-md hover:bg-flodrama-fuchsia hover:bg-opacity-30 hover:text-white">
                        Dramas Coréens
                      </a>
                    </Link>
                    
                    <Link to={"/category/animes"}>
                      <a className="block px-3 py-1 text-sm font-medium text-gray-300 rounded-md hover:bg-flodrama-fuchsia hover:bg-opacity-30 hover:text-white">
                        Animes
                      </a>
                    </Link>
                    
                    <Link to={"/category/bollywood"}>
                      <a className="block px-3 py-1 text-sm font-medium text-gray-300 rounded-md hover:bg-flodrama-fuchsia hover:bg-opacity-30 hover:text-white">
                        Films Bollywood
                      </a>
                    </Link>
                    
                    <Link to={"/category/trending"}>
                      <a className="block px-3 py-1 text-sm font-medium text-gray-300 rounded-md hover:bg-flodrama-fuchsia hover:bg-opacity-30 hover:text-white">
                        Tendances
                      </a>
                    </Link>
                    
                    <Link to={"/category/recent"}>
                      <a className="block px-3 py-1 text-sm font-medium text-gray-300 rounded-md hover:bg-flodrama-fuchsia hover:bg-opacity-30 hover:text-white">
                        Ajouts Récents
                      </a>
                    </Link>
                  </div>

                  <Link to={"/series"}>
                    <a className="block px-3 py-2 text-base font-medium text-gray-300 rounded-md hover:bg-flodrama-blue hover:bg-opacity-60 hover:text-white">
                      TV-Series
                    </a>
                  </Link>

                  <Link to={"/history"}>
                    <a className="block px-3 py-2 text-base font-medium text-gray-300 rounded-md hover:bg-flodrama-blue hover:bg-opacity-60 hover:text-white">
                      History
                    </a>
                  </Link>

                  <Link to={"/liked"}>
                    <a className="block px-3 py-2 text-base font-medium text-gray-300 rounded-md hover:bg-flodrama-blue hover:bg-opacity-60 hover:text-white">
                      Liked
                    </a>
                  </Link>

                  <Link to={"/mylist"}>
                    <a className="block px-3 py-2 text-base font-medium text-gray-300 rounded-md hover:bg-flodrama-blue hover:bg-opacity-60 hover:text-white">
                      My-List
                    </a>
                  </Link>
                  
                  <Link to={"/watch-party"}>
                    <a className="block px-3 py-2 text-base font-medium text-gray-300 rounded-md hover:bg-flodrama-blue hover:bg-opacity-60 hover:text-white">
                      WatchParty
                    </a>
                  </Link>

                  <Link to={"/signin"}>
                    <a className="block px-3 py-2 text-base font-medium text-gray-300 rounded-md hover:bg-flodrama-blue hover:bg-opacity-60 hover:text-white">
                      Add another user
                    </a>
                  </Link>

                  <a
                    onClick={SignOut}
                    className="block px-3 py-2 text-base font-medium text-gray-300 rounded-md hover:bg-flodrama-fuchsia hover:bg-opacity-60 hover:text-white"
                  >
                    Sign Out
                  </a>
                </div>
              </div>
            )}
          </Transition>
        </nav>
      </header>
    </Fade>
  );
}

export default Navbar;
