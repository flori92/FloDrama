import React from 'react';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className="text-4xl font-bold text-flo-fuchsia mb-6">
          FloDrama - Plateforme de streaming asiatique
        </h1>
        <p className="text-lg mb-4">
          Votre plateforme de référence pour les dramas, films, animes et plus encore !
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="h-40 bg-gradient-to-r from-flo-blue to-flo-violet"></div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">Titre du contenu {i+1}</h2>
                <p className="text-gray-400">Description courte du contenu...</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">2023</span>
                  <span className="text-sm bg-flo-fuchsia text-white px-2 py-1 rounded">8.5 ★</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <footer className="py-6 text-center text-gray-500">
        <p>© 2025 FloDrama - Tous droits réservés</p>
      </footer>
    </div>
  );
}
