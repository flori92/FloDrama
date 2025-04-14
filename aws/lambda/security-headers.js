'use strict';

/**
 * Fonction Lambda@Edge pour ajouter des en-têtes de sécurité aux réponses CloudFront
 * 
 * Cette fonction sera associée à l'événement "origin-response" de CloudFront
 * pour ajouter des en-têtes de sécurité à toutes les réponses.
 */
exports.handler = (event, context, callback) => {
    // Récupérer la réponse de l'origine
    const response = event.Records[0].cf.response;
    const headers = response.headers;

    // Ajouter l'en-tête Strict-Transport-Security (HSTS)
    // Cet en-tête indique aux navigateurs d'utiliser HTTPS exclusivement pendant un an
    headers['strict-transport-security'] = [{
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
    }];

    // Ajouter l'en-tête Content-Security-Policy (CSP)
    // Cet en-tête définit les sources autorisées pour le contenu de la page
    headers['content-security-policy'] = [{
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.cloudfront.net; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.amazonaws.com; media-src 'self' https://*.cloudfront.net; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    }];

    // Ajouter l'en-tête X-Content-Type-Options
    // Cet en-tête empêche le navigateur de deviner le type MIME d'un fichier
    headers['x-content-type-options'] = [{
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    }];

    // Ajouter l'en-tête X-Frame-Options
    // Cet en-tête empêche le site d'être affiché dans un iframe
    headers['x-frame-options'] = [{
        key: 'X-Frame-Options',
        value: 'DENY'
    }];

    // Ajouter l'en-tête X-XSS-Protection
    // Cet en-tête active la protection XSS du navigateur
    headers['x-xss-protection'] = [{
        key: 'X-XSS-Protection',
        value: '1; mode=block'
    }];

    // Ajouter l'en-tête Referrer-Policy
    // Cet en-tête contrôle les informations de référence envoyées lors de la navigation
    headers['referrer-policy'] = [{
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
    }];

    // Ajouter l'en-tête Permissions-Policy
    // Cet en-tête limite les fonctionnalités du navigateur que le site peut utiliser
    headers['permissions-policy'] = [{
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    }];

    // Renvoyer la réponse modifiée
    callback(null, response);
};
