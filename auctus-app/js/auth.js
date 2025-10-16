// Auctus Auth0 Authentication System

let auth0Client = null;

// Initialize Auth0
async function initializeAuth0() {
    try {
        auth0Client = await window.auth0.createAuth0Client({
            domain: window.AUTH0_DOMAIN,
            clientId: window.AUTH0_CLIENT_ID,
            redirect_uri: window.location.origin,
            audience: window.AUTH0_AUDIENCE || undefined,
            useRefreshTokens: true,
            cacheLocation: 'localstorage'
        });

        // Handle redirect from Auth0
        const query = window.location.search;
        if (query.includes('code=') && query.includes('state=')) {
            try {
                await auth0Client.handleRedirectCallback();
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // User is authenticated, proceed with profile sync and redirect
                await handlePostLoginFlow();
            } catch (error) {
                console.error('Error handling redirect:', error);
                showError('Authentication failed. Please try again.');
            }
        } else {
            // Check if already authenticated
            const isAuthenticated = await auth0Client.isAuthenticated();
            if (isAuthenticated) {
                await handlePostLoginFlow();
            }
        }

        // Set up login button
        const loginButton = document.getElementById('auth0-login');
        if (loginButton) {
            loginButton.addEventListener('click', async () => {
                await auth0Client.loginWithRedirect({
                    screen_hint: 'login'
                });
            });
        }
    } catch (error) {
        console.error('Error initializing Auth0:', error);
        showError('Failed to initialize authentication. Please refresh the page.');
    }
}

// Handle post-login flow: sync user with Neon DB
async function handlePostLoginFlow() {
    try {
        const user = await auth0Client.getUser();
        const token = await auth0Client.getTokenSilently();

        // Sync user with Neon database
        const response = await fetch('/.netlify/functions/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                auth0_id: user.sub,
                email: user.email,
                firstName: user.given_name || user.nickname || '',
                lastName: user.family_name || '',
                picture: user.picture || null
            })
        });

        if (!response.ok) {
            throw new Error('Failed to sync user profile');
        }

        // Get user profile from database to check role
        const profileResponse = await fetch(`/.netlify/functions/users?auth0_id=${user.sub}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to retrieve user profile');
        }

        const userProfile = await profileResponse.json();

        // Store authentication info in localStorage
        localStorage.setItem('auth0_token', token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', userProfile.role || 'user');
        localStorage.setItem('currentUserId', user.sub);
        localStorage.setItem('username', `${user.given_name || ''} ${user.family_name || ''}`.trim());
        localStorage.setItem('userEmail', user.email);

        // Add login animation
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.style.animation = 'slideDown 0.5s ease-in forwards';
        }

        // Redirect based on role after animation
        setTimeout(() => {
            const role = userProfile.role || 'user';
            if (role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'general-dashboard.html';
            }
        }, 500);
    } catch (error) {
        console.error('Error in post-login flow:', error);
        showError('Failed to complete authentication. Please try again.');
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        // Shake animation
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.style.animation = 'shake 0.5s';
            setTimeout(() => {
                loginCard.style.animation = '';
            }, 500);
        }
    }
}

// Logout function
async function logout() {
    if (auth0Client) {
        localStorage.removeItem('auth0_token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('username');
        localStorage.removeItem('userEmail');

        await auth0Client.logout({
            returnTo: window.location.origin
        });
    }
}

// Get Auth0 token
async function getAuth0Token() {
    if (auth0Client) {
        try {
            return await auth0Client.getTokenSilently();
        } catch (error) {
            console.error('Error getting Auth0 token:', error);
            return null;
        }
    }
    return null;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeAuth0);

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes slideDown {
        to {
            opacity: 0;
            transform: translateY(50px) scale(0.9);
        }
    }
`;
document.head.appendChild(style);