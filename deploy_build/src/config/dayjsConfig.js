/**
 * Configuration de dayjs pour l'application
 * 
 * Ce fichier configure dayjs avec les plugins et locales nécessaires
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/fr'; // Importe la locale française

// Extension pour le formatage relatif (il y a X minutes, etc.)
dayjs.extend(relativeTime);
// Extension pour le formatage localisé
dayjs.extend(localizedFormat);
// Définir le français comme locale par défaut
dayjs.locale('fr');

export default dayjs;
