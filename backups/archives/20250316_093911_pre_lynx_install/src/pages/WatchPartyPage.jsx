import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Typography, 
  CircularProgress, 
  Button, 
  Paper, 
  Container, 
  Snackbar, 
  Alert,
  useMediaQuery,
  IconButton,
  Drawer,
  Divider
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import VideoPlayer from '../components/player/VideoPlayer';
import WatchPartyChat from '../components/social/WatchPartyChat';
import WatchPartyControls from '../components/social/WatchPartyControls';
import WatchPartyParticipants from '../components/social/WatchPartyParticipants';
import socialViewingService from '../services/SocialViewingService';
import HybridBridgeService from '../services/HybridBridgeService';

// Styles personnalisés
const MainContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
}));

const VideoContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  aspectRatio: '16/9',
  backgroundColor: 'black',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[5],
}));

const SidePanel = styled(Box)(({ theme, isMobile }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  height: isMobile ? 'auto' : '100%',
  maxHeight: isMobile ? 'none' : 'calc(100vh - 200px)',
}));

const MobileDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '85%',
    maxWidth: '400px',
    padding: theme.spacing(2),
  },
}));

/**
 * Page de soirée de visionnage (Watch Party)
 * Permet aux utilisateurs de regarder du contenu ensemble de manière synchronisée
 */
