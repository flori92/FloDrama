const Anime = require('../../../core/models/Anime');

describe('Anime Model', () => {
  test('devrait créer une instance avec les propriétés par défaut', () => {
    const anime = new Anime();
    
    // Propriétés héritées de Content
    expect(anime).toHaveProperty('id', '');
    expect(anime).toHaveProperty('title', '');
    expect(anime).toHaveProperty('description', '');
    expect(anime).toHaveProperty('image', '');
    expect(anime).toHaveProperty('source', '');
    expect(anime).toHaveProperty('genres', []);
    expect(anime).toHaveProperty('rating', 0);
    expect(anime).toHaveProperty('release_date', '');
    expect(anime).toHaveProperty('status', '');
    
    // Propriétés spécifiques à Anime
    expect(anime).toHaveProperty('episodes', 0);
    expect(anime).toHaveProperty('duration', 0);
    expect(anime).toHaveProperty('type', '');
    expect(anime).toHaveProperty('studios', []);
    expect(anime).toHaveProperty('season', '');
    expect(anime).toHaveProperty('year', 0);
    expect(anime).toHaveProperty('trailer_url', '');
    expect(anime).toHaveProperty('characters', []);
  });

  test('devrait normaliser les données depuis un objet source Jikan', () => {
    const sourceData = {
      mal_id: 123,
      title: 'Naruto',
      synopsis: 'Un ninja en devenir',
      images: { jpg: { image_url: 'https://example.com/naruto.jpg' } },
      genres: [{ id: 1, name: 'Action' }, { id: 2, name: 'Adventure' }],
      score: 8.7,
      aired: { from: '2002-10-03' },
      status: 'Finished Airing',
      episodes: 220,
      duration: '23 min per ep',
      type: 'TV',
      studios: [{ id: 1, name: 'Studio Pierrot' }],
      season: 'fall',
      year: 2002,
      trailer: { url: 'https://www.youtube.com/watch?v=123' },
      characters: [
        { character: { mal_id: 17, name: 'Uzumaki Naruto' } },
        { character: { mal_id: 18, name: 'Uchiha Sasuke' } }
      ]
    };

    const anime = new Anime(sourceData, 'jikan');

    expect(anime.id).toBe('123');
    expect(anime.title).toBe('Naruto');
    expect(anime.description).toBe('Un ninja en devenir');
    expect(anime.image).toBe('https://example.com/naruto.jpg');
    expect(anime.source).toBe('jikan');
    expect(anime.genres).toEqual([{ id: 1, name: 'Action' }, { id: 2, name: 'Adventure' }]);
    expect(anime.rating).toBe(8.7);
    expect(anime.release_date).toBe('2002-10-03');
    expect(anime.status).toBe('Finished Airing');
    expect(anime.episodes).toBe(220);
    expect(anime.duration).toBe(23);
    expect(anime.type).toBe('TV');
    expect(anime.studios).toEqual([{ id: 1, name: 'Studio Pierrot' }]);
    expect(anime.season).toBe('fall');
    expect(anime.year).toBe(2002);
    expect(anime.trailer_url).toBe('https://www.youtube.com/watch?v=123');
    expect(anime.characters).toEqual([
      { id: 17, name: 'Uzumaki Naruto' },
      { id: 18, name: 'Uchiha Sasuke' }
    ]);
  });

  test('devrait normaliser les données depuis un objet source Anime API', () => {
    const sourceData = {
      id: '123',
      title: 'One Piece',
      description: 'Aventures de pirates',
      image: 'https://example.com/onepiece.jpg',
      genres: ['Action', 'Adventure', 'Comedy'],
      rating: 9.2,
      release_date: '1999-10-20',
      status: 'Ongoing',
      episodes: 1000,
      duration: 24,
      type: 'TV',
      studios: ['Toei Animation'],
      season: 'Fall 1999',
      trailer_url: 'https://www.youtube.com/watch?v=456'
    };

    const anime = new Anime(sourceData, 'anime-api');

    expect(anime.id).toBe('123');
    expect(anime.title).toBe('One Piece');
    expect(anime.description).toBe('Aventures de pirates');
    expect(anime.image).toBe('https://example.com/onepiece.jpg');
    expect(anime.source).toBe('anime-api');
    expect(anime.genres).toEqual([
      { id: 0, name: 'Action' },
      { id: 0, name: 'Adventure' },
      { id: 0, name: 'Comedy' }
    ]);
    expect(anime.rating).toBe(9.2);
    expect(anime.release_date).toBe('1999-10-20');
    expect(anime.status).toBe('Ongoing');
    expect(anime.episodes).toBe(1000);
    expect(anime.duration).toBe(24);
    expect(anime.type).toBe('TV');
    expect(anime.studios).toEqual([{ id: 0, name: 'Toei Animation' }]);
    expect(anime.season).toBe('Fall 1999');
    expect(anime.trailer_url).toBe('https://www.youtube.com/watch?v=456');
  });

  test('devrait extraire correctement la durée en minutes', () => {
    const anime = new Anime();
    
    // Test avec différents formats de durée
    expect(anime.extractDuration('23 min per ep')).toBe(23);
    expect(anime.extractDuration('1 hr 30 min per ep')).toBe(90);
    expect(anime.extractDuration('1 hr per ep')).toBe(60);
    expect(anime.extractDuration('45 min')).toBe(45);
    expect(anime.extractDuration(30)).toBe(30);
    
    // Test avec des valeurs non valides
    expect(anime.extractDuration(null)).toBe(0);
    expect(anime.extractDuration(undefined)).toBe(0);
    expect(anime.extractDuration('Unknown')).toBe(0);
  });

  test('devrait normaliser les studios correctement', () => {
    const anime = new Anime();
    
    // Test avec un tableau d'objets
    const studios1 = [{ id: 1, name: 'Studio Pierrot' }, { id: 2, name: 'Toei Animation' }];
    expect(anime.normalizeStudios(studios1)).toEqual(studios1);
    
    // Test avec un tableau de chaînes
    const studios2 = ['Studio Pierrot', 'Toei Animation'];
    expect(anime.normalizeStudios(studios2)).toEqual([
      { id: 0, name: 'Studio Pierrot' },
      { id: 0, name: 'Toei Animation' }
    ]);
    
    // Test avec une valeur non valide
    expect(anime.normalizeStudios(null)).toEqual([]);
    expect(anime.normalizeStudios('Studio Pierrot')).toEqual([]);
    expect(anime.normalizeStudios(123)).toEqual([]);
  });

  test('devrait normaliser les personnages correctement', () => {
    const anime = new Anime();
    
    // Test avec un tableau d'objets Jikan
    const characters1 = [
      { character: { mal_id: 17, name: 'Uzumaki Naruto' } },
      { character: { mal_id: 18, name: 'Uchiha Sasuke' } }
    ];
    expect(anime.normalizeCharacters(characters1)).toEqual([
      { id: 17, name: 'Uzumaki Naruto' },
      { id: 18, name: 'Uchiha Sasuke' }
    ]);
    
    // Test avec un tableau d'objets simples
    const characters2 = [
      { id: 17, name: 'Uzumaki Naruto' },
      { id: 18, name: 'Uchiha Sasuke' }
    ];
    expect(anime.normalizeCharacters(characters2)).toEqual(characters2);
    
    // Test avec un tableau de chaînes
    const characters3 = ['Uzumaki Naruto', 'Uchiha Sasuke'];
    expect(anime.normalizeCharacters(characters3)).toEqual([
      { id: 0, name: 'Uzumaki Naruto' },
      { id: 0, name: 'Uchiha Sasuke' }
    ]);
    
    // Test avec une valeur non valide
    expect(anime.normalizeCharacters(null)).toEqual([]);
    expect(anime.normalizeCharacters('Uzumaki Naruto')).toEqual([]);
    expect(anime.normalizeCharacters(123)).toEqual([]);
  });

  test('devrait convertir en JSON correctement', () => {
    const anime = new Anime({
      mal_id: 123,
      title: 'Naruto',
      synopsis: 'Un ninja en devenir',
      images: { jpg: { image_url: 'https://example.com/naruto.jpg' } },
      genres: [{ id: 1, name: 'Action' }],
      score: 8.7,
      aired: { from: '2002-10-03' },
      status: 'Finished Airing',
      episodes: 220,
      duration: '23 min per ep',
      type: 'TV',
      studios: [{ id: 1, name: 'Studio Pierrot' }],
      season: 'fall',
      year: 2002,
      trailer: { url: 'https://www.youtube.com/watch?v=123' }
    }, 'jikan');

    const json = anime.toJSON();
    
    expect(json).toEqual({
      id: '123',
      title: 'Naruto',
      description: 'Un ninja en devenir',
      image: 'https://example.com/naruto.jpg',
      source: 'jikan',
      genres: [{ id: 1, name: 'Action' }],
      rating: 8.7,
      release_date: '2002-10-03',
      status: 'Finished Airing',
      episodes: 220,
      duration: 23,
      type: 'TV',
      studios: [{ id: 1, name: 'Studio Pierrot' }],
      season: 'fall',
      year: 2002,
      trailer_url: 'https://www.youtube.com/watch?v=123',
      characters: []
    });
  });
});
