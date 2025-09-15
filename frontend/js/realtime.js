// Real-time Communication Manager
class RealtimeManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnected = false;
        this.eventHandlers = new Map();
    }

    // Initialize Socket.IO connection
    init() {
        try {
            this.socket = io('http://localhost:3001', {
                autoConnect: true,
                timeout: 5000,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });

            this.setupEventListeners();
            console.log('Real-time connection initialized');
        } catch (error) {
            console.error('Failed to initialize real-time connection:', error);
            showStatusMessage('Real-time features unavailable', 'warning');
        }
    }

    // Setup Socket.IO event listeners
    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('Connected to real-time server');
            showStatusMessage('Real-time connection established', 'success');
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('Disconnected from real-time server:', reason);
            showStatusMessage('Real-time connection lost', 'warning');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                showStatusMessage('Unable to establish real-time connection', 'error');
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            showStatusMessage('Real-time connection restored', 'success');
        });

        // Application-specific events
        this.socket.on('new-emergency', (data) => {
            this.handleNewEmergencyRequest(data);
        });

        this.socket.on('resource-updated', (data) => {
            this.handleResourceUpdate(data);
        });

        this.socket.on('request-status-updated', (data) => {
            this.handleRequestStatusUpdate(data);
        });

        this.socket.on('request-assigned', (data) => {
            this.handleRequestAssignment(data);
        });
    }

    // Handle new emergency request notification
    handleNewEmergencyRequest(data) {
        console.log('New emergency request received:', data);
        
        // Create notification
        showNotification(
            'New Emergency Request',
            `${data.requester_name} has submitted a ${data.priority} priority request`,
            'emergency'
        );

        // Update emergency list if visible
        if (isCurrentSection('emergency')) {
            loadEmergencyRequests();
        }

        // Update admin dashboard if visible
        if (isCurrentSection('admin')) {
            loadStatistics();
        }

        // Emit custom event for other components
        window.dispatchEvent(new CustomEvent('newEmergencyRequest', {
            detail: data
        }));
    }

    // Handle resource availability update
    handleResourceUpdate(data) {
        console.log('Resource updated:', data);
        
        // Update resource list if visible
        if (isCurrentSection('resources')) {
            updateResourceInList(data.resource);
        }

        // Update map markers
        if (mapManager) {
            mapManager.clearMarkers();
            loadResourcesOnMap();
        }

        // Show subtle notification for availability changes
        if (data.current_availability !== undefined) {
            showStatusMessage(
                `${data.resource.name} availability updated: ${data.current_availability} available`,
                'info'
            );
        }

        // Emit custom event
        window.dispatchEvent(new CustomEvent('resourceUpdated', {
            detail: data
        }));
    }

    // Handle request status update
    handleRequestStatusUpdate(data) {
        console.log('Request status updated:', data);
        
        // Update emergency list if visible
        if (isCurrentSection('emergency')) {
            updateEmergencyRequestInList(data.request);
        }

        // Show notification for important status changes
        const statusMessages = {
            'in-progress': 'Request is now being handled',
            'resolved': 'Request has been resolved',
            'closed': 'Request has been closed'
        };

        if (statusMessages[data.status]) {
            showStatusMessage(statusMessages[data.status], 'success');
        }

        // Emit custom event
        window.dispatchEvent(new CustomEvent('requestStatusUpdated', {
            detail: data
        }));
    }

    // Handle volunteer assignment
    handleRequestAssignment(data) {
        console.log('Request assigned to volunteer:', data);
        
        showNotification(
            'Request Assigned',
            `${data.volunteer.name} has been assigned to handle the request`,
            'success'
        );

        // Update emergency list
        if (isCurrentSection('emergency')) {
            loadEmergencyRequests();
        }

        // Emit custom event
        window.dispatchEvent(new CustomEvent('requestAssigned', {
            detail: data
        }));
    }

    // Join volunteer room (for volunteers to receive assignments)
    joinVolunteerRoom(volunteerId) {
        if (!this.socket || !this.isConnected) {
            console.log('Cannot join volunteer room: not connected');
            return;
        }

        this.socket.emit('join-volunteer', volunteerId);
        console.log(`Joined volunteer room: ${volunteerId}`);
    }

    // Join admin room (for administrators to receive notifications)
    joinAdminRoom() {
        if (!this.socket || !this.isConnected) {
            console.log('Cannot join admin room: not connected');
            return;
        }

        this.socket.emit('join-admin');
        console.log('Joined admin room');
    }

    // Send emergency update
    sendEmergencyUpdate(emergencyData) {
        if (!this.socket || !this.isConnected) {
            console.log('Cannot send emergency update: not connected');
            return false;
        }

        this.socket.emit('emergency-update', emergencyData);
        return true;
    }

    // Send resource update
    sendResourceUpdate(resourceData) {
        if (!this.socket || !this.isConnected) {
            console.log('Cannot send resource update: not connected');
            return false;
        }

        this.socket.emit('resource-update', resourceData);
        return true;
    }

    // Subscribe to custom events
    on(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(handler);
    }

    // Emit custom events
    emit(eventName, data) {
        if (this.eventHandlers.has(eventName)) {
            this.eventHandlers.get(eventName).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            });
        }
    }

    // Get connection status
    isConnected() {
        return this.isConnected && this.socket && this.socket.connected;
    }

    // Disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        console.log('Disconnected from real-time server');
    }

    // Reconnect manually
    reconnect() {
        if (this.socket) {
            this.socket.connect();
        } else {
            this.init();
        }
    }
}

