// Internationalization (i18n) Module for Community Resource Dashboard

class I18nManager {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.defaultLanguage = 'en';
        this.storageKey = 'community_language';
        
        // Load saved language preference
        this.loadLanguagePreference();
        
        // Initialize translations
        this.initializeTranslations();
    }

    // Initialize all translations
    initializeTranslations() {
        this.translations = {
            // English translations
            en: {
                // Login page
                welcome: "Welcome Back",
                signin_message: "Sign in to access the admin dashboard",
                email: "Email Address",
                password: "Password",
                remember_me: "Remember me",
                forgot_password: "Forgot Password?",
                sign_in: "Sign In",
                or: "OR",
                demo_text: "Demo Login Credentials:",
                footer_text: "© 2024 Community Resource Dashboard",
                privacy: "Privacy Policy",
                terms: "Terms of Service",
                help: "Help",
                
                // Main dashboard
                dashboard_title: "Sahaayak",
                resources: "Resources",
                emergency: "Emergency",
                volunteer: "Volunteer",
                admin: "Admin",
                logout: "Logout",
                profile: "Profile",
                
                // Resources section
                resources_title: "Community Resources",
                all_categories: "All Categories",
                search_resources: "Search resources...",
                toggle_map: "Toggle Map",
                loading_resources: "Loading resources...",
                no_resources: "No resources found",
                
                // Emergency section
                emergency_title: "Submit Emergency Request",
                emergency_subtitle: "Get immediate help from community resources and volunteers",
                your_name: "Your Name",
                phone_number: "Phone Number",
                email_address: "Email",
                category: "Category",
                select_category: "Select category",
                description: "Description",
                describe_situation: "Please describe your situation in detail...",
                voice_to_text: "Click to speak",
                voice_listening: "Listening... Click to stop",
                voice_processing: "Processing speech...",
                voice_not_supported: "Voice recognition not supported",
                voice_started: "Voice recognition started. Please speak...",
                voice_completed: "Voice input completed successfully!",
                voice_error: "Voice recognition error occurred",
                voice_no_speech: "No speech detected. Please try again.",
                voice_no_microphone: "No microphone found. Please check your microphone.",
                voice_access_denied: "Microphone access denied. Please allow microphone access.",
                voice_network_error: "Network error occurred. Please check your connection.",
                location: "Location",
                enter_location: "Enter your address or location",
                use_current_location: "Use Current Location",
                submit_emergency: "Submit Emergency Request",
                recent_requests: "Recent Emergency Requests",
                loading_requests: "Loading emergency requests...",
                no_requests: "No emergency requests",
                
                // Volunteer section
                volunteer_title: "Volunteer Registration",
                volunteer_subtitle: "Join our community of helpers",
                full_name: "Full Name",
                skills_expertise: "Skills & Expertise",
                skills_placeholder: "e.g., First Aid, Transportation, Food Service, General Help",
                availability: "Availability",
                availability_placeholder: "e.g., Weekends, Evenings, Flexible",
                register_volunteer: "Register as Volunteer",
                active_volunteers: "Active Volunteers",
                loading_volunteers: "Loading volunteers...",
                no_volunteers: "No active volunteers",
                
                // Admin section
                admin_title: "Admin Dashboard",
                admin_subtitle: "Manage resources and monitor activities",
                active_resources: "Active Resources",
                open_requests: "Open Requests",
                high_priority: "High Priority",
                refresh_data: "Refresh Data",
                export_data: "Export Data",
                view_logs: "View Activity Logs",
                recent_activity: "Recent Activity",
                loading_activity: "Loading activity...",
                
                // Status messages
                loading: "Loading...",
                success: "Success",
                error: "Error",
                warning: "Warning",
                info: "Information",
                
                // Priority levels
                priority_high: "High Priority",
                priority_medium: "Medium Priority",
                priority_low: "Low Priority",
                
                // Status levels
                status_open: "Open",
                status_in_progress: "In Progress",
                status_resolved: "Resolved",
                status_closed: "Closed",
                status_active: "Active",
                status_inactive: "Inactive",
                
                // Availability
                availability_high: "High",
                availability_medium: "Medium",
                availability_low: "Low",
                
                // Actions
                save: "Save",
                cancel: "Cancel",
                edit: "Edit",
                delete: "Delete",
                view: "View",
                close: "Close",
                submit: "Submit",
                update: "Update",
                refresh: "Refresh",
                
                // Validation messages
                required_field: "This field is required",
                invalid_email: "Please enter a valid email address",
                invalid_phone: "Please enter a valid phone number",
                password_mismatch: "Passwords do not match",
                
                // Success messages
                login_success: "Login successful",
                logout_success: "Logout successful",
                data_saved: "Data saved successfully",
                request_submitted: "Request submitted successfully",
                volunteer_registered: "Volunteer registered successfully",
                
                // Error messages
                login_failed: "Login failed",
                network_error: "Network error occurred",
                server_error: "Server error occurred",
                unauthorized: "Unauthorized access",
                not_found: "Resource not found"
            },

            // Hindi translations (हिंदी)
            hi: {
                // Login page
                welcome: "स्वागत है",
                signin_message: "एडमिन डैशबोर्ड एक्सेस करने के लिए साइन इन करें",
                email: "ईमेल पता",
                password: "पासवर्ड",
                remember_me: "मुझे याद रखें",
                forgot_password: "पासवर्ड भूल गए?",
                sign_in: "साइन इन",
                or: "या",
                demo_text: "डेमो लॉगिन क्रेडेंशियल:",
                footer_text: "© 2024 सामुदायिक संसाधन डैशबोर्ड",
                privacy: "गोपनीयता नीति",
                terms: "सेवा की शर्तें",
                help: "सहायता",
                
                // Main dashboard
                dashboard_title: "सहायक",
                resources: "संसाधन",
                emergency: "आपातकाल",
                volunteer: "स्वयंसेवक",
                admin: "एडमिन",
                logout: "लॉग आउट",
                profile: "प्रोफ़ाइल",
                
                // Resources section
                resources_title: "सामुदायिक संसाधन",
                all_categories: "सभी श्रेणियां",
                search_resources: "संसाधन खोजें...",
                toggle_map: "मैप टॉगल करें",
                loading_resources: "संसाधन लोड हो रहे हैं...",
                no_resources: "कोई संसाधन नहीं मिला",
                
                // Emergency section
                emergency_title: "आपातकालीन अनुरोध सबमिट करें",
                emergency_subtitle: "सामुदायिक संसाधनों और स्वयंसेवकों से तत्काल सहायता प्राप्त करें",
                your_name: "आपका नाम",
                phone_number: "फोन नंबर",
                email_address: "ईमेल",
                category: "श्रेणी",
                select_category: "श्रेणी चुनें",
                description: "विवरण",
                describe_situation: "कृपया अपनी स्थिति का विस्तार से वर्णन करें...",
                voice_to_text: "बोलने के लिए क्लिक करें",
                voice_listening: "सुन रहा है... रोकने के लिए क्लिक करें",
                voice_processing: "भाषण प्रसंस्करण...",
                voice_not_supported: "आवाज पहचान समर्थित नहीं है",
                voice_started: "आवाज पहचान शुरू हुई। कृपया बोलें...",
                voice_completed: "आवाज इनपुट सफलतापूर्वक पूरा हुआ!",
                voice_error: "आवाज पहचान त्रुटि हुई",
                voice_no_speech: "कोई भाषण नहीं मिला। कृपया पुनः प्रयास करें।",
                voice_no_microphone: "कोई माइक्रोफोन नहीं मिला। कृपया अपना माइक्रोफोन जांचें।",
                voice_access_denied: "माइक्रोफोन एक्सेस अस्वीकृत। कृपया माइक्रोफोन एक्सेस की अनुमति दें।",
                voice_network_error: "नेटवर्क त्रुटि हुई। कृपया अपना कनेक्शन जांचें।",
                location: "स्थान",
                enter_location: "अपना पता या स्थान दर्ज करें",
                use_current_location: "वर्तमान स्थान का उपयोग करें",
                submit_emergency: "आपातकालीन अनुरोध सबमिट करें",
                recent_requests: "हाल के आपातकालीन अनुरोध",
                loading_requests: "आपातकालीन अनुरोध लोड हो रहे हैं...",
                no_requests: "कोई आपातकालीन अनुरोध नहीं",
                
                // Volunteer section
                volunteer_title: "स्वयंसेवक पंजीकरण",
                volunteer_subtitle: "हमारे सहायकों के समुदाय में शामिल हों",
                full_name: "पूरा नाम",
                skills_expertise: "कौशल और विशेषज्ञता",
                skills_placeholder: "जैसे, प्राथमिक चिकित्सा, परिवहन, खाद्य सेवा, सामान्य सहायता",
                availability: "उपलब्धता",
                availability_placeholder: "जैसे, सप्ताहांत, शाम, लचीला",
                register_volunteer: "स्वयंसेवक के रूप में पंजीकरण करें",
                active_volunteers: "सक्रिय स्वयंसेवक",
                loading_volunteers: "स्वयंसेवक लोड हो रहे हैं...",
                no_volunteers: "कोई सक्रिय स्वयंसेवक नहीं",
                
                // Admin section
                admin_title: "एडमिन डैशबोर्ड",
                admin_subtitle: "संसाधनों का प्रबंधन करें और गतिविधियों की निगरानी करें",
                active_resources: "सक्रिय संसाधन",
                open_requests: "खुले अनुरोध",
                high_priority: "उच्च प्राथमिकता",
                refresh_data: "डेटा रीफ्रेश करें",
                export_data: "डेटा निर्यात करें",
                view_logs: "गतिविधि लॉग देखें",
                recent_activity: "हाल की गतिविधि",
                loading_activity: "गतिविधि लोड हो रही है...",
                
                // Priority levels
                priority_high: "उच्च प्राथमिकता",
                priority_medium: "मध्यम प्राथमिकता",
                priority_low: "निम्न प्राथमिकता",
                
                // Status levels
                status_open: "खुला",
                status_in_progress: "प्रगति में",
                status_resolved: "हल हो गया",
                status_closed: "बंद",
                status_active: "सक्रिय",
                status_inactive: "निष्क्रिय"
            },

            // Marathi translations (मराठी)
            mr: {
                // Login page
                welcome: "स्वागत आहे",
                signin_message: "अॅडमिन डॅशबोर्ड अॅक्सेस करण्यासाठी साइन इन करा",
                email: "ईमेल पत्ता",
                password: "पासवर्ड",
                remember_me: "मला लक्षात ठेवा",
                forgot_password: "पासवर्ड विसरलात?",
                sign_in: "साइन इन",
                or: "किंवा",
                demo_text: "डेमो लॉगिन क्रेडेंशियल:",
                footer_text: "© 2024 समुदायिक संसाधन डॅशबोर्ड",
                privacy: "गोपनीयता धोरण",
                terms: "सेवेच्या अटी",
                help: "मदत",
                
                // Main dashboard
                dashboard_title: "सहाय्यक",
                resources: "संसाधने",
                emergency: "आणीबाणी",
                volunteer: "स्वयंसेवक",
                admin: "अॅडमिन",
                logout: "लॉग आउट",
                profile: "प्रोफाइल",
                
                // Resources section
                resources_title: "समुदायिक संसाधने",
                all_categories: "सर्व श्रेणी",
                search_resources: "संसाधने शोधा...",
                toggle_map: "नकाशा टॉगल करा",
                loading_resources: "संसाधने लोड होत आहेत...",
                no_resources: "कोणतीही संसाधने सापडली नाहीत",
                
                // Emergency section
                emergency_title: "आणीबाणीची विनंती सबमिट करा",
                emergency_subtitle: "समुदायिक संसाधने आणि स्वयंसेवकांकडून तत्काळ मदत मिळवा",
                your_name: "तुमचे नाव",
                phone_number: "फोन नंबर",
                email_address: "ईमेल",
                category: "श्रेणी",
                select_category: "श्रेणी निवडा",
                description: "वर्णन",
                describe_situation: "कृपया तुमच्या परिस्थितीचे तपशीलवार वर्णन करा...",
                voice_to_text: "बोलण्यासाठी क्लिक करा",
                voice_listening: "ऐकत आहे... थांबवण्यासाठी क्लिक करा",
                voice_processing: "भाषण प्रक्रिया...",
                voice_not_supported: "आवाज ओळख समर्थित नाही",
                voice_started: "आवाज ओळख सुरू झाली। कृपया बोला...",
                voice_completed: "आवाज इनपुट यशस्वीरीत्या पूर्ण झाले!",
                voice_error: "आवाज ओळख त्रुटी झाली",
                voice_no_speech: "कोणतेही भाषण आढळले नाही। कृपया पुन्हा प्रयत्न करा।",
                voice_no_microphone: "कोणताही मायक्रोफोन आढळला नाही। कृपया तुमचा मायक्रोफोन तपासा।",
                voice_access_denied: "मायक्रोफोन एक्सेस नाकारला। कृपया मायक्रोफोन एक्सेसची परवानगी द्या।",
                voice_network_error: "नेटवर्क त्रुटी झाली। कृपया तुमचे कनेक्शन तपासा।",
                location: "ठिकाण",
                enter_location: "तुमचा पत्ता किंवा ठिकाण प्रविष्ट करा",
                use_current_location: "सध्याचे ठिकाण वापरा",
                submit_emergency: "आणीबाणीची विनंती सबमिट करा",
                recent_requests: "अलीकडील आणीबाणीच्या विनंत्या",
                loading_requests: "आणीबाणीच्या विनंत्या लोड होत आहेत...",
                no_requests: "कोणत्याही आणीबाणीच्या विनंत्या नाहीत",
                
                // Volunteer section
                volunteer_title: "स्वयंसेवक नोंदणी",
                volunteer_subtitle: "आमच्या मदतगारांच्या समुदायात सामील व्हा",
                full_name: "पूर्ण नाव",
                skills_expertise: "कौशल्ये आणि तज्ञता",
                skills_placeholder: "उदा., प्राथमिक वैद्यकीय मदत, वाहतूक, अन्न सेवा, सामान्य मदत",
                availability: "उपलब्धता",
                availability_placeholder: "उदा., आठवड्याच्या शेवटी, संध्याकाळी, लवचिक",
                register_volunteer: "स्वयंसेवक म्हणून नोंदणी करा",
                active_volunteers: "सक्रिय स्वयंसेवक",
                loading_volunteers: "स्वयंसेवक लोड होत आहेत...",
                no_volunteers: "कोणतेही सक्रिय स्वयंसेवक नाहीत",
                
                // Admin section
                admin_title: "अॅडमिन डॅशबोर्ड",
                admin_subtitle: "संसाधनांचे व्यवस्थापन करा आणि क्रियाकलापांवर लक्ष ठेवा",
                active_resources: "सक्रिय संसाधने",
                open_requests: "उघड्या विनंत्या",
                high_priority: "उच्च प्राधान्य",
                refresh_data: "डेटा रीफ्रेश करा",
                export_data: "डेटा निर्यात करा",
                view_logs: "क्रियाकलाप लॉग पहा",
                recent_activity: "अलीकडील क्रियाकलाप",
                loading_activity: "क्रियाकलाप लोड होत आहे...",
                
                // Priority levels
                priority_high: "उच्च प्राधान्य",
                priority_medium: "मध्यम प्राधान्य",
                priority_low: "कमी प्राधान्य",
                
                // Status levels
                status_open: "उघडे",
                status_in_progress: "प्रगतीत",
                status_resolved: "निराकरण झाले",
                status_closed: "बंद",
                status_active: "सक्रिय",
                status_inactive: "निष्क्रिय"
            }
        };
    }

    // Load language preference from storage
    loadLanguagePreference() {
        const savedLanguage = localStorage.getItem(this.storageKey);
        if (savedLanguage && this.isValidLanguage(savedLanguage)) {
            this.currentLanguage = savedLanguage;
        } else {
            // Detect browser language
            const browserLanguage = navigator.language.substring(0, 2);
            if (this.isValidLanguage(browserLanguage)) {
                this.currentLanguage = browserLanguage;
            }
        }
    }

    // Check if language is valid
    isValidLanguage(language) {
        return Object.keys(this.translations).includes(language);
    }

    // Set current language
    setLanguage(language) {
        if (!this.isValidLanguage(language)) {
            console.warn(`Language ${language} not supported`);
            return false;
        }

        this.currentLanguage = language;
        localStorage.setItem(this.storageKey, language);
        
        // Update page content
        this.updatePageContent();
        
        // Dispatch language change event
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
        
        return true;
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Get translation for a key
    t(key, fallback = null) {
        const translations = this.translations[this.currentLanguage];
        const defaultTranslations = this.translations[this.defaultLanguage];
        
        // Try current language first
        if (translations && translations[key]) {
            return translations[key];
        }
        
        // Fall back to default language
        if (defaultTranslations && defaultTranslations[key]) {
            return defaultTranslations[key];
        }
        
        // Return fallback or key if no translation found
        return fallback || key;
    }

    // Update page content with current language
    updatePageContent() {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.type === 'submit' || element.type === 'button') {
                    element.value = translation;
                } else {
                    element.placeholder = translation;
                }
            } else {
                element.textContent = translation;
            }
        });
        
        // Update document title if exists
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            const titleKey = titleElement.getAttribute('data-i18n');
            document.title = this.t(titleKey);
        }
        
        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
    }

    // Initialize i18n for the page
    init() {
        this.updatePageContent();
        
        // Set up language selector if present
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = this.currentLanguage;
            languageSelect.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }
    }

    // Get available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    // Get language display names
    getLanguageNames() {
        return {
            'en': 'English',
            'hi': 'हिंदी',
            'mr': 'मराठी'
        };
    }
}

// Create global i18n manager instance
const i18n = new I18nManager();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { I18nManager, i18n };
}