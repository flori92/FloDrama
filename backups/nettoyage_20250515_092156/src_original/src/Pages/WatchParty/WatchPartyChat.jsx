/**
 * Composant WatchPartyChat
 * Interface de chat pour les sessions WatchParty
 */

import React, { useState, useEffect, useRef } from 'react';
import { useWatchParty } from '../../Context/WatchPartyContext';

const WatchPartyChat = () => {
  const { messages, sendMessage } = useWatchParty();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Faire défiler automatiquement vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Envoyer un message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText('');
    }
  };
  
  // Formater l'heure du message
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col h-[500px]">
      {/* En-tête du chat */}
      <div className="bg-gray-800 p-3 border-b border-gray-700">
        <h3 className="text-white font-medium">Chat</h3>
      </div>
      
      {/* Zone des messages */}
      <div 
        ref={chatContainerRef}
        className="flex-grow p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <p>Aucun message pour le moment</p>
            <p className="text-sm">Soyez le premier à écrire !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="message">
                {message.type === 'system' ? (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm bg-gray-800 bg-opacity-50 inline-block px-3 py-1 rounded-full">
                      {message.text}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start">
                    {message.photoURL ? (
                      <img 
                        src={message.photoURL} 
                        alt={message.displayName} 
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full mr-2 bg-flodrama-fuchsia flex items-center justify-center text-white font-medium">
                        {message.displayName?.charAt(0) || '?'}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-baseline">
                        <span className="font-medium text-flodrama-fuchsia mr-2">
                          {message.displayName}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-white break-words">{message.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Formulaire d'envoi de message */}
      <form 
        onSubmit={handleSendMessage}
        className="p-3 border-t border-gray-700 bg-gray-800"
      >
        <div className="flex">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Écrivez un message..."
            className="flex-grow bg-gray-900 text-white border border-gray-700 rounded-l-lg py-2 px-3 focus:outline-none focus:border-flodrama-fuchsia"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className={`px-4 rounded-r-lg ${
              messageText.trim()
                ? 'bg-flodrama-fuchsia text-white hover:bg-flodrama-fuchsia/80'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default WatchPartyChat;
