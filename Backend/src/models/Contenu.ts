import mongoose, { Document, Schema } from 'mongoose';

export interface IContenu extends Document {
  titre: string;
  description: string;
  imageUrl: string;
  type: 'film' | 'serie' | 'documentaire';
  genres: string[];
  duree?: number;
  note?: number;
  dateAjout: Date;
  vues: number;
  langue: string;
  pays: string;
  annee: number;
  acteurs: string[];
  realisateur: string;
  metadonnees: {
    qualite: string;
    sousTitres: Array<{
      langue: string;
      url: string;
    }>;
    audio: string[];
  };
}

const ContenuSchema = new Schema<IContenu>({
  titre: { type: String, required: true, index: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['film', 'serie', 'documentaire'],
    index: true 
  },
  genres: [{ 
    type: String, 
    required: true,
    index: true 
  }],
  duree: { type: Number },
  note: { 
    type: Number,
    min: 0,
    max: 5,
    index: true 
  },
  dateAjout: { 
    type: Date, 
    required: true,
    default: Date.now,
    index: true 
  },
  vues: { 
    type: Number,
    default: 0,
    index: true 
  },
  langue: { type: String, required: true },
  pays: { type: String, required: true },
  annee: { 
    type: Number,
    required: true,
    index: true 
  },
  acteurs: [{ type: String }],
  realisateur: { type: String },
  metadonnees: {
    qualite: { type: String },
    sousTitres: [{
      langue: { type: String },
      url: { type: String }
    }],
    audio: [{ type: String }]
  }
}, {
  timestamps: true
});

// Index composé pour les recherches fréquentes
ContenuSchema.index({ type: 1, genres: 1, note: -1 });
ContenuSchema.index({ dateAjout: -1, type: 1 });

export default mongoose.model<IContenu>('Contenu', ContenuSchema);
