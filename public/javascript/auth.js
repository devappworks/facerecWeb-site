// Authentication management
class AuthManager {
    constructor() {
        this.tokenKey = 'photolytics_auth_token';
        this.emailKey = 'photolytics_user_email';
        this.loginApiUrl = 'https://facerecognition.mpanel.app/api/auth/token-by-email';
        
        // Debounce flags
        this.isLoggingOut = false;
        this.isLoggingIn = false;
        
        // DOM elements
        this.loginSection = document.getElementById('loginSection');
        this.mainApplication = document.getElementById('mainApplication');
        this.transitionLoader = document.getElementById('transitionLoader');
        this.initialLoader = document.getElementById('initialLoader');
        this.loginForm = document.getElementById('loginForm');
        this.emailInput = document.getElementById('emailInput');
        this.loginButton = document.getElementById('loginButton');
        this.loginButtonText = document.getElementById('loginButtonText');
        this.loginSpinner = document.getElementById('loginSpinner');
        this.loginAlert = document.getElementById('loginAlert');
        this.logoutButton = document.getElementById('logoutButton');
        this.userEmailDisplay = document.getElementById('userEmail');
        
        this.init();
    }
    
    init() {
        console.log('AuthManager initializing...');
        
        // Check if DOM elements exist
        if (!this.loginSection || !this.mainApplication) {
            console.error('Required DOM elements not found:', {
                loginSection: !!this.loginSection,
                mainApplication: !!this.mainApplication,
                transitionLoader: !!this.transitionLoader
            });
            return;
        }
        
        // Check authentication status on page load
        this.checkAuthStatus();
        
        // Add event listeners
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (this.logoutButton) {
            this.logoutButton.addEventListener('click', () => this.handleLogout());
        }
        
        console.log('AuthManager initialized successfully');
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem(this.tokenKey);
        const email = localStorage.getItem(this.emailKey);
        return !!(token && email);
    }
    
    // Get stored token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }
    
    // Get stored email
    getEmail() {
        return localStorage.getItem(this.emailKey);
    }
    
    // Save authentication data
    saveAuthData(email, token) {
        localStorage.setItem(this.emailKey, email);
        localStorage.setItem(this.tokenKey, token);
    }
    
    // Clear authentication data
    clearAuthData() {
        localStorage.removeItem(this.emailKey);
        localStorage.removeItem(this.tokenKey);
    }
    
    // Check authentication status and show appropriate UI
    checkAuthStatus() {
        console.log('Checking auth status...');
        const isAuth = this.isAuthenticated();
        console.log('Is authenticated:', isAuth);
        console.log('Token:', this.getToken());
        console.log('Email:', this.getEmail());
        
        // Hide domain selection modal if it's open
        this.hideDomainSelectionModal();
        
        // Hide initial loader first
        if (this.initialLoader) {
            this.initialLoader.style.display = 'none';
            this.initialLoader.style.visibility = 'hidden';
            this.initialLoader.style.pointerEvents = 'none';
            this.initialLoader.style.zIndex = '-1';
        }
        
        // Force hide transition loader
        if (this.transitionLoader) {
            this.transitionLoader.style.display = 'none';
            this.transitionLoader.style.opacity = '0';
            this.transitionLoader.style.visibility = 'hidden';
            this.transitionLoader.style.pointerEvents = 'none';
            this.transitionLoader.style.zIndex = '-1';
        }
        
        if (isAuth) {
            console.log('User is authenticated, showing main app');
            // Hide login immediately and show main app (no animation on page load)
            if (this.loginSection) {
                this.loginSection.style.display = 'none';
                this.loginSection.style.opacity = '0';
                this.loginSection.style.visibility = 'hidden';
                this.loginSection.style.pointerEvents = 'none';
                this.loginSection.style.zIndex = '-1';
            }
            
            if (this.mainApplication) {
                this.mainApplication.style.display = 'block';
                this.mainApplication.style.opacity = '1';
                this.mainApplication.style.transform = 'translateY(0)';
                this.mainApplication.style.visibility = 'visible';
                this.mainApplication.style.pointerEvents = 'auto';
                this.mainApplication.style.zIndex = '1';
            }
            
            // Set user email
            if (this.userEmailDisplay) {
                this.userEmailDisplay.textContent = this.getEmail();
            }
            
            // Ensure event listeners are attached
            setTimeout(() => {
                this.reattachEventListeners();
            }, 100);
            
        } else {
            console.log('User is not authenticated, showing login');
            // Hide main app and show login
            if (this.mainApplication) {
                this.mainApplication.style.display = 'none';
                this.mainApplication.style.opacity = '0';
                this.mainApplication.style.visibility = 'hidden';
                this.mainApplication.style.pointerEvents = 'none';
                this.mainApplication.style.zIndex = '-1';
            }
            
            if (this.loginSection) {
                this.loginSection.style.display = 'flex';
                this.loginSection.style.opacity = '1';
                this.loginSection.style.transform = 'scale(1)';
                this.loginSection.style.visibility = 'visible';
                this.loginSection.style.pointerEvents = 'auto';
                this.loginSection.style.zIndex = '10';
            }
        }
    }
    
