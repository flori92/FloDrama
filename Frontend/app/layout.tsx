import './globals.css';

export const metadata = {
  title: 'FloDrama - Plateforme de streaming asiatique',
  description: 'Votre plateforme de référence pour les dramas, films, animes et plus encore !',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
