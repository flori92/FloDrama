/**
 * Adaptateur pour react-native-gifted-chat
 * Fournit des composants simulant l'interface de chat pour une utilisation dans un environnement web
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from './react-native-adapter';

// Composant Bubble pour afficher les bulles de message
export const Bubble = ({ 
  currentMessage, 
  position, 
  nextMessage, 
  previousMessage,
  renderTime,
  renderTicks,
  renderUsername,
  ...props 
}) => {
  const isUser = position === 'right';
  
  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        backgroundColor: isUser ? '#3f51b5' : '#f0f0f0',
        borderRadius: 15,
        marginBottom: 10,
        marginLeft: isUser ? 50 : 0,
        marginRight: isUser ? 0 : 50,
        padding: 10,
        maxWidth: '80%',
      }}
    >
      {renderUsername && currentMessage.user && currentMessage.user.name && !isUser && (
        <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 12 }}>
          {currentMessage.user.name}
        </Text>
      )}
      
      <Text style={{ color: isUser ? 'white' : 'black' }}>
        {currentMessage.text}
      </Text>
      
      {renderTime && (
        <Text style={{ fontSize: 10, color: isUser ? 'rgba(255,255,255,0.7)' : 'gray', alignSelf: 'flex-end', marginTop: 5 }}>
          {new Date(currentMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
};

// Composant Send pour le bouton d'envoi
export const Send = ({ text, onSend, ...props }) => {
  return (
    <TouchableOpacity
      style={{
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: text ? '#3f51b5' : '#cccccc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 5,
      }}
      disabled={!text}
      onPress={() => {
        if (text && onSend) {
          onSend({ text }, true);
        }
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold' }}>➤</Text>
    </TouchableOpacity>
  );
};

// Composant SystemMessage pour les messages système
export const SystemMessage = ({ currentMessage, ...props }) => {
  if (!currentMessage || !currentMessage.text) return null;
  
  return (
    <View
      style={{
        alignItems: 'center',
        marginVertical: 10,
      }}
    >
      <Text
        style={{
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: 10,
          color: '#666',
          fontSize: 12,
          fontWeight: '400',
          padding: 5,
          paddingHorizontal: 10,
        }}
      >
        {currentMessage.text}
      </Text>
    </View>
  );
};

// Composant InputToolbar pour la barre de saisie
export const InputToolbar = ({ 
  composerHeight,
  onSend,
  text,
  onTextChanged,
  renderSend,
  ...props 
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
      }}
    >
      <TextInput
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: '#e0e0e0',
          borderRadius: 20,
          paddingHorizontal: 15,
          paddingVertical: 8,
          marginRight: 10,
          backgroundColor: 'white',
        }}
        placeholder="Tapez un message..."
        value={text}
        onChangeText={onTextChanged}
        multiline={true}
        numberOfLines={1}
      />
      
      {renderSend && renderSend({ text, onSend })}
    </View>
  );
};

// Composant principal GiftedChat
export const GiftedChat = ({
  messages = [],
  onSend,
  user,
  renderBubble,
  renderSend,
  renderSystemMessage,
  renderInputToolbar,
  renderTime,
  renderDay,
  ...props
}) => {
  const [text, setText] = useState('');
  
  const handleSend = (messages = []) => {
    if (onSend) {
      onSend(messages);
    }
    setText('');
  };
  
  const renderMessage = (message, index) => {
    const position = message.user._id === user._id ? 'right' : 'left';
    const showUsername = position === 'left';
    
    if (message.system) {
      return renderSystemMessage ? 
        renderSystemMessage({ currentMessage: message }) : 
        <SystemMessage key={`system_${index}`} currentMessage={message} />;
    }
    
    return renderBubble ? 
      renderBubble({ 
        currentMessage: message, 
        position, 
        renderUsername: showUsername,
        renderTime: true,
      }) : 
      <Bubble 
        key={`bubble_${index}`}
        currentMessage={message} 
        position={position}
        renderUsername={showUsername}
        renderTime={true}
      />;
  };
  
  return (
    <View style={{ flex: 1, height: '100%' }}>
      <ScrollView 
        style={{ flex: 1, padding: 10 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
      >
        {messages.map((message, index) => renderMessage(message, index))}
      </ScrollView>
      
      {renderInputToolbar ? 
        renderInputToolbar({
          text,
          onTextChanged: setText,
          onSend: handleSend,
          renderSend: props => renderSend ? 
            renderSend(props) : 
            <Send {...props} />
        }) : 
        <InputToolbar
          text={text}
          onTextChanged={setText}
          onSend={handleSend}
          renderSend={props => renderSend ? 
            renderSend(props) : 
            <Send {...props} />
          }
        />
      }
    </View>
  );
};

// Exporter un objet avec toutes les fonctionnalités
const GiftedChatAdapter = {
  GiftedChat,
  Bubble,
  Send,
  SystemMessage,
  InputToolbar
};

export default GiftedChatAdapter;
