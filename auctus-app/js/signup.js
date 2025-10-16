// Auctus Auth0 Signup System

let auth0Client = null;

// Initialize Auth0
async function initializeAuth0() {
    try {
        // Wait for Auth0 SDK to be available
        if (!window.auth0) {
            throw new Error('Auth0 SDK not loaded. Please refresh the page.');
        }

        // Check that configuration is set
        if (!window.AUTH0_DOMAIN || window.AUTH0_DOMAIN === 'YOUR_AUTH0_DOMAIN') {
            throw new Error('Auth0 configuration missing. Check environment variables: AUTH0_DOMAIN, AUTH0_CLIENT_ID');
        }

        if (!window.AUTH0_CLIENT_ID || window.AUTH0_CLIENT_ID === 'YOUR_AUTH0_CLIENT_ID') {
            throw new Error('Auth0 Client ID not configured. Check AUTH0_CLIENT_ID environment variable.');
        }

        auth0Client = await window.auth0.createAuth0Client({
            domain: window.AUTH0_DOMAIN,
            clientId: window.AUTH0_CLIENT_ID,
            redirect_uri: window.location.href.split('?')[0],
            audience: window.AUTH0_AUDIENCE || undefined,
            useRefreshTokens: true,
            cacheLocation: 'localstorage'
        });

        // Set up signup button
        const signupButton = document.getElementById('auth0-signup');
        if (signupButton) {
            signupButton.addEventListener('click', async () => {
                await handleSignupFlow();
            });
        }

        // Check if redirected back from Auth0
        const query = window.location.search;
        if (query.includes('code=') && query.includes('state=')) {
            try {
                await auth0Client.handleRedirectCallback();
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // After signup, user needs to complete profile info
                await completeSignupProfile();
            } catch (error) {
                console.error('Error handling redirect:', error);
                showError('Authentication failed. Please try again.');
            }
        }
    } catch (error) {
        console.error('Error initializing Auth0:', error);
        console.error('Auth0 Domain:', window.AUTH0_DOMAIN);
        console.error('Auth0 Client ID:', window.AUTH0_CLIENT_ID);
        console.error('Auth0 SDK loaded:', !!window.auth0);
        showError(`Failed to initialize signup: ${error.message}`);
    }
}

// Handle signup flow
async function handleSignupFlow() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const phone = document.getElementById('phone').value.trim();
    const adminCode = document.getElementById('adminCode').value.trim();

    // Clear previous messages
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';

    // Validation
    if (!firstName || !lastName || !email || !phone) {
        showError('Please fill in all required fields');
        return;
    }

    // Email validation
    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Store profile info in sessionStorage to retrieve after Auth0 signup
    sessionStorage.setItem('signupProfile', JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        adminCode
    }));

    try {
        // Redirect to Auth0 signup
        await auth0Client.loginWithRedirect({
            screen_hint: 'signup',
            login_hint: email,
            prompt: 'consent'
        });
    } catch (error) {
        console.error('Error initiating signup:', error);
        showError('Failed to start signup process. Please try again.');
    }
}

// Complete signup profile after Auth0 authentication
async function completeSignupProfile() {
    try {
        // Retrieve stored profile info
        const profileData = sessionStorage.getItem('signupProfile');
        if (!profileData) {
            window.location.href = 'login.html';
            return;
        }

        const { firstName, lastName, email, phone, adminCode } = JSON.parse(profileData);
        const user = await auth0Client.getUser();
        const token = await auth0Client.getTokenSilently();

        // Validate admin code if provided
        let role = 'user';
        if (adminCode) {
            const adminResponse = await fetch('/.netlify/functions/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'validate-admin-code',
                    adminCode
                })
            });

            if (adminResponse.ok) {
                const adminData = await adminResponse.json();
                if (adminData.valid) {
                    role = 'admin';
                }
            }
        }

        // Create user in Neon database
        const response = await fetch('/.netlify/functions/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                auth0_id: user.sub,
                email,
                firstName,
                lastName,
                phone,
                role,
                picture: user.picture || null
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create user profile');
        }

        // Clear sessionStorage
        sessionStorage.removeItem('signupProfile');

        // Show success message
        const roleText = role === 'admin' ? 'Admin' : 'Employee';
        showSuccess(`Account created successfully as ${roleText}! Redirecting to dashboard...`);

        // Store authentication info
        localStorage.setItem('auth0_token', token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('currentUserId', user.sub);
        localStorage.setItem('username', `${firstName} ${lastName}`);
        localStorage.setItem('userEmail', email);

        // Add login animation
        const signupCard = document.querySelector('.login-card');
        if (signupCard) {
            signupCard.style.animation = 'slideDown 0.5s ease-in forwards';
        }

        // Redirect after animation
        setTimeout(() => {
            if (role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'general-dashboard.html';
            }
        }, 1500);
    } catch (error) {
        console.error('Error completing signup:', error);
        showError('Failed to complete signup. Please try again.');
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        // Shake animation
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.animation = 'shake 0.5s';
            setTimeout(() => {
                card.style.animation = '';
            }, 500);
        }
    }
}

function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    }
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

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