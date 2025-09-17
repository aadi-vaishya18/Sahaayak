// Authentication Module for Community Resource Dashboard

class AuthManager {
    constructor() {
        this.baseUrl = 'http://localhost:3001/api/auth';
        this.tokenKey = 'community_auth_token';
        this.userKey = 'community_user_data';
        this.isAuthenticated = false;
        this.user = null;
        
        // Check for existing authentication on initialization
        this.checkAuthStatus();
    }

    // Check if user is currently authenticated
    checkAuthStatus() {
        const token = this.getToken();
        const userData = this.getUserData();
        
        if (token && userData) {
            // Verify token is still valid
            this.verifyToken()
                .then((isValid) => {
                    if (isValid) {
                        this.isAuthenticated = true;
                        this.user = userData;
                        this.dispatchAuthEvent('authenticated', userData);
                    } else {
                        this.logout();
                    }
                })
                .catch(() => {
                    this.logout();
                });
        }
    }

    // Login user
    async login(email, password) {
        try {
            console.log('Attempting login with:', email);
            
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Login response status:', response.status);
            
            const data = await response.json();
            console.log('Login response data:', data);

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: Login failed`);
            }

            // Store authentication data
            this.setToken(data.data.token);
            this.setUserData(data.data.user);
            
            this.isAuthenticated = true;
            this.user = data.data.user;

            // Dispatch authentication event
            this.dispatchAuthEvent('login', data.data.user);

            return {
                success: true,
                user: data.data.user,
                token: data.data.token
            };

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Logout user
    logout() {
        // Clear stored data
        this.removeToken();
        this.removeUserData();
        
        this.isAuthenticated = false;
        this.user = null;

        // Dispatch logout event
        this.dispatchAuthEvent('logout');

        // Redirect to login page if not already there
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    // Get current user profile
    async getProfile() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch(`${this.baseUrl}/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch profile');
            }

            // Update stored user data
            this.setUserData(data.data);
            this.user = data.data;

            return data.data;

        } catch (error) {
            console.error('Profile fetch error:', error);
            
            // If token is invalid, logout
            if (error.message.includes('token') || error.message.includes('Unauthorized')) {
                this.logout();
            }
            
            throw error;
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch(`${this.baseUrl}/change-password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            return data;

        } catch (error) {
            console.error('Password change error:', error);
            throw error;
        }
    }

    // Verify token validity
    async verifyToken() {
        try {
            const token = this.getToken();
            if (!token) return false;

            const response = await fetch(`${this.baseUrl}/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Token management
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    removeToken() {
        localStorage.removeItem(this.tokenKey);
    }

    // User data management
    setUserData(userData) {
        localStorage.setItem(this.userKey, JSON.stringify(userData));
    }

    getUserData() {
        const data = localStorage.getItem(this.userKey);
        return data ? JSON.parse(data) : null;
    }

    removeUserData() {
        localStorage.removeItem(this.userKey);
    }

    // Get authorization header
    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // Make authenticated API request
    async authenticatedRequest(url, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('No authentication token');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // If unauthorized, logout and redirect
        if (response.status === 401) {
            this.logout();
            throw new Error('Authentication expired');
        }

        return response;
    }

    // Dispatch authentication events
    dispatchAuthEvent(type, data = null) {
        const event = new CustomEvent(`auth:${type}`, {
            detail: data
        });
        window.dispatchEvent(event);
    }

    // Check if user has specific role
    hasRole(role) {
        return this.user && this.user.role === role;
    }

    // Check if user has any of the specified roles
    hasAnyRole(roles) {
        return this.user && roles.includes(this.user.role);
    }

    // Get current user info
    getCurrentUser() {
        return this.user;
    }

    // Check if authenticated
    isAuth() {
        return this.isAuthenticated && this.user && this.getToken();
    }
}

// Create global authentication manager instance
const authManager = new AuthManager();

// Helper function for protected pages
function requireAuth() {
    if (!authManager.isAuth()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Helper function to check admin role
function requireAdmin() {
    if (!authManager.isAuth() || !authManager.hasRole('admin')) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Auto-logout on token expiry
window.addEventListener('auth:logout', () => {
    console.log('User logged out');
});

window.addEventListener('auth:login', (event) => {
    console.log('User logged in:', event.detail);
});

window.addEventListener('auth:authenticated', (event) => {
    console.log('User authenticated:', event.detail);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, authManager, requireAuth, requireAdmin };
}

// Global error handler for authentication errors
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason.message && event.reason.message.includes('Authentication expired')) {
        authManager.logout();
        event.preventDefault();
    }
});