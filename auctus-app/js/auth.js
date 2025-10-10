// Auctus Login System

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Clear previous error
        errorMessage.style.display = 'none';

        // Get form values
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;

        // Get users from storage
        const users = getUsersFromStorage();

        // Find user by email
        const user = users.find(u => u.email === email);

        if (!user) {
            showError('No account found with this email');
            return;
        }

        // Check password
        if (user.password !== password) {
            showError('Incorrect password');
            return;
        }

        // Store authentication
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('currentUserId', user.id);
        localStorage.setItem('username', user.firstName + ' ' + user.lastName);

        // Add login animation
        const loginCard = document.querySelector('.login-card');
        loginCard.style.animation = 'slideDown 0.5s ease-in forwards';

        // Redirect based on role after animation
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'general-dashboard.html';
            }
        }, 500);
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';

        // Shake animation
        const loginCard = document.querySelector('.login-card');
        loginCard.style.animation = 'shake 0.5s';
        setTimeout(() => {
            loginCard.style.animation = '';
        }, 500);
    }
});

// Get users from localStorage
function getUsersFromStorage() {
    try {
        const users = localStorage.getItem('auctusUsers');
        return users ? JSON.parse(users) : [];
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
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