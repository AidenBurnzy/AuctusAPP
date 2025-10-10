// Auctus Signup System

// Admin code (only admins should know this)
const ADMIN_CODE = '2025AUCTUSADMIN';

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Clear previous messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        // Get form values
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const adminCode = document.getElementById('adminCode').value.trim();

        // Validation
        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
            showError('Please fill in all required fields');
            return;
        }

        // Email validation
        if (!validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Password validation
        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        // Check if user already exists
        const users = getUsersFromStorage();
        if (users.find(u => u.email === email)) {
            showError('An account with this email already exists');
            return;
        }

        // Determine user role based on admin code
        // If admin code is correct = admin, otherwise = general (employee)
        let userRole = 'general';
        if (adminCode && adminCode === ADMIN_CODE) {
            userRole = 'admin';
        }

        // Create new user
        const newUser = {
            id: generateId(),
            firstName,
            lastName,
            email,
            phone,
            password, // In production, this should be hashed!
            role: userRole,
            createdAt: new Date().toISOString()
        };

        // Save user
        users.push(newUser);
        saveUsersToStorage(users);

        // Show success message
        const roleText = userRole === 'admin' ? 'Admin' : 'Employee';
        showSuccess(`Account created successfully as ${roleText}! Redirecting to login...`);

        // Clear form
        signupForm.reset();

        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Shake animation
        const card = document.querySelector('.login-card');
        card.style.animation = 'shake 0.5s';
        setTimeout(() => {
            card.style.animation = '';
        }, 500);
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
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

// Save users to localStorage
function saveUsersToStorage(users) {
    try {
        localStorage.setItem('auctusUsers', JSON.stringify(users));
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);