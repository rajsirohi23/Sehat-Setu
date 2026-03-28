// Authentication JavaScript for Sehat Setu
// Handles login and registration with real backend API

let currentUserType = 'patient';
let currentForm = 'login';

// Password validation function
function validatePassword(password) {
    // Must be at least 6 characters
    // Must contain at least one uppercase letter
    // Must contain at least one lowercase letter
    // Must contain at least one number
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return {
        isValid: minLength && hasUpperCase && hasLowerCase && hasNumber,
        errors: {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumber
        }
    };
}

// Real Login Function - Connects to Backend
async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        // Basic validation
        if (!loginData.email || !loginData.password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Call real backend API
        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok) {
            // Store authentication data
            localStorage.setItem('userToken', data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.tokens.refreshToken);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userType', data.user.userType);
            localStorage.setItem('userEmail', data.user.email);

            if (data.user.profile) {
                localStorage.setItem('userName', data.user.profile.name);
                localStorage.setItem('userData', JSON.stringify(data.user.profile));
            }

            showNotification('Login successful! Redirecting...', 'success');

            // Check if user type matches selected tab
            const selectedType = document.querySelector('.user-type-btn.active')?.dataset?.type || 
                                 document.querySelector('.tab-btn.active')?.dataset?.type ||
                                 document.querySelector('[data-type].active')?.dataset?.type;

            if (selectedType && selectedType !== data.user.userType) {
                showNotification(`This account is registered as a ${data.user.userType}. Please use the ${data.user.userType} login tab.`, 'error');
                localStorage.clear();
                return;
            }

            // Redirect based on user type
            setTimeout(() => {
                if (data.user.userType === 'patient') {
                    window.location.href = 'patient-dashboard.html';
                } else if (data.user.userType === 'doctor') {
                    window.location.href = 'doctor-dashboard.html';
                }
            }, 1500);

        } else {
            showNotification(data.message || 'Login failed. Please check your credentials.', 'error');
        }

    } catch (error) {
        console.error('Login error:', error);
        showNotification('Cannot connect to server. Please make sure backend is running.', 'error');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

// Real Register Function - Connects to Backend
async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');

        // Validate required fields
        if (!name || !email || !password) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            let errorMsg = 'Password must contain: ';
            const errors = [];
            if (!passwordValidation.errors.minLength) errors.push('at least 6 characters');
            if (!passwordValidation.errors.hasUpperCase) errors.push('one uppercase letter');
            if (!passwordValidation.errors.hasLowerCase) errors.push('one lowercase letter');
            if (!passwordValidation.errors.hasNumber) errors.push('one number');
            errorMsg += errors.join(', ');
            showNotification(errorMsg, 'error');
            return;
        }

        const registerData = {
            name,
            email,
            password,
            phone: formData.get('phone'),
            userType: currentUserType
        };

        // Add user-type specific fields
        if (currentUserType === 'patient') {
            registerData.dateOfBirth = formData.get('dateOfBirth');
            registerData.gender = formData.get('gender');
            registerData.bloodGroup = formData.get('bloodGroup');
        } else if (currentUserType === 'doctor') {
            registerData.licenseNumber = formData.get('licenseNumber');
            registerData.specialty = formData.get('specialty');
            registerData.experience = parseInt(formData.get('experience')) || 0;
        }

        // Call real backend API
        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Registration successful! Please sign in to continue.', 'success');

            // Switch to login form
            setTimeout(() => {
                toggleForm('login');
                // Pre-fill email
                document.querySelector('#loginForm input[name="email"]').value = email;
            }, 2000);

        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }

    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Cannot connect to server. Please make sure backend is running.', 'error');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const userType = urlParams.get('type');
    const formType = urlParams.get('form');

    if (userType && ['patient', 'doctor'].includes(userType)) {
        switchUserType(userType);
    }

    if (formType === 'register') {
        toggleForm('register');
    }

    initializeEventListeners();
});

function initializeEventListeners() {
    // User type toggle
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userType = btn.getAttribute('data-type');
            switchUserType(userType);
        });
    });

    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

function switchUserType(userType) {
    currentUserType = userType;

    // Update active button
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${userType}"]`).classList.add('active');

    // Show/hide appropriate fields in registration form
    const patientFields = document.querySelector('.patient-fields');
    const doctorFields = document.querySelector('.doctor-fields');

    if (userType === 'patient') {
        patientFields.style.display = 'block';
        doctorFields.style.display = 'none';
    } else {
        patientFields.style.display = 'none';
        doctorFields.style.display = 'block';
    }
}

function toggleForm(formType) {
    currentForm = formType;

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');

    if (formType === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        formTitle.textContent = 'Welcome Back';
        formSubtitle.textContent = 'Sign in to your account to continue';
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        formTitle.textContent = 'Create Account';
        formSubtitle.textContent = 'Join Sehat Setu to start your health journey';
    }
}

// Real-time password validation feedback
document.addEventListener('input', function (e) {
    if (e.target.name === 'password' && e.target.form.id === 'registerForm') {
        const password = e.target.value;
        const validation = validatePassword(password);
        
        // You can add visual feedback here
        if (password.length > 0) {
            if (validation.isValid) {
                e.target.style.borderColor = '#48bb78';
            } else {
                e.target.style.borderColor = '#f56565';
            }
        } else {
            e.target.style.borderColor = '#e2e8f0';
        }
    }
});
