import React from 'react'

const Contact: React.FC = () => (
  <main className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-b from-flo-black to-flo-secondary p-8 rounded-2xl shadow-lg">
    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-flo-blue to-flo-fuchsia bg-clip-text text-transparent">Contactez-nous</h1>
    <p className="text-flo-white mb-6 max-w-2xl text-center">Une question, une suggestion ou un problème ? Notre équipe est à votre écoute. Envoyez-nous un email à <a href="mailto:support@flodrama.com" className="underline text-flo-fuchsia">support@flodrama.com</a>.</p>
  </main>
)

export default Contact
