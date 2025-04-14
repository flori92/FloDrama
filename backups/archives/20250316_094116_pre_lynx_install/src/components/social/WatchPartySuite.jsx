import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/material/styles';
import WatchPartyControls from './WatchPartyControls';
import WatchPartyChat from './WatchPartyChat';
import WatchPartyParticipants from './WatchPartyParticipants';
import WatchPartyNotifications from './WatchPartyNotifications';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SocialViewingService } from '../../services/SocialViewingService';

// Styles personnalisés
const WatchPartySuiteContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: theme.spacing(2),
}));

const WatchPartyHeader = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.primary.contrastText,
}));

const TabPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
}));

/**
 * Composant principal pour la suite de fonctionnalités de Watch Party
 * Intègre les contrôles, le chat, les participants et les notifications
 */
const WatchPartySuite = ({ videoRef }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [watchParty, setWatchParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { watchPartyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socialViewingService = useMemo(() => new SocialViewingService(), []);
  
  // Charger les détails de la soirée de visionnage
  useEffect(() => {
    if (!watchPartyId || !user) return;
    
    const fetchWatchPartyDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Rejoindre la soirée de visionnage
        const result = await socialViewingService.joinWatchParty(watchPartyId);
        setWatchParty(result.watchParty);
      } catch (err) {
        console.error('Erreur lors du chargement de la soirée de visionnage:', err);
        setError('Impossible de rejoindre la soirée de visionnage');
        
        // Rediriger vers la liste des soirées en cas d'erreur
        setTimeout(() => {
          navigate('/watch-parties');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWatchPartyDetails();
    
    // Nettoyage : quitter la soirée lorsque le composant est démonté
    return () => {
      socialViewingService.leaveWatchParty().catch(err => {
        console.error('Erreur lors de la sortie de la soirée de visionnage:', err);
      });
    };
  }, [watchPartyId, user, socialViewingService, navigate]);
  
  // Configurer les écouteurs d'événements pour les mises à jour de la soirée
  useEffect(() => {
    const handleWatchPartyUpdate = (event) => {
      if (event.detail && event.detail.watchParty) {
        setWatchParty(event.detail.watchParty);
      }
    };
    
    window.addEventListener('watchPartyUpdated', handleWatchPartyUpdate);
    
    return () => {
      window.removeEventListener('watchPartyUpdated', handleWatchPartyUpdate);
    };
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Déterminer si l'utilisateur actuel est l'hôte de la soirée
  const isHost = watchParty && user && watchParty.hostId === user.id;
  
  return (
    <WatchPartySuiteContainer>
      <WatchPartyHeader>
        <Box>
          <Typography variant="h5">
            {watchParty ? watchParty.title : 'Chargement de la soirée...'}
          </Typography>
          {watchParty && (
            <Typography variant="body2">
              {watchParty.description}
            </Typography>
          )}
          {isHost && (
            <Typography variant="caption" color="primary.light">
              Vous êtes l'hôte de cette soirée
            </Typography>
          )}
        </Box>
        
        <WatchPartyNotifications />
      </WatchPartyHeader>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          {/* Lecteur vidéo ou contenu principal */}
          {videoRef && (
            <WatchPartyControls
              videoRef={videoRef}
              watchPartyId={watchPartyId}
              onToggleChat={() => setActiveTab(0)}
              onToggleParticipants={() => setActiveTab(1)}
              isChatOpen={activeTab === 0}
              isParticipantsOpen={activeTab === 1}
            />
          )}
          
          {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <Typography>Chargement de la soirée...</Typography>
            </Box>
          )}
          
          {error && (
            <Box display="flex" justifyContent="center" my={4}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Chat" />
              <Tab label="Participants" />
            </Tabs>
            
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              {activeTab === 0 && (
                <TabPanel>
                  <WatchPartyChat watchPartyId={watchPartyId} />
                </TabPanel>
              )}
              
              {activeTab === 1 && (
                <TabPanel>
                  <WatchPartyParticipants watchPartyId={watchPartyId} isHost={isHost} />
                </TabPanel>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </WatchPartySuiteContainer>
  );
};

export default WatchPartySuite;
