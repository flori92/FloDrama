/**
 * Composant WatchPartyParticipants
 * Affiche la liste des participants à une session WatchParty
 */

import React from 'react';

const WatchPartyParticipants = ({ participants }) => {
  return (
    <div className="p-3">
      <h3 className="text-white font-medium mb-3">Participants ({participants.length})</h3>
      
      {participants.length === 0 ? (
        <div className="text-center text-gray-500 py-2">
          <p>Aucun participant</p>
        </div>
      ) : (
        <div className="space-y-2">
          {participants.map((participant) => (
            <div key={participant.userId} className="flex items-center">
              {participant.photoURL ? (
                <img 
                  src={participant.photoURL} 
                  alt={participant.displayName} 
                  className="w-8 h-8 rounded-full mr-2 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full mr-2 bg-flodrama-fuchsia flex items-center justify-center text-white font-medium">
                  {participant.displayName?.charAt(0) || '?'}
                </div>
              )}
              
              <span className="text-white">{participant.displayName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchPartyParticipants;
