import React from 'react';
import { View, ActivityIndicator } from '@lynx/core';
import { styled } from '@lynx/styled';

const ConteneurChargement = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${props => props.theme.colors.background};
`;

export const Chargement = () => (
  <ConteneurChargement>
    <ActivityIndicator size="large" color={props => props.theme.colors.primary} />
  </ConteneurChargement>
);
