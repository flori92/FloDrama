import React from 'react';
import { 
  HybridComponentProvider, 
  HybridComponent, 
  HybridSystemControlPanel, 
  useHybridSystem 
} from '../components/HybridComponentProvider';
import { useHybridComponent } from '../hooks/useHybridComponent';
import { LoadingSpinner } from '../components/ui/loading-spinner';

// Exemple de composant utilisant le système hybride
const HybridButtonExample: React.FC = () => {
  // Utilisation du hook pour obtenir le composant approprié (Lynx ou React)
  const { component: Button, isLynx } = useHybridComponent('Button');
  const { isLynxAvailable, forceReactMode } = useHybridSystem();

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Exemple de Bouton Hybride</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">
          Ce bouton utilise {isLynx ? 'Lynx' : 'React'} pour le rendu.
        </p>
        
        <Button 
          variant="default" 
          size="default" 
          onClick={() => alert(`Bouton cliqué avec ${isLynx ? 'Lynx' : 'React'}`)}
        >
          Cliquez-moi
        </Button>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Statut du système:</p>
        <ul className="list-disc pl-5">
          <li>Lynx disponible: {isLynxAvailable ? 'Oui' : 'Non'}</li>
          <li>Mode React forcé: {forceReactMode ? 'Oui' : 'Non'}</li>
          <li>Framework utilisé: {isLynx ? 'Lynx' : 'React'}</li>
        </ul>
      </div>
    </div>
  );
};

// Exemple utilisant directement le composant HybridComponent
const DirectHybridExample: React.FC = () => {
  // Importations fictives pour l'exemple
  const LynxButton = (props: any) => <button className="lynx-button" {...props}>{props.children}</button>;
  const ReactButton = (props: any) => <button className="react-button" {...props}>{props.children}</button>;
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Exemple Direct de Composant Hybride</h2>
      
      <HybridComponent
        lynxComponent={LynxButton}
        reactComponent={ReactButton}
        componentProps={{
          onClick: () => alert('Bouton cliqué'),
          children: 'Bouton Hybride Direct',
          className: 'px-4 py-2 bg-blue-500 text-white rounded'
        }}
        loadingComponent={<LoadingSpinner size="small" />}
      />
    </div>
  );
};

// Page d'exemple complète
const HybridComponentExample: React.FC = () => {
  return (
    <HybridComponentProvider>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Démonstration du Système Hybride Lynx/React</h1>
        
        <div className="mb-8">
          <HybridSystemControlPanel />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <HybridButtonExample />
          <DirectHybridExample />
        </div>
        
        <div className="mt-8 p-6 bg-gray-100 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Guide d'utilisation</h2>
          
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Utilisation avec useHybridComponent</h3>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
              {`// Obtenir le composant approprié
const { component: Button, isLynx } = useHybridComponent('Button');

// Utiliser comme un composant normal
<Button variant="primary">Mon Bouton</Button>`}
            </pre>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Utilisation directe avec HybridComponent</h3>
            <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
              {`<HybridComponent
  lynxComponent={LynxButton}
  reactComponent={ReactButton}
  componentProps={{
    onClick: () => alert('Clic'),
    children: 'Mon Bouton'
  }}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </HybridComponentProvider>
  );
};

export default HybridComponentExample;
