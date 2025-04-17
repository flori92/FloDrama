import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Button, 
  Container, 
  Snackbar, 
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';

import WatchPartyContainer from '../components/watch-party/WatchPartyContainer';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { copyToClipboard } from '../utils/clipboard';

// Styles personnalisés
const MainContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

/**
 * Page de soirée de visionnage (Watch Party)
 * Permet aux utilisateurs de regarder du contenu ensemble de manière synchronisée
 * Utilise react-native-gifted-chat pour l'interface de chat
 */
const WatchPartyPage = () => {
  const { partyId, dramaId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { hasActiveSubscription, currentPlan } = useSubscription();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  
  // Vérifier si l'utilisateur a accès à la fonctionnalité
  useEffect(() => {
    if (isAuthenticated && !loading) {
      // La fonctionnalité Watch Party est réservée aux abonnés Ultimate
      if (!hasActiveSubscription || currentPlan !== 'ultimate') {
        setError('La fonctionnalité Watch Party est disponible uniquement pour les abonnements Ultimate.');
      }
    }
  }, [isAuthenticated, hasActiveSubscription, currentPlan, loading]);
  
  // Charger les détails du drama
  useEffect(() => {
    const loadDramaDetails = async () => {
      try {
        setLoading(true);
        
        // Simulation pour le développement - à remplacer par un appel API réel
        setTimeout(() => {
          setLoading(false);
        }, 1500);
        
      } catch (err) {
        console.error('Erreur lors du chargement des détails du drama:', err);
        setError('Impossible de charger les détails du drama. Veuillez réessayer.');
        setLoading(false);
      }
    };
    
    if (dramaId && partyId) {
      loadDramaDetails();
    }
  }, [dramaId, partyId, user]);
  
  // Fermer la notification Snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setShowSnackbar(false);
  };

  // Afficher un écran de chargement
  if (loading) {
    return (
      <MainContainer>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Préparation de la Watch Party...
          </Typography>
        </Box>
      </MainContainer>
    );
  }
  
  // Afficher un message d'erreur
  if (error) {
    return (
      <MainContainer>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Oups ! Un problème est survenu
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
            {error}
          </Typography>
          {!hasActiveSubscription && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/subscription')}
              sx={{ mt: 2 }}
            >
              Découvrir les abonnements
            </Button>
          )}
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
            sx={{ mt: 2 }}
          >
            Retour
          </Button>
        </Box>
      </MainContainer>
    );
  }

  // Utiliser le nouveau composant WatchPartyContainer pour une expérience complète
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <WatchPartyContainer 
        partyId={partyId}
        dramaId={dramaId}
        onShareSuccess={(url) => {
          copyToClipboard(url);
          setSnackbarMessage('Lien de la Watch Party copié dans le presse-papiers !');
          setSnackbarSeverity('success');
          setShowSnackbar(true);
        }}
        onLeave={() => navigate(`/watch/${dramaId}`)}
      />
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WatchPartyPage;
