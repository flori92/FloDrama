/**
 * Données de test pour les films asiatiques
 * Utilisées comme fallback quand les APIs et le scraping échouent
 */

const testFilms = [
  {
    id: "film-001",
    title: "Train to Busan",
    original_title: "부산행",
    overview: "Un virus zombie se propage en Corée du Sud alors qu'un père et sa fille montent dans un train pour Busan.",
    poster_path: "https://m.media-amazon.com/images/M/MV5BMTkwOTQ4OTg0OV5BMl5BanBnXkFtZTgwMzQyOTM0OTE@._V1_.jpg",
    backdrop_path: "https://m.media-amazon.com/images/M/MV5BZTkwZjU3MTctMGExMi00YjU5LTgwMDMtOWNkZDRlZjQ4NmZhXkEyXkFqcGdeQXVyNjUwNzk3NDc@._V1_.jpg",
    release_date: "2016-07-20",
    vote_average: 7.8,
    genres: ["Action", "Horreur", "Thriller"],
    production_countries: ["kr"],
    runtime: 118,
    content_type: "film"
  },
  {
    id: "film-002",
    title: "Parasite",
    original_title: "기생충",
    overview: "Une famille pauvre s'immisce dans une famille riche, avec des conséquences inattendues.",
    poster_path: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg",
    backdrop_path: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg",
    release_date: "2019-05-30",
    vote_average: 8.6,
    genres: ["Comédie", "Drame", "Thriller"],
    production_countries: ["kr"],
    runtime: 132,
    content_type: "film"
  },
  {
    id: "film-003",
    title: "The Wandering Earth",
    original_title: "流浪地球",
    overview: "Dans un futur proche, le soleil devient instable et menace la Terre. L'humanité construit d'énormes moteurs pour déplacer la planète vers un nouveau système solaire.",
    poster_path: "https://m.media-amazon.com/images/M/MV5BMjE2NzZlMGItMzA4OS00ZjRiLTk3NzItMDRkOGFlZmNhYzJkXkEyXkFqcGdeQXVyNjc5NjEzNA@@._V1_.jpg",
    backdrop_path: "https://m.media-amazon.com/images/M/MV5BMjE2NzZlMGItMzA4OS00ZjRiLTk3NzItMDRkOGFlZmNhYzJkXkEyXkFqcGdeQXVyNjc5NjEzNA@@._V1_.jpg",
    release_date: "2019-02-05",
    vote_average: 7.2,
    genres: ["Action", "Science-Fiction", "Aventure"],
    production_countries: ["cn"],
    runtime: 125,
    content_type: "film"
  },
  {
    id: "film-004",
    title: "Your Name",
    original_title: "君の名は。",
    overview: "Deux adolescents découvrent qu'ils échangent mystérieusement leurs corps.",
    poster_path: "https://m.media-amazon.com/images/M/MV5BODRmZDVmNzUtZDA4ZC00NjhkLWI2M2UtN2M0ZDIzNDcxYThjL2ltYWdlXkEyXkFqcGdeQXVyNTk0MzMzODA@._V1_.jpg",
    backdrop_path: "https://m.media-amazon.com/images/M/MV5BODRmZDVmNzUtZDA4ZC00NjhkLWI2M2UtN2M0ZDIzNDcxYThjL2ltYWdlXkEyXkFqcGdeQXVyNTk0MzMzODA@._V1_.jpg",
    release_date: "2016-08-26",
    vote_average: 8.4,
    genres: ["Animation", "Drame", "Fantastique"],
    production_countries: ["jp"],
    runtime: 106,
    content_type: "film"
  },
  {
    id: "film-005",
    title: "Oldboy",
    original_title: "올드보이",
    overview: "Après avoir été kidnappé et emprisonné pendant 15 ans, Oh Dae-Su est libéré et doit trouver son ravisseur en 5 jours.",
    poster_path: "https://m.media-amazon.com/images/M/MV5BMTI3NTQyMzU5M15BMl5BanBnXkFtZTcwMTM2MjgyMQ@@._V1_.jpg",
    backdrop_path: "https://m.media-amazon.com/images/M/MV5BMTI3NTQyMzU5M15BMl5BanBnXkFtZTcwMTM2MjgyMQ@@._V1_.jpg",
    release_date: "2003-11-21",
    vote_average: 8.4,
    genres: ["Action", "Drame", "Mystère"],
    production_countries: ["kr"],
    runtime: 120,
    content_type: "film"
  },
  {
    id: "film-006",
    title: "Hero",
    original_title: "英雄",
    overview: "Un guerrier anonyme raconte comment il a vaincu trois assassins qui cherchaient à tuer le roi de Qin.",
    poster_path: "https://m.media-amazon.com/images/M/MV5BMWQ2MjQ0OTctMWE1OC00NjZjLTk3ZDAtNTk3NTZiYWMxYTlmXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg",
    backdrop_path: "https://m.media-amazon.com/images/M/MV5BMWQ2MjQ0OTctMWE1OC00NjZjLTk3ZDAtNTk3NTZiYWMxYTlmXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg",
    release_date: "2002-10-24",
    vote_average: 7.9,
    genres: ["Action", "Aventure", "Histoire"],
    production_countries: ["cn"],
    runtime: 99,
    content_type: "film"
  },
  {
    id: "film-007",
    title: "La Forêt de Mogari",
    original_title: "殯の森",
    overview: "Un vieil homme et une jeune femme, tous deux en deuil, se rencontrent et entreprennent un voyage dans une forêt mystérieuse.",
    poster_path: "https://m.media-amazon.com/images/M/MV5BMTUzOTcwOTg2MF5BMl5BanBnXkFtZTcwNTcwOTg1MQ@@._V1_.jpg",
    backdrop_path: "https://m.media-amazon.com/images/M/MV5BMTUzOTcwOTg2MF5BMl5BanBnXkFtZTcwNTcwOTg1MQ@@._V1_.jpg",
    release_date: "2007-05-20",
    vote_average: 7.1,
    genres: ["Drame"],
    production_countries: ["jp"],
    runtime: 97,
    content_type: "film"
  },
  {
    id: "film-008",
    title: "The Raid",
    original_title: "Serbuan maut",
    overview: "Une équipe d'élite de la police indonésienne est piégée dans un immeuble contrôlé par un baron de la drogue.",
    poster_path: "https://m.media-amazon.com/images/M/MV5BZGIxODNjM2YtZjA5Mi00MjA5LTk2YjItODE0OWI5NThjNTBmXkEyXkFqcGdeQXVyNzQ1ODk3MTQ@._V1_.jpg",
    backdrop_path: "https://m.media-amazon.com/images/M/MV5BZGIxODNjM2YtZjA5Mi00MjA5LTk2YjItODE0OWI5NThjNTBmXkEyXkFqcGdeQXVyNzQ1ODk3MTQ@._V1_.jpg",
    release_date: "2011-09-08",
    vote_average: 7.6,
    genres: ["Action", "Thriller", "Crime"],
    production_countries: ["id"],
    runtime: 101,
    content_type: "film"
  },
  {
    id: "film-009",
    title: "Memories of Murder",
    original_title: "살인의 추억",
    overview: "Dans une petite ville de Corée du Sud en 1986, deux détectives tentent de résoudre une série de meurtres.",
    poster_path: "https://m.media-amazon.com/images/M/MV5BOGViNTg4YTktYTQ2Ni00MTU0LTk2NWUtMTI4OGY0MTY0YzAwXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg",
    backdrop_path: "https://m.media-amazon.com/images/M/MV5BOGViNTg4YTktYTQ2Ni00MTU0LTk2NWUtMTI4OGY0MTY0YzAwXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg",
    release_date: "2003-05-02",
    vote_average: 8.1,
    genres: ["Crime", "Drame", "Mystère"],
    production_countries: ["kr"],
    runtime: 131,
    content_type: "film"
  },
  {
    id: "film-010",
    title: "Chungking Express",
    original_title: "重慶森林",
    overview: "Deux histoires d'amour se déroulent à Hong Kong, impliquant deux policiers différents.",
    poster_path: "https://m.media-amazon.com/images/M/MV5BYjBjYTRlMzctZGU5MC00OGVjLTk3YjQtZTgwYmYwZDk3YTk2XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg",
    backdrop_path: "https://m.media-amazon.com/images/M/MV5BYjBjYTRlMzctZGU5MC00OGVjLTk3YjQtZTgwYmYwZDk3YTk2XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_.jpg",
    release_date: "1994-07-14",
    vote_average: 8.0,
    genres: ["Comédie", "Drame", "Romance"],
    production_countries: ["hk"],
    runtime: 102,
    content_type: "film"
  }
];

module.exports = {
  testFilms
};