const WatchPartyPage = () => {
  const { id: watchPartyId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchParty, setWatchParty] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(!isMobile);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [mobileDrawerContent, setMobileDrawerContent] = useState(null); // 'chat' ou 'participants'
  
  const videoRef = useRef(null);
  
  // Charger les détails de la soirée de visionnage
  useEffect(() => {
    const loadWatchParty = async () => {
      try {
        setLoading(true);
        
        // Si nous sommes déjà dans une soirée active, la quitter d'abord
        if (socialViewingService.activeWatchParty && 
            socialViewingService.activeWatchParty.id !== watchPartyId) {
          await socialViewingService.leaveWatchParty();
        }
        
        // Rejoindre la soirée
        const result = await socialViewingService.joinWatchParty(watchPartyId);
        setWatchParty(result.watchParty);
        
        // Récupérer les détails du contenu
        if (HybridBridgeService.isFlutterAvailable) {
          const contentDetails = await HybridBridgeService.getDramaMetadata(result.watchParty.contentId);
          setVideoSource({
            url: contentDetails.videoUrl,
            type: contentDetails.videoType || 'video/mp4',
            subtitles: contentDetails.subtitles || []
          });
        } else {
          // Fallback pour le mode web standalone
          // Dans un cas réel, vous feriez un appel API pour obtenir les détails du contenu
          setVideoSource({
            url: `https://api.flodrama.com/content/${result.watchParty.contentId}/stream`,
            type: 'video/mp4',
            subtitles: []
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement de la soirée de visionnage:', err);
        setError('Impossible de rejoindre la soirée de visionnage. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    if (watchPartyId) {
      loadWatchParty();
    }
    
    // Nettoyage : quitter la soirée lorsque l'utilisateur quitte la page
    return () => {
      if (socialViewingService.activeWatchParty) {
        socialViewingService.leaveWatchParty().catch(console.error);
      }
    };
  }, [watchPartyId]);
  
  // Gérer les événements de lecture vidéo pour la synchronisation
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Stocker une référence à l'élément vidéo actuel
    const videoElement = videoRef.current;
    
    const handlePlay = () => {
      socialViewingService.syncPlayback(videoElement.currentTime, true)
        .catch(console.error);
    };
    
    const handlePause = () => {
      socialViewingService.syncPlayback(videoElement.currentTime, false)
        .catch(console.error);
    };
    
    const handleSeeked = () => {
      socialViewingService.syncPlayback(
        videoElement.currentTime, 
        !videoElement.paused
      ).catch(console.error);
    };
    
    // Ajouter les écouteurs d'événements
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('seeked', handleSeeked);
    
    // Nettoyage
    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('seeked', handleSeeked);
    };
  }, [videoRef]);
  
  // Gérer l'ouverture du tiroir mobile
  const handleOpenMobileDrawer = (content) => {
    setMobileDrawerContent(content);
  };
  
  // Gérer la fermeture du tiroir mobile
  const handleCloseMobileDrawer = () => {
    setMobileDrawerContent(null);
  };
  
  // Gérer le basculement du chat sur desktop
  const handleToggleChat = () => {
    if (isMobile) {
      handleOpenMobileDrawer('chat');
    } else {
      setIsChatOpen(!isChatOpen);
    }
  };
  
  // Gérer le basculement des participants sur desktop
  const handleToggleParticipants = () => {
    if (isMobile) {
      handleOpenMobileDrawer('participants');
    } else {
      setIsParticipantsOpen(!isParticipantsOpen);
    }
  };
  
  // Gérer le retour à la page précédente
  const handleGoBack = async () => {
    try {
      // Quitter la soirée
      if (socialViewingService.activeWatchParty) {
        await socialViewingService.leaveWatchParty();
      }
      
      // Naviguer vers la page précédente
      navigate(-1);
    } catch (error) {
      console.error('Erreur lors de la sortie de la soirée:', error);
    }
  };
  
  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          Chargement de la soirée de visionnage...
        </Typography>
      </Box>
    );
  }
  
  // Afficher un message d'erreur
  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleGoBack}>
          Retour
        </Button>
      </Box>
    );
  }
  
  return (
    <MainContainer maxWidth="xl">
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={handleGoBack} edge="start" sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        
        <Typography variant="h5" component="h1">
          {watchParty?.title || 'Soirée de visionnage'}
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ flexGrow: 1 }}>
        {/* Lecteur vidéo */}
        <Grid item xs={12} md={isChatOpen || isParticipantsOpen ? 8 : 12}>
          <VideoContainer>
            {videoSource && (
              <VideoPlayer
                src={videoSource.url}
                type={videoSource.type}
                subtitles={videoSource.subtitles}
                videoRef={videoRef}
                autoPlay={false}
                controls={true}
                width="100%"
                height="100%"
              />
            )}
          </VideoContainer>
          
          <Box mt={2}>
            <WatchPartyControls
              videoRef={videoRef}
              watchPartyId={watchPartyId}
              onToggleChat={handleToggleChat}
              onToggleParticipants={handleToggleParticipants}
              isChatOpen={isChatOpen}
              isParticipantsOpen={isParticipantsOpen}
            />
          </Box>
          
          {/* Boutons flottants pour mobile */}
          {isMobile && (
            <Box 
              position="fixed" 
              bottom={16} 
              right={16} 
              display="flex" 
              flexDirection="column"
              gap={1}
              zIndex={10}
            >
              <IconButton 
                color="primary" 
                onClick={() => handleOpenMobileDrawer('chat')}
                sx={{ bgcolor: 'background.paper', boxShadow: 3 }}
              >
                <ChatIcon />
              </IconButton>
              
              <IconButton 
                color="primary" 
                onClick={() => handleOpenMobileDrawer('participants')}
                sx={{ bgcolor: 'background.paper', boxShadow: 3 }}
              >
                <PeopleIcon />
              </IconButton>
            </Box>
          )}
        </Grid>
        
        {/* Panneau latéral (chat et participants) pour desktop */}
        {!isMobile && (isChatOpen || isParticipantsOpen) && (
          <Grid item xs={12} md={4}>
            <SidePanel isMobile={isMobile}>
              {isChatOpen && (
                <WatchPartyChat watchPartyId={watchPartyId} />
              )}
              
              {isParticipantsOpen && (
                <WatchPartyParticipants watchPartyId={watchPartyId} />
              )}
            </SidePanel>
          </Grid>
        )}
      </Grid>
      
      {/* Tiroir mobile pour le chat et les participants */}
      <MobileDrawer
        anchor="right"
        open={Boolean(mobileDrawerContent)}
        onClose={handleCloseMobileDrawer}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {mobileDrawerContent === 'chat' ? 'Chat' : 'Participants'}
          </Typography>
          
          <IconButton onClick={handleCloseMobileDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {mobileDrawerContent === 'chat' && (
          <WatchPartyChat watchPartyId={watchPartyId} />
        )}
        
        {mobileDrawerContent === 'participants' && (
          <WatchPartyParticipants watchPartyId={watchPartyId} />
        )}
      </MobileDrawer>
      
      {/* Snackbar pour les notifications */}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        open={false} // Géré par les événements
        autoHideDuration={6000}
      >
        <Alert severity="info" sx={{ width: '100%' }}>
          Notification
        </Alert>
      </Snackbar>
    </MainContainer>
  );
};

export default WatchPartyPage;
