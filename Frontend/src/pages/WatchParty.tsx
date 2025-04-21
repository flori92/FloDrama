import React from 'react'

const WatchParty: React.FC = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-b from-flo-black to-flo-secondary p-8 rounded-2xl shadow-lg">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-flo-blue to-flo-fuchsia bg-clip-text text-transparent">WatchParty FloDrama</h1>
      <p className="text-flo-white mb-8 text-center max-w-xl">Regardez vos films et séries préférés en simultané avec vos amis, où qu'ils soient ! Créez ou rejoignez une WatchParty pour une expérience partagée et interactive.</p>
      <div className="flex flex-col md:flex-row gap-6 items-center mb-8">
        <a href="/watchparty/create" className="transition-all px-6 py-3 rounded-lg bg-gradient-to-r from-flo-blue to-flo-fuchsia text-flo-white font-bold text-lg shadow hover:scale-105">Créer une WatchParty</a>
        <a href="/watchparty/join" className="transition-all px-6 py-3 rounded-lg border border-flo-fuchsia text-flo-fuchsia font-bold text-lg hover:bg-flo-fuchsia hover:text-flo-white">Rejoindre une WatchParty</a>
      </div>
      <div className="text-flo-white opacity-70 text-sm">Fonctionnalité déjà disponible pour tous les membres inscrits.</div>
    </main>
  )
}

export default WatchParty
