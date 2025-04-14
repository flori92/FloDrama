import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Composant simple pour tester l'environnement
const SimpleComponent: React.FC = () => {
  return <div>Test d'environnement</div>;
};

describe('Test de base', () => {
  test('peut rendre un composant simple', () => {
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('Test d\'environnement')).toBeInTheDocument();
  });
});
