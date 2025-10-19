// Auth0 Configuration
// Replace these with your actual Auth0 values
window.AUTH0_DOMAIN = 'dev-xx542itzll5jbrnr.us.auth0.com';
window.AUTH0_CLIENT_ID = 'TVmGEBZEEZzPmlqBuF453lS7fhZmujfF';
window.AUTH0_AUDIENCE = undefined;

// Hardcoded redirect URIs to match Auth0 configuration exactly
window.AUTH0_REDIRECT_URI_LOGIN = 'https://auctusapp.netlify.app/login.html';
window.AUTH0_REDIRECT_URI_SIGNUP = 'https://auctusapp.netlify.app/signup.html';

// Load Auth0 SDK first, then initialize
async function loadAuth0SDK() {
    return new Promise((resolve, reject) => {
        if (window.auth0) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js';
        script.async = true;
        
        script.onload = () => {
            setTimeout(resolve, 100);
        };
        
        script.onerror = () => {
            reject(new Error('Failed to load Auth0 SDK'));
        };
        
        document.head.appendChild(script);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAuth0SDK();
        
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