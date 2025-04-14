/**
 * Composant ContentCollections
 * 
 * Affiche les collections thématiques générées par le ContentCategorizer
 * sous forme de cartes et widgets.
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Tabs, Tab, Grid, Card, CardMedia, CardContent, CardActionArea } from '@mui/material';
import ContentDataService from '../services/ContentDataService';
import ContentCategorizer from '../services/ContentCategorizer';

const ContentCollections = () => {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState({});
  const [widgets, setWidgets] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const loadCollections = async () => {
      try {
        setLoading(true);
        
        // Récupérer les contenus populaires
        const contentService = new ContentDataService();
        const popularContent = await contentService.getPopularContent();
        
        // Vérifier si les données sont au nouveau format avec MAX_LENGTH
        const processedContent = Array.isArray(popularContent) 
          ? popularContent 
          : (popularContent && popularContent.data ? popularContent.data : []);
        
        // Générer les collections thématiques
        const generatedCollections = ContentCategorizer.generateCollections(processedContent);
        setCollections(generatedCollections);
        
        // Générer les widgets
        const generatedWidgets = ContentCategorizer.generateWidgets(generatedCollections);
        setWidgets(generatedWidgets);
        
        // Récupérer les statistiques
        const categoryStats = ContentCategorizer.getStats();
        setStats(categoryStats);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des collections:', error);
        setLoading(false);
      }
    };
    
    loadCollections();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Chargement des collections...
        </Typography>
      </Box>
    );
  }
  
  const collectionsList = Object.values(collections);
  
  if (collectionsList.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Aucune collection disponible
        </Typography>
        <Typography variant="body1">
          Le système n'a pas encore généré de collections thématiques.
          Veuillez rafraîchir les contenus populaires pour alimenter le système.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Collections Thématiques
      </Typography>
      
      <Typography variant="body1" paragraph>
        {stats.categorizedItems || 0} contenus catégorisés dans {collectionsList.length} collections thématiques.
      </Typography>
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab label="Widgets" />
        <Tab label="Collections" />
        <Tab label="Animés" />
        <Tab label="Bollywood" />
        <Tab label="Statistiques" />
      </Tabs>
      
      {activeTab === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Widgets Générés ({widgets.length})
          </Typography>
          
          {widgets.map((widget, index) => (
            <Box key={widget.id} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {widget.title}
                {widget.subtitle && (
                  <Typography variant="subtitle1" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                    {widget.subtitle}
                  </Typography>
                )}
              </Typography>
              
              <Grid container spacing={2}>
                {widget.items.slice(0, 6).map((item) => (
                  <Grid item xs={6} sm={4} md={2} key={item.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardActionArea>
                        <CardMedia
                          component="img"
                          height="180"
                          image={item.image || '/placeholder.jpg'}
                          alt={item.title}
                        />
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="body2" noWrap>
                            {item.title}
                          </Typography>
                          {item.categories && item.categories.origin && (
                            <Typography variant="caption" color="text.secondary">
                              {item.categories.origin}
                            </Typography>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      )}
      
      {activeTab === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Collections ({collectionsList.length})
          </Typography>
          
          <Grid container spacing={3}>
            {collectionsList.map((collection) => (
              <Grid item xs={12} sm={6} md={4} key={collection.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {collection.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {collection.count} contenus
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Exemples: {collection.contents.slice(0, 3).map(c => c.title).join(', ')}
                        {collection.contents.length > 3 ? '...' : ''}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Collections d'Animés
          </Typography>
          
          <Grid container spacing={3}>
            {Object.values(collections)
              .filter(collection => 
                collection.id.includes('anime') || 
                (collection.contents.length > 0 && collection.contents[0].type === 'anime')
              )
              .map((collection) => (
                <Grid item xs={12} sm={6} md={4} key={collection.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {collection.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {collection.count} animés
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Sources: {Array.from(new Set(collection.contents.slice(0, 5).map(c => c.source?.name || 'Inconnue'))).join(', ')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Sources d'Animés
            </Typography>
            
            <Grid container spacing={2}>
              {['Neko Sama', 'Anime Sama', 'GogoAnime', 'VoirAnime'].map(sourceName => {
                const sourceContents = Object.values(collections)
                  .flatMap(c => c.contents)
                  .filter(content => content.source?.name === sourceName);
                
                return (
                  <Grid item xs={6} sm={3} key={sourceName}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {sourceName}
                        </Typography>
                        <Typography variant="h4" align="center">
                          {sourceContents.length}
                        </Typography>
                        <Typography variant="body2" align="center">
                          contenus
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Box>
      )}
      
      {activeTab === 3 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Collections Bollywood
          </Typography>
          
          <Grid container spacing={3}>
            {Object.values(collections)
              .filter(collection => 
                collection.id.includes('bollywood') || 
                (collection.contents.length > 0 && collection.contents[0].categories?.origin === 'in')
              )
              .map((collection) => (
                <Grid item xs={12} sm={6} md={4} key={collection.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {collection.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {collection.count} films
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Genres: {Array.from(new Set(collection.contents.flatMap(c => c.categories?.genres || []))).slice(0, 3).join(', ')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Genres Populaires dans Bollywood
            </Typography>
            
            <Grid container spacing={2}>
              {['romance', 'action', 'music', 'drama'].map(genreId => {
                const genreContents = Object.values(collections)
                  .flatMap(c => c.contents)
                  .filter(content => 
                    content.categories?.origin === 'in' && 
                    content.categories?.genres?.includes(genreId)
                  );
                
                const genreName = ContentCategorizer.taxonomies.genres.find(g => g.id === genreId)?.name || genreId;
                
                return (
                  <Grid item xs={6} sm={3} key={genreId}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {genreName}
                        </Typography>
                        <Typography variant="h4" align="center">
                          {genreContents.length}
                        </Typography>
                        <Typography variant="body2" align="center">
                          films
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Box>
      )}
      
      {activeTab === 4 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Statistiques de Catégorisation
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contenus Catégorisés
                  </Typography>
                  <Typography variant="h3" align="center">
                    {stats.categorizedItems || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Associations aux Collections
                  </Typography>
                  <Typography variant="h3" align="center">
                    {stats.matchedCollections || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contenus Non Associés
                  </Typography>
                  <Typography variant="h3" align="center">
                    {stats.unmatchedItems || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Taxonomies du Système
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Types de Contenu
                    </Typography>
                    <Box component="ul">
                      {ContentCategorizer.taxonomies.contentTypes.map(type => (
                        <Box component="li" key={type.id}>
                          <Typography variant="body2">
                            {type.name} (priorité: {type.priority})
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Origines Géographiques
                    </Typography>
                    <Box component="ul">
                      {ContentCategorizer.taxonomies.origins.map(origin => (
                        <Box component="li" key={origin.id}>
                          <Typography variant="body2">
                            {origin.name} ({origin.aliases.slice(0, 2).join(', ')}
                            {origin.aliases.length > 2 ? '...' : ''})
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Genres Principaux (Top 10)
                    </Typography>
                    <Box component="ul">
                      {ContentCategorizer.taxonomies.genres.slice(0, 10).map(genre => (
                        <Box component="li" key={genre.id}>
                          <Typography variant="body2">
                            {genre.name} (priorité: {genre.priority})
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ContentCollections;
