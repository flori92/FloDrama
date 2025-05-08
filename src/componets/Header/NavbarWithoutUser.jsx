import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function NavbarWithoutUser() {
  const [show, handleShow] = useState(false);
  
  const transitionNavBar = () => {
    if (window.scrollY > 100) {
      handleShow(true);
    } else {
      handleShow(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", transitionNavBar);
    return () => {
      window.removeEventListener("scroll", transitionNavBar);
    };
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${show ? 'bg-black' : 'bg-transparent'} transition-all duration-500`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div>
            <img
              className="h-8 sm:h-10 w-32 cursor-pointer transition-opacity duration-300 hover:opacity-80"
              src="/flodrama-logo.svg?v=1683576581"
              alt="FloDrama"
            />
          </div>
          
          {/* Bouton Connexion */}
          <div>
            <Link to="/signin">
              <div className="flex items-center justify-center cursor-pointer transition-opacity duration-300 hover:opacity-80">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia font-bold font-sans text-2xl tracking-tight">
                  Connexion
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavbarWithoutUser;
