// Auctus Authentication System
// This handles login and session management

// Demo credentials (In production, replace with secure backend authentication)
const CREDENTIALS = {
    admin: {
        username: 'admin',
        password: 'auctus2025',
        type: 'admin'
    },
    general: {
        username: 'user',
        password: 'auctus2025',
        type: 'general'
    }
};

// Check if user is already logged in
function checkExistingSession() {
    const currentUser = JSON.parse(localStorage.getItem('auctusUser') || 'null');
    
    if (currentUser && currentUser.sessionExpiry > Date.now()) {
        // Valid session exists, redirect to appropriate dashboard
        redirectToDashboard(currentUser.type);
    }
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;
    const errorMessage = document.getElementById('errorMessage');
    
    // Clear previous error
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    
    // Validate credentials
    if (validateCredentials(username, password, userType)) {
        // Create session
        const sessionData = {
            username: username,
            type: userType,
            loginTime: Date.now(),
            sessionExpiry: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
        };
        
        // Store session
        localStorage.setItem('auctusUser', JSON.stringify(sessionData));
        
        // Add login animation
        const loginCard = document.querySelector('.login-card');
        loginCard.style.animation = 'slideDown 0.5s ease-in forwards';
        
        // Redirect after animation
        setTimeout(() => {
            redirectToDashboard(userType);
        }, 500);
    } else {
        // Show error message
        errorMessage.textContent = 'Invalid credentials. Please check your username, password, and access level.';
        errorMessage.style.display = 'block';
        
        // Shake animation for error
        const loginCard = document.querySelector('.login-card');
        loginCard.style.animation = 'shake 0.5s';
        setTimeout(() => {
            loginCard.style.animation = '';
        }, 500);
    }
});

// Validate user credentials
function validateCredentials(username, password, userType) {
    if (userType === 'admin') {
        return username === CREDENTIALS.admin.username && 
               password === CREDENTIALS.admin.password;
    } else if (userType === 'general') {
        return username === CREDENTIALS.general.username && 
               password === CREDENTIALS.general.password;
    }
    return false;
}

// Redirect to appropriate dashboard
function redirectToDashboard(userType) {
    if (userType === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else if (userType === 'general') {
        window.location.href = 'general-dashboard.html';
    }
}

// Add shake animation
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

// Check for existing session on page load
checkExistingSession();

// IMPORTANT NOTE FOR PRODUCTION:
// This demo uses localStorage and hardcoded credentials for demonstration purposes.
// For a production app, you should:
// 1. Use a secure backend API for authentication
// 2. Implement proper password hashing (bcrypt, argon2)
// 3. Use secure session tokens (JWT)
// 4. Implement HTTPS
// 5. Add rate limiting for login attempts
// 6. Consider using OAuth or Auth0 for authentication
// 7. Store sensitive data server-side, not in localStorage