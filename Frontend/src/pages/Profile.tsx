import React from 'react';
import { User, Settings, Bookmark, History } from 'lucide-react';
import ContentGrid from '../components/ContentGrid';

const Profile: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 p-6 bg-gray-800 rounded-lg">
        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mon Profil</h1>
          <p className="text-gray-400">Membre depuis 2024</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="space-y-4">
            <button className="w-full flex items-center space-x-2 p-4 bg-gray-800 rounded-lg hover:bg-gray-700">
              <Settings className="w-5 h-5" />
              <span>Paramètres</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-4 bg-gray-800 rounded-lg hover:bg-gray-700">
              <Bookmark className="w-5 h-5" />
              <span>Ma liste</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-4 bg-gray-800 rounded-lg hover:bg-gray-700">
              <History className="w-5 h-5" />
              <span>Historique</span>
            </button>
          </div>
        </div>

        <div className="col-span-2">
          <ContentGrid title="Contenu récemment regardé" category="history" />
          <ContentGrid title="Ma liste" category="watchlist" />
        </div>
      </div>
    </div>
  );
};

export default Profile; 