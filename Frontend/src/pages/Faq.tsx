import React from 'react'

const Faq: React.FC = () => (
  <main className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-b from-flo-black to-flo-secondary p-8 rounded-2xl shadow-lg">
    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-flo-blue to-flo-fuchsia bg-clip-text text-transparent">FAQ</h1>
    <ul className="text-flo-white space-y-4 max-w-2xl">
      <li><b>Comment regarder un contenu ?</b> Sélectionnez une catégorie et cliquez sur le contenu souhaité.</li>
      <li><b>Comment participer à une WatchParty ?</b> Rendez-vous dans la section WatchParty et suivez les instructions.</li>
      <li><b>Comment contacter le support ?</b> Envoyez un email à support@flodrama.com.</li>
    </ul>
  </main>
)

export default Faq
