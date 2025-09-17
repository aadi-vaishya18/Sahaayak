/**
 * Voice-to-Text functionality for Emergency Description
 * Uses Web Speech API for speech recognition
 */

class VoiceToText {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isProcessing = false;
        this.textareaElement = null;
        this.buttonElement = null;
        this.originalText = '';
        
        // Check browser support
        this.isSupported = this.checkBrowserSupport();
        
        this.init();
    }

    checkBrowserSupport() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    init() {
        // Get DOM elements
        this.textareaElement = document.getElementById('emergency-description');
        this.buttonElement = document.getElementById('voice-to-text-btn');
        
        if (!this.textareaElement || !this.buttonElement) {
            console.warn('Voice-to-text: Required elements not found');
            return;
        }

        // Check browser support
        if (!this.isSupported) {
            this.showUnsupportedState();
            return;
        }

        // Setup speech recognition
        this.setupSpeechRecognition();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Add status indicator
        this.addStatusIndicator();
        
        console.log('Voice-to-text initialized successfully');
    }

    setupSpeechRecognition() {
        // Create speech recognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition settings
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.getLanguage();
        this.recognition.maxAlternatives = 1;
        
        // Event handlers
        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onresult = (event) => this.onRecognitionResult(event);
        this.recognition.onerror = (event) => this.onRecognitionError(event);
        this.recognition.onend = () => this.onRecognitionEnd();
    }

    getLanguage() {
        // Get current language from i18n or default to English
        const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : 'en';
        
        switch (currentLang) {
            case 'hi':
                return 'hi-IN'; // Hindi
            case 'mr':
                return 'mr-IN'; // Marathi
            default:
                return 'en-IN'; // English (India)
        }
    }

    setupEventListeners() {
        this.buttonElement.addEventListener('click', () => this.toggleRecognition());
        
        // Listen for language changes
        document.addEventListener('languageChanged', () => {
            if (this.recognition) {
                this.recognition.lang = this.getLanguage();
            }
        });
    }

    addStatusIndicator() {
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'voice-status';
        this.buttonElement.appendChild(statusIndicator);
    }

    toggleRecognition() {
        if (this.isListening) {
            this.stopRecognition();
        } else {
            this.startRecognition();
        }
    }

    startRecognition() {
        if (!this.recognition || this.isListening) return;
        
        try {
            // Store original text
            this.originalText = this.textareaElement.value;
            
            // Update UI state
            this.setListeningState(true);
            
            // Start recognition
            this.recognition.start();
            
            // Show status message
            this.showStatusMessage('Voice recognition started. Please speak...', 'info');
            
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.showStatusMessage('Failed to start voice recognition', 'error');
            this.setListeningState(false);
        }
    }

    stopRecognition() {
        if (!this.recognition || !this.isListening) return;
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error stopping speech recognition:', error);
        }
    }

    onRecognitionStart() {
        console.log('Speech recognition started');
        this.isListening = true;
        this.setListeningState(true);
    }

    onRecognitionResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // Process recognition results
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update textarea with results
        this.updateTextarea(finalTranscript, interimTranscript);
    }

    onRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Speech recognition error occurred';
        
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage = 'No microphone found. Please check your microphone.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access denied. Please allow microphone access.';
                break;
            case 'network':
                errorMessage = 'Network error occurred. Please check your connection.';
                break;
            case 'language-not-supported':
                errorMessage = 'Language not supported. Switching to English.';
                this.recognition.lang = 'en-IN';
                break;
        }
        
        this.showStatusMessage(errorMessage, 'error');
        this.setListeningState(false);
    }

    onRecognitionEnd() {
        console.log('Speech recognition ended');
        this.isListening = false;
        this.setListeningState(false);
        
        if (this.textareaElement.value.trim()) {
            this.showStatusMessage('Voice input completed successfully!', 'success');
        }
    }

    updateTextarea(finalText, interimText) {
        if (finalText) {
            // Add final text to textarea
            const currentValue = this.textareaElement.value;
            const newValue = currentValue + (currentValue ? ' ' : '') + finalText;
            this.textareaElement.value = newValue;
            
            // Trigger input event for any listeners
            this.textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Show interim results in placeholder or status
        if (interimText) {
            console.log('Interim result:', interimText);
        }
    }

    setListeningState(listening) {
        this.isListening = listening;
        
        if (listening) {
            this.buttonElement.classList.add('listening');
            this.buttonElement.title = 'Click to stop recording';
            this.buttonElement.innerHTML = '<i class="fas fa-stop"></i>';
        } else {
            this.buttonElement.classList.remove('listening', 'processing');
            this.buttonElement.title = 'Click to speak';
            this.buttonElement.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }

    setProcessingState(processing) {
        this.isProcessing = processing;
        
        if (processing) {
            this.buttonElement.classList.add('processing');
            this.buttonElement.innerHTML = '<i class="fas fa-spinner"></i>';
        } else {
            this.buttonElement.classList.remove('processing');
        }
    }

    showUnsupportedState() {
        this.buttonElement.disabled = true;
        this.buttonElement.title = 'Voice recognition not supported in this browser';
        this.buttonElement.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        this.buttonElement.style.opacity = '0.5';
        
        console.warn('Speech recognition not supported in this browser');
    }

    showStatusMessage(message, type = 'info') {
        // Use the global status message function if available
        if (typeof showStatusMessage === 'function') {
            showStatusMessage(message, type);
        } else {
            console.log(`[Voice] ${type.toUpperCase()}: ${message}`);
        }
    }

    // Public method to change language
    setLanguage(language) {
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }

    // Public method to clear text
    clearText() {
        if (this.textareaElement) {
            this.textareaElement.value = '';
        }
    }

    // Cleanup method
    destroy() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        
        if (this.buttonElement) {
            this.buttonElement.removeEventListener('click', this.toggleRecognition);
        }
        
        this.recognition = null;
        this.textareaElement = null;
        this.buttonElement = null;
    }
}

// Initialize voice-to-text when DOM is ready
let voiceToText = null;

document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other components to initialize
    setTimeout(() => {
        voiceToText = new VoiceToText();
    }, 500);
});

// Export for potential external use
window.VoiceToText = VoiceToText;