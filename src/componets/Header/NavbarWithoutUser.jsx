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
    <div>
      <header
        className={`fixed z-50 w-full flex items-center py-4 transition duration-500 ease-in-out ${
          show && "bg-black transition duration-500 ease-in-out"
        }`}
      >
        <div className="w-9/12 md:w-11/12">
          <img
            className="h-8 sm:h-10 w-32 ml-8 cursor-pointer transition duration-300 ease-in-out hover:opacity-80"
            src="/flodrama-logo.svg?v=1683576581"
            alt="FloDrama"
          />
        </div>

        <div>
          <Link to="/signin">
            <div className="bg-white px-6 py-2 rounded-sm mr-4 lg:mr-0 transition-all duration-300 cursor-pointer hover:bg-opacity-90">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-flodrama-blue to-flodrama-fuchsia font-bold font-sans text-2xl tracking-tight">
                Connexion
              </span>
            </div>
          </Link>
        </div>
      </header>
    </div>
  );
}

export default NavbarWithoutUser;
