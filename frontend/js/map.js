// Map Configuration for India
const DEFAULT_MAP_CENTER = [20.5937, 78.9629]; // Center of India
const DEFAULT_ZOOM = 6;
const MAX_ZOOM = 18;
const MIN_ZOOM = 4;

// Map Manager Class
class MapManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = [];
        this.currentMarkers = L.layerGroup();
        this.userLocationMarker = null;
        this.categoryColors = {
            'Healthcare': '#e74c3c',
            'Shelter': '#3498db', 
            'Food Distribution': '#27ae60',
            'Emergency Services': '#f39c12',
            'Mental Health': '#9b59b6',
            'Transportation': '#34495e'
        };
    }

    // Initialize the map
    initMap(center = DEFAULT_MAP_CENTER, zoom = DEFAULT_ZOOM) {
        try {
            // Create the map with explicit dimensions
            this.map = L.map(this.containerId, {
                center: center,
                zoom: zoom,
                maxZoom: MAX_ZOOM,
                minZoom: MIN_ZOOM,
                zoomControl: true,
                attributionControl: true,
                preferCanvas: false
            });
            
            // Ensure the container has proper dimensions
            const container = document.getElementById(this.containerId);
            if (container) {
                container.style.height = '500px';
                container.style.width = '100%';
                container.style.minHeight = '500px';
            }

            // Add tile layer (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: MAX_ZOOM
            }).addTo(this.map);

            // Add current markers layer to map
            this.currentMarkers.addTo(this.map);

            // Set up event listeners
            this.setupEventListeners();

            // Try to get user's current location
            this.addUserLocation();
            
            // Force map resize after a short delay
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                    console.log('Map resized and initialized');
                }
            }, 500);

            console.log('Map initialized successfully');
            return this.map;
        } catch (error) {
            console.error('Failed to initialize map:', error);
            throw error;
        }
    }

    // Setup map event listeners
    setupEventListeners() {
        if (!this.map) return;

        // Map click event
        this.map.on('click', (e) => {
            console.log('Map clicked at:', e.latlng);
            this.handleMapClick(e.latlng);
        });

        // Zoom event
        this.map.on('zoomend', () => {
            const zoom = this.map.getZoom();
            console.log('Map zoom changed to:', zoom);
        });

        // Move event (for updating visible resources)
        this.map.on('moveend', () => {
            const bounds = this.map.getBounds();
            console.log('Map bounds changed:', bounds);
            this.updateVisibleResources(bounds);
        });
    }

    // Handle map click events
    handleMapClick(latlng) {
        // Could be used for adding new resources or emergency requests
        const event = new CustomEvent('mapClick', {
            detail: { latlng }
        });
        window.dispatchEvent(event);
    }

    // Add user's current location to map
    async addUserLocation() {
        try {
            const location = await ApiUtils.getCurrentLocation();
            
            if (this.userLocationMarker) {
                this.map.removeLayer(this.userLocationMarker);
            }

            // Create user location marker
            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: '<i class="fas fa-user" style="color: #667eea; font-size: 20px;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            this.userLocationMarker = L.marker([location.latitude, location.longitude], {
                icon: userIcon,
                title: 'Your Location'
            }).addTo(this.map);

            // Add popup
            this.userLocationMarker.bindPopup(`
                <div class="user-location-popup">
                    <h4><i class="fas fa-user"></i> Your Location</h4>
                    <p>Accuracy: ±${Math.round(location.accuracy)}m</p>
                </div>
            `);

            // Center map on user location
            this.map.setView([location.latitude, location.longitude], DEFAULT_ZOOM);
            
            console.log('User location added to map');
        } catch (error) {
            console.log('Could not get user location:', error.message);
        }
    }

    // Add resources to map
    addResources(resources) {
        // Clear existing markers
        this.clearMarkers();

        resources.forEach(resource => {
            this.addResourceMarker(resource);
        });

        // Fit map to show all markers if there are any
        if (resources.length > 0) {
            this.fitToMarkers();
        }

        console.log(`Added ${resources.length} resource markers to map`);
    }

    // Add a single resource marker
    addResourceMarker(resource) {
        if (!resource.latitude || !resource.longitude) {
            return null;
        }

        const categoryColor = this.categoryColors[resource.category_name] || '#667eea';
        
        // Create custom icon
        const resourceIcon = L.divIcon({
            className: 'resource-marker',
            html: `
                <div class="resource-marker-content" style="background-color: ${categoryColor};">
                    <i class="${this.getCategoryIcon(resource.category_name)}"></i>
                </div>
            `,
            iconSize: [35, 35],
            iconAnchor: [17, 17],
            popupAnchor: [0, -17]
        });

        // Create marker
        const marker = L.marker([resource.latitude, resource.longitude], {
            icon: resourceIcon,
            title: resource.name
        });

        // Create popup content
        const popupContent = this.createResourcePopup(resource);
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'resource-popup'
        });

        // Add click event
        marker.on('click', () => {
            this.handleResourceMarkerClick(resource);
        });

        // Add to markers group
        marker.addTo(this.currentMarkers);
        this.markers.push(marker);

        return marker;
    }

    // Get category icon
    getCategoryIcon(categoryName) {
        const icons = {
            'Healthcare': 'fas fa-hospital',
            'Shelter': 'fas fa-home',
            'Food Distribution': 'fas fa-utensils',
            'Emergency Services': 'fas fa-exclamation-triangle',
            'Mental Health': 'fas fa-brain',
            'Transportation': 'fas fa-car'
        };
        return icons[categoryName] || 'fas fa-map-marker';
    }

    // Create resource popup content
    createResourcePopup(resource) {
        const availability = ApiUtils.formatAvailability(
            resource.current_availability, 
            resource.capacity
        );

        return `
            <div class="resource-popup-content">
                <div class="popup-header">
                    <h4>${resource.name}</h4>
                    <span class="resource-category" style="background-color: ${this.categoryColors[resource.category_name] || '#667eea'};">
                        ${resource.category_icon || ''} ${resource.category_name || 'Unknown'}
                    </span>
                </div>
                
                <div class="popup-body">
                    ${resource.description ? `<p class="description">${resource.description}</p>` : ''}
                    
                    <div class="resource-details">
                        ${resource.address ? `
                            <div class="detail-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${resource.address}</span>
                            </div>
                        ` : ''}
                        
                        ${resource.phone ? `
                            <div class="detail-item">
                                <i class="fas fa-phone"></i>
                                <a href="tel:${resource.phone}">${resource.phone}</a>
                            </div>
                        ` : ''}
                        
                        ${resource.operating_hours ? `
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>${resource.operating_hours}</span>
                            </div>
                        ` : ''}
                        
                        ${availability !== 'N/A' ? `
                            <div class="detail-item">
                                <i class="fas fa-users"></i>
                                <span class="availability ${availability.className}">
                                    ${availability.text}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="popup-actions">
                    <button class="btn btn-primary btn-sm" onclick="getDirections(${resource.latitude}, ${resource.longitude})">
                        <i class="fas fa-directions"></i> Directions
                    </button>
                    ${resource.website ? `
                        <a href="${resource.website}" target="_blank" class="btn btn-secondary btn-sm">
                            <i class="fas fa-external-link-alt"></i> Website
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Handle resource marker click
    handleResourceMarkerClick(resource) {
        console.log('Resource marker clicked:', resource);
        
        // Emit custom event
        const event = new CustomEvent('resourceMarkerClick', {
            detail: { resource }
        });
        window.dispatchEvent(event);
    }

    // Add emergency request markers
    addEmergencyRequests(requests) {
        requests.forEach(request => {
            this.addEmergencyMarker(request);
        });
    }

    // Add a single emergency request marker
    addEmergencyMarker(request) {
        if (!request.latitude || !request.longitude) {
            return null;
        }

        const priorityColors = {
            'high': '#f56565',
            'medium': '#ed8936',
            'low': '#38b2ac'
        };

        const color = priorityColors[request.priority] || '#718096';
        
        // Create custom icon for emergency request
        const emergencyIcon = L.divIcon({
            className: 'emergency-marker',
            html: `
                <div class="emergency-marker-content" style="background-color: ${color};">
                    <i class="fas fa-exclamation"></i>
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });

        // Create marker
        const marker = L.marker([request.latitude, request.longitude], {
            icon: emergencyIcon,
            title: `Emergency Request - ${request.priority} priority`
        });

        // Create popup content
        const popupContent = this.createEmergencyPopup(request);
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'emergency-popup'
        });

        // Add to markers group
        marker.addTo(this.currentMarkers);
        this.markers.push(marker);

        return marker;
    }

    // Create emergency request popup content
    createEmergencyPopup(request) {
        const priority = ApiUtils.formatPriority(request.priority);
        const status = ApiUtils.formatStatus(request.status);

        return `
            <div class="emergency-popup-content">
                <div class="popup-header">
                    <h4><i class="fas fa-exclamation-triangle"></i> Emergency Request</h4>
                    <div class="tags">
                        <span class="emergency-priority ${priority.class}">${priority.text}</span>
                        <span class="emergency-status ${status.class}">${status.text}</span>
                    </div>
                </div>
                
                <div class="popup-body">
                    <p class="requester"><strong>Requested by:</strong> ${request.requester_name}</p>
                    <p class="description">${request.description}</p>
                    
                    ${request.location ? `<p class="location"><i class="fas fa-map-marker-alt"></i> ${request.location}</p>` : ''}
                    
                    <p class="time"><i class="fas fa-clock"></i> ${ApiUtils.formatDate(request.created_at)}</p>
                    
                    ${request.assigned_volunteer_id ? `
                        <p class="volunteer"><i class="fas fa-user"></i> Assigned to volunteer</p>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Clear all markers
    clearMarkers() {
        this.currentMarkers.clearLayers();
        this.markers = [];
    }

    // Fit map to show all markers
    fitToMarkers() {
        if (this.markers.length === 0) return;

        const group = new L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
    }

    // Update visible resources based on map bounds
    updateVisibleResources(bounds) {
        // This could be used to load resources only in visible area
        // For now, we'll just emit an event
        const event = new CustomEvent('mapBoundsChanged', {
            detail: { bounds }
        });
        window.dispatchEvent(event);
    }

    // Get map center
    getCenter() {
        return this.map ? this.map.getCenter() : null;
    }

    // Set map center
    setCenter(lat, lng, zoom = null) {
        if (!this.map) return;
        
        if (zoom) {
            this.map.setView([lat, lng], zoom);
        } else {
            this.map.setView([lat, lng]);
        }
    }

    // Get current zoom level
    getZoom() {
        return this.map ? this.map.getZoom() : null;
    }

    // Set zoom level
    setZoom(zoom) {
        if (!this.map) return;
        this.map.setZoom(zoom);
    }

    // Resize map (useful when container size changes)
    resize() {
        if (!this.map) return;
        
        setTimeout(() => {
            this.map.invalidateSize();
        }, 100);
    }

    // Destroy map instance
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.markers = [];
        this.userLocationMarker = null;
    }
}

