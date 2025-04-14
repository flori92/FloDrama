# Documentation de la Fonctionnalité Watch Party

## Vue d'ensemble

La fonctionnalité Watch Party permet aux utilisateurs de FloDrama de regarder des dramas ensemble en synchronisant leur lecture vidéo et en discutant en temps réel. Cette fonctionnalité est exclusivement disponible pour les abonnés Ultimate.

## Table des matières

1. [Fonctionnalités principales](#fonctionnalités-principales)
2. [Architecture technique](#architecture-technique)
3. [Composants](#composants)
4. [Services](#services)
5. [Utilisation](#utilisation)
6. [Restrictions et limitations](#restrictions-et-limitations)
7. [Dépannage](#dépannage)
8. [Évolutions futures](#évolutions-futures)

## Fonctionnalités principales

- **Création de soirées de visionnage** : Les utilisateurs peuvent créer des soirées de visionnage pour n'importe quel drama disponible sur la plateforme.
- **Invitation d'amis** : Possibilité d'inviter des amis via un lien de partage.
- **Chat en temps réel** : Discussion instantanée pendant le visionnage.
- **Synchronisation vidéo** : La lecture vidéo est synchronisée entre tous les participants.
- **Timestamps cliquables** : Les utilisateurs peuvent partager des moments précis du drama en insérant des timestamps dans leurs messages.
- **Gestion des participants** : Visualisation des participants actifs et de leur statut.

## Architecture technique

La fonctionnalité Watch Party repose sur une architecture client-serveur utilisant WebSocket pour les communications en temps réel :

```
┌─────────────┐      ┌───────────────┐      ┌────────────────┐
│ Interface   │      │ Service       │      │ Serveur        │
│ Utilisateur │<────>│ WatchParty    │<────>│ WebSocket      │
└─────────────┘      └───────────────┘      └────────────────┘
       │                     │                      │
       │                     │                      │
       ▼                     ▼                      ▼
┌─────────────┐      ┌───────────────┐      ┌────────────────┐
│ Composants  │      │ Gestionnaire  │      │ Base de        │
│ React       │<────>│ d'événements  │<────>│ données        │
└─────────────┘      └───────────────┘      └────────────────┘
```

## Composants

### WatchPartyContainer
Composant principal qui orchestre tous les sous-composants de la Watch Party.

### WatchPartyChat
Interface de chat utilisant react-native-gifted-chat pour une expérience utilisateur optimale.

### WatchPartyMessage
Composant personnalisé pour afficher les messages avec des timestamps cliquables.

### WatchPartyInvite
Gère le partage de liens d'invitation et la copie dans le presse-papiers.

### WatchPartyParticipants
Affiche la liste des participants avec leur statut (en ligne, hors ligne, etc.).

### WatchPartySettings
Permet de configurer les paramètres de la Watch Party (privée/publique, etc.).

## Services

### WatchPartyService
Service principal qui gère la connexion WebSocket et les événements associés :

- Connexion/déconnexion à une Watch Party
- Envoi et réception de messages
- Synchronisation de la position vidéo
- Gestion des participants
- Notifications d'événements

## Utilisation

### Création d'une Watch Party

1. Accéder à la page "Watch Party" depuis le menu principal
2. Cliquer sur "Créer une Watch Party"
3. Sélectionner un drama et définir un titre pour la soirée
4. Configurer les paramètres (privée/publique)
5. Cliquer sur "Créer"

### Rejoindre une Watch Party

1. Via la liste des Watch Parties publiques :
   - Accéder à la page "Watch Party"
   - Sélectionner une soirée dans la liste
   - Cliquer sur "Rejoindre"

2. Via un lien d'invitation :
   - Cliquer sur le lien reçu
   - L'application s'ouvre automatiquement sur la bonne soirée

### Utilisation du chat

- Envoyer des messages texte dans la zone de saisie
- Insérer un timestamp en utilisant le format `[MM:SS]` ou `[HH:MM:SS]`
- Cliquer sur un timestamp pour synchroniser la vidéo à ce moment précis

### Synchronisation vidéo

- La vidéo est automatiquement synchronisée entre tous les participants
- L'hôte peut contrôler la lecture (pause, lecture, avance rapide)
- Les participants peuvent demander une synchronisation manuelle

## Restrictions et limitations

- **Exclusivité Ultimate** : Fonctionnalité réservée aux abonnés Ultimate
- **Nombre de participants** : Limité à 10 participants par Watch Party
- **Types de contenu** : Disponible uniquement pour les dramas (pas pour les films ou autres contenus)
- **Bande passante** : Une connexion internet stable est recommandée

## Dépannage

### Problèmes courants

1. **Impossible de rejoindre une Watch Party**
   - Vérifier que vous avez un abonnement Ultimate actif
   - Vérifier votre connexion internet
   - Essayer de rafraîchir la page

2. **Chat non synchronisé**
   - Vérifier que vous êtes bien connecté au serveur WebSocket
   - Rafraîchir la page pour rétablir la connexion

3. **Vidéo non synchronisée**
   - Cliquer sur le bouton "Synchroniser" dans les contrôles vidéo
   - Vérifier que vous n'avez pas de problème de connexion

### Contact support

Si vous rencontrez des problèmes persistants, contactez notre support technique à support@flodrama.com en précisant :
- Votre identifiant utilisateur
- L'identifiant de la Watch Party
- Une description détaillée du problème
- Captures d'écran si possible

## Évolutions futures

- Intégration de réactions rapides (émojis)
- Partage d'images dans le chat
- Sondages et votes en direct
- Annotations vidéo
- Mode "cinéma" avec avatars virtuels
- Intégration avec les réseaux sociaux
