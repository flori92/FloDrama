const Content = require('../../../core/models/Content');

describe('Content Model', () => {
  test('devrait créer une instance avec les propriétés par défaut', () => {
    const content = new Content();
    
    expect(content).toHaveProperty('id', '');
    expect(content).toHaveProperty('title', '');
    expect(content).toHaveProperty('description', '');
    expect(content).toHaveProperty('image', '');
    expect(content).toHaveProperty('source', '');
    expect(content).toHaveProperty('genres', []);
    expect(content).toHaveProperty('rating', 0);
    expect(content).toHaveProperty('release_date', '');
    expect(content).toHaveProperty('status', '');
  });

  test('devrait normaliser les données depuis un objet source', () => {
    const sourceData = {
      mal_id: 123,
      id: 456,
      title: 'Titre Test',
      overview: 'Description Test',
      synopsis: 'Synopsis Test',
      description: 'Autre Description',
      poster_path: '/path/to/image.jpg',
      image: 'https://example.com/image.jpg',
      images: { jpg: { image_url: 'https://example.com/another_image.jpg' } },
      genres: [{ id: 1, name: 'Action' }],
      score: 8.5,
      rating: 4.2,
      aired: { from: '2020-01-01' },
      release_date: '2019-01-01',
      status: 'Completed',
      airing_status: 'Finished Airing'
    };

    const content = new Content(sourceData, 'test-source');

    expect(content.id).toBe('123');
    expect(content.title).toBe('Titre Test');
    expect(content.description).toBe('Description Test');
    expect(content.image).toBe('https://example.com/another_image.jpg');
    expect(content.source).toBe('test-source');
    expect(content.genres).toEqual([{ id: 1, name: 'Action' }]);
    expect(content.rating).toBe(8.5);
    expect(content.release_date).toBe('2020-01-01');
    expect(content.status).toBe('Completed');
  });

  test('devrait normaliser les genres correctement', () => {
    const content = new Content();
    
    // Test avec un tableau d'objets
    const genres1 = [{ id: 1, name: 'Action' }, { id: 2, name: 'Comedy' }];
    expect(content.normalizeGenres(genres1)).toEqual(genres1);
    
    // Test avec un tableau de chaînes
    const genres2 = ['Action', 'Comedy'];
    expect(content.normalizeGenres(genres2)).toEqual([
      { id: 0, name: 'Action' },
      { id: 0, name: 'Comedy' }
    ]);
    
    // Test avec une valeur non valide
    expect(content.normalizeGenres(null)).toEqual([]);
    expect(content.normalizeGenres('Action')).toEqual([]);
    expect(content.normalizeGenres(123)).toEqual([]);
  });

  test('devrait extraire correctement la date', () => {
    const content = new Content();
    
    // Test avec différents formats de date
    expect(content.extractDate('2020-01-01')).toBe('2020-01-01');
    expect(content.extractDate({ from: '2020-01-01' })).toBe('2020-01-01');
    expect(content.extractDate({ from: '2020-01-01', to: '2020-12-31' })).toBe('2020-01-01');
    
    // Test avec des valeurs non valides
    expect(content.extractDate(null)).toBe('');
    expect(content.extractDate(undefined)).toBe('');
    expect(content.extractDate(123)).toBe('');
  });

  test('devrait convertir en JSON correctement', () => {
    const content = new Content({
      mal_id: 123,
      title: 'Titre Test',
      synopsis: 'Description Test',
      images: { jpg: { image_url: 'https://example.com/image.jpg' } },
      genres: [{ id: 1, name: 'Action' }],
      score: 8.5,
      aired: { from: '2020-01-01' },
      status: 'Completed'
    }, 'test-source');

    const json = content.toJSON();
    
    expect(json).toEqual({
      id: '123',
      title: 'Titre Test',
      description: 'Description Test',
      image: 'https://example.com/image.jpg',
      source: 'test-source',
      genres: [{ id: 1, name: 'Action' }],
      rating: 8.5,
      release_date: '2020-01-01',
      status: 'Completed'
    });
  });
});
