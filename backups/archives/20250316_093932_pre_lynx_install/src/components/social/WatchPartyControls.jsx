import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Tooltip, Badge, Paper, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import PeopleIcon from '@mui/icons-material/People';
import ChatIcon from '@mui/icons-material/Chat';
import ShareIcon from '@mui/icons-material/Share';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import socialViewingService from '../../services/SocialViewingService';
import WatchPartyInvitation from './WatchPartyInvitation';

// Styles personnalisés
const ControlsContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
}));

const ControlsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const ControlsActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(2),
}));

const ParticipantBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
}));

/**
 * Composant de contrôles pour les soirées de visionnage
 * Permet de synchroniser la lecture, voir les participants, etc.
 */
const WatchPartyControls = ({ 
  videoRef, 
  watchPartyId, 
  onToggleChat, 
  onToggleParticipants,
  isChatOpen,
  isParticipantsOpen
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [watchParty, setWatchParty] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Initialiser les données de la soirée
  useEffect(() => {
    if (!watchPartyId) return;
    
    // Récupérer les données de la soirée active
    setWatchParty(socialViewingService.activeWatchParty);
    setParticipants(socialViewingService.participants);
    
    // Fonction pour gérer les mises à jour de la soirée
    const handleWatchPartyUpdate = (event) => {
      setWatchParty(event.detail.watchParty);
    };
    
    // Fonction pour gérer l'arrivée d'un nouveau participant
    const handleParticipantJoined = () => {
      setParticipants(socialViewingService.participants);
    };
    
    // Fonction pour gérer le départ d'un participant
    const handleParticipantLeft = () => {
      setParticipants(socialViewingService.participants);
    };
    
    // Fonction pour gérer la synchronisation de la lecture
    const handlePlaybackSync = (event) => {
      const { currentTime, isPlaying: newIsPlaying } = event.detail;
      
      // Ne pas appliquer la synchronisation si c'est nous qui l'avons envoyée
      if (event.detail.source === 'self') return;
      
      // Mettre à jour la position de lecture
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        
        if (newIsPlaying && videoRef.current.paused) {
          videoRef.current.play();
        } else if (!newIsPlaying && !videoRef.current.paused) {
          videoRef.current.pause();
        }
        
        setIsPlaying(newIsPlaying);
      }
    };
    
    // Fonction pour gérer les nouveaux messages
    const handleNewMessage = () => {
      if (!isChatOpen) {
        setUnreadMessages(prev => prev + 1);
      }
    };
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('watchPartyUpdated', handleWatchPartyUpdate);
    window.addEventListener('watchPartyParticipantJoined', handleParticipantJoined);
    window.addEventListener('watchPartyParticipantLeft', handleParticipantLeft);
    window.addEventListener('watchPartyPlaybackSync', handlePlaybackSync);
    window.addEventListener('watchPartyChatMessageReceived', handleNewMessage);
    
    // Nettoyage
    return () => {
      window.removeEventListener('watchPartyUpdated', handleWatchPartyUpdate);
      window.removeEventListener('watchPartyParticipantJoined', handleParticipantJoined);
      window.removeEventListener('watchPartyParticipantLeft', handleParticipantLeft);
      window.removeEventListener('watchPartyPlaybackSync', handlePlaybackSync);
      window.removeEventListener('watchPartyChatMessageReceived', handleNewMessage);
    };
  }, [watchPartyId, videoRef, isChatOpen]);
  
  // Réinitialiser le compteur de messages non lus lorsque le chat est ouvert
  useEffect(() => {
    if (isChatOpen) {
      setUnreadMessages(0);
    }
  }, [isChatOpen]);
  
  // Récupérer les détails de la soirée pour le partage
  useEffect(() => {
    if (showShareDialog && watchParty) {
      // Réinitialiser le message de succès de copie
      setCopySuccess(false);
    }
  }, [showShareDialog, watchParty]);
  
  // Synchroniser la lecture avec les autres participants
  const syncPlayback = async (newIsPlaying) => {
    if (!videoRef.current) return;
    
    try {
      const currentTime = videoRef.current.currentTime;
      await socialViewingService.syncPlayback(currentTime, newIsPlaying);
      setIsPlaying(newIsPlaying);
    } catch (error) {
      console.error('Erreur lors de la synchronisation de la lecture:', error);
    }
  };
  
  // Gérer le clic sur le bouton lecture/pause
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      syncPlayback(true);
    } else {
      videoRef.current.pause();
      syncPlayback(false);
    }
  };
  
  // Partager la soirée de visionnage
  const handleShare = () => {
    setShowShareDialog(true);
  };
  
  // Copier le lien ou le code d'invitation
  const handleCopyInvite = () => {
    if (!watchParty) return;
    
    const inviteText = watchParty.isPrivate 
      ? `Code d'invitation pour ${watchParty.title} : ${watchParty.inviteCode}`
      : `${window.location.origin}/watch-party/${watchParty.id}`;
      
    navigator.clipboard.writeText(inviteText)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => console.error('Erreur lors de la copie :', err));
  };
  
  // Gérer le clic sur le bouton de sortie
  const handleExit = async () => {
    try {
      await socialViewingService.leaveWatchParty();
      // Rediriger vers la page précédente ou la page d'accueil
      window.history.back();
    } catch (error) {
      console.error('Erreur lors de la sortie de la soirée:', error);
    }
  };
  
  return (
    <ControlsContainer>
      <ControlsHeader>
        <Typography variant="h6" color="primary">
          {watchParty?.title || 'Soirée de visionnage'}
        </Typography>
        
        <ParticipantBadge badgeContent={participants.length} color="primary" max={99}>
          <PeopleIcon />
        </ParticipantBadge>
      </ControlsHeader>
      
      <Divider />
      
      <Box mt={2} mb={2}>
        <Typography variant="body2" color="textSecondary">
          {watchParty?.description || 'Regardez ce contenu ensemble avec vos amis.'}
        </Typography>
      </Box>
      
      <Box display="flex" justifyContent="center" mb={2}>
        <IconButton 
          color="primary" 
          size="large" 
          onClick={handlePlayPause}
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
      </Box>
      
      <ControlsActions>
        <Tooltip title="Participants">
          <IconButton 
            color={isParticipantsOpen ? "primary" : "default"} 
            onClick={onToggleParticipants}
          >
            <PeopleIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Chat">
          <IconButton 
            color={isChatOpen ? "primary" : "default"} 
            onClick={() => {
              setUnreadMessages(0);
              onToggleChat();
            }}
          >
            <Badge badgeContent={unreadMessages} color="error" max={99}>
              <ChatIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Partager la soirée">
          <IconButton color="primary" onClick={handleShare}>
            <ShareIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Quitter la soirée">
          <IconButton color="error" onClick={handleExit}>
            <ExitToAppIcon />
          </IconButton>
        </Tooltip>
      </ControlsActions>
      
      {/* Dialog de partage */}
      <Dialog 
        open={showShareDialog} 
        onClose={() => setShowShareDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Partager la soirée de visionnage
          <IconButton
            aria-label="fermer"
            onClick={() => setShowShareDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              {watchParty?.isPrivate 
                ? "Partagez ce code d'invitation avec vos amis :"
                : "Partagez ce lien avec vos amis :"}
            </Typography>
            
            <Paper
              variant="outlined"
              sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'background.paper',
                borderRadius: 1,
                mb: 2
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  color: 'text.primary'
                }}
              >
                {watchParty?.isPrivate 
                  ? watchParty?.inviteCode
                  : `${window.location.origin}/watch-party/${watchParty?.id}`}
              </Typography>
              
              <Tooltip title={copySuccess ? "Copié !" : "Copier"}>
                <IconButton onClick={handleCopyInvite} color="primary">
                  {copySuccess ? <CheckIcon /> : <ContentCopyIcon />}
                </IconButton>
              </Tooltip>
            </Paper>
            
            {watchParty?.isPrivate && (
              <Typography variant="body2" color="text.secondary">
                Ce code est valable uniquement pour cette soirée et ne peut être utilisé que par des personnes disposant d'un compte FloDrama.
              </Typography>
            )}
          </Box>
          
          {/* Options de partage supplémentaires */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Partager via
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button 
                variant="outlined" 
                startIcon={<WhatsAppIcon />}
                onClick={() => {
                  const text = watchParty?.isPrivate
                    ? `Rejoins-moi pour regarder "${watchParty.title}" sur FloDrama ! Code d'invitation : ${watchParty.inviteCode}`
                    : `Rejoins-moi pour regarder "${watchParty.title}" sur FloDrama ! ${window.location.origin}/watch-party/${watchParty.id}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                WhatsApp
              </Button>
              <Button 
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => {
                  const subject = `Invitation à une soirée FloDrama : ${watchParty?.title}`;
                  const body = watchParty?.isPrivate
                    ? `Rejoins-moi pour regarder "${watchParty.title}" sur FloDrama !\n\nCode d'invitation : ${watchParty.inviteCode}\n\nÀ bientôt !`
                    : `Rejoins-moi pour regarder "${watchParty.title}" sur FloDrama !\n\n${window.location.origin}/watch-party/${watchParty.id}\n\nÀ bientôt !`;
                  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                }}
              >
                Email
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
      
      {/* Invitation à la soirée */}
      <WatchPartyInvitation 
        watchPartyId={watchPartyId} 
        isHost={watchParty && watchParty.hostId === socialViewingService.currentUserId}
        onInvitationSent={() => {
          // Rafraîchir la liste des participants si nécessaire
          if (onToggleParticipants) {
            onToggleParticipants(true);
          }
        }}
      />
    </ControlsContainer>
  );
};

export default WatchPartyControls;
