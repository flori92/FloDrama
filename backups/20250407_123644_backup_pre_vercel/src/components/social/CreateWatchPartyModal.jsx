import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Typography,
  Box
} from '@mui/material';

/**
 * Modal pour créer une nouvelle soirée de visionnage (Watch Party)
 * Permet de configurer les paramètres de la soirée et d'inviter des amis
 */
const CreateWatchPartyModal = ({ open, onClose, onCreateParty, contentId, contentTitle }) => {
  // État du formulaire
  const [partyName, setPartyName] = useState(`Soirée ${contentTitle || 'de visionnage'}`);
  const [isPublic, setIsPublic] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!partyName.trim()) {
      newErrors.partyName = 'Le nom de la soirée est requis';
    }
    
    if (maxParticipants < 2 || maxParticipants > 10) {
      newErrors.maxParticipants = 'Le nombre de participants doit être entre 2 et 10';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = () => {
    if (validateForm()) {
      onCreateParty({
        name: partyName,
        contentId,
        isPublic,
        maxParticipants,
        description: description.trim() || `Soirée de visionnage pour ${contentTitle}`,
        createdAt: new Date().toISOString()
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Créer une soirée de visionnage</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Nom de la soirée"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            error={!!errors.partyName}
            helperText={errors.partyName}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Description (optionnelle)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal" error={!!errors.maxParticipants}>
            <InputLabel>Nombre maximum de participants</InputLabel>
            <Select
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              label="Nombre maximum de participants"
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <MenuItem key={num} value={num}>
                  {num} participants
                </MenuItem>
              ))}
            </Select>
            {errors.maxParticipants && (
              <FormHelperText>{errors.maxParticipants}</FormHelperText>
            )}
          </FormControl>
          
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  color="primary"
                />
              }
              label="Soirée publique"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Les soirées publiques peuvent être rejointes par n'importe quel utilisateur de FloDrama
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Annuler
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Créer la soirée
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateWatchPartyModal;
