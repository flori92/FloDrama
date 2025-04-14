import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Paper, 
  Divider, 
  Chip 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import socialViewingService from '../../services/SocialViewingService';

// Styles personnalisés
const ParticipantsContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxHeight: '400px',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
}));

const ParticipantsList = styled(List)(({ theme }) => ({
  overflow: 'auto',
  padding: 0,
}));

const HostChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.warning.main,
  color: theme.palette.warning.contrastText,
  fontSize: '0.7rem',
  height: 20,
}));

/**
 * Composant affichant la liste des participants à une soirée de visionnage
 */
const WatchPartyParticipants = ({ watchPartyId }) => {
  const [participants, setParticipants] = useState([]);
  const [watchParty, setWatchParty] = useState(null);
  
  // Charger les participants et configurer les écouteurs d'événements
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
    
    // Ajouter les écouteurs d'événements
    window.addEventListener('watchPartyUpdated', handleWatchPartyUpdate);
    window.addEventListener('watchPartyParticipantJoined', handleParticipantJoined);
    window.addEventListener('watchPartyParticipantLeft', handleParticipantLeft);
    
    // Nettoyage
    return () => {
      window.removeEventListener('watchPartyUpdated', handleWatchPartyUpdate);
      window.removeEventListener('watchPartyParticipantJoined', handleParticipantJoined);
      window.removeEventListener('watchPartyParticipantLeft', handleParticipantLeft);
    };
  }, [watchPartyId]);
  
  return (
    <ParticipantsContainer>
      <Box p={2} bgcolor="primary.dark" color="primary.contrastText">
        <Typography variant="h6">Participants ({participants.length})</Typography>
      </Box>
      
      <Divider />
      
      <ParticipantsList>
        {participants.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <Typography variant="body2" color="textSecondary">
              Aucun participant pour le moment
            </Typography>
          </Box>
        ) : (
          participants.map((participant) => {
            const isHost = watchParty && participant.id === watchParty.hostId;
            const isCurrentUser = participant.isCurrentUser;
            
            return (
              <React.Fragment key={participant.id}>
                <ListItem alignItems="center">
                  <ListItemAvatar>
                    {participant.avatarUrl ? (
                      <Avatar alt={participant.username} src={participant.avatarUrl} />
                    ) : (
                      <Avatar>
                        {isHost ? <StarIcon /> : <PersonIcon />}
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          {participant.username}
                          {isCurrentUser && ' (Vous)'}
                        </Typography>
                        
                        {isHost && (
                          <HostChip
                            label="Hôte"
                            size="small"
                            icon={<StarIcon fontSize="small" />}
                          />
                        )}
                      </Box>
                    }
                    secondary={participant.status || 'En ligne'}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            );
          })
        )}
      </ParticipantsList>
    </ParticipantsContainer>
  );
};

export default WatchPartyParticipants;
