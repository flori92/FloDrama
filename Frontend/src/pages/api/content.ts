// Simule une API locale pour /api/content
import { NextApiRequest, NextApiResponse } from 'next'

interface ContentItem {
  id: number
  title: string
  image: string
  type: string
  year: number
  rating: number
}

const mockData: Record<string, ContentItem[]> = {
  dramas: [
    { id: 1, title: 'Crash Landing on You', image: '/images/dramas/cloy.webp', type: 'dramas', year: 2020, rating: 9.1 },
    { id: 2, title: 'Itaewon Class', image: '/images/dramas/itaewon.webp', type: 'dramas', year: 2020, rating: 8.8 },
    { id: 3, title: 'Goblin', image: '/images/dramas/goblin.webp', type: 'dramas', year: 2017, rating: 9.2 },
  ],
  movies: [
    { id: 4, title: 'Parasite', image: '/images/movies/parasite.webp', type: 'movies', year: 2019, rating: 8.6 },
    { id: 5, title: 'Oldboy', image: '/images/movies/oldboy.webp', type: 'movies', year: 2003, rating: 8.4 },
    { id: 6, title: 'Train to Busan', image: '/images/movies/train.webp', type: 'movies', year: 2016, rating: 7.6 },
  ],
  anime: [
    { id: 7, title: 'Demon Slayer', image: '/images/anime/kimetsu.webp', type: 'anime', year: 2019, rating: 8.7 },
    { id: 8, title: 'Attack on Titan', image: '/images/anime/aot.webp', type: 'anime', year: 2013, rating: 9.0 },
    { id: 9, title: 'Jujutsu Kaisen', image: '/images/anime/jujutsu.webp', type: 'anime', year: 2020, rating: 8.5 },
  ],
  bollywood: [
    { id: 10, title: '3 Idiots', image: '/images/bollywood/3idiots.webp', type: 'bollywood', year: 2009, rating: 8.4 },
    { id: 11, title: 'Dangal', image: '/images/bollywood/dangal.webp', type: 'bollywood', year: 2016, rating: 8.3 },
    { id: 12, title: 'Gully Boy', image: '/images/bollywood/gullyboy.webp', type: 'bollywood', year: 2019, rating: 7.9 },
  ],
  trending: [
    { id: 13, title: 'Squid Game', image: '/images/trending/squidgame.webp', type: 'trending', year: 2021, rating: 8.0 },
    { id: 14, title: 'Alice in Borderland', image: '/images/trending/alice.webp', type: 'trending', year: 2020, rating: 7.7 },
    { id: 15, title: 'Money Heist Korea', image: '/images/trending/moneyheist.webp', type: 'trending', year: 2022, rating: 7.2 },
  ]
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { category } = req.query
  if (typeof category !== 'string' || !(category in mockData)) {
    return res.status(404).json([])
  }
  return res.status(200).json(mockData[category])
}
