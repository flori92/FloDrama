import React from "react";
import styles from "./styles.module.scss";

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
              "FAQ", "À propos", "Confidentialité", "Test de connexion",
              "Centre d'aide", "Recrutement", "Préférences cookies", "Mentions légales",
              "Mon compte", "Comment regarder", "Informations légales", "iOS", "Android"
            ].map((item, index) => (
              <li key={index} className="transition duration-300 ease-in-out hover:text-flodrama-fuchsia cursor-pointer">
                {item}
              </li>
            ))}
          </ul>
          <div className={styles.security}>
            <div className="transition duration-300 ease-in-out hover:text-flodrama-blue cursor-pointer">Français</div>
            <span>© 2025 FloDrama, Tous droits réservés.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Footer2;