    // Show login section
    showLoginSection() {
        console.log('Showing login section');
        
        // Immediately hide and disable transition loader
        if (this.transitionLoader) {
            this.transitionLoader.style.display = 'none !important';
            this.transitionLoader.style.opacity = '0';
            this.transitionLoader.style.visibility = 'hidden';
            this.transitionLoader.style.pointerEvents = 'none';
            this.transitionLoader.style.zIndex = '-1';
        }
        
        // Hide main application with fade out if it's visible
        if (this.mainApplication && this.mainApplication.style.display !== 'none' && this.mainApplication.offsetParent !== null) {
            this.mainApplication.style.opacity = '0';
            this.mainApplication.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.mainApplication.style.display = 'none';
                this.mainApplication.style.visibility = 'hidden';
                this.mainApplication.style.pointerEvents = 'none';
                this.mainApplication.style.zIndex = '-1';
                this.showLoginWithAnimation();
            }, 300);
        } else {
            // Main app is already hidden, just show login
            if (this.mainApplication) {
                this.mainApplication.style.display = 'none';
                this.mainApplication.style.visibility = 'hidden';
                this.mainApplication.style.pointerEvents = 'none';
                this.mainApplication.style.zIndex = '-1';
            }
            this.showLoginWithAnimation();
        }
    }
    
    // Helper method to show login with animation
    showLoginWithAnimation() {
        if (this.loginSection) {
            this.loginSection.style.display = 'flex';
            this.loginSection.style.visibility = 'visible';
            this.loginSection.style.pointerEvents = 'auto';
            this.loginSection.style.zIndex = '10';
            this.loginSection.style.opacity = '0';
            this.loginSection.style.transform = 'scale(0.95)';
            
            // Force reflow
            this.loginSection.offsetHeight;
            
            // Animate in
            this.loginSection.style.transition = 'all 0.6s ease-out';
            this.loginSection.style.opacity = '1';
            this.loginSection.style.transform = 'scale(1)';
            
            // Focus email input after animation
            setTimeout(() => {
                if (this.emailInput) {
                    this.emailInput.focus();
                }
            }, 600);
        }
    }
    
    // Show main application
    showMainApplication() {
        console.log('Showing main application');
        
        // Step 1: Fade out login section
        if (this.loginSection) {
            this.loginSection.style.opacity = '0';
            this.loginSection.style.transform = 'scale(0.95)';
        }
        
        setTimeout(() => {
            // Step 2: Completely hide login and show loader immediately (no fade)
            if (this.loginSection) {
                this.loginSection.style.display = 'none';
                this.loginSection.style.visibility = 'hidden';
                this.loginSection.style.pointerEvents = 'none';
                this.loginSection.style.zIndex = '-1';
            }
            
            if (this.transitionLoader) {
                this.transitionLoader.style.display = 'flex';
                this.transitionLoader.style.visibility = 'visible';
                this.transitionLoader.style.pointerEvents = 'auto';
                this.transitionLoader.style.zIndex = '9999';
                this.transitionLoader.style.opacity = '1'; // Show immediately without fade
            }
            
            setTimeout(() => {
                // Step 3: Hide loader and show main application
                if (this.transitionLoader) {
                    this.transitionLoader.style.display = 'none';
                    this.transitionLoader.style.visibility = 'hidden';
                    this.transitionLoader.style.pointerEvents = 'none';
                    this.transitionLoader.style.zIndex = '-1';
                }
                
                // Show main application
                if (this.mainApplication) {
                    this.mainApplication.style.display = 'block';
                    this.mainApplication.style.visibility = 'visible';
                    this.mainApplication.style.pointerEvents = 'auto';
                    this.mainApplication.style.zIndex = '1';
                    
                    if (this.userEmailDisplay) {
                        this.userEmailDisplay.textContent = this.getEmail();
                    }
                    
                    // Reset and animate main app
                    this.mainApplication.style.opacity = '0';
                    this.mainApplication.style.transform = 'translateY(20px)';
                    
                    // Force reflow
                    this.mainApplication.offsetHeight;
                    
                    // Animate in
                    this.mainApplication.style.transition = 'all 0.6s ease-out';
                    this.mainApplication.style.opacity = '1';
                    this.mainApplication.style.transform = 'translateY(0)';
                    
                    // Re-attach event listeners to ensure they work
                    this.reattachEventListeners();
                }
                
            }, 800); // Reduced from 1200ms to 800ms - shorter welcome screen time
            
        }, 300); // Wait for login section to fade out
    }
    
    // Re-attach event listeners to ensure they work after transitions
    reattachEventListeners() {
        console.log('Reattaching event listeners...');
        
        // Re-attach logout button listener with proper cleanup
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            // Clone the button to remove all existing event listeners
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            // Add fresh listener to the new button
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleLogout();
            });
            
            // Update reference
            this.logoutButton = newLogoutBtn;
        }
        
        // Re-initialize main app event listeners
        if (window.reinitializeMainApp) {
            window.reinitializeMainApp();
        }
        
        // Ensure upload form and other elements are clickable
        const uploadForm = document.getElementById('uploadForm');
        const fileInput = document.getElementById('fileInput');
        const uploadZone = document.querySelector('.upload-zone');
        
        if (uploadForm) {
            uploadForm.style.pointerEvents = 'auto';
        }
        if (fileInput) {
            fileInput.style.pointerEvents = 'auto';
        }
        if (uploadZone) {
            uploadZone.style.pointerEvents = 'auto';
        }
        
        console.log('Event listeners reattached successfully');
    }
    
    // Handle login form submission
    async handleLogin(e) {
        e.preventDefault();
        
        // Prevent multiple simultaneous login operations
        if (this.isLoggingIn) {
            console.log('Login already in progress, ignoring...');
            return;
        }
        
        const email = this.emailInput.value.trim();
        if (!email) {
            this.showLoginAlert('Please enter your email address', 'danger');
            return;
        }
        
        // Validate email format
        if (!this.isValidEmail(email)) {
            this.showLoginAlert('Please enter a valid email address', 'danger');
            return;
        }
        
        try {
            this.isLoggingIn = true;
            this.setLoginLoading(true);
            this.hideLoginAlert();
            
            const response = await fetch(this.loginApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });
            
            const data = await response.json();
            
            if (data.success && data.data) {
                // Check if data is an array (multiple domains) or object (single domain)
                if (Array.isArray(data.data)) {
                    // Multiple domains - show domain selection modal
                    console.log('Multiple domains received:', data.data);
                    this.showLoginAlert('Multiple domains available. Please select one...', 'info');
                    this.showDomainSelection(data.data, email);
                    this.isLoggingIn = false;
                } else {
                    // Single domain - proceed as before
                    console.log('Single domain received:', data.data);
                    const { email: userEmail, token } = data.data;
                    this.saveAuthData(userEmail, token);
                    this.showLoginAlert('Login successful! Redirecting...', 'success');
                    
                    // Small delay before showing main app for better UX
                    setTimeout(() => {
                        this.showMainApplication();
                        this.resetLoginForm();
                        this.isLoggingIn = false;
                    }, 1000);
                }
            } else {
                // Failed login
                const errorMessage = data.error || 'Login failed. Please try again.';
                this.showLoginAlert(errorMessage, 'danger');
                this.isLoggingIn = false;
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginAlert('Connection error. Please check your internet connection and try again.', 'danger');
            this.isLoggingIn = false;
        } finally {
            this.setLoginLoading(false);
        }
    }
    
    // Show domain selection modal
    showDomainSelection(domains, email) {
        console.log('Showing domain selection for domains:', domains);
        
        const modal = document.getElementById('domainSelectionModal');
        const domainList = document.getElementById('domainList');
        
        if (!modal || !domainList) {
            console.error('Domain selection modal elements not found');
            this.showLoginAlert('Error loading domain selection. Please try again.', 'danger');
            return;
        }
        
        // Clear previous domain options
        domainList.innerHTML = '';
        
        // Create domain options
        domains.forEach((domainData, index) => {
            const domainButton = document.createElement('button');
            domainButton.className = 'domain-option';
            domainButton.innerHTML = `
                <div class="domain-name">${domainData.domain}</div>
                <div class="domain-icon">
                    <i class="bi bi-arrow-right-circle"></i>
                </div>
            `;
            
            domainButton.addEventListener('click', () => {
                this.selectDomain(domainData, email);
            });
            
            domainList.appendChild(domainButton);
        });
        
        // Show the modal
        const modalInstance = new bootstrap.Modal(modal, {
            backdrop: 'static',
            keyboard: false
        });
        modalInstance.show();
        
        // Store modal instance for later use
        this.domainModalInstance = modalInstance;
    }
    
    // Handle domain selection
    selectDomain(selectedDomainData, email) {
        console.log('Domain selected:', selectedDomainData);
        
        try {
            // Save the selected domain's data
            this.saveAuthData(selectedDomainData.email, selectedDomainData.token);
            
            // Show success message
            this.showLoginAlert('Domain selected! Logging in...', 'success');
            
            // Close the modal
            if (this.domainModalInstance) {
                this.domainModalInstance.hide();
            }
            
            // Small delay before showing main app
            setTimeout(() => {
                this.showMainApplication();
                this.resetLoginForm();
            }, 1000);
            
        } catch (error) {
            console.error('Error selecting domain:', error);
            this.showLoginAlert('Error selecting domain. Please try again.', 'danger');
        }
    }
    
    // Hide domain selection modal
    hideDomainSelectionModal() {
        if (this.domainModalInstance) {
            try {
                this.domainModalInstance.hide();
                this.domainModalInstance = null;
            } catch (error) {
                console.log('Modal already disposed or hidden');
            }
        }
        
        // Also hide via direct DOM manipulation as fallback
        const modal = document.getElementById('domainSelectionModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            
            // Remove backdrop if it exists
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            
            // Restore body scroll
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
        }
    }
    
    // Handle logout
    handleLogout() {
        // Prevent multiple simultaneous logout operations
        if (this.isLoggingOut) {
            console.log('Logout already in progress, ignoring...');
            return;
        }
        
        console.log('Logout initiated');
        this.isLoggingOut = true;
        
        // Hide domain selection modal if it's open
        this.hideDomainSelectionModal();
        
        // Prevent multiple clicks
        if (this.logoutButton) {
            this.logoutButton.disabled = true;
            this.logoutButton.innerHTML = '<i class="bi bi-box-arrow-right"></i> Logging out...';
        }
        
        // Clear authentication data immediately
        this.clearAuthData();
        
        // Clear any existing results
        const result1 = document.getElementById('result1');
        const result2 = document.getElementById('result2');
        if (result1) result1.innerHTML = '<p class="text-muted">Results will be displayed after upload...</p>';
        if (result2) result2.innerHTML = '<p class="text-muted">Results will be displayed after upload...</p>';
        
        // Clear file input and preview
        const fileInput = document.getElementById('fileInput');
        const previewContainer = document.getElementById('previewContainer');
        const uploadPrompt = document.getElementById('uploadPrompt');
        
        if (fileInput) fileInput.value = '';
        if (previewContainer) previewContainer.style.display = 'none';
        if (uploadPrompt) uploadPrompt.style.display = 'block';
        
        // Reset login form
        this.resetLoginForm();
        
        // Show login section immediately
        setTimeout(() => {
            this.showLoginSection();
            
            // Re-enable logout button for next time and reset flag
            setTimeout(() => {
                if (this.logoutButton) {
                    this.logoutButton.disabled = false;
                    this.logoutButton.innerHTML = '<i class="bi bi-box-arrow-right"></i> Logout';
                }
                this.isLoggingOut = false;
                console.log('Logout completed');
            }, 500);
        }, 100);
    }
    
    // Set login button loading state
    setLoginLoading(isLoading) {
        this.loginButton.disabled = isLoading;
        this.emailInput.disabled = isLoading;
        
        if (isLoading) {
            this.loginButtonText.textContent = 'Logging in...';
            this.loginSpinner.style.display = 'inline-block';
        } else {
            this.loginButtonText.textContent = 'Login';
            this.loginSpinner.style.display = 'none';
        }
    }
    
    // Show login alert message
    showLoginAlert(message, type = 'info') {
        this.loginAlert.className = `alert alert-${type}`;
        this.loginAlert.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-${this.getAlertIcon(type)} me-2"></i>
                <span>${message}</span>
            </div>
        `;
        this.loginAlert.style.display = 'block';
    }
    
    // Hide login alert
    hideLoginAlert() {
        this.loginAlert.style.display = 'none';
    }
    
    // Get appropriate icon for alert type
    getAlertIcon(type) {
        const icons = {
            success: 'check-circle-fill',
            danger: 'exclamation-triangle-fill',
            warning: 'exclamation-triangle-fill',
            info: 'info-circle-fill'
        };
        return icons[type] || 'info-circle-fill';
    }
    
    // Reset login form
    resetLoginForm() {
        this.emailInput.value = '';
        this.hideLoginAlert();
        this.setLoginLoading(false);
    }
    
    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AuthManager...');
    
    // Add small delay to ensure all elements are properly loaded
    setTimeout(() => {
        try {
            window.authManager = new AuthManager();
        } catch (error) {
            console.error('Error initializing AuthManager:', error);
            
            // Fallback: hide loader and show login
            const initialLoader = document.getElementById('initialLoader');
            const transitionLoader = document.getElementById('transitionLoader');
            const loginSection = document.getElementById('loginSection');
            const mainApplication = document.getElementById('mainApplication');
            
            if (initialLoader) {
                initialLoader.style.display = 'none';
                initialLoader.style.visibility = 'hidden';
                initialLoader.style.pointerEvents = 'none';
                initialLoader.style.zIndex = '-1';
            }
            
            if (transitionLoader) {
                transitionLoader.style.display = 'none';
                transitionLoader.style.visibility = 'hidden';
                transitionLoader.style.pointerEvents = 'none';
                transitionLoader.style.zIndex = '-1';
            }
            
            // Check if user has token
            const token = localStorage.getItem('photolytics_auth_token');
            if (token) {
                // Show main app
                if (mainApplication) {
                    mainApplication.style.display = 'block';
                    mainApplication.style.opacity = '1';
                    mainApplication.style.visibility = 'visible';
                    mainApplication.style.pointerEvents = 'auto';
                    mainApplication.style.zIndex = '1';
                }
                if (loginSection) {
                    loginSection.style.display = 'none';
                    loginSection.style.visibility = 'hidden';
                    loginSection.style.pointerEvents = 'none';
                    loginSection.style.zIndex = '-1';
                }
            } else {
                // Show login
                if (loginSection) {
                    loginSection.style.display = 'flex';
                    loginSection.style.opacity = '1';
                    loginSection.style.visibility = 'visible';
                    loginSection.style.pointerEvents = 'auto';
                    loginSection.style.zIndex = '10';
                }
                if (mainApplication) {
                    mainApplication.style.display = 'none';
                    mainApplication.style.visibility = 'hidden';
                    mainApplication.style.pointerEvents = 'none';
                    mainApplication.style.zIndex = '-1';
                }
            }
        }
    }, 100);
    
    // Additional fallback after 3 seconds
    setTimeout(() => {
        const initialLoader = document.getElementById('initialLoader');
        const transitionLoader = document.getElementById('transitionLoader');
        
        // Hide any visible loaders
        if (initialLoader && initialLoader.style.display !== 'none') {
            console.warn('Initial loader still visible after 3 seconds, forcing hide...');
            initialLoader.style.display = 'none';
            initialLoader.style.visibility = 'hidden';
            initialLoader.style.pointerEvents = 'none';
            initialLoader.style.zIndex = '-1';
        }
        
        if (transitionLoader && transitionLoader.style.display !== 'none') {
            console.warn('Transition loader still visible after 3 seconds, forcing hide...');
            transitionLoader.style.display = 'none';
            transitionLoader.style.visibility = 'hidden';
            transitionLoader.style.pointerEvents = 'none';
            transitionLoader.style.zIndex = '-1';
            
            // Show appropriate section
            const token = localStorage.getItem('photolytics_auth_token');
            const loginSection = document.getElementById('loginSection');
            const mainApplication = document.getElementById('mainApplication');
            
            if (token && mainApplication) {
                mainApplication.style.display = 'block';
                mainApplication.style.opacity = '1';
                mainApplication.style.visibility = 'visible';
                mainApplication.style.pointerEvents = 'auto';
                mainApplication.style.zIndex = '1';
                if (loginSection) {
                    loginSection.style.display = 'none';
                    loginSection.style.visibility = 'hidden';
                    loginSection.style.pointerEvents = 'none';
                    loginSection.style.zIndex = '-1';
                }
            } else if (loginSection) {
                loginSection.style.display = 'flex';
                loginSection.style.opacity = '1';
                loginSection.style.visibility = 'visible';
                loginSection.style.pointerEvents = 'auto';
                loginSection.style.zIndex = '10';
                if (mainApplication) {
                    mainApplication.style.display = 'none';
                    mainApplication.style.visibility = 'hidden';
                    mainApplication.style.pointerEvents = 'none';
                    mainApplication.style.zIndex = '-1';
                }
            }
        }
    }, 3000);
});

// Export for use in other files
window.AuthManager = AuthManager; 