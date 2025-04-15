/**
 * Point d'entrée principal de l'application FloDrama
 * Ce fichier sert de wrapper pour main.jsx afin d'éviter les problèmes de MIME type
 * sur GitHub Pages et autres plateformes de déploiement
 */

// Import dynamique du fichier main.jsx pour éviter les problèmes de MIME type
import('./main.jsx')
  .then(() => {
    console.log('Application FloDrama chargée avec succès');
  })
  .catch(error => {
    console.error('Erreur lors du chargement de l\'application FloDrama:', error);
    
    // Afficher un message d'erreur visible pour l'utilisateur en cas d'échec
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          font-family: 'SF Pro Display', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
          background-color: #121118;
          padding: 20px;
          border-radius: 8px;
          margin: 50px auto;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        ">
          <div style="
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
          ">FD</div>
          <h2 style="
            margin-top: 0;
            font-size: 28px;
            background: linear-gradient(to right, #3b82f6, #d946ef);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">Erreur de chargement</h2>
          <p>Impossible de charger les modules JavaScript nécessaires pour FloDrama.</p>
          <p style="
            font-family: monospace;
            background: rgba(0,0,0,0.2);
            padding: 10px;
            border-radius: 4px;
            text-align: left;
            overflow-wrap: break-word;
          ">
            ${error.message}
          </p>
          <p>Veuillez vérifier votre connexion internet et rafraîchir la page.</p>
          <button onclick="window.location.reload()" style="
            background: linear-gradient(to right, #3b82f6, #d946ef);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 20px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(217, 70, 239, 0.4)';" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            Rafraîchir la page
          </button>
        </div>
      `;
    }
  });
