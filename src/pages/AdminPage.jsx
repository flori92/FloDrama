/**
 * AdminPage
 * 
 * Page d'administration de FloDrama
 * Permet de gérer les fonctionnalités avancées comme le scraping
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import ScrapingManager from '../components/admin/ScrapingManager';

// Styles
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.header`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #fff;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #ccc;
  font-size: 1rem;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid #333;
`;

const Tab = styled.button`
  background-color: transparent;
  color: ${props => props.active ? '#fff' : '#999'};
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: ${props => props.active ? '#8e24aa' : 'transparent'};
    transition: background-color 0.2s;
  }
  
  &:hover {
    color: #fff;
  }
`;

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('scraping');
  
  // Animation pour les sections
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5
      }
    }
  };
  
  // Rendu du contenu en fonction de l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case 'scraping':
        return <ScrapingManager />;
      case 'metadata':
        return (
          <div>
            <h2>Gestion des Métadonnées</h2>
            <p>Cette fonctionnalité sera disponible prochainement.</p>
          </div>
        );
      case 'users':
        return (
          <div>
            <h2>Gestion des Utilisateurs</h2>
            <p>Cette fonctionnalité sera disponible prochainement.</p>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h2>Paramètres</h2>
            <p>Cette fonctionnalité sera disponible prochainement.</p>
          </div>
        );
      default:
        return <ScrapingManager />;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Container>
        <Header>
          <Title>Administration FloDrama</Title>
          <Subtitle>Gérez les fonctionnalités avancées de votre plateforme</Subtitle>
        </Header>
        
        <TabsContainer>
          <Tab 
            active={activeTab === 'scraping'} 
            onClick={() => setActiveTab('scraping')}
          >
            Scraping
          </Tab>
          <Tab 
            active={activeTab === 'metadata'} 
            onClick={() => setActiveTab('metadata')}
          >
            Métadonnées
          </Tab>
          <Tab 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')}
          >
            Utilisateurs
          </Tab>
          <Tab 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
          >
            Paramètres
          </Tab>
        </TabsContainer>
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {renderContent()}
        </motion.div>
      </Container>
    </div>
  );
};

export default AdminPage;
