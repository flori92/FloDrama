// Composant Footer pour FloDrama
// Implémente le pied de page avec liens et informations légales

export const footer = `
// Fonction pour créer le footer
function createFooter() {
  const footer = createElementWithHTML('footer', { 
    class: 'footer',
    style: 'background-color: #1A1926; padding: 3rem 0; margin-top: 2rem;'
  });
  
  const footerContainer = createElementWithHTML('div', { 
    class: 'footer-container',
    style: 'max-width: 1440px; margin: 0 auto; padding: 0 2rem;'
  });
  
  // Logo et description
  const footerBrand = createElementWithHTML('div', { 
    class: 'footer-brand',
    style: 'margin-bottom: 2rem;'
  });
  
  // Logo avec dégradé
  const footerLogo = createElementWithHTML('div', { 
    class: 'footer-logo',
    style: 'display: flex; align-items: center; margin-bottom: 1rem;'
  });
  
  const logoText = createElementWithHTML('h2', { 
    class: 'logo-text',
    style: 'font-size: 1.5rem; font-weight: bold; background: linear-gradient(to right, #3b82f6, #d946ef); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin: 0;'
  }, 'FloDrama');
  
  footerLogo.appendChild(logoText);
  
  // Description
  const footerDescription = createElementWithHTML('p', { 
    class: 'footer-description',
    style: 'color: rgba(255, 255, 255, 0.7); max-width: 400px;'
  }, 'FloDrama est votre plateforme de streaming dédiée aux films, séries, animés et productions asiatiques. Découvrez un monde de divertissement sans limites.');
  
  footerBrand.appendChild(footerLogo);
  footerBrand.appendChild(footerDescription);
  
  // Sections de liens
  const footerLinks = createElementWithHTML('div', { 
    class: 'footer-links',
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-bottom: 2rem;'
  });
  
  // Sections
  const linkSections = [
    {
      title: 'Navigation',
      links: [
        { text: 'Accueil', href: '/' },
        { text: 'Dramas', href: '/dramas' },
        { text: 'Films', href: '/films' },
        { text: 'Animés', href: '/animes' },
        { text: 'Bollywood', href: '/bollywood' }
      ]
    },
    {
      title: 'Compte',
      links: [
        { text: 'Mon Compte', href: '/account' },
        { text: 'Ma Liste', href: '/my-list' },
        { text: 'Historique', href: '/history' },
        { text: 'Paramètres', href: '/settings' },
        { text: 'Aide', href: '/help' }
      ]
    },
    {
      title: 'Légal',
      links: [
        { text: 'Conditions d\\'utilisation', href: '/terms' },
        { text: 'Politique de confidentialité', href: '/privacy' },
        { text: 'Cookies', href: '/cookies' },
        { text: 'Mentions légales', href: '/legal' },
        { text: 'RGPD', href: '/gdpr' }
      ]
    },
    {
      title: 'Contact',
      links: [
        { text: 'Support', href: '/support' },
        { text: 'Nous contacter', href: '/contact' },
        { text: 'FAQ', href: '/faq' },
        { text: 'Signaler un problème', href: '/report' },
        { text: 'Partenariats', href: '/partners' }
      ]
    }
  ];
  
  // Créer chaque section
  linkSections.forEach(section => {
    const linkSection = createElementWithHTML('div', { 
      class: 'footer-link-section'
    });
    
    // Titre de la section
    const sectionTitle = createElementWithHTML('h3', { 
      class: 'footer-section-title',
      style: 'color: white; font-size: 1.1rem; margin-bottom: 1rem;'
    }, section.title);
    
    // Liste de liens
    const linkList = createElementWithHTML('ul', { 
      class: 'footer-link-list',
      style: 'list-style: none; padding: 0; margin: 0;'
    });
    
    // Créer chaque lien
    section.links.forEach(link => {
      const listItem = createElementWithHTML('li', { 
        class: 'footer-link-item',
        style: 'margin-bottom: 0.5rem;'
      });
      
      const linkElement = createElementWithHTML('a', { 
        href: link.href,
        class: 'footer-link',
        style: 'color: rgba(255, 255, 255, 0.7); text-decoration: none; transition: color 0.3s ease;'
      }, link.text);
      
      // Ajouter l'événement de survol
      linkElement.addEventListener('mouseover', function() {
        this.style.color = '#d946ef';
      });
      
      linkElement.addEventListener('mouseout', function() {
        this.style.color = 'rgba(255, 255, 255, 0.7)';
      });
      
      listItem.appendChild(linkElement);
      linkList.appendChild(listItem);
    });
    
    linkSection.appendChild(sectionTitle);
    linkSection.appendChild(linkList);
    
    footerLinks.appendChild(linkSection);
  });
  
  // Copyright et réseaux sociaux
  const footerBottom = createElementWithHTML('div', { 
    class: 'footer-bottom',
    style: 'display: flex; justify-content: space-between; align-items: center; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.1);'
  });
  
  // Copyright
  const copyright = createElementWithHTML('div', { 
    class: 'copyright',
    style: 'color: rgba(255, 255, 255, 0.5); font-size: 0.9rem;'
  }, ' ' + new Date().getFullYear() + ' FloDrama. Tous droits réservés.');
  
  // Réseaux sociaux
  const socialLinks = createElementWithHTML('div', { 
    class: 'social-links',
    style: 'display: flex; gap: 1rem;'
  });
  
  // Icônes de réseaux sociaux
  const socialIcons = [
    { icon: '', label: 'Twitter', href: 'https://twitter.com/flodrama' },
    { icon: '', label: 'Instagram', href: 'https://instagram.com/flodrama' },
    { icon: '', label: 'Facebook', href: 'https://facebook.com/flodrama' },
    { icon: '', label: 'YouTube', href: 'https://youtube.com/flodrama' }
  ];
  
  // Créer chaque icône
  socialIcons.forEach(social => {
    const socialLink = createElementWithHTML('a', { 
      href: social.href,
      'aria-label': social.label,
      class: 'social-link',
      style: 'color: rgba(255, 255, 255, 0.7); text-decoration: none; font-size: 1.2rem; transition: color 0.3s ease;'
    }, social.icon);
    
    // Ajouter l'événement de survol
    socialLink.addEventListener('mouseover', function() {
      this.style.color = '#d946ef';
    });
    
    socialLink.addEventListener('mouseout', function() {
      this.style.color = 'rgba(255, 255, 255, 0.7)';
    });
    
    socialLinks.appendChild(socialLink);
  });
  
  footerBottom.appendChild(copyright);
  footerBottom.appendChild(socialLinks);
  
  // Assembler le footer
  footerContainer.appendChild(footerBrand);
  footerContainer.appendChild(footerLinks);
  footerContainer.appendChild(footerBottom);
  
  footer.appendChild(footerContainer);
  
  return footer;
}
`;
