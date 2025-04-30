import React from 'react';
import Link from 'next/link';

export default function BollywoodPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gradient-to-r from-flo-blue to-flo-violet py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">
            <Link href="/">FloDrama</Link>
          </h1>
        </div>
      </header>
      
      <nav className="bg-gray-900 py-2">
        <div className="container mx-auto px-4">
          <ul className="flex space-x-6">
            <li><Link href="/" className="text-white hover:text-flo-fuchsia">Accueil</Link></li>
            <li><Link href="/dramas" className="text-white hover:text-flo-fuchsia">Dramas</Link></li>
            <li><Link href="/films" className="text-white hover:text-flo-fuchsia">Films</Link></li>
            <li><Link href="/animes" className="text-white hover:text-flo-fuchsia">Animes</Link></li>
            <li><Link href="/bollywood" className="text-white hover:text-flo-fuchsia">Bollywood</Link></li>
            <li><Link href="/recherche" className="text-white hover:text-flo-fuchsia">Recherche</Link></li>
          </ul>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 border-b border-flo-fuchsia pb-2">Bollywood</h2>
        <p className="text-lg">Cette section est en cours de développement.</p>
      </main>
      
      <footer className="bg-gray-900 py-6 text-center text-gray-500">
        <p>© 2025 FloDrama - Tous droits réservés</p>
      </footer>
    </div>
  );
}
