import Link from 'next/link';

const navLinks = [
  { name: 'Accueil', href: '/' },
  { name: 'Dramas', href: '/dramas' },
  { name: 'Films', href: '/films' },
  { name: 'Animés', href: '/animes' },
  { name: 'Bollywood', href: '/bollywood' },
  { name: 'WatchParty', href: '/watchparty' },
  { name: 'App', href: '/app' },
  { name: 'Recherche', href: '/search' },
];

export default function Navbar() {
  return (
    <nav className="w-full bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl text-primary">FloDrama</Link>
          <div className="hidden md:flex gap-6">
            {navLinks.map(link => (
              <Link key={link.name} href={link.href} className="hover:text-primary transition-colors font-medium">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <Link href="/profile" className="rounded-full bg-primary text-white px-4 py-2 font-semibold hover:bg-primary-dark transition-colors">Profil</Link>
        </div>
      </div>
    </nav>
  );
}
