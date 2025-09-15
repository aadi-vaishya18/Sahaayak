// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// API Client Class
class ApiClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                searchParams.append(key, params[key]);
            }
        });
        
        const queryString = searchParams.toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(fullEndpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Resources API
    async getResources(filters = {}) {
        return this.get('/resources', filters);
    }

    async getResource(id) {
        return this.get(`/resources/${id}`);
    }

    async createResource(resourceData) {
        return this.post('/resources', resourceData);
    }

    async updateResource(id, resourceData) {
        return this.put(`/resources/${id}`, resourceData);
    }

    async updateResourceAvailability(id, availability) {
        return this.post(`/resources/${id}/update-availability`, {
            current_availability: availability
        });
    }

    async deleteResource(id) {
        return this.delete(`/resources/${id}`);
    }

    // Categories API
    async getCategories() {
        return this.get('/categories');
    }

    async getCategory(id) {
        return this.get(`/categories/${id}`);
    }

    async getCategoryResources(id) {
        return this.get(`/categories/${id}/resources`);
    }

    async getCategoryRequests(id) {
        return this.get(`/categories/${id}/requests`);
    }

    // Emergency Requests API
    async getEmergencyRequests() {
        return this.get('/emergency-requests');
    }

    async getEmergencyRequest(id) {
        return this.get(`/emergency-requests/${id}`);
    }

    async createEmergencyRequest(requestData) {
        return this.post('/emergency-requests', requestData);
    }

    async updateRequestStatus(id, status, volunteerId = null, notes = null) {
        const data = { status };
        if (volunteerId) data.assigned_volunteer_id = volunteerId;
        if (notes) data.notes = notes;
        return this.put(`/emergency-requests/${id}/status`, data);
    }

    async assignVolunteerToRequest(requestId, volunteerId) {
        return this.put(`/emergency-requests/${requestId}/assign`, {
            volunteer_id: volunteerId
        });
    }

    async deleteEmergencyRequest(id) {
        return this.delete(`/emergency-requests/${id}`);
    }

    // Volunteers API
    async getVolunteers(filters = {}) {
        return this.get('/volunteers', filters);
    }

    async getVolunteer(id) {
        return this.get(`/volunteers/${id}`);
    }

    async registerVolunteer(volunteerData) {
        return this.post('/volunteers/register', volunteerData);
    }

    async updateVolunteer(id, volunteerData) {
        return this.put(`/volunteers/${id}`, volunteerData);
    }

    async updateVolunteerStatus(id, status) {
        return this.put(`/volunteers/${id}/status`, { status });
    }

    async updateVolunteerAvailability(id, availability, status = null) {
        const data = { availability };
        if (status) data.status = status;
        return this.post(`/volunteers/${id}/availability`, data);
    }

    async getVolunteerAssignments(id) {
        return this.get(`/volunteers/${id}/assignments`);
    }

    async getMatchingVolunteers(requestId) {
        return this.get(`/volunteers/match/${requestId}`);
    }

    async removeVolunteer(id) {
        return this.delete(`/volunteers/${id}`);
    }

    // Statistics API
    async getStatistics() {
        return this.get('/emergency-requests/stats');
    }

    // Health check
    async healthCheck() {
        return this.get('/health');
    }
}

// Create global API instance
const api = new ApiClient();

// Utility functions for common operations
const ApiUtils = {
    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format priority for display
    formatPriority(priority) {
        const priorities = {
            'low': { text: 'Low Priority', class: 'priority-low' },
            'medium': { text: 'Medium Priority', class: 'priority-medium' },
            'high': { text: 'High Priority', class: 'priority-high' }
        };
        return priorities[priority] || { text: priority, class: '' };
    },

    // Format status for display
    formatStatus(status) {
        const statuses = {
            'open': { text: 'Open', class: 'status-open' },
            'in-progress': { text: 'In Progress', class: 'status-in-progress' },
            'resolved': { text: 'Resolved', class: 'status-resolved' },
            'closed': { text: 'Closed', class: 'status-closed' },
            'active': { text: 'Active', class: 'status-active' },
            'inactive': { text: 'Inactive', class: 'status-inactive' }
        };
        return statuses[status] || { text: status, class: '' };
    },

    // Format availability indicator
    formatAvailability(current, capacity) {
        if (!capacity) return 'N/A';
        
        const percentage = (current / capacity) * 100;
        let level, className;
        
        if (percentage >= 50) {
            level = 'High';
            className = 'availability-high';
        } else if (percentage >= 20) {
            level = 'Medium';
            className = 'availability-medium';
        } else {
            level = 'Low';
            className = 'availability-low';
        }
        
        return {
            level,
            className,
            text: `${current}/${capacity} available`
        };
    },

    // Handle API errors consistently
    handleApiError(error, context = '') {
        console.error(`API Error ${context}:`, error);
        
        let message = 'An unexpected error occurred';
        
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        
        // Show error to user
        showStatusMessage(message, 'error');
        
        return message;
    },

    // Debounce function for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate phone format (basic)
    validatePhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    },

    // Get current location
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    reject(new Error(`Geolocation error: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, api, ApiUtils };
}

// Global error handler for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    ApiUtils.handleApiError(event.reason, 'Unhandled Promise');
    event.preventDefault();
});

// Network status monitoring
window.addEventListener('online', () => {
    showStatusMessage('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    showStatusMessage('Connection lost - working offline', 'warning');
});

// Auto-retry mechanism for failed requests
const originalRequest = ApiClient.prototype.request;
ApiClient.prototype.request = async function(endpoint, options = {}) {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            return await originalRequest.call(this, endpoint, options);
        } catch (error) {
            if (retries === maxRetries - 1) {
                throw error;
            }
            
            // Only retry on network errors or 5xx server errors
            if (error.message.includes('fetch') || 
                (error.message.includes('status') && error.message.includes('5'))) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
                continue;
            }
            
            throw error;
        }
    }
};