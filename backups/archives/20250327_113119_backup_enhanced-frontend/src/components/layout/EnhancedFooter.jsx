import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Heart } from 'lucide-react';

/**
 * Pied de page amélioré pour FloDrama
 * Contient les liens utiles, les réseaux sociaux et les informations légales
 */
const EnhancedFooter = () => {
  // Année actuelle pour le copyright
  const currentYear = new Date().getFullYear();
  
  // Liens du pied de page
  const footerLinks = [
    {
      title: 'FloDrama',
      links: [
        { label: 'À propos', path: '/about' },
        { label: 'Nous contacter', path: '/contact' },
        { label: 'Carrières', path: '/careers' },
        { label: 'Blog', path: '/blog' }
      ]
    },
    {
      title: 'Aide',
      links: [
        { label: 'FAQ', path: '/faq' },
        { label: 'Appareils compatibles', path: '/devices' },
        { label: 'Conditions d\'utilisation', path: '/terms' },
        { label: 'Confidentialité', path: '/privacy' }
      ]
    },
    {
      title: 'Contenu',
      links: [
        { label: 'Dramas', path: '/dramas' },
        { label: 'Films', path: '/films' },
        { label: 'Anime', path: '/anime' },
        { label: 'Nouveautés', path: '/new' }
      ]
    }
  ];
  
  // Réseaux sociaux
  const socialLinks = [
    { icon: <Facebook size={20} />, label: 'Facebook', url: 'https://facebook.com/flodrama' },
    { icon: <Twitter size={20} />, label: 'Twitter', url: 'https://twitter.com/flodrama' },
    { icon: <Instagram size={20} />, label: 'Instagram', url: 'https://instagram.com/flodrama' },
    { icon: <Youtube size={20} />, label: 'YouTube', url: 'https://youtube.com/flodrama' }
  ];
  
  return (
    <footer
      style={{
        backgroundColor: '#0a0a0a',
        color: '#999',
        padding: '60px 40px 40px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {/* Logo et tagline */}
        <div style={{ marginBottom: '40px' }}>
          <h2
            style={{
              margin: '0 0 10px 0',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#E50914'
            }}
          >
            FloDrama
          </h2>
          <p style={{ margin: 0, fontSize: '14px' }}>
            La meilleure plateforme de streaming de dramas asiatiques en France
          </p>
        </div>
        
        {/* Liens principaux */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: '40px'
          }}
        >
          {footerLinks.map((section, index) => (
            <div key={index} style={{ marginBottom: '30px', minWidth: '200px' }}>
              <h3
                style={{
                  margin: '0 0 15px 0',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'white'
                }}
              >
                {section.title}
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0
                }}
              >
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex} style={{ marginBottom: '10px' }}>
                    <Link
                      to={link.path}
                      style={{
                        color: '#999',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                      onMouseOut={(e) => e.currentTarget.style.color = '#999'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Newsletter */}
          <div style={{ marginBottom: '30px', minWidth: '250px' }}>
            <h3
              style={{
                margin: '0 0 15px 0',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              Newsletter
            </h3>
            <p style={{ fontSize: '14px', marginBottom: '15px' }}>
              Recevez les dernières nouveautés et mises à jour
            </p>
            <form
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <input
                type="email"
                placeholder="Votre email"
                style={{
                  padding: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px',
                  backgroundColor: '#E50914',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F40D17'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#E50914'}
              >
                S'abonner
              </button>
            </form>
          </div>
        </div>
        
        {/* Réseaux sociaux */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '20px',
            marginBottom: '40px'
          }}
        >
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                color: 'white',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#E50914';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              aria-label={social.label}
            >
              {social.icon}
            </a>
          ))}
        </div>
        
        {/* Informations légales et copyright */}
        <div
          style={{
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '20px',
            fontSize: '12px'
          }}
        >
          <p style={{ margin: '0 0 10px 0' }}>
            &copy; {currentYear} FloDrama. Tous droits réservés.
          </p>
          <p style={{ margin: 0 }}>
            Conçu avec <Heart size={12} color="#E50914" style={{ verticalAlign: 'middle', display: 'inline' }} /> en France
          </p>
        </div>
        
        {/* Informations de contact */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Mail size={12} style={{ verticalAlign: 'middle' }} />
          <a
            href="mailto:contact@flodrama.com"
            style={{
              color: '#999',
              textDecoration: 'none'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'white'}
            onMouseOut={(e) => e.currentTarget.style.color = '#999'}
          >
            contact@flodrama.com
          </a>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
