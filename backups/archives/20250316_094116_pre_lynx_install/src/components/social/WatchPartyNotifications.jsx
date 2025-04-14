import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Divider, 
  Button, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SocialViewingService } from '../../services/SocialViewingService';

// Styles personnalisés
const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
}));

const EmptyNotification = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  color: theme.palette.text.secondary,
}));

const NotificationItem = styled(MenuItem)(({ theme, isNew }) => ({
  padding: theme.spacing(1, 2),
  borderLeft: isNew ? `4px solid ${theme.palette.primary.main}` : 'none',
  backgroundColor: isNew ? theme.palette.action.hover : 'transparent',
}));

/**
 * Composant pour afficher et gérer les notifications de Watch Party
 */
const WatchPartyNotifications = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const socialViewingService = useMemo(() => new SocialViewingService(), []);
  
  const unreadCount = useMemo(() => {
    return notifications.filter(notif => !notif.read).length;
  }, [notifications]);
  
  // Définir fetchNotifications avec useCallback
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const invitations = await socialViewingService.getReceivedInvitations();
      setNotifications(invitations);
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications:', err);
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  }, [socialViewingService]);
  
  // Charger les notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);
  
  // Configurer l'écouteur d'événements pour les nouvelles notifications
  useEffect(() => {
    const handleNewNotification = (event) => {
      if (event.detail && event.detail.notification) {
        setNotifications(prev => [event.detail.notification, ...prev]);
      }
    };
    
    window.addEventListener('newWatchPartyNotification', handleNewNotification);
    
    return () => {
      window.removeEventListener('newWatchPartyNotification', handleNewNotification);
    };
  }, []);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications(); // Rafraîchir les notifications à chaque ouverture
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleAcceptInvitation = async (invitationId) => {
    try {
      setLoading(true);
      
      // Accepter l'invitation
      const result = await socialViewingService.acceptWatchPartyInvitation(invitationId);
      
      // Mettre à jour la liste des notifications
      setNotifications(prev => prev.filter(notif => notif.id !== invitationId));
      
      // Fermer le menu
      handleClose();
      
      // Rediriger vers la soirée de visionnage
      if (result && result.watchPartyId) {
        navigate(`/watch-party/${result.watchPartyId}`);
      }
    } catch (err) {
      console.error('Erreur lors de l\'acceptation de l\'invitation:', err);
      setError('Impossible d\'accepter l\'invitation');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeclineInvitation = async (invitationId) => {
    try {
      setLoading(true);
      
      // Refuser l'invitation
      await socialViewingService.declineWatchPartyInvitation(invitationId);
      
      // Mettre à jour la liste des notifications
      setNotifications(prev => prev.filter(notif => notif.id !== invitationId));
    } catch (err) {
      console.error('Erreur lors du refus de l\'invitation:', err);
      setError('Impossible de refuser l\'invitation');
    } finally {
      setLoading(false);
    }
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
  
  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleClick}
        aria-label="Notifications"
      >
        <NotificationBadge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </NotificationBadge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            width: '350px',
            maxHeight: '500px',
          },
        }}
      >
        <Box px={2} py={1} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <EmptyNotification>
            <Typography variant="body2" color="error">{error}</Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={fetchNotifications} 
              sx={{ mt: 1 }}
            >
              Réessayer
            </Button>
          </EmptyNotification>
        ) : notifications.length === 0 ? (
          <EmptyNotification>
            <Typography variant="body2">Aucune notification</Typography>
          </EmptyNotification>
        ) : (
          notifications.map((notification) => (
            <NotificationItem 
              key={notification.id} 
              isNew={!notification.read}
              divider
            >
              <Box width="100%">
                <Box display="flex" alignItems="center" mb={1}>
                  <ListItemIcon>
                    <Avatar>
                      <LiveTvIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2">
                        Invitation à une soirée de visionnage
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(notification.createdAt)}
                      </Typography>
                    }
                  />
                </Box>
                
                <Typography variant="body2" mb={1} pl={7}>
                  {notification.senderName || 'Un utilisateur'} vous invite à rejoindre 
                  <strong> {notification.watchPartyTitle || 'une soirée de visionnage'}</strong>
                </Typography>
                
                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={() => handleDeclineInvitation(notification.id)}
                    disabled={loading}
                  >
                    Refuser
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleAcceptInvitation(notification.id)}
                    disabled={loading}
                  >
                    Accepter
                  </Button>
                </Box>
              </Box>
            </NotificationItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default WatchPartyNotifications;
