// Main Application Controller with Authentication and i18n
class CommunityResourceApp {
    constructor() {
        this.currentSection = 'resources';
        this.categories = [];
        this.resources = [];
        this.emergencyRequests = [];
        this.volunteers = [];
        this.filters = {
            category: '',
            search: '',
            location: null
        };
        this.currentLocation = null;
        this.isAuthenticated = false;
    }

    // Initialize the application
    async init() {
        try {
            console.log('Initializing Community Resource Dashboard...');
            
            // Initialize i18n
            i18n.init();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup user interface (no auth check required for main app)
            this.setupUserInterface();
            
            // Load initial data
            await this.loadInitialData();
            
            // Check for URL hash to determine initial section
            const hash = window.location.hash.substring(1);
            if (hash && ['resources', 'emergency', 'volunteer', 'admin'].includes(hash)) {
                await this.switchSection(hash);
            } else {
                // Load default section
                await this.loadResourcesSection();
            }
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            showStatusMessage('Failed to initialize application', 'error');
        }
    }

    // Check authentication status (only for admin section)
    checkAuthenticationForAdmin() {
        if (!authManager.isAuth()) {
            // Redirect to admin login page
            this.showAdminLogin();
            return false;
        }
        
        this.isAuthenticated = true;
        return true;
    }

    // Show admin login modal or redirect
    showAdminLogin() {
        // Show a simple prompt or redirect to login page in the same window
        const shouldLogin = confirm('Admin access required. Click OK to go to login page.');
        if (shouldLogin) {
            // Store current state and redirect to login
            sessionStorage.setItem('redirectAfterLogin', 'admin');
            window.location.href = 'login.html';
        } else {
            // Switch back to previous section
            this.switchSection('resources');
        }
    }

    // Setup user interface elements
    setupUserInterface() {
        // Check if user is authenticated to show user controls
        const user = authManager.getCurrentUser();
        const userControls = document.querySelector('.user-controls');
        
        if (user && userControls) {
            // Show authenticated user interface
            const userNameElement = document.getElementById('user-name');
            const userRoleElement = document.getElementById('user-role');
            
            if (userNameElement) userNameElement.textContent = user.name || 'Admin User';
            if (userRoleElement) userRoleElement.textContent = user.role || 'Administrator';
            
            // Setup user menu dropdown
            this.setupUserMenu();
        } else {
            // Hide user controls for non-authenticated users
            if (userControls) {
                const userMenu = userControls.querySelector('.user-menu');
                if (userMenu) userMenu.style.display = 'none';
            }
        }
        
        // Setup language switcher (always available)
        this.setupLanguageSwitcher();
    }

