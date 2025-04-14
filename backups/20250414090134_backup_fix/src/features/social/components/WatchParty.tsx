import React, { useEffect, useState, useCallback } from 'react';
import { LynxView, LynxText, LynxButton, LynxScrollView } from '@lynx/core';
import { WatchPartyService } from '../services/WatchPartyService';
import { ChatMessage, PartyMember, SyncState } from '../types';
import { useTheme } from '@lynx/hooks';

interface WatchPartyProps {
  contentId: string;
  userId: string;
  partyId?: string;
  onClose?: () => void;
}

export const WatchParty: React.FC<WatchPartyProps> = ({
  contentId,
  userId,
  partyId,
  onClose
}) => {
  const theme = useTheme();
  const [service] = useState(() => new WatchPartyService());
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [syncState, setSyncState] = useState<SyncState>({
    playing: false,
    timestamp: 0,
    speed: 1
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialisation du service
  useEffect(() => {
    const initializeParty = async () => {
      try {
        await service.configure({
          syncInterval: 1000,
          maxChatHistory: 100,
          sync: {
            tolerance: 500,
            mode: 'flexible',
            maxCatchupDelay: 5000
          },
          chat: {
            maxMessageLength: 500,
            allowedMessageTypes: ['text', 'emoji'],
            autoModeration: true
          }
        });

        if (partyId) {
          await service.joinParty(partyId, userId);
        } else {
          const newPartyId = await service.createParty({
            contentId,
            hostId: userId,
            title: 'Watch Party',
            isPrivate: false
          });
          // Mise à jour de l'URL avec le nouveau partyId
          window.history.pushState({}, '', `?partyId=${newPartyId}`);
        }
      } catch (err) {
        setError("Erreur lors de l'initialisation de la Watch Party");
        console.error(err);
      }
    };

    initializeParty();

    return () => {
      service.leaveParty(userId);
    };
  }, [contentId, userId, partyId]);

  // Gestion des événements du service
  useEffect(() => {
    const handleMemberJoined = (member: PartyMember) => {
      setMembers(prev => [...prev, member]);
    };

    const handleMemberLeft = (member: PartyMember) => {
      setMembers(prev => prev.filter(m => m.id !== member.id));
    };

    const handleChatMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    };

    const handleStateUpdated = (state: SyncState) => {
      setSyncState(state);
    };

    service.events.on('memberJoined', handleMemberJoined);
    service.events.on('memberLeft', handleMemberLeft);
    service.events.on('chatMessage', handleChatMessage);
    service.events.on('stateUpdated', handleStateUpdated);

    return () => {
      service.events.off('memberJoined', handleMemberJoined);
      service.events.off('memberLeft', handleMemberLeft);
      service.events.off('chatMessage', handleChatMessage);
      service.events.off('stateUpdated', handleStateUpdated);
    };
  }, [service]);

  // Envoi d'un message
  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;

    try {
      await service.sendChatMessage({
        id: Date.now().toString(),
        senderId: userId,
        type: 'text',
        content: message,
        timestamp: new Date(),
        status: 'sent'
      });
      setMessage('');
    } catch (err) {
      setError("Erreur lors de l'envoi du message");
      console.error(err);
    }
  }, [message, userId, service]);

  // Mise à jour de l'état de lecture
  const handlePlaybackUpdate = useCallback(async (update: Partial<SyncState>) => {
    try {
      await service.updatePlaybackState(update);
    } catch (err) {
      setError("Erreur lors de la synchronisation");
      console.error(err);
    }
  }, [service]);

  // Invitation d'un ami
  const handleInviteFriend = useCallback(async (friendId: string) => {
    try {
      await service.sendInvitation({
        id: Date.now().toString(),
        senderId: userId,
        recipientId: friendId,
        partyId: partyId!,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'pending'
      });
    } catch (err) {
      setError("Erreur lors de l'envoi de l'invitation");
      console.error(err);
    }
  }, [userId, partyId, service]);

  return (
    <LynxView 
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md
      }}
    >
      {/* En-tête */}
      <LynxView 
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.md
        }}
      >
        <LynxText style={{ fontSize: theme.fontSize.lg, fontWeight: 'bold' }}>
          Watch Party
        </LynxText>
        <LynxButton
          onPress={onClose}
          style={{
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.secondary
          }}
        >
          Fermer
        </LynxButton>
      </LynxView>

      {/* Liste des membres */}
      <LynxView 
        style={{
          marginBottom: theme.spacing.md,
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md
        }}
      >
        <LynxText style={{ marginBottom: theme.spacing.sm }}>
          Participants ({members.length})
        </LynxText>
        <LynxScrollView horizontal>
          {members.map(member => (
            <LynxView 
              key={member.id}
              style={{
                marginRight: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: member.role === 'host' 
                  ? theme.colors.primary 
                  : theme.colors.surface,
                borderRadius: theme.radius.sm
              }}
            >
              <LynxText>
                {member.id} {member.role === 'host' ? '(Hôte)' : ''}
              </LynxText>
            </LynxView>
          ))}
        </LynxScrollView>
      </LynxView>

      {/* Chat */}
      <LynxView 
        style={{
          flex: 1,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          padding: theme.spacing.sm,
          marginBottom: theme.spacing.md
        }}
      >
        <LynxScrollView>
          {messages.map(msg => (
            <LynxView 
              key={msg.id}
              style={{
                marginBottom: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: msg.senderId === userId 
                  ? theme.colors.primary 
                  : theme.colors.secondary,
                borderRadius: theme.radius.sm,
                alignSelf: msg.senderId === userId ? 'flex-end' : 'flex-start'
              }}
            >
              <LynxText style={{ color: theme.colors.onPrimary }}>
                {msg.content}
              </LynxText>
              <LynxText 
                style={{ 
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.onPrimary,
                  opacity: 0.8
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString()}
              </LynxText>
            </LynxView>
          ))}
        </LynxScrollView>

        {/* Zone de saisie */}
        <LynxView 
          style={{
            flexDirection: 'row',
            marginTop: theme.spacing.sm
          }}
        >
          <LynxTextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Votre message..."
            style={{
              flex: 1,
              marginRight: theme.spacing.sm,
              padding: theme.spacing.sm,
              backgroundColor: theme.colors.background,
              borderRadius: theme.radius.sm
            }}
          />
          <LynxButton
            onPress={handleSendMessage}
            style={{
              padding: theme.spacing.sm,
              backgroundColor: theme.colors.primary
            }}
          >
            Envoyer
          </LynxButton>
        </LynxView>
      </LynxView>

      {/* Contrôles de lecture */}
      <LynxView 
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md
        }}
      >
        <LynxButton
          onPress={() => handlePlaybackUpdate({ playing: !syncState.playing })}
          style={{
            marginRight: theme.spacing.md,
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.primary
          }}
        >
          {syncState.playing ? 'Pause' : 'Lecture'}
        </LynxButton>
        <LynxButton
          onPress={() => handleInviteFriend('ami-id')}
          style={{
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.secondary
          }}
        >
          Inviter un ami
        </LynxButton>
      </LynxView>

      {/* Affichage des erreurs */}
      {error && (
        <LynxView 
          style={{
            marginTop: theme.spacing.md,
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.error,
            borderRadius: theme.radius.sm
          }}
        >
          <LynxText style={{ color: theme.colors.onError }}>
            {error}
          </LynxText>
        </LynxView>
      )}
    </LynxView>
  );
};
