/**
 * Données mockées pour FloDrama
 * Ces données sont utilisées lorsque les services de scraping ne sont pas disponibles
 */

export const mockDramas = [
  {
    id: 'drama-001',
    title: 'Crash Landing on You',
    image: 'https://m.media-amazon.com/images/M/MV5BMzRiZWUyN2YtNDI4YS00NTg2LTg0OTgtMGI2ZjU4ODQ4Yjk3XkEyXkFqcGdeQXVyNTI5NjIyMw@@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BYmQ3NTk5M2QtZTg0ZC00YzE5LWEzZmYtNTc4ZDRlNWYxZDc3XkEyXkFqcGdeQXVyNDY5MjMyNTg@._V1_.jpg',
    year: 2019,
    country: 'Corée du Sud',
    type: 'drama',
    genres: ['Romance', 'Comédie', 'Drame'],
    rating: 8.7,
    episodes: 16,
    description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente. Elle y rencontre un officier de l\'armée nord-coréenne qui décide de l\'aider à retourner chez elle.',
    trailer: 'https://www.youtube.com/watch?v=eXMjTVL5bug'
  },
  {
    id: 'drama-002',
    title: 'Goblin',
    image: 'https://m.media-amazon.com/images/M/MV5BZTg0YmQxZTgtMzgwYi00N2NhLTlkMWYtOWYwNDA1YjkxMmViL2ltYWdlL2ltYWdlXkEyXkFqcGdeQXVyMzE4MDkyNTA@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BYmRhY2JlYTUtZWM4Yi00YWQ4LWIzZDAtYzM5YzVmODdlYzI0XkEyXkFqcGdeQXVyMzE4MDkyNTA@._V1_.jpg',
    year: 2016,
    country: 'Corée du Sud',
    type: 'drama',
    genres: ['Fantastique', 'Romance', 'Drame'],
    rating: 8.6,
    episodes: 16,
    description: 'Un gobelin immortel cherche sa fiancée pour mettre fin à sa vie éternelle. Il rencontre une jeune femme qui peut voir les fantômes et qui pourrait être celle qu\'il cherche.',
    trailer: 'https://www.youtube.com/watch?v=S94ukM8C17A'
  },
  {
    id: 'drama-003',
    title: 'It\'s Okay to Not Be Okay',
    image: 'https://m.media-amazon.com/images/M/MV5BYWQxMjM0YzItNzNmYi00MDRmLTgxZTctMjVkZmYyOTcyZjMxXkEyXkFqcGdeQXVyNDY5MjMyNTg@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BODVjZThlMzMtZjQwNy00YjRlLTk1ZjktNzI3YzE1NWJkNTU5XkEyXkFqcGdeQXVyNDY5MjMyNTg@._V1_.jpg',
    year: 2020,
    country: 'Corée du Sud',
    type: 'drama',
    genres: ['Romance', 'Drame', 'Psychologique'],
    rating: 8.7,
    episodes: 16,
    description: 'Un employé d\'hôpital psychiatrique et une auteure de livres pour enfants au caractère antisocial se rencontrent et commencent à guérir mutuellement leurs blessures émotionnelles.',
    trailer: 'https://www.youtube.com/watch?v=1H__LNPCc80'
  },
  {
    id: 'drama-004',
    title: 'Reply 1988',
    image: 'https://m.media-amazon.com/images/M/MV5BZmI1ZGRhNDYtOGMwNS00MTliLTlkNjEtYTNlZjI1MDFkYzM0XkEyXkFqcGdeQXVyMzE4MDkyNTA@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNzQyYzU3Y2MtOWY2Yy00ZGM2LTg3ZTUtMDJkZTJiMmEzMjYxXkEyXkFqcGdeQXVyMTI2NTY3NDg5._V1_.jpg',
    year: 2015,
    country: 'Corée du Sud',
    type: 'drama',
    genres: ['Comédie', 'Drame', 'Famille'],
    rating: 9.2,
    episodes: 20,
    description: 'Cinq familles vivant dans la même ruelle de Séoul en 1988 partagent leurs joies et leurs peines, tandis que leurs enfants grandissent et découvrent l\'amitié et l\'amour.',
    trailer: 'https://www.youtube.com/watch?v=NyLkjCUvh-0'
  },
  {
    id: 'drama-005',
    title: 'My Love from the Star',
    image: 'https://m.media-amazon.com/images/M/MV5BYmVjNDIxODAtNWZiYi00MzI3LWJmOTgtMDZiYTFhMGM1YTAyXkEyXkFqcGdeQXVyMzE4MDkyNTA@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BZjRlZDIyNDMtZjIwYi00YmJiLTg4NjMtODRmYjIwYzJmNDJkXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg',
    year: 2013,
    country: 'Corée du Sud',
    type: 'drama',
    genres: ['Romance', 'Fantastique', 'Comédie'],
    rating: 8.3,
    episodes: 21,
    description: 'Un extraterrestre coincé sur Terre depuis 400 ans rencontre une actrice célèbre et arrogante, et tombe amoureux d\'elle alors qu\'il se prépare à retourner sur sa planète.',
    trailer: 'https://www.youtube.com/watch?v=AqmCLt5L3H8'
  }
];