    // Setup user menu functionality
    setupUserMenu() {
        const userMenuToggle = document.getElementById('user-menu-toggle');
        const userDropdown = document.getElementById('user-dropdown');
        const logoutLink = document.getElementById('logout-link');
        
        if (userMenuToggle && userDropdown) {
            userMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.style.display = 'none';
            });
        }
        
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    }

    // Setup language switcher
    setupLanguageSwitcher() {
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = i18n.getCurrentLanguage();
            languageSelect.addEventListener('change', (e) => {
                i18n.setLanguage(e.target.value);
            });
        }
    }

    // Handle user logout
    async handleLogout() {
        try {
            showStatusMessage(i18n.t('logging_out') || 'Logging out...', 'info');
            authManager.logout();
            // Redirect will be handled by authManager
        } catch (error) {
            console.error('Logout error:', error);
            showStatusMessage('Logout failed', 'error');
        }
    }

    // Setup event listeners for UI elements
    setupEventListeners() {
        // Navigation tabs
        document.getElementById('resources-tab').addEventListener('click', () => this.switchSection('resources'));
        document.getElementById('emergency-tab').addEventListener('click', () => this.switchSection('emergency'));
        document.getElementById('volunteer-tab').addEventListener('click', () => this.switchSection('volunteer'));
        document.getElementById('admin-tab').addEventListener('click', () => this.switchSection('admin'));

        // Resource filters
        document.getElementById('category-filter').addEventListener('change', this.handleCategoryFilter.bind(this));
        document.getElementById('search-input').addEventListener('input', 
            ApiUtils.debounce(this.handleSearchFilter.bind(this), 300)
        );
        document.getElementById('toggle-map').addEventListener('click', this.toggleMap.bind(this));

        // Emergency form
        document.getElementById('emergency-form').addEventListener('submit', this.handleEmergencySubmission.bind(this));
        document.getElementById('use-current-location').addEventListener('click', this.useCurrentLocation.bind(this));

        // Volunteer form
        document.getElementById('volunteer-form').addEventListener('submit', this.handleVolunteerRegistration.bind(this));

        // Admin actions
        document.getElementById('refresh-data').addEventListener('click', this.refreshAllData.bind(this));
        document.getElementById('export-data').addEventListener('click', this.exportData.bind(this));
        document.getElementById('view-logs').addEventListener('click', this.viewActivityLogs.bind(this));

        // Custom events from real-time system
        window.addEventListener('newEmergencyRequest', this.handleNewEmergencyRequest.bind(this));
        window.addEventListener('resourceUpdated', this.handleResourceUpdate.bind(this));
        
        // Map events
        window.addEventListener('resourceMarkerClick', this.handleResourceMarkerClick.bind(this));
        window.addEventListener('mapClick', this.handleMapClick.bind(this));
        
        // Hash change events for navigation
        window.addEventListener('hashchange', this.handleHashChange.bind(this));
    }

    // Load initial application data
    async loadInitialData() {
        try {
            console.log('Loading initial data...');
            
            // Test API connectivity first
            try {
                const healthCheck = await api.healthCheck();
                console.log('API health check successful:', healthCheck);
            } catch (healthError) {
                console.error('API health check failed:', healthError);
                showStatusMessage('Backend API is not responding. Please check if the server is running.', 'error');
                return;
            }
            
            // Load categories for dropdowns
            await this.loadCategories();
            console.log('Initial data loaded successfully');
        } catch (error) {
            console.error('Error loading initial data:', error);
            showStatusMessage('Failed to load application data: ' + error.message, 'error');
            // Don't throw error to allow app to continue partially
        }
    }

    // Switch between application sections
    async switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${sectionName}-tab`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Update current section
        this.currentSection = sectionName;
        
        // Update URL hash
        window.location.hash = sectionName;

        // Load section-specific data
        try {
            switch (sectionName) {
                case 'resources':
                    await this.loadResourcesSection();
                    break;
                case 'emergency':
                    await this.loadEmergencySection();
                    break;
                case 'volunteer':
                    await this.loadVolunteerSection();
                    break;
                case 'admin':
                    // For now, allow access to admin section without authentication
                    // TODO: Re-enable authentication check in production
                    // if (!this.checkAuthenticationForAdmin()) {
                    //     return;
                    // }
                    await this.loadAdminSection();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${sectionName} section:`, error);
            ApiUtils.handleApiError(error, `loading ${sectionName} section`);
        }
    }

    // Load categories
    async loadCategories() {
        try {
            console.log('Loading categories from API...');
            const response = await api.getCategories();
            console.log('Categories API response:', response);
            
            this.categories = response.data || [];
            console.log('Loaded categories:', this.categories.length);

            // Populate category filters
            this.populateCategoryFilters();
        } catch (error) {
            console.error('Error loading categories:', error);
            // Set empty categories array as fallback
            this.categories = [];
            this.populateCategoryFilters(); // Still populate with empty array
            throw error;
        }
    }

    // Populate category filter dropdowns
    populateCategoryFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const emergencyCategory = document.getElementById('emergency-category');

        // Clear existing options (except "All Categories")
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        emergencyCategory.innerHTML = '<option value="">Select category</option>';

        this.categories.forEach(category => {
            const option1 = document.createElement('option');
            option1.value = category.id;
            option1.textContent = `${category.icon || ''} ${category.name}`;
            categoryFilter.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = category.id;
            option2.textContent = `${category.icon || ''} ${category.name}`;
            emergencyCategory.appendChild(option2);
        });
    }

    // Load Resources Section
    async loadResourcesSection() {
        try {
            showStatusMessage('Loading resources...', 'info', 1000);
            
            const response = await api.getResources(this.filters);
            this.resources = response.data;

            this.displayResources(this.resources);
            this.loadResourcesOnMap();
        } catch (error) {
            console.error('Error loading resources:', error);
            ApiUtils.handleApiError(error, 'loading resources');
        }
    }

    // Display resources in the list
    displayResources(resources) {
        const resourceList = document.getElementById('resource-list');
        
        if (!resources || resources.length === 0) {
            resourceList.innerHTML = '<div class="loading">No resources found</div>';
            return;
        }

        resourceList.innerHTML = resources.map(resource => this.createResourceCard(resource)).join('');
    }

    // Create resource card HTML
    createResourceCard(resource) {
        const availability = ApiUtils.formatAvailability(resource.current_availability, resource.capacity);
        const categoryColor = mapManager?.categoryColors[resource.category_name] || '#667eea';

        return `
            <div class="resource-card" data-resource-id="${resource.id}">
                <div class="resource-header">
                    <div>
                        <div class="resource-title">${resource.name}</div>
                        <span class="resource-category" style="background-color: ${categoryColor};">
                            ${resource.category_icon || ''} ${resource.category_name || 'Unknown'}
                        </span>
                    </div>
                </div>
                
                ${resource.description ? `<div class="resource-description">${resource.description}</div>` : ''}
                
                <div class="resource-details">
                    ${resource.address ? `
                        <div class="resource-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${resource.address}</span>
                        </div>
                    ` : ''}
                    
                    ${resource.phone ? `
                        <div class="resource-detail">
                            <i class="fas fa-phone"></i>
                            <a href="tel:${resource.phone}">${resource.phone}</a>
                        </div>
                    ` : ''}
                    
                    ${resource.operating_hours ? `
                        <div class="resource-detail">
                            <i class="fas fa-clock"></i>
                            <span>${resource.operating_hours}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${availability !== 'N/A' ? `
                    <div class="resource-availability">
                        <span class="availability-text">${availability.text}</span>
                        <span class="availability-indicator ${availability.className}">${availability.level}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Load resources on map
    loadResourcesOnMap() {
        if (mapManager && this.resources.length > 0) {
            mapManager.addResources(this.resources);
        }
    }

    // Load Emergency Section
    async loadEmergencySection() {
        try {
            await this.loadEmergencyRequests();
        } catch (error) {
            console.error('Error loading emergency section:', error);
            ApiUtils.handleApiError(error, 'loading emergency section');
        }
    }

    // Load emergency requests
    async loadEmergencyRequests() {
        try {
            const response = await api.getEmergencyRequests();
            this.emergencyRequests = response.data;

            this.displayEmergencyRequests(this.emergencyRequests);
        } catch (error) {
            console.error('Error loading emergency requests:', error);
            throw error;
        }
    }

    // Display emergency requests
    displayEmergencyRequests(requests) {
        const emergencyList = document.getElementById('emergency-list');
        
        if (!requests || requests.length === 0) {
            emergencyList.innerHTML = '<div class="loading">No emergency requests</div>';
            return;
        }

        emergencyList.innerHTML = requests.map(request => this.createEmergencyCard(request)).join('');
    }

    // Create emergency request card HTML
    createEmergencyCard(request) {
        const priority = ApiUtils.formatPriority(request.priority);
        const status = ApiUtils.formatStatus(request.status);

        return `
            <div class="emergency-card priority-${request.priority}" data-request-id="${request.id}">
                <div class="emergency-header">
                    <span class="emergency-priority ${priority.class}">${priority.text}</span>
                    <span class="emergency-status ${status.class}">${status.text}</span>
                </div>
                
                <div class="emergency-content">
                    <p><strong>${request.requester_name}</strong></p>
                    <p class="description">${request.description}</p>
                    
                    ${request.location ? `<p class="location"><i class="fas fa-map-marker-alt"></i> ${request.location}</p>` : ''}
                    
                    <p class="time"><i class="fas fa-clock"></i> ${ApiUtils.formatDate(request.created_at)}</p>
                    
                    ${request.volunteer_name ? `
                        <p class="volunteer"><i class="fas fa-user"></i> Assigned to: ${request.volunteer_name}</p>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Load Volunteer Section
    async loadVolunteerSection() {
        try {
            await this.loadVolunteers();
        } catch (error) {
            console.error('Error loading volunteer section:', error);
            ApiUtils.handleApiError(error, 'loading volunteer section');
        }
    }

    // Load volunteers
    async loadVolunteers() {
        try {
            const response = await api.getVolunteers();
            this.volunteers = response.data;

            this.displayVolunteers(this.volunteers);
        } catch (error) {
            console.error('Error loading volunteers:', error);
            throw error;
        }
    }

    // Display volunteers
    displayVolunteers(volunteers) {
        const volunteersGrid = document.getElementById('volunteers-grid');
        
        if (!volunteers || volunteers.length === 0) {
            volunteersGrid.innerHTML = '<div class="loading">No active volunteers</div>';
            return;
        }

        volunteersGrid.innerHTML = volunteers.map(volunteer => this.createVolunteerCard(volunteer)).join('');
    }

    // Create volunteer card HTML
    createVolunteerCard(volunteer) {
        return `
            <div class="volunteer-card" data-volunteer-id="${volunteer.id}">
                <div class="volunteer-name">${volunteer.name}</div>
                <div class="volunteer-skills">
                    <i class="fas fa-tools"></i> ${volunteer.skills || 'General Help'}
                </div>
                <div class="volunteer-availability">
                    <i class="fas fa-calendar"></i> ${volunteer.availability || 'Not specified'}
                </div>
                ${volunteer.location ? `
                    <div class="volunteer-location">
                        <i class="fas fa-map-marker-alt"></i> ${volunteer.location}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Load Admin Section
    async loadAdminSection() {
        try {
            await this.loadStatistics();
            await this.loadActivityLog();
        } catch (error) {
            console.error('Error loading admin section:', error);
            ApiUtils.handleApiError(error, 'loading admin section');
        }
    }

    // Load statistics
    async loadStatistics() {
        try {
            const response = await api.getStatistics();
            const stats = response.data;

            // Update stat cards
            document.getElementById('total-resources').textContent = stats.totalResources || 0;
            document.getElementById('total-requests').textContent = stats.totalRequests || 0;
            document.getElementById('total-volunteers').textContent = stats.totalVolunteers || 0;
            document.getElementById('high-priority-requests').textContent = stats.highPriorityRequests || 0;
        } catch (error) {
            console.error('Error loading statistics:', error);
            throw error;
        }
    }

    // Load activity log
    async loadActivityLog() {
        const activityLog = document.getElementById('activity-log');
        
        // For MVP, show static recent activities
        activityLog.innerHTML = `
            <div class="activity-item">
                <div class="activity-content">
                    <strong>New emergency request submitted</strong><br>
                    <small>High priority request from downtown area</small>
                </div>
                <div class="activity-time">5 min ago</div>
            </div>
            <div class="activity-item">
                <div class="activity-content">
                    <strong>Volunteer registered</strong><br>
                    <small>Sarah Johnson joined as a volunteer</small>
                </div>
                <div class="activity-time">1 hour ago</div>
            </div>
            <div class="activity-item">
                <div class="activity-content">
                    <strong>Resource availability updated</strong><br>
                    <small>City General Hospital capacity changed</small>
                </div>
                <div class="activity-time">2 hours ago</div>
            </div>
            <div class="activity-item">
                <div class="activity-content">
                    <strong>Emergency request resolved</strong><br>
                    <small>Transportation request completed successfully</small>
                </div>
                <div class="activity-time">4 hours ago</div>
            </div>
        `;
    }

    // Handle category filter change
    async handleCategoryFilter(event) {
        this.filters.category = event.target.value;
        await this.loadResourcesSection();
    }

    // Handle search filter
    async handleSearchFilter(event) {
        this.filters.search = event.target.value;
        await this.loadResourcesSection();
    }

    // Toggle map visibility
    toggleMap() {
        const mapContainer = document.getElementById('map-container');
        const toggleBtn = document.getElementById('toggle-map');
        
        if (mapContainer.style.display === 'none') {
            mapContainer.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-map"></i> Hide Map';
            if (mapManager) {
                setTimeout(() => mapManager.resize(), 100);
            }
        } else {
            mapContainer.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-map"></i> Show Map';
        }
    }

    // Handle emergency form submission
    async handleEmergencySubmission(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const emergencyData = {
                requester_name: document.getElementById('requester-name').value,
                requester_phone: document.getElementById('requester-phone').value,
                requester_email: document.getElementById('requester-email').value,
                category_id: document.getElementById('emergency-category').value,
                description: document.getElementById('emergency-description').value,
                location: document.getElementById('emergency-location').value
            };

            // Add current location if available
            if (this.currentLocation) {
                emergencyData.latitude = this.currentLocation.latitude;
                emergencyData.longitude = this.currentLocation.longitude;
            }

            // Validate required fields
            if (!emergencyData.requester_name || !emergencyData.description) {
                showStatusMessage('Please fill in all required fields', 'error');
                return;
            }

            showStatusMessage('Submitting emergency request...', 'info', 1000);
            
            const response = await api.createEmergencyRequest(emergencyData);
            
            showStatusMessage('Emergency request submitted successfully!', 'success');
            
            // Reset form
            event.target.reset();
            this.currentLocation = null;
            
            // Refresh emergency requests if on that section
            if (this.currentSection === 'emergency') {
                await this.loadEmergencyRequests();
            }

            // Send real-time update
            if (realtimeManager.isConnected()) {
                realtimeManager.sendEmergencyUpdate(response.data);
            }
            
        } catch (error) {
            console.error('Error submitting emergency request:', error);
            ApiUtils.handleApiError(error, 'submitting emergency request');
        }
    }

    // Use current location
    async useCurrentLocation() {
        try {
            showStatusMessage('Getting your location...', 'info', 2000);
            
            const location = await ApiUtils.getCurrentLocation();
            this.currentLocation = location;
            
            // Update location field
            document.getElementById('emergency-location').value = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
            
            showStatusMessage('Location acquired successfully', 'success');
            
        } catch (error) {
            console.error('Error getting location:', error);
            showStatusMessage(error.message, 'error');
        }
    }

    // Handle volunteer registration
    async handleVolunteerRegistration(event) {
        event.preventDefault();
        
        try {
            const volunteerData = {
                name: document.getElementById('volunteer-name').value,
                email: document.getElementById('volunteer-email').value,
                phone: document.getElementById('volunteer-phone').value,
                location: document.getElementById('volunteer-location').value,
                skills: document.getElementById('volunteer-skills').value,
                availability: document.getElementById('volunteer-availability').value
            };

            // Validate required fields
            if (!volunteerData.name || !volunteerData.email) {
                showStatusMessage('Please fill in all required fields', 'error');
                return;
            }

            // Validate email
            if (!ApiUtils.validateEmail(volunteerData.email)) {
                showStatusMessage('Please enter a valid email address', 'error');
                return;
            }

            showStatusMessage('Registering volunteer...', 'info', 1000);
            
            await api.registerVolunteer(volunteerData);
            
            showStatusMessage('Volunteer registered successfully!', 'success');
            
            // Reset form
            event.target.reset();
            
            // Refresh volunteers list
            await this.loadVolunteers();
            
        } catch (error) {
            console.error('Error registering volunteer:', error);
            ApiUtils.handleApiError(error, 'registering volunteer');
        }
    }

    // Refresh all data
    async refreshAllData() {
        try {
            showStatusMessage('Refreshing all data...', 'info', 1000);
            
            await this.loadInitialData();
            
            // Refresh current section
            switch (this.currentSection) {
                case 'resources':
                    await this.loadResourcesSection();
                    break;
                case 'emergency':
                    await this.loadEmergencySection();
                    break;
                case 'volunteer':
                    await this.loadVolunteerSection();
                    break;
                case 'admin':
                    await this.loadAdminSection();
                    break;
            }
            
            showStatusMessage('Data refreshed successfully', 'success');
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            ApiUtils.handleApiError(error, 'refreshing data');
        }
    }

    // Export data (placeholder)
    async exportData() {
        showStatusMessage('Export functionality will be available soon', 'info');
    }

    // View activity logs (placeholder)
    async viewActivityLogs() {
        showStatusMessage('Detailed activity logs will be available soon', 'info');
    }

    // Handle new emergency request from real-time
    handleNewEmergencyRequest(event) {
        const data = event.detail;
        console.log('Handling new emergency request:', data);
        
        // Refresh emergency list if on emergency section
        if (this.currentSection === 'emergency') {
            this.loadEmergencyRequests();
        }
    }

    // Handle resource update from real-time
    handleResourceUpdate(event) {
        const data = event.detail;
        console.log('Handling resource update:', data);
        
        // Refresh resources if on resources section
        if (this.currentSection === 'resources') {
            // Find and update specific resource rather than reloading all
            const resourceIndex = this.resources.findIndex(r => r.id === data.id);
            if (resourceIndex !== -1) {
                this.resources[resourceIndex] = { ...this.resources[resourceIndex], ...data.resource };
                this.displayResources(this.resources);
            }
        }
    }

    // Handle resource marker click
    handleResourceMarkerClick(event) {
        const resource = event.detail.resource;
        console.log('Resource marker clicked:', resource);
        
        // Could show detailed modal or navigate to resource details
        showNotification(
            resource.name,
            resource.description || 'Resource information',
            'info'
        );
    }

    // Handle map click
    handleMapClick(event) {
        const latlng = event.detail.latlng;
        console.log('Map clicked at:', latlng);
        
        // Could be used for adding new resources or emergency requests
    }
    
    // Handle URL hash changes
    handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash && ['resources', 'emergency', 'volunteer', 'admin'].includes(hash)) {
            this.switchSection(hash);
        }
    }
}

// Global app instance
const app = new CommunityResourceApp();

// Global functions that need to be accessible from HTML
window.loadResourcesData = () => app.loadResourcesSection();
window.loadEmergencyRequests = () => app.loadEmergencyRequests();
window.loadVolunteersData = () => app.loadVolunteers();
window.loadStatistics = () => app.loadStatistics();
window.loadResourcesOnMap = () => app.loadResourcesOnMap();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await app.init();
        showStatusMessage('Community Resource Dashboard loaded successfully', 'success', 2000);
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showStatusMessage('Failed to load application. Please refresh the page.', 'error');
    }
});

// Handle browser back/forward navigation
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.section) {
        app.switchSection(event.state.section);
    }
});

// Export app instance for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CommunityResourceApp, app };
}