// Ajoutez un gestionnaire d'erreur pour les images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.onerror = function() {
            console.log(`Image de remplacement chargée pour ${this.src}`);
            this.src = 'images/placeholder.jpg';
        };
    });
}); 