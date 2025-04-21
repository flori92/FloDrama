// API REST pour les détails d'un contenu (mock)
import { NextApiRequest, NextApiResponse } from 'next'

interface ContentDetail {
  id: number
  title: string
  image: string
  type: string
  year: number
  rating: number
  description: string
}

const mockData: Record<number, ContentDetail> = {
  1: { id: 1, title: 'Crash Landing on You', image: '/images/dramas/cloy.webp', type: 'dramas', year: 2020, rating: 9.1, description: "Une héritière sud-coréenne atterrit en urgence en Corée du Nord et rencontre un officier militaire." },
  2: { id: 2, title: 'Itaewon Class', image: '/images/dramas/itaewon.webp', type: 'dramas', year: 2020, rating: 8.8, description: "Un jeune homme ouvre un bar à Itaewon pour défier un conglomérat puissant." },
  3: { id: 3, title: 'Goblin', image: '/images/dramas/goblin.webp', type: 'dramas', year: 2017, rating: 9.2, description: "Un immortel cherche la paix et l'amour après des siècles de solitude." },
  4: { id: 4, title: 'Parasite', image: '/images/movies/parasite.webp', type: 'movies', year: 2019, rating: 8.6, description: "Une famille pauvre infiltre la vie d'une famille riche à Séoul." },
  5: { id: 5, title: 'Oldboy', image: '/images/movies/oldboy.webp', type: 'movies', year: 2003, rating: 8.4, description: "Un homme emprisonné pendant 15 ans cherche la vérité sur son ravisseur." },
  6: { id: 6, title: 'Train to Busan', image: '/images/movies/train.webp', type: 'movies', year: 2016, rating: 7.6, description: "Un père et sa fille luttent pour survivre à une invasion zombie dans un train." },
  7: { id: 7, title: 'Demon Slayer', image: '/images/anime/kimetsu.webp', type: 'anime', year: 2019, rating: 8.7, description: "Un jeune garçon combat des démons pour sauver sa sœur." },
  8: { id: 8, title: 'Attack on Titan', image: '/images/anime/aot.webp', type: 'anime', year: 2013, rating: 9.0, description: "L'humanité lutte pour survivre face à des titans mangeurs d'hommes." },
  9: { id: 9, title: 'Jujutsu Kaisen', image: '/images/anime/jujutsu.webp', type: 'anime', year: 2020, rating: 8.5, description: "Un lycéen affronte des fléaux surnaturels après avoir absorbé une relique maudite." },
  10: { id: 10, title: '3 Idiots', image: '/images/bollywood/3idiots.webp', type: 'bollywood', year: 2009, rating: 8.4, description: "Trois amis défient le système éducatif indien." },
  11: { id: 11, title: 'Dangal', image: '/images/bollywood/dangal.webp', type: 'bollywood', year: 2016, rating: 8.3, description: "Un père entraîne ses filles à devenir championnes de lutte." },
  12: { id: 12, title: 'Gully Boy', image: '/images/bollywood/gullyboy.webp', type: 'bollywood', year: 2019, rating: 7.9, description: "Un jeune homme des bidonvilles rêve de devenir rappeur." },
  13: { id: 13, title: 'Squid Game', image: '/images/trending/squidgame.webp', type: 'trending', year: 2021, rating: 8.0, description: "Des personnes endettées participent à des jeux mortels pour gagner une fortune." },
  14: { id: 14, title: 'Alice in Borderland', image: '/images/trending/alice.webp', type: 'trending', year: 2020, rating: 7.7, description: "Des jeunes sont piégés dans un Tokyo alternatif et doivent survivre à des jeux dangereux." },
  15: { id: 15, title: 'Money Heist Korea', image: '/images/trending/moneyheist.webp', type: 'trending', year: 2022, rating: 7.2, description: "Un groupe tente de réaliser le plus grand braquage de Corée." }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const numId = Number(id)
  if (!numId || !(numId in mockData)) {
    return res.status(404).json({})
  }
  return res.status(200).json(mockData[numId])
}