export const mockMovies = [
  {
    id: 'movie-001',
    title: 'Parasite',
    image: 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNDJiZDliZDAtMjc0Yy00MmQ2LTk0M2UtNjVjMjZjOTIyYTk0XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg',
    year: 2019,
    country: 'Corée du Sud',
    type: 'movie',
    genres: ['Thriller', 'Drame', 'Comédie noire'],
    rating: 8.6,
    duration: 132,
    description: 'Une famille pauvre s\'immisce subtilement dans le foyer d\'une famille riche, mais les choses prennent une tournure inattendue.',
    trailer: 'https://www.youtube.com/watch?v=isOGD_7hNIY'
  },
  {
    id: 'movie-002',
    title: 'Train to Busan',
    image: 'https://m.media-amazon.com/images/M/MV5BMTkwOTQ4OTg0OV5BMl5BanBnXkFtZTgwMzQyOTM0OTE@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNjJiZDhjZDAtZTYxYy00YWM3LTkwODQtZDg3MjlkMGE5ZTFhXkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg',
    year: 2016,
    country: 'Corée du Sud',
    type: 'movie',
    genres: ['Action', 'Horreur', 'Thriller'],
    rating: 7.6,
    duration: 118,
    description: 'Alors qu\'une épidémie zombie se propage en Corée du Sud, des passagers luttent pour leur survie à bord d\'un train à grande vitesse de Séoul à Busan.',
    trailer: 'https://www.youtube.com/watch?v=pyWuHv2-Abk'
  },
  {
    id: 'movie-003',
    title: 'The Handmaiden',
    image: 'https://m.media-amazon.com/images/M/MV5BNDJhYTk2MTctZmVmOS00OTViLTgxNjQtMzQxOTRiMDdmNGRjXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNDNiOTA5YjktY2Q0Ni00ODgzLWE5MWItNGExOWRlYjY2MjBlXkEyXkFqcGdeQXVyNjQ2MjQ5NzM@._V1_.jpg',
    year: 2016,
    country: 'Corée du Sud',
    type: 'movie',
    genres: ['Drame', 'Romance', 'Thriller'],
    rating: 8.1,
    duration: 145,
    description: 'Dans la Corée des années 1930 sous occupation japonaise, une jeune femme est engagée comme servante d\'une riche héritière japonaise, mais elle cache un secret.',
    trailer: 'https://www.youtube.com/watch?v=whldChqCsYk'
  },
  {
    id: 'movie-004',
    title: 'Oldboy',
    image: 'https://m.media-amazon.com/images/M/MV5BMTI3NTQyMzU5M15BMl5BanBnXkFtZTcwMTM2MjgyMQ@@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNzc5MTczNDQtNDFjNi00ZDU5LWFkNzItOTE1NzQzMzdhNzYxXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg',
    year: 2003,
    country: 'Corée du Sud',
    type: 'movie',
    genres: ['Action', 'Drame', 'Mystère'],
    rating: 8.4,
    duration: 120,
    description: 'Après avoir été kidnappé et emprisonné pendant 15 ans, Oh Dae-Su est libéré et doit trouver celui qui l\'a séquestré, tout en découvrant pourquoi.',
    trailer: 'https://www.youtube.com/watch?v=2HkjrJ6IK5E'
  },
  {
    id: 'movie-005',
    title: 'The Wailing',
    image: 'https://m.media-amazon.com/images/M/MV5BODkwMTgxNjA2NF5BMl5BanBnXkFtZTgwMDc0OTcwOTE@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BZTQyNTU0MDktYTFkYi00ZjNhLWE2ODctMzBkM2U1ZTk3YTMzXkEyXkFqcGdeQXVyNTI4MzE4MDU@._V1_.jpg',
    year: 2016,
    country: 'Corée du Sud',
    type: 'movie',
    genres: ['Horreur', 'Mystère', 'Thriller'],
    rating: 7.5,
    duration: 156,
    description: 'Un policier enquête sur une série de meurtres mystérieux dans un village reculé. Les habitants soupçonnent un étranger japonais d\'être responsable d\'une maladie qui transforme les victimes en meurtriers sauvages.',
    trailer: 'https://www.youtube.com/watch?v=43uAputjI4k'
  },
  {
    id: 'movie-006',
    title: 'Amélie',
    image: 'https://m.media-amazon.com/images/M/MV5BNDg4NjM1YjMtYmNhZC00MjM0LWFiZmYtNGY1YjA3MzZmODc5XkEyXkFqcGdeQXVyNDk3NzU2MTQ@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNDg4NjM1YjMtYmNhZC00MjM0LWFiZmYtNGY1YjA3MzZmODc5XkEyXkFqcGdeQXVyNDk3NzU2MTQ@._V1_.jpg',
    year: 2001,
    country: 'France',
    type: 'movie',
    genres: ['Comédie', 'Romance'],
    rating: 8.3,
    duration: 122,
    description: 'Une jeune femme timide décide de changer la vie des gens qui l\'entourent tout en luttant avec sa propre timidité.',
    trailer: 'https://www.youtube.com/watch?v=HUECWi5pX7o'
  },
  {
    id: 'movie-007',
    title: 'Les Intouchables',
    image: 'https://m.media-amazon.com/images/M/MV5BMTYxNDA3MDQwNl5BMl5BanBnXkFtZTcwNTU4Mzc1Nw@@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BMTYxNDA3MDQwNl5BMl5BanBnXkFtZTcwNTU4Mzc1Nw@@._V1_.jpg',
    year: 2011,
    country: 'France',
    type: 'movie',
    genres: ['Biographie', 'Comédie', 'Drame'],
    rating: 8.5,
    duration: 112,
    description: 'Après être devenu tétraplégique suite à un accident de parapente, un aristocrate engage un jeune homme des banlieues comme aide-soignant.',
    trailer: 'https://www.youtube.com/watch?v=34WIbmXkewU'
  },
  {
    id: 'movie-008',
    title: 'La Haine',
    image: 'https://m.media-amazon.com/images/M/MV5BNDNiOTA5YjktY2Q0Ni00ODgzLWE5MWItNGExOWRlYjY2MjBlXkEyXkFqcGdeQXVyNjQ2MjQ5NzM@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNDNiOTA5YjktY2Q0Ni00ODgzLWE5MWItNGExOWRlYjY2MjBlXkEyXkFqcGdeQXVyNjQ2MjQ5NzM@._V1_.jpg',
    year: 1995,
    country: 'France',
    type: 'movie',
    genres: ['Crime', 'Drame'],
    rating: 8.1,
    duration: 98,
    description: 'Vingt-quatre heures dans la vie de trois jeunes d\'une banlieue parisienne après une nuit d\'émeutes.',
    trailer: 'https://www.youtube.com/watch?v=FKwcXt3JIaU'
  },
  {
    id: 'movie-009',
    title: 'Portrait de la jeune fille en feu',
    image: 'https://m.media-amazon.com/images/M/MV5BNjgwNjkwOWYtYmM3My00NzI1LTk5OGItYWY0OTMyZTY4OTg2XkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNjgwNjkwOWYtYmM3My00NzI1LTk5OGItYWY0OTMyZTY4OTg2XkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg',
    year: 2019,
    country: 'France',
    type: 'movie',
    genres: ['Drame', 'Romance'],
    rating: 8.1,
    duration: 122,
    description: 'À la fin du XVIIIe siècle, une peintre est engagée pour réaliser le portrait de mariage d\'une jeune femme qui vient de quitter le couvent. Jour après jour, les deux femmes se rapprochent.',
    trailer: 'https://www.youtube.com/watch?v=R-fQPTwma9o'
  }
];