// Global real-time manager instance
const realtimeManager = new RealtimeManager();

// Notification system
function showNotification(title, message, type = 'info', duration = 5000) {
    const notificationsContainer = document.getElementById('notifications');
    if (!notificationsContainer) return;

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">${title}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="notification-body">${message}</div>
    `;

    // Add type-specific styling
    const typeColors = {
        'success': '#38a169',
        'error': '#e53e3e',
        'warning': '#ed8936',
        'info': '#3182ce',
        'emergency': '#f56565'
    };

    if (typeColors[type]) {
        notification.style.borderLeft = `4px solid ${typeColors[type]}`;
    }

    // Add to container
    notificationsContainer.appendChild(notification);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }

    // Play notification sound for emergency
    if (type === 'emergency') {
        playNotificationSound();
    }
}

// Status message system
function showStatusMessage(message, type = 'info', duration = 3000) {
    const statusContainer = document.getElementById('status-messages');
    if (!statusContainer) return;

    const statusMessage = document.createElement('div');
    statusMessage.className = `status-message status-${type}`;
    statusMessage.textContent = message;

    statusContainer.appendChild(statusMessage);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (statusMessage.parentElement) {
                statusMessage.remove();
            }
        }, duration);
    }
}

// Play notification sound
function playNotificationSound() {
    // Create simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

// Utility functions for real-time updates
function isCurrentSection(sectionName) {
    const section = document.getElementById(`${sectionName}-section`);
    return section && section.classList.contains('active');
}

function updateResourceInList(resource) {
    // Find and update resource card in the list
    const resourceCards = document.querySelectorAll('.resource-card');
    resourceCards.forEach(card => {
        const titleElement = card.querySelector('.resource-title');
        if (titleElement && titleElement.textContent.trim() === resource.name) {
            // Update availability indicator
            const availabilityElement = card.querySelector('.resource-availability');
            if (availabilityElement && resource.current_availability !== undefined) {
                const availability = ApiUtils.formatAvailability(
                    resource.current_availability, 
                    resource.capacity
                );
                
                const indicator = availabilityElement.querySelector('.availability-indicator');
                if (indicator) {
                    indicator.textContent = availability.level;
                    indicator.className = `availability-indicator ${availability.className}`;
                }
                
                const text = availabilityElement.querySelector('.availability-text');
                if (text) {
                    text.textContent = availability.text;
                }
            }
            
            // Add visual update indicator
            card.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            setTimeout(() => {
                card.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }, 2000);
        }
    });
}

function updateEmergencyRequestInList(request) {
    // Find and update emergency request card in the list
    const emergencyCards = document.querySelectorAll('.emergency-card');
    emergencyCards.forEach(card => {
        // You could use a data attribute to match requests
        // For now, we'll reload the entire list
    });
    
    // Reload the emergency requests list
    loadEmergencyRequests();
}

// Initialize real-time features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize real-time connection
    realtimeManager.init();
    
    // Join admin room by default (in a real app, this would be role-based)
    setTimeout(() => {
        if (realtimeManager.isConnected) {
            realtimeManager.joinAdminRoom();
        }
    }, 1000);
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, reduce real-time activity if needed
        console.log('Page hidden - reducing real-time activity');
    } else {
        // Page is visible again, resume full activity
        console.log('Page visible - resuming real-time activity');
        
        // Refresh data when page becomes visible again
        if (realtimeManager.isConnected) {
            const currentSection = document.querySelector('.section.active');
            if (currentSection) {
                const sectionId = currentSection.id.replace('-section', '');
                refreshSectionData(sectionId);
            }
        }
    }
});

// Refresh section data based on current view
function refreshSectionData(sectionName) {
    switch (sectionName) {
        case 'resources':
            loadResourcesData();
            break;
        case 'emergency':
            loadEmergencyRequests();
            break;
        case 'volunteer':
            loadVolunteersData();
            break;
        case 'admin':
            loadStatistics();
            break;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        RealtimeManager, 
        realtimeManager, 
        showNotification, 
        showStatusMessage 
    };
}