// Auth0 Configuration
// Replace these with your actual Auth0 values
window.AUTH0_DOMAIN = 'dev-xx542itzll5jbrnr.us.auth0.com';  // ← Paste your domain here
window.AUTH0_CLIENT_ID = 'TVmGEBZEEZzPmlqBuF453lS7fhZmujfF';       // ← Paste your client ID here
window.AUTH0_AUDIENCE = undefined; // We're skipping this for now

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
            setTimeout(resolve, 100);
        };
        
        script.onerror = () => {
            reject(new Error('Failed to load Auth0 SDK'));
        };
        
        document.head.appendChild(script);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAuth0SDK();
        
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