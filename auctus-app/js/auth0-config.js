// Auth0 Configuration
// These values should be set as environment variables in Netlify
// For local development, update these with your Auth0 application credentials

window.AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'YOUR_AUTH0_DOMAIN';
window.AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || 'YOUR_AUTH0_CLIENT_ID';
window.AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'YOUR_AUTH0_API_IDENTIFIER';

// Load Auth0 SDK
const script = document.createElement('script');
script.src = 'https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js';
script.async = true;
script.defer = true;
document.head.appendChild(script);
