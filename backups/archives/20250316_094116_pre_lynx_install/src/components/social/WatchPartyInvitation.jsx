import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Snackbar, Alert, Typography, Box, Divider, CircularProgress } from '@mui/material';
import { Share as ShareIcon, ContentCopy as ContentCopyIcon, WhatsApp as WhatsAppIcon, Facebook as FacebookIcon, Twitter as TwitterIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { SocialViewingService } from '../../services/SocialViewingService';
import { HybridBridgeService } from '../../services/HybridBridgeService';

/**
 * Composant pour gérer les invitations aux soirées de visionnage
 * Permet de générer et partager des codes d'invitation
 */
const WatchPartyInvitation = ({ watchPartyId, isHost, onInvitationSent }) => {
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  
  const { user } = useAuth();
  const socialViewingService = useMemo(() => new SocialViewingService(), []);
  const isNative = HybridBridgeService.isRunningInFlutter();

  // Définir fetchFriends avec useCallback
  const fetchFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const response = await fetch(`/api/profiles/${user.id}/friends`);
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      } else {
        console.error('Erreur lors de la récupération des amis');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des amis:', error);
    } finally {
      setLoadingFriends(false);
    }
  }, [user]);

  // Définir fetchOrGenerateInviteCode avec useCallback
  const fetchOrGenerateInviteCode = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier si un code existe déjà pour cette soirée
      const existingCode = await socialViewingService.getWatchPartyInviteCode(watchPartyId);
      
      if (existingCode) {
        setInviteCode(existingCode);
        setInviteLink(`${window.location.origin}/watch-party/join/${existingCode}`);
      } else {
        // Générer un nouveau code
        const newCode = await socialViewingService.generateWatchPartyInviteCode(watchPartyId);
        setInviteCode(newCode);
        setInviteLink(`${window.location.origin}/watch-party/join/${newCode}`);
      }
    } catch (err) {
      console.error('Erreur lors de la génération du code d\'invitation:', err);
      setError('Impossible de générer un code d\'invitation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [watchPartyId, socialViewingService]);

  // Récupérer ou générer un code d'invitation lors de l'ouverture du dialogue
  useEffect(() => {
    if (open && isHost) {
      fetchOrGenerateInviteCode();
    }
  }, [open, isHost, fetchOrGenerateInviteCode]);

  // Récupérer la liste des amis
  useEffect(() => {
    if (open && user) {
      fetchFriends();
    }
  }, [open, user, fetchFriends]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFriendEmail('');
    setError(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setSnackbarMessage('Copié dans le presse-papiers !');
        setSnackbarOpen(true);
      },
      (err) => {
        console.error('Impossible de copier le texte: ', err);
        setSnackbarMessage('Erreur lors de la copie');
        setSnackbarOpen(true);
      }
    );
  };

  const shareViaEmail = (email) => {
    const subject = encodeURIComponent('Rejoins ma soirée FloDrama !');
    const body = encodeURIComponent(`Hey ! J'organise une soirée de visionnage sur FloDrama. Rejoins-moi avec ce code : ${inviteCode} ou en cliquant sur ce lien : ${inviteLink}`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const shareViaNative = async () => {
    if (isNative) {
      try {
        await HybridBridgeService.callNative('shareContent', {
          title: 'Rejoins ma soirée FloDrama !',
          text: `Hey ! J'organise une soirée de visionnage sur FloDrama. Rejoins-moi avec ce code : ${inviteCode}`,
          url: inviteLink
        });
      } catch (error) {
        console.error('Erreur lors du partage natif:', error);
        setSnackbarMessage('Erreur lors du partage');
        setSnackbarOpen(true);
      }
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Hey ! J'organise une soirée de visionnage sur FloDrama. Rejoins-moi avec ce code : ${inviteCode} ou en cliquant sur ce lien : ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Rejoins ma soirée de visionnage sur FloDrama ! Code : ${inviteCode}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(inviteLink)}`);
  };

  const sendInvitationByEmail = async () => {
    if (!friendEmail) {
      setError('Veuillez entrer une adresse e-mail');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Envoyer l'invitation par e-mail via le service
      await socialViewingService.sendWatchPartyInvitation(watchPartyId, friendEmail);
      
      setSnackbarMessage('Invitation envoyée avec succès !');
      setSnackbarOpen(true);
      setFriendEmail('');
      
      if (onInvitationSent) {
        onInvitationSent();
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', err);
      setError('Impossible d\'envoyer l\'invitation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outlined" 
        color="primary" 
        startIcon={<ShareIcon />} 
        onClick={handleClickOpen}
        disabled={!isHost}
      >
        Inviter des amis
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Inviter des amis à votre soirée</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          ) : (
            <>
              <DialogContentText>
                Partagez ce code d'invitation ou ce lien avec vos amis pour qu'ils puissent rejoindre votre soirée de visionnage.
              </DialogContentText>
              
              <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1} border={1} borderColor="divider">
                <Typography variant="h5" align="center" gutterBottom>{inviteCode}</Typography>
                <Box display="flex" justifyContent="center" mt={1}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<ContentCopyIcon />} 
                    onClick={() => copyToClipboard(inviteCode)}
                  >
                    Copier le code
                  </Button>
                </Box>
              </Box>
              
              <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1} border={1} borderColor="divider">
                <Typography variant="body2" noWrap>{inviteLink}</Typography>
                <Box display="flex" justifyContent="center" mt={1}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<ContentCopyIcon />} 
                    onClick={() => copyToClipboard(inviteLink)}
                  >
                    Copier le lien
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" gutterBottom>Inviter par e-mail</Typography>
              <TextField
                margin="dense"
                label="Adresse e-mail"
                type="email"
                fullWidth
                variant="outlined"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={sendInvitationByEmail}
                disabled={loading}
                fullWidth
              >
                Envoyer une invitation
              </Button>
              
              {friends.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle1" gutterBottom>Inviter vos amis</Typography>
                  {loadingFriends ? (
                    <Box display="flex" justifyContent="center" my={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={1} mt={1}>
                      {friends.map(friend => (
                        <Button 
                          key={friend.id}
                          variant="outlined" 
                          onClick={() => shareViaEmail(friend.email)}
                          startIcon={<ShareIcon />}
                        >
                          {friend.displayName || friend.email}
                        </Button>
                      ))}
                    </Box>
                  )}
                </>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" gutterBottom>Partager via</Typography>
              <Box display="flex" justifyContent="space-around" mt={1}>
                {isNative && (
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<ShareIcon />} 
                    onClick={shareViaNative}
                  >
                    Partager
                  </Button>
                )}
                <Button 
                  variant="outlined" 
                  color="success" 
                  startIcon={<WhatsAppIcon />} 
                  onClick={shareViaWhatsApp}
                >
                  WhatsApp
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<FacebookIcon />} 
                  onClick={shareViaFacebook}
                >
                  Facebook
                </Button>
                <Button 
                  variant="outlined" 
                  color="info" 
                  startIcon={<TwitterIcon />} 
                  onClick={shareViaTwitter}
                >
                  Twitter
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default WatchPartyInvitation;
