// Login Page JavaScript for Community Resource Dashboard

class LoginManager {
    constructor() {
        this.form = document.getElementById('login-form');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.togglePassword = document.getElementById('toggle-password');
        this.loginBtn = document.getElementById('login-btn');
        this.rememberCheckbox = document.getElementById('remember');
        
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAutoLogin();
        this.loadRememberedCredentials();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', this.handleLogin.bind(this));
        
        // Password toggle
        this.togglePassword.addEventListener('click', this.togglePasswordVisibility.bind(this));
        
        // Input validation
        this.emailInput.addEventListener('blur', this.validateEmail.bind(this));
        this.passwordInput.addEventListener('input', this.validatePassword.bind(this));
        
        // Remember me functionality
        this.rememberCheckbox.addEventListener('change', this.handleRememberChange.bind(this));
        
        // Enter key navigation
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.passwordInput.focus();
            }
        });
        
        // Demo credentials click
        document.querySelectorAll('.credential-item').forEach(item => {
            item.addEventListener('click', this.fillDemoCredentials.bind(this));
        });
        
        // Forgot password link
        const forgotLink = document.querySelector('.forgot-link');
        if (forgotLink) {
            forgotLink.addEventListener('click', this.handleForgotPassword.bind(this));
        }
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        
        // Basic validation
        if (!this.validateForm(email, password)) {
            return;
        }
        
        this.setLoading(true);
        
        try {
            // Attempt login
            const result = await authManager.login(email, password);
            
            // Handle remember me
            if (this.rememberCheckbox.checked) {
                this.saveCredentials(email);
            } else {
                this.clearRememberedCredentials();
            }
            
            this.showMessage(i18n.t('login_success'), 'success');
            
            // Check if there's a redirect after login
            const redirectSection = sessionStorage.getItem('redirectAfterLogin');
            
            if (redirectSection) {
                sessionStorage.removeItem('redirectAfterLogin');
                // Redirect to main dashboard with specific section
                setTimeout(() => {
                    window.location.href = `index.html#${redirectSection}`;
                }, 1000);
            } else {
                // Redirect to main dashboard
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
            
        } catch (error) {
            console.error('Login failed:', error);
            this.showMessage(error.message || i18n.t('login_failed'), 'error');
        } finally {
            this.setLoading(false);
        }
    }

    // Validate form inputs
    validateForm(email, password) {
        let isValid = true;
        
        // Email validation
        if (!email) {
            this.showFieldError(this.emailInput, i18n.t('required_field'));
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError(this.emailInput, i18n.t('invalid_email'));
            isValid = false;
        } else {
            this.clearFieldError(this.emailInput);
        }
        
        // Password validation
        if (!password) {
            this.showFieldError(this.passwordInput, i18n.t('required_field'));
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError(this.passwordInput, 'Password must be at least 6 characters');
            isValid = false;
        } else {
            this.clearFieldError(this.passwordInput);
        }
        
        return isValid;
    }

    // Email validation
    validateEmail() {
        const email = this.emailInput.value.trim();
        if (email && !this.isValidEmail(email)) {
            this.showFieldError(this.emailInput, i18n.t('invalid_email'));
        } else {
            this.clearFieldError(this.emailInput);
        }
    }

    // Password validation
    validatePassword() {
        const password = this.passwordInput.value;
        if (password && password.length < 6) {
            this.showFieldError(this.passwordInput, 'Password must be at least 6 characters');
        } else {
            this.clearFieldError(this.passwordInput);
        }
    }

    // Show field error
    showFieldError(input, message) {
        const wrapper = input.closest('.input-wrapper');
        wrapper.classList.add('error');
        
        // Remove existing error message
        const existingError = wrapper.nextElementSibling;
        if (existingError && existingError.classList.contains('field-error')) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        wrapper.parentNode.insertBefore(errorDiv, wrapper.nextSibling);
    }

    // Clear field error
    clearFieldError(input) {
        const wrapper = input.closest('.input-wrapper');
        wrapper.classList.remove('error');
        
        // Remove error message
        const errorMessage = wrapper.nextElementSibling;
        if (errorMessage && errorMessage.classList.contains('field-error')) {
            errorMessage.remove();
        }
    }

    // Toggle password visibility
    togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        
        const icon = this.togglePassword.querySelector('i');
        icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    }

    // Set loading state
    setLoading(loading) {
        this.isLoading = loading;
        this.loginBtn.disabled = loading;
        
        const buttonText = this.loginBtn.querySelector('span');
        const spinner = this.loginBtn.querySelector('.loading-spinner');
        
        if (loading) {
            buttonText.style.display = 'none';
            spinner.style.display = 'inline-block';
        } else {
            buttonText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    }

    // Fill demo credentials
    fillDemoCredentials() {
        this.emailInput.value = 'admin@community.gov.in';
        this.passwordInput.value = 'admin123';
        this.emailInput.focus();
    }

    // Handle forgot password
    handleForgotPassword(event) {
        event.preventDefault();
        this.showMessage('Password reset functionality will be available soon', 'info');
    }

    // Handle remember me change
    handleRememberChange() {
        if (!this.rememberCheckbox.checked) {
            this.clearRememberedCredentials();
        }
    }

    // Save credentials for remember me
    saveCredentials(email) {
        localStorage.setItem('remembered_email', email);
        localStorage.setItem('remember_login', 'true');
    }

    // Load remembered credentials
    loadRememberedCredentials() {
        const rememberLogin = localStorage.getItem('remember_login') === 'true';
        const rememberedEmail = localStorage.getItem('remembered_email');
        
        if (rememberLogin && rememberedEmail) {
            this.emailInput.value = rememberedEmail;
            this.rememberCheckbox.checked = true;
        }
    }

    // Clear remembered credentials
    clearRememberedCredentials() {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remember_login');
    }

    // Check for auto login
    checkAutoLogin() {
        // If user is already authenticated, redirect to dashboard
        if (authManager.isAuth()) {
            window.location.href = 'index.html';
            return;
        }
    }

    // Email validation helper
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show status message
    showMessage(message, type = 'info') {
        const container = document.getElementById('status-messages');
        if (!container) return;

        const messageElement = document.createElement('div');
        messageElement.className = `status-message status-${type}`;
        messageElement.textContent = message;

        container.appendChild(messageElement);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, 5000);
    }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginManager = new LoginManager();
});

// Add CSS for field errors
const errorStyles = `
    .input-wrapper.error input {
        border-color: var(--vermillion) !important;
        box-shadow: 0 0 0 4px rgba(227, 66, 52, 0.1) !important;
    }
    
    .field-error {
        color: var(--vermillion);
        font-size: 0.8rem;
        margin-top: 0.25rem;
        margin-left: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .field-error::before {
        content: '⚠';
        font-size: 0.9rem;
    }
`;

// Inject error styles
const styleSheet = document.createElement('style');
styleSheet.textContent = errorStyles;
document.head.appendChild(styleSheet);