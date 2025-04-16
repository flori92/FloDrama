import React, { useState, useCallback, useMemo } from 'react';
import EmojiPickerReact, { EmojiStyle, Theme, Categories } from 'emoji-picker-react';
import '../../styles/components/emojiPicker.scss';

// Types pour notre implémentation personnalisée
interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string) => void;
}

interface GifData {
  id: string;
  url: string;
  preview: string;
  title: string;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onGifSelect }) => {
  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [showGifs, setShowGifs] = useState(false);
  
  // Fonction pour gérer la sélection d'un emoji
  const handleEmojiSelect = useCallback((emoji: string) => {
    // Sauvegarde de l'emoji dans le localStorage pour les récents
    const saved = localStorage.getItem('recentEmojis');
    const recentEmojis = saved ? JSON.parse(saved) : ['😊', '😂', '❤️', '👍', '🔥', '😍', '🎉', '👏'];
    const newRecent = [emoji, ...recentEmojis.filter((e: string) => e !== emoji)].slice(0, 16);
    localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
    
    onSelect(emoji);
  }, [onSelect]);

  // Fonction pour gérer la sélection d'un GIF
  const handleGifSelect = useCallback((gifUrl: string) => {
    onGifSelect(gifUrl);
  }, [onGifSelect]);

  // Fonction pour basculer entre émojis et GIFs
  const toggleGifs = useCallback(() => {
    setShowGifs(prev => !prev);
    setSearchTerm('');
  }, []);

  // Fonction pour gérer la recherche
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Collection de GIFs prédéfinis (sans API key)
  const predefinedGifs = useMemo<GifData[]>(() => {
    return [
      {
        id: '1',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHlxMnlveTZvbzE2ZWl2M2RsYzl0MXVlbGZhcGJ3eWRrZXVjZXlrZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0xeJpnrWC4XWblEk/giphy.gif',
        preview: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHlxMnlveTZvbzE2ZWl2M2RsYzl0MXVlbGZhcGJ3eWRrZXVjZXlrZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0xeJpnrWC4XWblEk/giphy.gif',
        title: 'Applaudissements'
      },
      {
        id: '2',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjNxcjRoYzJ4cHY3bHRvZzZqNHJxMjVsZGVlNzJsYXFwbmJjcHBwdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2K5jinAlChoCLS/giphy.gif',
        preview: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjNxcjRoYzJ4cHY3bHRvZzZqNHJxMjVsZGVlNzJsYXFwbmJjcHBwdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2K5jinAlChoCLS/giphy.gif',
        title: 'Rire'
      },
      {
        id: '3',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcm5nZnNlMDVkOWJzNXd2cHRtMjN0cHFkZGNkZWd3cGJwOGJpbHRwcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abKhOpu0NwenH3O/giphy.gif',
        preview: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcm5nZnNlMDVkOWJzNXd2cHRtMjN0cHFkZGNkZWd3cGJwOGJpbHRwcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abKhOpu0NwenH3O/giphy.gif',
        title: 'Pouce en l\'air'
      },
      {
        id: '4',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXA1ZWRlZGZ0aWl3cXVlbGVpYnl4bGVqeHJxaWp4ZTVvYzNlYTdvYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKsGhevAjqcroKA/giphy.gif',
        preview: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXA1ZWRlZGZ0aWl3cXVlbGVpYnl4bGVqeHJxaWp4ZTVvYzNlYTdvYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKsGhevAjqcroKA/giphy.gif',
        title: 'Danse'
      },
      {
        id: '5',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmZqcnJsZXVmcnVuMnpnYnVkYnZtcWh5eXBmZmVlbGNxcXZnZDJxcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjHAUOqG3lSS0f1C/giphy.gif',
        preview: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmZqcnJsZXVmcnVuMnpnYnVkYnZtcWh5eXBmZmVlbGNxcXZnZDJxcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjHAUOqG3lSS0f1C/giphy.gif',
        title: 'Wow'
      },
      {
        id: '6',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdDc0YXJmZG9hMnpyYnRtcmVjbHVhbzRqZnNzZjlhZGZjZ2ZuYWFmcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYJnJQ4EiYLR8tO/giphy.gif',
        preview: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdDc0YXJmZG9hMnpyYnRtcmVjbHVhbzRqZnNzZjlhZGZjZ2ZuYWFmcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYJnJQ4EiYLR8tO/giphy.gif',
        title: 'Triste'
      },
      {
        id: '7',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWRhb3B6OGc3YzJpNGNxZGxqNnRiMGxmNXRlMnRwNXhvNWpnYzlqcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l378BzHA5FwWFXVSg/giphy.gif',
        preview: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWRhb3B6OGc3YzJpNGNxZGxqNnRiMGxmNXRlMnRwNXhvNWpnYzlqcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l378BzHA5FwWFXVSg/giphy.gif',
        title: 'Coeur'
      },
      {
        id: '8',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWJ1dWR3ZXo3MzVyYWxnMjlxdnZ3ZmFpbWJzMXJoZXhqMXBjdXJwMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7aTB1ISzYv0vtkSQ/giphy.gif',
        preview: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWJ1dWR3ZXo3MzVyYWxnMjlxdnZ3ZmFpbWJzMXJoZXhqMXBjdXJwMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7aTB1ISzYv0vtkSQ/giphy.gif',
        title: 'Feu'
      },
      {
        id: '9',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXZjcTBwZHJnbWl3ZWI0ZGYxNGJhNGt5bWNwdGNzOHI1aXFzNXJmaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlPystfePnAI3G8/giphy.gif',
        preview: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXZjcTBwZHJnbWl3ZWI0ZGYxNGJhNGt5bWNwdGNzOHI1aXFzNXJmaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlPystfePnAI3G8/giphy.gif',
        title: 'Choc'
      },
      {
        id: '10',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWZtcnRlZDQ3dHJzZHFkMTI2aWF3dXJpMTRhNHlxcXhvbXdwbzVmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4FGlzBAGyDc3XQA0/giphy.gif',
        preview: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWZtcnRlZDQ3dHJzZHFkMTI2aWF3dXJpMTRhNHlxcXhvbXdwbzVmZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l4FGlzBAGyDc3XQA0/giphy.gif',
        title: 'Anime'
      }
    ];
  }, []);
  
  // Filtrer les GIFs en fonction de la recherche
  const filteredGifs = useMemo(() => {
    if (!searchTerm) return predefinedGifs;
    return predefinedGifs.filter(gif => 
      gif.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [predefinedGifs, searchTerm]);

  // Fonction pour gérer la sélection d'emoji via la bibliothèque emoji-picker-react
  const onEmojiClick = useCallback((emojiData: any) => {
    const emoji = emojiData.emoji;
    handleEmojiSelect(emoji);
  }, [handleEmojiSelect]);

  return (
    <div className="emoji-picker">
      <div className="emoji-picker-header">
        <div className="emoji-search-container">
          <input
            type="text"
            className="emoji-search"
            placeholder={showGifs ? "Rechercher un GIF..." : "Rechercher un emoji..."}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <div className="emoji-tabs">
          <button
            className={`emoji-tab ${!showGifs ? 'active' : ''}`}
            onClick={() => !showGifs || toggleGifs()}
          >
            😊 Émojis
          </button>
          <button
            className={`emoji-tab ${showGifs ? 'active' : ''}`}
            onClick={() => showGifs || toggleGifs()}
          >
            🎬 GIFs
          </button>
        </div>
      </div>
      
      <div className="emoji-picker-content">
        {!showGifs ? (
          <EmojiPickerReact
            onEmojiClick={onEmojiClick}
            searchDisabled={false}
            skinTonesDisabled
            autoFocusSearch={false}
            emojiStyle={EmojiStyle.NATIVE}
            theme={Theme.AUTO}
            height={300}
            width="100%"
            previewConfig={{
              showPreview: true,
            }}
            searchPlaceHolder="Rechercher un emoji..."
            categories={[
              {
                name: "Récents",
                category: Categories.SUGGESTED
              },
              {
                name: "Émotions",
                category: Categories.SMILEYS_PEOPLE
              },
              {
                name: "Animaux",
                category: Categories.ANIMALS_NATURE
              },
              {
                name: "Nourriture",
                category: Categories.FOOD_DRINK
              },
              {
                name: "Activités",
                category: Categories.ACTIVITIES
              },
              {
                name: "Voyage",
                category: Categories.TRAVEL_PLACES
              },
              {
                name: "Objets",
                category: Categories.OBJECTS
              },
              {
                name: "Symboles",
                category: Categories.SYMBOLS
              },
              {
                name: "Drapeaux",
                category: Categories.FLAGS
              }
            ]}
          />
        ) : (
          <div className="gif-grid">
            {filteredGifs.length > 0 ? (
              filteredGifs.map(gif => (
                <div 
                  className="gif-item"
                  key={gif.id}
                  onClick={() => handleGifSelect(gif.url)}
                >
                  <img src={gif.preview} alt={gif.title} loading="lazy" />
                  <div className="gif-title">{gif.title}</div>
                </div>
              ))
            ) : (
              <div className="gif-no-results">
                Aucun GIF trouvé pour "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiPicker;
