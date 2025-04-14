import mongoose, { Document, Schema } from 'mongoose';

export interface IPreferencesUtilisateur extends Document {
  userId: string;
  genresPrefers: string[];
  historique: Array<{
    contenuId: string;
    dateVisionnage: Date;
    tempsVisionnage: number;
    termine: boolean;
  }>;
  favoris: string[];
  languesPreferees: string[];
  notesMoyennes: {
    [genre: string]: number;
  };
  derniereActivite: Date;
  parametres: {
    autoplay: boolean;
    qualitePreferee: string;
    sousTitresParDefaut: boolean;
    langueAudioPreferee: string;
  };
}

const PreferencesUtilisateurSchema = new Schema<IPreferencesUtilisateur>({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  genresPrefers: [{ 
    type: String,
    index: true 
  }],
  historique: [{
    contenuId: { 
      type: String,
      required: true 
    },
    dateVisionnage: { 
      type: Date,
      required: true,
      default: Date.now 
    },
    tempsVisionnage: { 
      type: Number,
      default: 0 
    },
    termine: { 
      type: Boolean,
      default: false 
    }
  }],
  favoris: [{ 
    type: String,
    index: true 
  }],
  languesPreferees: [{ 
    type: String 
  }],
  notesMoyennes: {
    type: Map,
    of: Number,
    default: {}
  },
  derniereActivite: { 
    type: Date,
    default: Date.now,
    index: true 
  },
  parametres: {
    autoplay: { 
      type: Boolean,
      default: true 
    },
    qualitePreferee: { 
      type: String,
      default: 'auto' 
    },
    sousTitresParDefaut: { 
      type: Boolean,
      default: false 
    },
    langueAudioPreferee: { 
      type: String,
      default: 'fr' 
    }
  }
}, {
  timestamps: true
});

// Index composés pour les requêtes fréquentes
PreferencesUtilisateurSchema.index({ userId: 1, derniereActivite: -1 });
PreferencesUtilisateurSchema.index({ 'historique.contenuId': 1, 'historique.dateVisionnage': -1 });

export default mongoose.model<IPreferencesUtilisateur>('PreferencesUtilisateur', PreferencesUtilisateurSchema);
