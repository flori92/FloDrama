import React from "react";
import FooterPage from "../FooterPage";

const CommentWatchParty = () => {
  return (
    <FooterPage title="Comment utiliser WatchParty">
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-flodrama-fuchsia mb-4">Qu'est-ce que WatchParty ?</h2>
          <p className="mb-4">
            WatchParty est une fonctionnalité qui vous permet de regarder des films et des séries en même temps que vos amis, même à distance. Vous pouvez discuter en temps réel pendant que vous regardez le même contenu, synchronisé pour tous les participants.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-flodrama-fuchsia mb-4">Comment créer une WatchParty</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <p className="font-semibold">Choisissez un film ou une série</p>
              <p>Naviguez sur FloDrama et sélectionnez le contenu que vous souhaitez regarder avec vos amis.</p>
            </li>
            <li>
              <p className="font-semibold">Créez une WatchParty</p>
              <p>Sur la page de lecture du contenu, cliquez sur le bouton "Créer une WatchParty". Vous serez redirigé vers la page WatchParty avec votre salon créé.</p>
            </li>
            <li>
              <p className="font-semibold">Invitez vos amis</p>
              <p>Partagez le code d'invitation ou le lien direct avec vos amis. Ils pourront rejoindre votre salon en utilisant ce code ou en cliquant sur le lien.</p>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-flodrama-fuchsia mb-4">Comment rejoindre une WatchParty</h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <p className="font-semibold">Via un lien d'invitation</p>
              <p>Si vous avez reçu un lien d'invitation, il vous suffit de cliquer dessus. Vous serez automatiquement dirigé vers la WatchParty.</p>
            </li>
            <li>
              <p className="font-semibold">Via un code d'invitation</p>
              <p>Accédez à la page WatchParty depuis le menu principal, puis entrez le code d'invitation dans la section "Rejoindre une WatchParty".</p>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-flodrama-fuchsia mb-4">Fonctionnalités de WatchParty</h2>
          <ul className="list-disc pl-6 space-y-4">
            <li>
              <p className="font-semibold">Lecture synchronisée</p>
              <p>Lorsque l'hôte met en pause, avance ou recule la vidéo, ces actions sont synchronisées pour tous les participants.</p>
            </li>
            <li>
              <p className="font-semibold">Chat en temps réel</p>
              <p>Discutez avec les autres participants pendant que vous regardez le contenu ensemble.</p>
            </li>
            <li>
              <p className="font-semibold">Liste des participants</p>
              <p>Voyez qui est présent dans votre salon de visionnage.</p>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-flodrama-fuchsia mb-4">Conseils pour une expérience optimale</h2>
          <ul className="list-disc pl-6 space-y-4">
            <li>
              <p>Assurez-vous d'avoir une connexion internet stable pour éviter les problèmes de synchronisation.</p>
            </li>
            <li>
              <p>Si vous rencontrez des problèmes de synchronisation, essayez de rafraîchir la page.</p>
            </li>
            <li>
              <p>Pour une meilleure expérience, utilisez un ordinateur plutôt qu'un appareil mobile.</p>
            </li>
            <li>
              <p>Si vous êtes l'hôte, attendez que tous les participants soient connectés avant de commencer la lecture.</p>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-flodrama-fuchsia mb-4">Questions fréquentes</h2>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Combien de personnes peuvent rejoindre une WatchParty ?</p>
              <p>Il n'y a pas de limite stricte, mais pour une expérience optimale, nous recommandons un maximum de 10 participants.</p>
            </div>
            <div>
              <p className="font-semibold">Que se passe-t-il si je quitte la WatchParty ?</p>
              <p>Vous pouvez rejoindre à nouveau la WatchParty avec le même code d'invitation tant que la session est active.</p>
            </div>
            <div>
              <p className="font-semibold">Est-ce que je peux changer de film pendant une WatchParty ?</p>
              <p>Non, pour changer de contenu, vous devez créer une nouvelle WatchParty.</p>
            </div>
          </div>
        </section>
      </div>
    </FooterPage>
  );
};

export default CommentWatchParty;
