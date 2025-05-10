import React from "react";
import styles from "./styles.module.scss";
import { Link } from "react-router-dom";

function Footer2() {
  return (
    <div className="bg-black p-2 bg-gradient-to-r from-flodrama-blue/10 to-flodrama-fuchsia/10">
      <footer className={styles.footer}>
        <div className={styles.containerFooter}>
          <div className={styles.icons}>
            <img 
              src="/flodrama-logo.svg" 
              alt="FloDrama" 
              className="h-8 mb-4 transition duration-300 ease-in-out hover:opacity-80" 
            />
          </div>
          <ul className={styles.details}>
            {[
              { name: "FAQ", path: "/footer/faq" },
              { name: "À propos", path: "/footer/a-propos" },
              { name: "Confidentialité", path: "/footer/confidentialite" },
              { name: "Test de connexion", path: "/footer/test-connexion" },
              { name: "Centre d'aide", path: "/footer/centre-aide" },
              { name: "Préférences cookies", path: "/footer/preferences-cookies" },
              { name: "Mentions légales", path: "/footer/mentions-legales" },
              { name: "Mon compte", path: "/profile" },
              { name: "Comment regarder", path: "/footer/comment-regarder" },
              { name: "Informations légales", path: "/footer/informations-legales" },
              { name: "iOS", path: "/footer/ios" },
              { name: "Android", path: "/footer/android" }
            ].map((item, index) => (
              <li key={index} className="transition duration-300 ease-in-out cursor-pointer">
                <Link to={item.path} className="hover:text-flodrama-fuchsia transition-all duration-300">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.security}>
            <div className="transition duration-300 ease-in-out hover:text-flodrama-fuchsia cursor-pointer">Français</div>
            <span>© 2025 FloDrama, Tous droits réservés.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Footer2;
