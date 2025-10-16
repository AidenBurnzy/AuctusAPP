// Auth0 Configuration
// These values are injected by Netlify at build time or via environment variables
// For local development, these should be set in your environment

// Load Auth0 SDK first, then initialize
async function loadAuth0SDK() {
    return new Promise((resolve, reject) => {
        // Check if Auth0 SDK is already loaded
        if (window.auth0) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js';
        script.async = true;
        
        script.onload = () => {
            // Give it a moment to fully initialize
            setTimeout(resolve, 100);
        };
        
        script.onerror = () => {
            reject(new Error('Failed to load Auth0 SDK'));
        };
        
        document.head.appendChild(script);
    });
}

// Initialize Auth0 configuration from meta tags or window variables
function initializeAuth0Config() {
    // Try to get from meta tags first (if injected by Netlify)
    const domainMeta = document.querySelector('meta[name="auth0-domain"]');
    const clientIdMeta = document.querySelector('meta[name="auth0-client-id"]');
    const audienceMeta = document.querySelector('meta[name="auth0-audience"]');
    
    window.AUTH0_DOMAIN = domainMeta?.content || window.AUTH0_DOMAIN || 'YOUR_AUTH0_DOMAIN';
    window.AUTH0_CLIENT_ID = clientIdMeta?.content || window.AUTH0_CLIENT_ID || 'YOUR_AUTH0_CLIENT_ID';
    window.AUTH0_AUDIENCE = audienceMeta?.content || window.AUTH0_AUDIENCE || 'YOUR_AUTH0_API_IDENTIFIER';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAuth0SDK();
        initializeAuth0Config();
        
        // Now initialize Auth0 in auth.js
        if (typeof initializeAuth0 === 'function') {
            await initializeAuth0();
        }
    } catch (error) {
        console.error('Error loading Auth0:', error);
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) {
            errorMsg.textContent = 'Failed to load authentication. Please refresh the page.';
            errorMsg.style.display = 'block';
        }
    }
});
