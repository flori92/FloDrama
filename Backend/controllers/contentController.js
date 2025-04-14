/**
 * Contrôleur de contenu
 * Gère les fonctionnalités liées aux contenus (dramas, films, animés)
 */

const Content = require('../models/Content');

/**
 * @desc    Obtenir tous les contenus avec filtrage et pagination
 * @route   GET /api/content
 * @access  Public
 */
exports.getContents = async (req, res) => {
  try {
    // Construire la requête de filtrage
    const query = {};
    
    // Filtrer par type (drama, film, anime)
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Filtrer par catégorie
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filtrer par pays
    if (req.query.country) {
      query.country = req.query.country;
    }
    
    // Filtrer par année de sortie
    if (req.query.year) {
      query.releaseYear = req.query.year;
    }
    
    // Recherche par titre
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { originalTitle: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Contenus en vedette ou tendances
    if (req.query.featured === 'true') {
      query.isFeatured = true;
    }
    
    if (req.query.trending === 'true') {
      query.isTrending = true;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Exécuter la requête avec pagination
    const total = await Content.countDocuments(query);
    const contents = await Content.find(query)
      .select('title originalTitle type category country poster backdrop releaseYear rating isFeatured isTrending')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Construire la réponse avec pagination
    const pagination = {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit
    };
    
    res.status(200).json({
      success: true,
      pagination,
      data: contents
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des contenus',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir un contenu spécifique par ID
 * @route   GET /api/content/:id
 * @access  Public
 */
exports.getContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du contenu',
      error: error.message
    });
  }
};

/**
 * @desc    Créer un nouveau contenu
 * @route   POST /api/content
 * @access  Private (Admin)
 */
exports.createContent = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Seuls les administrateurs peuvent créer du contenu.'
      });
    }
    
    const content = await Content.create(req.body);
    
    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Erreur lors de la création du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du contenu',
      error: error.message
    });
  }
};

/**
 * @desc    Mettre à jour un contenu
 * @route   PUT /api/content/:id
 * @access  Private (Admin)
 */
exports.updateContent = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Seuls les administrateurs peuvent mettre à jour du contenu.'
      });
    }
    
    let content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }
    
    content = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du contenu',
      error: error.message
    });
  }
};

/**
 * @desc    Supprimer un contenu
 * @route   DELETE /api/content/:id
 * @access  Private (Admin)
 */
exports.deleteContent = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Seuls les administrateurs peuvent supprimer du contenu.'
      });
    }
    
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }
    
    await content.remove();
    
    res.status(200).json({
      success: true,
      message: 'Contenu supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du contenu',
      error: error.message
    });
  }
};

/**
 * @desc    Ajouter un épisode à un contenu
 * @route   POST /api/content/:id/episodes
 * @access  Private (Admin)
 */
exports.addEpisode = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Seuls les administrateurs peuvent ajouter des épisodes.'
      });
    }
    
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }
    
    // Ajouter l'épisode
    content.episodes.push(req.body);
    
    // Mettre à jour le nombre total d'épisodes
    content.totalEpisodes = content.episodes.length;
    
    await content.save();
    
    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'épisode:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'épisode',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir les contenus les plus populaires
 * @route   GET /api/content/popular
 * @access  Public
 */
exports.getPopularContents = async (req, res) => {
  try {
    const contents = await Content.find()
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(10)
      .select('title type poster backdrop rating');
    
    res.status(200).json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus populaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des contenus populaires',
      error: error.message
    });
  }
};

/**
 * @desc    Noter un contenu
 * @route   POST /api/content/:id/rate
 * @access  Private
 */
exports.rateContent = async (req, res) => {
  try {
    const { rating } = req.body;
    
    // Vérifier si la note est valide
    if (!rating || rating < 0 || rating > 10) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir une note valide entre 0 et 10'
      });
    }
    
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }
    
    // Calculer la nouvelle note moyenne
    const updatedRating = await content.calculateRating(rating);
    
    res.status(200).json({
      success: true,
      data: updatedRating
    });
  } catch (error) {
    console.error('Erreur lors de la notation du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la notation du contenu',
      error: error.message
    });
  }
};
