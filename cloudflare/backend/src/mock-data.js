/**
 * Données mockées pour FloDrama
 * 
 * Ce fichier contient les données de démonstration utilisées par l'API
 * en attendant la migration complète vers Cloudflare D1.
 */

// Données mockées
export const mockData = {
  'film': [
    { 
      id: "film-1",
      title: "La légende du guerrier", 
      description: "Un guerrier légendaire doit faire face à son plus grand défi : protéger son village et retrouver sa famille disparue. Une épopée captivante mêlant arts martiaux et spiritualité.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-1.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-1.jpg",
      rating: 4.8, 
      year: 2023,
      duration: 125, // Durée en minutes
      genres: ["Action", "Aventure", "Drame"],
      language: "Mandarin",
      country: "Chine",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "film-2",
      title: "Sous les cerisiers en fleurs", 
      description: "Quand un jeune architecte retourne dans sa ville natale, il redécouvre son premier amour. Une histoire touchante de seconde chance dans un cadre magnifique du Japon rural.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-2.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-2.jpg",
      rating: 4.6, 
      year: 2022,
      duration: 118, // Durée en minutes
      genres: ["Romance", "Drame"],
      language: "Japonais",
      country: "Japon",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "film-3",
      title: "Le secret des montagnes", 
      description: "Dans un village isolé des montagnes coréennes, une jeune femme découvre un ancien secret qui pourrait changer le destin de sa communauté. Un thriller atmosphérique aux paysages à couper le souffle.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-3.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-3.jpg",
      rating: 4.7, 
      year: 2023,
      duration: 132, // Durée en minutes
      genres: ["Thriller", "Mystère", "Drame"],
      language: "Coréen",
      country: "Corée du Sud",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "film-4",
      title: "L'héritage du dragon", 
      description: "Après la mort de son grand-père, un jeune homme hérite d'un médaillon mystérieux qui le conduit dans une quête à travers l'Asie pour découvrir ses origines. Un film d'aventure épique avec des scènes d'action spectaculaires.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-4.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/film-4.jpg",
      rating: 4.5, 
      year: 2021,
      duration: 145, // Durée en minutes
      genres: ["Action", "Aventure", "Fantastique"],
      language: "Mandarin",
      country: "Chine",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  'drama': [
    { 
      id: "drama-1",
      title: "Les mystères de l'Empire", 
      description: "Dans la Chine ancienne, une jeune femme devient enquêtrice pour résoudre des mystères qui menacent l'empire. Entre complots politiques et aventures romantiques, suivez son parcours extraordinaire.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-1.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-1.jpg",
      rating: 4.9, 
      year: 2023,
      episodeCount: 16,
      seasonCount: 1,
      genres: ["Historique", "Mystère", "Romance"],
      language: "Mandarin",
      country: "Chine",
      status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "drama-2",
      title: "Destins croisés", 
      description: "Trois familles que tout oppose voient leurs vies bouleversées par un événement tragique. Une exploration profonde des relations humaines et du pardon.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-2.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-2.jpg",
      rating: 4.7, 
      year: 2022,
      episodeCount: 20,
      seasonCount: 1,
      genres: ["Drame", "Famille"],
      language: "Coréen",
      country: "Corée du Sud",
      status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "drama-3",
      title: "Médecin de cœur", 
      description: "Un brillant chirurgien cardiaque doit faire face à son propre passé traumatique tout en sauvant des vies dans l'un des hôpitaux les plus prestigieux de Séoul. Un drame médical émouvant et captivant.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-3.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-3.jpg",
      rating: 4.8, 
      year: 2023,
      episodeCount: 16,
      seasonCount: 1,
      genres: ["Médical", "Drame", "Romance"],
      language: "Coréen",
      country: "Corée du Sud",
      status: "ongoing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "drama-4",
      title: "Le bureau des légendes", 
      description: "Dans un bureau gouvernemental secret, une équipe d'agents spéciaux enquête sur des phénomènes surnaturels liés aux légendes asiatiques. Un mélange unique de thriller, d'horreur et de mythologie.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-4.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-4.jpg",
      rating: 4.6, 
      year: 2022,
      episodeCount: 12,
      seasonCount: 2,
      genres: ["Fantastique", "Thriller", "Mystère"],
      language: "Thaïlandais",
      country: "Thaïlande",
      status: "ongoing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "drama-5",
      title: "Dynastie impériale", 
      description: "La saga épique d'une famille royale dans la Chine ancienne, leurs luttes pour le pouvoir, leurs amours interdites et leurs sacrifices. Une fresque historique somptueuse aux costumes magnifiques.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-5.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/drama-5.jpg",
      rating: 4.9, 
      year: 2021,
      episodeCount: 50,
      seasonCount: 1,
      genres: ["Historique", "Drame", "Romance"],
      language: "Mandarin",
      country: "Chine",
      status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  'anime': [
    { 
      id: "anime-1",
      title: "Le monde des esprits", 
      description: "Une jeune fille découvre un monde parallèle peuplé d'esprits et doit trouver un moyen de sauver ses parents transformés en créatures mystiques. Une aventure fantastique inoubliable.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/anime-1.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/anime-1.jpg",
      rating: 4.9, 
      year: 2021,
      episodeCount: 24,
      seasonCount: 1,
      genres: ["Fantastique", "Aventure", "Surnaturel"],
      language: "Japonais",
      country: "Japon",
      status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "anime-2",
      title: "Chasseurs de démons", 
      description: "Après la tragédie qui a frappé sa famille, un jeune homme décide de devenir chasseur de démons pour venger les siens et protéger l'humanité. Un récit épique de courage et de détermination.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/anime-2.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/anime-2.jpg",
      rating: 4.8, 
      year: 2022,
      episodeCount: 26,
      seasonCount: 2,
      genres: ["Action", "Surnaturel", "Drame"],
      language: "Japonais",
      country: "Japon",
      status: "ongoing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "anime-3",
      title: "Académie des héros", 
      description: "Dans un monde où 80% de la population possède des super-pouvoirs, un jeune garçon sans don rêve de devenir un héros. Son destin bascule lorsqu'il rencontre le plus grand héros de tous les temps.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/anime-3.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/anime-3.jpg",
      rating: 4.7, 
      year: 2023,
      episodeCount: 25,
      seasonCount: 6,
      genres: ["Action", "Super-héros", "École"],
      language: "Japonais",
      country: "Japon",
      status: "ongoing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "anime-4",
      title: "Titans en guerre", 
      description: "L'humanité vit retranchée derrière d'immenses murs pour se protéger de créatures gigantesques qui dévorent les humains. Un jeune homme dont la mère a été tuée par ces monstres jure de les exterminer tous.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/anime-4.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/anime-4.jpg",
      rating: 4.9, 
      year: 2020,
      episodeCount: 75,
      seasonCount: 4,
      genres: ["Action", "Drame", "Horreur", "Fantastique"],
      language: "Japonais",
      country: "Japon",
      status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  'bollywood': [
    { 
      id: "bollywood-1",
      title: "Amour éternel", 
      description: "Une histoire d'amour qui transcende les classes sociales et les traditions dans l'Inde moderne. Entre danses colorées et émotions intenses, suivez ce couple qui défie tous les obstacles.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/bollywood-1.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/bollywood-1.jpg",
      rating: 4.7, 
      year: 2023,
      duration: 165, // Durée en minutes
      genres: ["Romance", "Musical", "Drame"],
      language: "Hindi",
      country: "Inde",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "bollywood-2",
      title: "Le destin d'un héros", 
      description: "Un homme ordinaire se retrouve dans des circonstances extraordinaires et doit devenir le héros que son pays attend. Un spectacle grandiose mêlant action, drame et moments musicaux.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/bollywood-2.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/bollywood-2.jpg",
      rating: 4.6, 
      year: 2022,
      duration: 180, // Durée en minutes
      genres: ["Action", "Patriotique", "Drame"],
      language: "Hindi",
      country: "Inde",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "bollywood-3",
      title: "Danse avec les étoiles", 
      description: "Une jeune danseuse talentueuse des quartiers populaires de Mumbai rêve de devenir une star de Bollywood. Son parcours semé d'embûches la conduira à découvrir le vrai sens de la passion et du sacrifice.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/bollywood-3.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/bollywood-3.jpg",
      rating: 4.8, 
      year: 2023,
      duration: 155, // Durée en minutes
      genres: ["Musical", "Drame", "Romance"],
      language: "Hindi",
      country: "Inde",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: "bollywood-4",
      title: "Le roi des voleurs", 
      description: "Inspiré d'une histoire vraie, ce film raconte l'ascension et la chute du plus célèbre voleur de bijoux de l'Inde, qui dérobait aux riches pour aider les pauvres. Un thriller palpitant aux rebondissements inattendus.", 
      poster: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/bollywood-4.jpg",
      backdrop: "https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content/placeholders/bollywood-4.jpg",
      rating: 4.5, 
      year: 2021,
      duration: 175, // Durée en minutes
      genres: ["Thriller", "Biopic", "Crime"],
      language: "Hindi",
      country: "Inde",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};