// Global map instance
let mapManager = null;

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        try {
            // Ensure Leaflet is loaded
            if (typeof L === 'undefined') {
                console.error('Leaflet library not loaded');
                mapContainer.innerHTML = `
                    <div class="map-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Map library not loaded. Please refresh the page.</p>
                    </div>
                `;
                return;
            }
            
            mapManager = new MapManager('map');
            mapManager.initMap();
            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Failed to initialize map:', error);
            mapContainer.innerHTML = `
                <div class="map-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load map: ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-secondary">Retry</button>
                </div>
            `;
        }
    }
});

// Global functions for popup actions
window.getDirections = function(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
};

// Handle map visibility toggle
window.toggleMapVisibility = function() {
    const mapContainer = document.getElementById('map-container');
    const toggleBtn = document.getElementById('toggle-map');
    
    if (mapContainer.style.display === 'none') {
        mapContainer.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-map"></i> Hide Map';
        if (mapManager) {
            mapManager.resize();
        }
    } else {
        mapContainer.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-map"></i> Show Map';
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapManager };
}

// CSS styles for map markers (injected dynamically)
const mapStyles = `
    .resource-marker {
        border: none;
        background: transparent;
    }
    
    .resource-marker-content {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        border: 2px solid white;
    }
    
    .emergency-marker {
        border: none;
        background: transparent;
    }
    
    .emergency-marker-content {
        width: 30px;
        height: 30px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        border: 1px solid white;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    .user-location-marker {
        border: none;
        background: transparent;
    }
    
    .resource-popup-content .popup-header {
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 0.5rem;
        margin-bottom: 0.75rem;
    }
    
    .resource-popup-content h4 {
        margin: 0 0 0.5rem 0;
        color: #2d3748;
    }
    
    .resource-popup-content .resource-category {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        color: white;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .resource-popup-content .description {
        color: #4a5568;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
    }
    
    .resource-popup-content .detail-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }
    
    .resource-popup-content .detail-item i {
        width: 16px;
        color: #718096;
    }
    
    .resource-popup-content .popup-actions {
        border-top: 1px solid #e2e8f0;
        padding-top: 0.75rem;
        margin-top: 0.75rem;
        display: flex;
        gap: 0.5rem;
    }
    
    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
    }
    
    .map-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #718096;
        text-align: center;
    }
    
    .map-error i {
        font-size: 2rem;
        margin-bottom: 1rem;
    }
`;

// Inject map styles
const styleSheet = document.createElement('style');
styleSheet.textContent = mapStyles;
document.head.appendChild(styleSheet);