export const mockAnimes = [
  {
    id: 'anime-001',
    title: 'Attack on Titan',
    image: 'https://m.media-amazon.com/images/M/MV5BNzc5MTczNDQtNDFjNi00ZDU5LWFkNzItOTE1NzQzMzdhNzYxXkEyXkFqcGdeQXVyNTgyNTA4MjM@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNzc5MTczNDQtNDFjNi00ZDU5LWFkNzItOTE1NzQzMzdhNzYxXkEyXkFqcGdeQXVyNTgyNTA4MjM@._V1_.jpg',
    year: 2013,
    country: 'Japon',
    type: 'anime',
    genres: ['Action', 'Drame', 'Fantastique'],
    rating: 9.0,
    episodes: 75,
    description: 'Dans un monde où l\'humanité vit entourée d\'immenses murs pour se protéger des Titans, des êtres gigantesques qui dévorent les humains, un jeune homme rejoint le corps militaire pour se venger après que sa mère a été tuée.',
    trailer: 'https://www.youtube.com/watch?v=MGRm4IzK1SQ'
  },
  {
    id: 'anime-002',
    title: 'Demon Slayer',
    image: 'https://m.media-amazon.com/images/M/MV5BZjZjNzI5MDctY2Y4YS00NmM4LTljMmItZTFkOTExNGI3ODRhXkEyXkFqcGdeQXVyNjc3MjQzNTI@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BZjZjNzI5MDctY2Y4YS00NmM4LTljMmItZTFkOTExNGI3ODRhXkEyXkFqcGdeQXVyNjc3MjQzNTI@._V1_.jpg',
    year: 2019,
    country: 'Japon',
    type: 'anime',
    genres: ['Action', 'Fantastique', 'Aventure'],
    rating: 8.7,
    episodes: 44,
    description: 'Un jeune homme devient chasseur de démons après que sa famille a été massacrée et sa sœur transformée en démon.',
    trailer: 'https://www.youtube.com/watch?v=VQGCKyvzIM4'
  },
  {
    id: 'anime-003',
    title: 'My Hero Academia',
    image: 'https://m.media-amazon.com/images/M/MV5BNmQzYmE2MGEtZjk4YS00YmVjLWEwZWMtODRkMjc4MTM5N2I3XkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BNmQzYmE2MGEtZjk4YS00YmVjLWEwZWMtODRkMjc4MTM5N2I3XkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_.jpg',
    year: 2016,
    country: 'Japon',
    type: 'anime',
    genres: ['Action', 'Comédie', 'Super-héros'],
    rating: 8.4,
    episodes: 113,
    description: 'Dans un monde où 80% de la population possède des super-pouvoirs, un jeune garçon sans pouvoir rêve de devenir un héros.',
    trailer: 'https://www.youtube.com/watch?v=EPVkcwyLQQ8'
  },
  {
    id: 'anime-004',
    title: 'One Punch Man',
    image: 'https://m.media-amazon.com/images/M/MV5BMTNmZDE2NDEtNTg3MS00OTE1LThlZGUtOGZkZTg0NTUyNGVmXkEyXkFqcGdeQXVyNTgyNTA4MjM@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BMTNmZDE2NDEtNTg3MS00OTE1LThlZGUtOGZkZTg0NTUyNGVmXkEyXkFqcGdeQXVyNTgyNTA4MjM@._V1_.jpg',
    year: 2015,
    country: 'Japon',
    type: 'anime',
    genres: ['Action', 'Comédie', 'Super-héros'],
    rating: 8.7,
    episodes: 24,
    description: 'L\'histoire d\'un super-héros qui peut vaincre n\'importe quel ennemi d\'un seul coup de poing, mais qui s\'ennuie à cause de l\'absence de défi.',
    trailer: 'https://www.youtube.com/watch?v=2JAElThbKrI'
  },
  {
    id: 'anime-005',
    title: 'Your Name',
    image: 'https://m.media-amazon.com/images/M/MV5BODRmZDVmNzUtZDA4ZC00NjhkLWI2M2UtN2M0ZDIzNDcxYThjL2ltYWdlXkEyXkFqcGdeQXVyNTk0MzMzODA@._V1_.jpg',
    backdrop: 'https://m.media-amazon.com/images/M/MV5BODRmZDVmNzUtZDA4ZC00NjhkLWI2M2UtN2M0ZDIzNDcxYThjL2ltYWdlXkEyXkFqcGdeQXVyNTk0MzMzODA@._V1_.jpg',
    year: 2016,
    country: 'Japon',
    type: 'anime',
    genres: ['Romance', 'Fantastique', 'Drame'],
    rating: 8.4,
    duration: 106,
    description: 'Deux adolescents découvrent qu\'ils échangent leurs corps pendant leur sommeil et commencent à communiquer l\'un avec l\'autre.',
    trailer: 'https://www.youtube.com/watch?v=xU47nhruN-Q'
  }
];

export const mockData = {
  dramas: mockDramas,
  movies: mockMovies,
  animes: mockAnimes,
  
  // Données combinées pour la page d'accueil
  homePageData: {
    popular: [...mockDramas, ...mockMovies, ...mockAnimes].slice(0, 10),
    dramas: mockDramas,
    movies: mockMovies,
    animes: mockAnimes
  }
};

export default mockData;
