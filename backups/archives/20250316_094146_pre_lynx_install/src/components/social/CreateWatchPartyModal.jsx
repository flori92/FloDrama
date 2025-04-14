import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  FormControlLabel, 
  Switch, 
  Box,
  Typography,
  CircularProgress,
  FormHelperText,
  IconButton,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CloseIcon from '@mui/icons-material/Close';
import socialViewingService from '../../services/SocialViewingService';
import { useNavigate } from 'react-router-dom';
import dayjs from '../../config/dayjsConfig';

// Styles personnalisés
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.shape.borderRadius,
    maxWidth: '500px',
    width: '100%',
  },
}));

const DialogHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
}));

/**
 * Modal pour créer une nouvelle soirée de visionnage
 */
const CreateWatchPartyModal = ({ open, onClose, contentId, contentTitle }) => {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState(`Soirée : ${contentTitle || 'Mon contenu'}`);
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    
    if (title.length > 100) {
      newErrors.title = 'Le titre ne doit pas dépasser 100 caractères';
    }
    
    if (description.length > 500) {
      newErrors.description = 'La description ne doit pas dépasser 500 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const result = await socialViewingService.createWatchParty({
        contentId,
        title,
        description: description.trim() || undefined,
        scheduledTime,
        isPrivate,
      });
      
      // Fermer le modal
      onClose();
      
      // Rediriger vers la page de la soirée
      navigate(`/watch-party/${result.id}`);
    } catch (error) {
      console.error('Erreur lors de la création de la soirée:', error);
      setErrors({ submit: 'Erreur lors de la création de la soirée. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };
  
  // Réinitialiser le formulaire lors de la fermeture
  const handleClose = () => {
    setTitle(`Soirée : ${contentTitle || 'Mon contenu'}`);
    setDescription('');
    setIsPrivate(false);
    setScheduledTime(null);
    setErrors({});
    onClose();
  };
  
  return (
    <StyledDialog open={open} onClose={handleClose} fullWidth>
      <DialogHeader>
        <DialogTitle sx={{ p: 0 }}>Créer une soirée de visionnage</DialogTitle>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogHeader>
      
      <Divider />
      
      <DialogContent sx={{ pt: 3 }}>
        <Box mb={3}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Invitez vos amis à regarder ce contenu ensemble en temps réel.
          </Typography>
        </Box>
        
        <TextField
          label="Titre de la soirée"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          error={Boolean(errors.title)}
          helperText={errors.title}
          disabled={loading}
          required
        />
        
        <TextField
          label="Description (optionnelle)"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={3}
          error={Boolean(errors.description)}
          helperText={errors.description}
          disabled={loading}
        />
        
        <LocalizationProvider dateAdapter={AdapterDayjs} locale={dayjs.locale()}>
          <DateTimePicker
            label="Date et heure programmées (optionnel)"
            value={scheduledTime}
            onChange={setScheduledTime}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                margin="normal"
                disabled={loading}
              />
            )}
            minDateTime={new Date()}
            disabled={loading}
          />
        </LocalizationProvider>
        
        <FormControlLabel
          control={
            <Switch
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              disabled={loading}
            />
          }
          label="Soirée privée (accessible uniquement par invitation)"
          sx={{ mt: 2 }}
        />
        
        {errors.submit && (
          <FormHelperText error sx={{ mt: 2 }}>
            {errors.submit}
          </FormHelperText>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Création...' : 'Créer la soirée'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default CreateWatchPartyModal;
