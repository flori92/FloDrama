import React from 'react'

const AppDownload: React.FC = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-b from-flo-black to-flo-secondary p-8 rounded-2xl shadow-lg">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-flo-blue to-flo-fuchsia bg-clip-text text-transparent">Téléchargez FloDrama sur votre appareil</h1>
      <p className="text-flo-white mb-8 text-center max-w-xl">Retrouvez l'expérience FloDrama sur mobile et tablette. Téléchargez notre application officielle pour iOS et Android, ou scannez le QR code pour un accès rapide.</p>
      <div className="flex flex-col md:flex-row gap-6 items-center mb-8">
        <a href="https://apps.apple.com/app/idXXXXXXXX" target="_blank" rel="noopener noreferrer" className="transition-all px-6 py-3 rounded-lg bg-gradient-to-r from-flo-blue to-flo-fuchsia text-flo-white font-bold text-lg shadow hover:scale-105">App Store (iOS)</a>
        <a href="https://play.google.com/store/apps/details?id=XXXXXXXX" target="_blank" rel="noopener noreferrer" className="transition-all px-6 py-3 rounded-lg bg-gradient-to-r from-flo-blue to-flo-fuchsia text-flo-white font-bold text-lg shadow hover:scale-105">Google Play (Android)</a>
        {/* QR code ou lien APK ici si besoin */}
      </div>
      <div className="text-flo-white opacity-70 text-sm">Bientôt disponible sur d'autres plateformes !</div>
    </main>
  )
}

export default AppDownload
