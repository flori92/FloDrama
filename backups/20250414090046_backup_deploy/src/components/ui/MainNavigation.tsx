import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HybridComponent } from "@/adapters/hybrid-component";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
}

interface MainNavigationProps {
  className?: string;
  logo?: React.ReactNode;
  onSearch?: (query: string) => void;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
}

/**
 * Navigation principale de FloDrama
 * Version adaptée du Template_Front
 */
export function MainNavigation({
  className,
  logo,
  onSearch,
  onProfileClick,
  onNotificationsClick
}: MainNavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Détecter le défilement pour changer l'apparence de la barre de navigation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Éléments de navigation par défaut
  const navItems: NavItem[] = [
    { name: "Regarder", href: "/" },
    { name: "Dramas", href: "/dramas" },
    { name: "Animés", href: "/animes" },
    { name: "Films", href: "/films" },
    { name: "Ma Liste", href: "/ma-liste" },
  ];

  // Gérer la soumission de recherche
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
    setSearchOpen(false);
  };

  // Utiliser le composant hybride pour la navigation
  return (
    <HybridComponent
      componentName="Navigation"
      componentProps={{
        className: cn(
          "fixed top-0 w-full z-50 transition-all duration-300",
          scrolled ? "bg-black/90 backdrop-blur-md" : "bg-transparent",
          className
        )
      }}
    >
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et navigation principale */}
            <div className="flex items-center gap-8">
              <a href="/" className="flex items-center">
                {logo || (
                  <motion.div
                    className="text-2xl font-medium tracking-tight bg-gradient-to-r from-blue-500 to-fuchsia-500 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    FloDrama
                  </motion.div>
                )}
              </a>

              {/* Liens de navigation - masqués sur mobile */}
              <nav className="hidden md:flex space-x-8">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>

            {/* Recherche et actions utilisateur */}
            <div className="flex items-center gap-4">
              {/* Formulaire de recherche */}
              <div className="relative">
                {searchOpen ? (
                  <form onSubmit={handleSearchSubmit} className="absolute right-0 top-0 z-10">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher..."
                      className="bg-gray-900 text-white px-4 py-2 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="text-gray-300 hover:text-white p-2"
                    aria-label="Rechercher"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </button>
                )}
              </div>

              {/* Notifications */}
              <button
                onClick={onNotificationsClick}
                className="text-gray-300 hover:text-white p-2"
                aria-label="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </button>

              {/* Profil utilisateur */}
              <button
                onClick={onProfileClick}
                className="text-gray-300 hover:text-white p-2"
                aria-label="Profil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile - visible uniquement sur petit écran */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </motion.header>
    </HybridComponent>
  );
}
