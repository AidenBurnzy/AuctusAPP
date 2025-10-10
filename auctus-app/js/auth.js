// Auctus Authentication System - API Version
// This version connects to your backend API

const API_URL = 'http://localhost:3001/api';

// Check if user is already logged in
function checkExistingSession() {
    const token = localStorage.getItem('auctusToken');
    const userType = localStorage.getItem('auctusUserType');
    
    if (token && userType) {
        // Verify token is still valid by checking expiry
        const tokenData = parseJwt(token);
        if (tokenData && tokenData.exp * 1000 > Date.now()) {
            redirectToDashboard(userType);
        } else {
            // Token expired, clear it
            localStorage.removeItem('auctusToken');
            localStorage.removeItem('auctusUserType');
        }
    }
}

// Parse JWT token
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;
    const errorMessage = document.getElementById('errorMessage');
    const submitButton = this.querySelector('button[type="submit"]');
    
    // Clear previous error
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    
    // Disable button during request
    submitButton.disabled = true;
    submitButton.textContent = 'Signing In...';
    
    try {
        // Call backend API
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password,
                userType
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store token and user info
            localStorage.setItem('auctusToken', data.token);
            localStorage.setItem('auctusUserType', data.user.type);
            localStorage.setItem('auctusUsername', data.user.username);
            
            // Add login animation
            const loginCard = document.querySelector('.login-card');
            loginCard.style.animation = 'slideDown 0.5s ease-in forwards';
            
            // Redirect after animation
            setTimeout(() => {
                redirectToDashboard(data.user.type);
            }, 500);
        } else {
            // Show error message
            errorMessage.textContent = data.error || 'Invalid credentials. Please try again.';
            errorMessage.style.display = 'block';
            
            // Shake animation for error
            const loginCard = document.querySelector('.login-card');
            loginCard.style.animation = 'shake 0.5s';
            setTimeout(() => {
                loginCard.style.animation = '';
            }, 500);
            
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = 'Sign In';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'Unable to connect to server. Please make sure the backend is running.';
        errorMessage.style.display = 'block';
        
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
    }
});

// Redirect to appropriate dashboard
function redirectToDashboard(userType) {
    if (userType === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else if (userType === 'general') {
        window.location.href = 'general-dashboard.html';
    }
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

// Check for existing session on page load
checkExistingSession();