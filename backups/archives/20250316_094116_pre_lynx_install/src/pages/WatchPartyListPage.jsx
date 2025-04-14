import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Button, 
  Fab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControlLabel, 
  Switch,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SocialViewingService } from '../services/SocialViewingService';
import WatchPartyNotifications from '../components/social/WatchPartyNotifications';

// Styles personnalisés
const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
}));

const WatchPartyCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const WatchPartyMedia = styled(CardMedia)(({ theme }) => ({
  paddingTop: '56.25%', // 16:9
  position: 'relative',
}));

const WatchPartyOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: theme.spacing(2),
  color: 'white',
}));

const WatchPartyContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
}));

const CreateFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  let color = theme.palette.primary.main;
  if (status === 'live') {
    color = theme.palette.success.main;
  } else if (status === 'scheduled') {
    color = theme.palette.warning.main;
  } else if (status === 'ended') {
    color = theme.palette.error.main;
  }
  
  return {
    backgroundColor: color,
    color: 'white',
    fontWeight: 'bold',
  };
});

/**
 * Page listant les soirées de visionnage disponibles
 * Permet de créer de nouvelles soirées et de rejoindre des soirées existantes
 */
const WatchPartyListPage = () => {
  const [watchParties, setWatchParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newWatchParty, setNewWatchParty] = useState({
    title: '',
    description: '',
    contentId: '',
    isPrivate: false,
    scheduledTime: ''
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const socialViewingService = useMemo(() => new SocialViewingService(), []);
  
  // Charger la liste des soirées de visionnage
  useEffect(() => {
    fetchWatchParties();
  }, []);
  
  const fetchWatchParties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel à l'API pour récupérer les soirées de visionnage
      const response = await fetch('/api/watch-parties');
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des soirées de visionnage');
      }
      
      const data = await response.json();
      setWatchParties(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les soirées de visionnage');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateWatchParty = async () => {
    try {
      setLoading(true);
      
      // Validation des champs
      if (!newWatchParty.title || !newWatchParty.contentId) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }
      
      // Créer la soirée de visionnage
      const createdWatchParty = await socialViewingService.createWatchParty({
        title: newWatchParty.title,
        description: newWatchParty.description,
        contentId: newWatchParty.contentId,
        isPrivate: newWatchParty.isPrivate,
        scheduledTime: newWatchParty.scheduledTime ? new Date(newWatchParty.scheduledTime) : null
      });
      
      // Fermer le dialogue
      setOpenCreateDialog(false);
      
      // Réinitialiser le formulaire
      setNewWatchParty({
        title: '',
        description: '',
        contentId: '',
        isPrivate: false,
        scheduledTime: ''
      });
      
      // Rediriger vers la page de la soirée de visionnage
      navigate(`/watch-party/${createdWatchParty.id}`);
    } catch (err) {
      console.error('Erreur lors de la création de la soirée de visionnage:', err);
      setError('Impossible de créer la soirée de visionnage');
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinWatchParty = (watchPartyId) => {
    navigate(`/watch-party/${watchPartyId}`);
  };
  
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setNewWatchParty(prev => ({
      ...prev,
      [name]: name === 'isPrivate' ? checked : value
    }));
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getWatchPartyStatus = (watchParty) => {
    if (watchParty.endedAt) {
      return { label: 'Terminée', value: 'ended' };
    } else if (watchParty.startedAt) {
      return { label: 'En direct', value: 'live' };
    } else if (watchParty.scheduledTime && new Date(watchParty.scheduledTime) > new Date()) {
      return { label: 'Programmée', value: 'scheduled' };
    } else {
      return { label: 'En attente', value: 'pending' };
    }
  };
  
  return (
    <PageContainer maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Soirées de Visionnage
        </Typography>
        
        <Box display="flex" alignItems="center">
          {user && (
            <Typography variant="subtitle2" mr={2}>
              Bienvenue, {user.displayName || user.email || 'Utilisateur'}
            </Typography>
          )}
          <WatchPartyNotifications />
        </Box>
      </Box>
      
      {loading && !watchParties.length ? (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="outlined" onClick={fetchWatchParties} sx={{ mt: 2 }}>
            Réessayer
          </Button>
        </Box>
      ) : watchParties.length === 0 ? (
        <Box textAlign="center" my={8}>
          <LiveTvIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Aucune soirée de visionnage disponible
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {user 
              ? "Créez votre première soirée pour regarder des contenus avec vos amis !"
              : "Connectez-vous pour créer ou rejoindre des soirées de visionnage."}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            disabled={!user}
          >
            Créer une soirée
          </Button>
        </Box>
      ) : (
        <>
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Soirées en direct
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              {watchParties
                .filter(wp => getWatchPartyStatus(wp).value === 'live')
                .map(watchParty => (
                  <Grid item key={watchParty.id} xs={12} sm={6} md={4}>
                    <WatchPartyCard>
                      <WatchPartyMedia
                        image={watchParty.thumbnailUrl || 'https://via.placeholder.com/300x169?text=FloDrama'}
                        title={watchParty.title}
                      >
                        <WatchPartyOverlay>
                          <StatusChip 
                            label={getWatchPartyStatus(watchParty).label}
                            status={getWatchPartyStatus(watchParty).value}
                            size="small"
                            icon={<LiveTvIcon />}
                          />
                          <Typography variant="h6" component="div">
                            {watchParty.title}
                          </Typography>
                        </WatchPartyOverlay>
                      </WatchPartyMedia>
                      
                      <WatchPartyContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" color="textSecondary">
                            Hôte: {watchParty.hostName}
                          </Typography>
                          <Chip 
                            icon={watchParty.isPrivate ? <LockIcon /> : <PublicIcon />}
                            label={watchParty.isPrivate ? 'Privée' : 'Publique'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        
                        <Typography variant="body2" paragraph>
                          {watchParty.description || 'Aucune description'}
                        </Typography>
                        
                        <Box display="flex" alignItems="center">
                          <GroupIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                            {watchParty.participantCount || 0} participants
                          </Typography>
                        </Box>
                      </WatchPartyContent>
                      
                      <CardActions>
                        <Button 
                          fullWidth 
                          variant="contained" 
                          color="primary"
                          onClick={() => handleJoinWatchParty(watchParty.id)}
                        >
                          Rejoindre
                        </Button>
                      </CardActions>
                    </WatchPartyCard>
                  </Grid>
                ))}
            </Grid>
            
            {!watchParties.some(wp => getWatchPartyStatus(wp).value === 'live') && (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ my: 3 }}>
                Aucune soirée en direct pour le moment
              </Typography>
            )}
          </Box>
          
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Soirées programmées
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              {watchParties
                .filter(wp => getWatchPartyStatus(wp).value === 'scheduled')
                .map(watchParty => (
                  <Grid item key={watchParty.id} xs={12} sm={6} md={4}>
                    <WatchPartyCard>
                      <WatchPartyMedia
                        image={watchParty.thumbnailUrl || 'https://via.placeholder.com/300x169?text=FloDrama'}
                        title={watchParty.title}
                      >
                        <WatchPartyOverlay>
                          <StatusChip 
                            label={getWatchPartyStatus(watchParty).label}
                            status={getWatchPartyStatus(watchParty).value}
                            size="small"
                          />
                          <Typography variant="h6" component="div">
                            {watchParty.title}
                          </Typography>
                        </WatchPartyOverlay>
                      </WatchPartyMedia>
                      
                      <WatchPartyContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" color="textSecondary">
                            Hôte: {watchParty.hostName}
                          </Typography>
                          <Chip 
                            icon={watchParty.isPrivate ? <LockIcon /> : <PublicIcon />}
                            label={watchParty.isPrivate ? 'Privée' : 'Publique'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        
                        <Typography variant="body2" paragraph>
                          {watchParty.description || 'Aucune description'}
                        </Typography>
                        
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          Date: {formatDate(watchParty.scheduledTime)}
                        </Typography>
                      </WatchPartyContent>
                      
                      <CardActions>
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          color="primary"
                          onClick={() => handleJoinWatchParty(watchParty.id)}
                        >
                          Détails
                        </Button>
                      </CardActions>
                    </WatchPartyCard>
                  </Grid>
                ))}
            </Grid>
            
            {!watchParties.some(wp => getWatchPartyStatus(wp).value === 'scheduled') && (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ my: 3 }}>
                Aucune soirée programmée pour le moment
              </Typography>
            )}
          </Box>
        </>
      )}
      
      <CreateFab 
        color="primary" 
        aria-label="Créer une soirée de visionnage"
        onClick={() => setOpenCreateDialog(true)}
        disabled={!user}
      >
        <AddIcon />
      </CreateFab>
      
      {/* Dialogue de création de soirée */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Créer une nouvelle soirée de visionnage</DialogTitle>
        
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Titre de la soirée *"
            type="text"
            fullWidth
            variant="outlined"
            value={newWatchParty.title}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newWatchParty.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="contentId"
            label="ID du contenu à regarder *"
            type="text"
            fullWidth
            variant="outlined"
            value={newWatchParty.contentId}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            helperText="Entrez l'ID du drama, film ou série que vous souhaitez regarder"
          />
          
          <TextField
            margin="dense"
            name="scheduledTime"
            label="Date et heure programmées"
            type="datetime-local"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            value={newWatchParty.scheduledTime}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={newWatchParty.isPrivate}
                onChange={handleInputChange}
                name="isPrivate"
                color="primary"
              />
            }
            label="Soirée privée (accessible uniquement sur invitation)"
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleCreateWatchParty} 
            variant="contained" 
            color="primary"
            disabled={loading || !newWatchParty.title || !newWatchParty.contentId}
          >
            {loading ? <CircularProgress size={24} /> : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default WatchPartyListPage;
