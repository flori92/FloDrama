import React from 'react'

const About: React.FC = () => (
  <main className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-b from-flo-black to-flo-secondary p-8 rounded-2xl shadow-lg">
    <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-flo-blue to-flo-fuchsia bg-clip-text text-transparent">À propos de FloDrama</h1>
    <p className="text-flo-white mb-6 max-w-2xl text-center">FloDrama est la plateforme de streaming dédiée aux films, séries, animés et productions asiatiques. Notre mission : offrir une expérience immersive, innovante et accessible à tous les passionnés de culture asiatique.</p>
    <div className="text-flo-white opacity-70 text-sm">© {new Date().getFullYear()} FloDrama. Tous droits réservés.</div>
  </main>
)

export default About
