import React from 'react';
import { View, TouchableOpacity, Text } from '@lynx/core';
import { styled } from '@lynx/styled';
import { useTheme } from '@lynx/hooks';
import { useNavigation } from '@lynx/navigation';

const ConteneurBarre = styled(View)`
  height: 60px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${props => props.theme.colors.surface};
  padding: 0 16px;
`;

const BoutonNav = styled(TouchableOpacity)`
  padding: 8px 16px;
  border-radius: 8px;
  background-color: ${props => props.active ? props.theme.colors.primary : 'transparent'};
`;

const TexteBouton = styled(Text)`
  color: ${props => props.active ? '#ffffff' : props.theme.colors.text};
  font-size: 16px;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
`;

export const BarreNavigation = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [routeActive, setRouteActive] = React.useState('accueil');

  const routes = [
    { id: 'accueil', titre: 'Accueil' },
    { id: 'dramas', titre: 'Dramas' },
    { id: 'films', titre: 'Films' },
    { id: 'favoris', titre: 'Favoris' }
  ];

  const naviguerVers = (route) => {
    setRouteActive(route.id);
    navigation.navigate(route.id);
  };

  return (
    <ConteneurBarre>
      {routes.map(route => (
        <BoutonNav
          key={route.id}
          active={routeActive === route.id}
          onPress={() => naviguerVers(route)}
        >
          <TexteBouton active={routeActive === route.id}>
            {route.titre}
          </TexteBouton>
        </BoutonNav>
      ))}
    </ConteneurBarre>
  );
};
