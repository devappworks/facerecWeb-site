// DOM Elements - Initialize with checks
let uploadZone, fileInput, uploadForm, previewContainer, uploadPrompt, imagePreview, removePreviewButton;

// Admin email check
const ADMIN_EMAILS = ['nikola1jankovic@gmail.com'];

function isAdminUser() {
    const userEmail = localStorage.getItem('photolytics_user_email') || '';
    return ADMIN_EMAILS.includes(userEmail.toLowerCase());
}

// Show/hide model selector based on admin status
function updateAdminFeatures() {
    const modelSelectorContainer = document.getElementById('modelSelectorContainer');
    if (modelSelectorContainer) {
        if (isAdminUser()) {
            modelSelectorContainer.style.display = 'block';
            console.log('Admin features enabled for:', localStorage.getItem('photolytics_user_email'));
        } else {
            modelSelectorContainer.style.display = 'none';
        }
    }
}

// Initialize DOM elements when page loads
function initializeDOMElements() {
    uploadZone = document.querySelector('.upload-zone');
    fileInput = document.getElementById('fileInput');
    uploadForm = document.getElementById('uploadForm');
    previewContainer = document.getElementById('previewContainer');
    uploadPrompt = document.getElementById('uploadPrompt');
    imagePreview = document.getElementById('imagePreview');
    removePreviewButton = document.getElementById('removePreview');

    console.log('DOM Elements initialized:', {
        uploadZone: !!uploadZone,
        fileInput: !!fileInput,
        uploadForm: !!uploadForm,
        previewContainer: !!previewContainer,
        uploadPrompt: !!uploadPrompt,
        imagePreview: !!imagePreview,
        removePreviewButton: !!removePreviewButton
    });

    // Check admin status and show/hide model selector
    updateAdminFeatures();

    // Attach event listeners if elements exist
    if (uploadForm) {
        attachEventListeners();
    }
}

// Attach all event listeners
function attachEventListeners() {
    console.log('Attaching event listeners...');
    
    // Upload form event listener
    if (uploadForm) {
        uploadForm.removeEventListener('submit', handleUploadSubmit);
        uploadForm.addEventListener('submit', handleUploadSubmit);
    }
    
    // File input event listener
    if (fileInput) {
        fileInput.removeEventListener('change', handleFileChange);
        fileInput.addEventListener('change', handleFileChange);
    }
    
    // Remove preview event listener
    if (removePreviewButton) {
        removePreviewButton.removeEventListener('click', handleRemovePreview);
        removePreviewButton.addEventListener('click', handleRemovePreview);
    }
    
    // Drag and drop event listeners
    if (uploadZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.removeEventListener(eventName, preventDefaults);
            uploadZone.addEventListener(eventName, preventDefaults, false);
        });
        
        uploadZone.removeEventListener('dragenter', handleDragEnter);
        uploadZone.removeEventListener('dragleave', handleDragLeave);
        uploadZone.removeEventListener('drop', handleDrop);
        uploadZone.removeEventListener('click', handleZoneClick);
        
        uploadZone.addEventListener('dragenter', handleDragEnter);
        uploadZone.addEventListener('dragleave', handleDragLeave);
        uploadZone.addEventListener('drop', handleDrop);
        uploadZone.addEventListener('click', handleZoneClick);
    }
}

// API Configuration - Updated to use dynamic token
const API_BASE_URL = 'https://facerecognition.mpanel.app';
const API_CONFIG = {
    faceRecognition: {
        url: `${API_BASE_URL}/recognize`
    },
    objectDetection: {
        url: `${API_BASE_URL}/upload-for-detection`
    },
    // New enhanced analyze endpoint (combines face recognition + vision analysis)
    analyze: {
        url: `${API_BASE_URL}/analyze`
    }
};


// Get authentication https://facerecognition.mpanel.appge
function getAuthToken() {
    if (window.authManager) {
        return window.authManager.getToken();
    }
    return localStorage.getItem('photolytics_auth_token');
}

// Check if user is authenticated
function isAuthenticated() {
    const token = getAuthToken();
    return !!token;
}

// Create headers with authentication token and user email
function getAuthHeaders() {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Authentication token not found. Please login again.');
    }

    // Get user email from localStorage (stored during login)
    const userEmail = localStorage.getItem('photolytics_user_email') || '';

    return {
        'Authorization': token,
        'X-User-Email': userEmail
    };
}

// Validate image file
function validateImageFile(file) {
    // Check if file exists
    if (!file) {
        throw new Error('No file selected');
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file (JPEG, PNG, GIF, etc.)');
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large. Please select a file under 10MB');
    }

    // Check if file is not corrupted
    if (file.size === 0) {
        throw new Error('File appears to be empty or corrupted');
    }

    return true;
}

// Alternative API call method for debugging
async function makeApiCallDebug(url, file) {
    // Check authentication before making API call
    if (!isAuthenticated()) {
        throw new Error('Authentication required. Please login first.');
    }
    
    // Method 1: Try with FormData (current approach)
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });

        const text = await response.text();
        
        if (response.ok) {
            return JSON.parse(text);
        } else if (response.status === 401 || response.status === 403) {
            // Authentication failed - redirect to login
            throw new Error('Authentication failed. Please login again.');
        } else {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.log('API call failed:', error.message);
        
        // If authentication error, trigger logout
        if (error.message.includes('Authentication') || error.message.includes('login')) {
            if (window.authManager) {
                window.authManager.clearAuthData();
                window.authManager.showLoginSection();
            }
        }
        
        throw error;
    }
}

// Modified handleFileUploadDebug to use the new unified analyze endpoint
async function handleFileUploadDebug(file) {
    try {
        validateImageFile(file);
        // Use the new unified analyze endpoint that combines face recognition + vision analysis
        handleAnalyze(file);

    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
}

// Handle the unified analyze endpoint
async function handleAnalyze(file) {
    const result1 = document.getElementById('result1');
    const result2 = document.getElementById('result2');

    // Clear previous results
    result1.innerHTML = '';
    result2.innerHTML = '';

    // Get selected language
    const languageSelector = document.getElementById('languageSelector');
    const selectedLanguage = languageSelector ? languageSelector.value : '';

    // Get selected model (admin only feature)
    const modelSelector = document.getElementById('modelSelector');
    const selectedModel = modelSelector ? modelSelector.value : 'gpt-4.1-mini';

    // Step 1: Face Recognition (show immediately)
    result1.innerHTML = `
        <div class="alert alert-info">
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>
                    <strong>Face Recognition Processing...</strong><br>
                    <small class="text-muted">Detecting and identifying faces</small>
                </div>
            </div>
        </div>
    `;

    const faceStartTime = performance.now();

    try {
        // Call face recognition endpoint directly
        const faceData = await makeApiCallDebug(API_CONFIG.faceRecognition.url, file);
        const faceEndTime = performance.now();
        const faceElapsedSeconds = ((faceEndTime - faceStartTime) / 1000).toFixed(2);

        // Display face recognition results with timing
        if (faceData && faceData.recognized_persons) {
            displayFaceRecognitionFromAnalyze(faceData, faceElapsedSeconds);
        } else if (faceData && faceData.metadata && faceData.metadata.recognized_persons) {
            displayFaceRecognitionFromAnalyze(faceData.metadata, faceElapsedSeconds);
        } else {
            displayFaceRecognitionFromAnalyze(faceData || {}, faceElapsedSeconds);
        }

    } catch (error) {
        const faceEndTime = performance.now();
        const faceElapsedSeconds = ((faceEndTime - faceStartTime) / 1000).toFixed(2);

        console.error('Face recognition failed:', error);
        result1.innerHTML = `
            <div class="alert alert-danger">
                <strong>Face Recognition Error:</strong><br>${error.message}
                <div class="mt-2 text-muted small">
                    <i class="bi bi-clock"></i> Time: ${faceElapsedSeconds}s
                </div>
            </div>
        `;
    }

    // Step 2: Vision Analysis (show when complete)
    result2.innerHTML = `
        <div class="alert alert-info">
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>
                    <strong>Photo Description Processing...</strong><br>
                    <small class="text-muted">Analyzing image with AI</small>
                </div>
            </div>
        </div>
    `;

    const visionStartTime = performance.now();

    try {
        // Build URL with parameters
        let analyzeUrl = API_CONFIG.analyze.url;
        const params = new URLSearchParams();
        if (selectedLanguage) {
            params.append('language', selectedLanguage);
        }
        if (selectedModel && selectedModel !== 'gpt-4.1-mini') {
            params.append('model', selectedModel);
            // Determine provider based on model name
            const provider = selectedModel.startsWith('gemini') ? 'gemini' : 'openai';
            params.append('provider', provider);
        }
        if (params.toString()) {
            analyzeUrl += '?' + params.toString();
        }

        // Make the vision analysis API call
        const analyzeData = await makeApiCallDebug(analyzeUrl, file);
        const visionEndTime = performance.now();
        const visionElapsedSeconds = ((visionEndTime - visionStartTime) / 1000).toFixed(2);

        if (analyzeData.success && analyzeData.metadata) {
            // Display admin usage info if available
            displayAdminUsageInfo(analyzeData.metadata, analyzeData.is_admin);

            // Display vision analysis results with timing
            displayVisionAnalysisResult(analyzeData.metadata, visionElapsedSeconds);
        } else if (analyzeData.error) {
            hideAdminUsageInfo();
            result2.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Photo Description Error:</strong><br>${analyzeData.error}
                    <div class="mt-2 text-muted small">
                        <i class="bi bi-clock"></i> Time: ${visionElapsedSeconds}s
                    </div>
                </div>
            `;
        } else {
            // Fallback display
            hideAdminUsageInfo();
            result2.innerHTML = `
                <div class="alert alert-warning">
                    <strong>Unexpected Response Format</strong>
                    <div class="mt-2 text-muted small">
                        <i class="bi bi-clock"></i> Time: ${visionElapsedSeconds}s
                    </div>
                    <pre class="bg-light p-3 rounded mt-2 small">${JSON.stringify(analyzeData, null, 2)}</pre>
                </div>
            `;
        }
    } catch (error) {
        const visionEndTime = performance.now();
        const visionElapsedSeconds = ((visionEndTime - visionStartTime) / 1000).toFixed(2);

        console.error('Vision analysis failed:', error);
        hideAdminUsageInfo();
        result2.innerHTML = `
            <div class="alert alert-danger">
                <strong>Photo Description Error:</strong><br>${error.message}
                <div class="mt-2 text-muted small">
                    <i class="bi bi-clock"></i> Time: ${visionElapsedSeconds}s
                </div>
            </div>
        `;
    }
}

// Display admin usage info in separate section
function displayAdminUsageInfo(metadata, isAdmin) {
    const section = document.getElementById('adminUsageSection');
    const content = document.getElementById('adminUsageContent');

    if (!section || !content) return;

    if (isAdmin && metadata.usage) {
        const usage = metadata.usage;
        const model = metadata.model || 'Unknown';
        const provider = metadata.provider || 'Unknown';

        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-sm table-borderless mb-0">
                        <tr>
                            <td class="text-muted" style="width: 120px;">Provider:</td>
                            <td><strong>${provider}</strong></td>
                        </tr>
                        <tr>
                            <td class="text-muted">Model:</td>
                            <td><strong>${model}</strong></td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm table-borderless mb-0">
                        <tr>
                            <td class="text-muted" style="width: 120px;">Prompt:</td>
                            <td><strong>${usage.prompt_tokens?.toLocaleString() || 0}</strong> tokens</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Completion:</td>
                            <td><strong>${usage.completion_tokens?.toLocaleString() || 0}</strong> tokens</td>
                        </tr>
                        <tr>
                            <td class="text-muted">Total:</td>
                            <td><strong>${usage.total_tokens?.toLocaleString() || 0}</strong> tokens</td>
                        </tr>
                    </table>
                </div>
            </div>
            <hr class="my-2">
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">Estimated Cost:</span>
                <span class="badge bg-success fs-6">$${usage.cost_usd?.toFixed(6) || '0.000000'}</span>
            </div>
        `;
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
}

// Hide admin usage info section
function hideAdminUsageInfo() {
    const section = document.getElementById('adminUsageSection');
    if (section) {
        section.style.display = 'none';
    }
}

// Display face recognition results from analyze endpoint
function displayFaceRecognitionFromAnalyze(metadata, elapsedSeconds) {
    const result1 = document.getElementById('result1');
    const recognizedPersons = metadata.recognized_persons || [];

    // Add timing display to the result
    const timingHtml = elapsedSeconds ? `
        <div class="mt-2 text-muted small">
            <i class="bi bi-clock"></i> Time: ${elapsedSeconds}s
        </div>
    ` : '';

    if (recognizedPersons.length > 0) {
        const personNames = recognizedPersons.map(p => {
            let name = p.name;
            if (p.role) name += ` (${p.role})`;
            return name;
        });
        const personCount = recognizedPersons.length;
        const personLabel = personCount > 1 ? 'Recognized persons' : 'Recognized person';

        result1.innerHTML = `
            <div class="alert alert-success">
                <div class="d-flex align-items-center">
                    <i class="bi bi-person-check-fill me-2 fs-4"></i>
                    <div class="flex-grow-1">
                        <h6 class="mb-1"><strong>Face Recognition Successful!</strong></h6>
                        <p class="mb-1">${personLabel}: <strong>${personNames.join(', ')}</strong></p>
                        <small class="text-muted">${personCount} person${personCount > 1 ? 's' : ''} recognized</small>
                    </div>
                </div>
                ${timingHtml}

                <!-- Details toggle -->
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#faceRawData" aria-expanded="false">
                        Show Details
                    </button>
                    <div class="collapse mt-2" id="faceRawData">
                        <pre class="bg-light p-3 rounded small">${JSON.stringify(recognizedPersons, null, 2)}</pre>
                    </div>
                </div>
            </div>
        `;
    } else {
        result1.innerHTML = `
            <div class="alert alert-warning">
                <div class="d-flex align-items-center">
                    <i class="bi bi-person-x-fill me-2 fs-4"></i>
                    <div class="flex-grow-1">
                        <h6 class="mb-1"><strong>No Face Recognized</strong></h6>
                        <p class="mb-0">No matching person found in the database.</p>
                    </div>
                </div>
                ${timingHtml}
            </div>
        `;
    }
}

// Display enhanced vision analysis results
function displayVisionAnalysisResult(metadata, elapsedSeconds) {
    const result2 = document.getElementById('result2');

    let formattedHtml = '<div class="vision-analysis-results">';

    // Add timing at the top if available
    if (elapsedSeconds) {
        formattedHtml += `
            <div class="mb-3 text-muted small">
                <i class="bi bi-clock"></i> Processing time: ${elapsedSeconds}s
            </div>
        `;
    }

    // Description section (bilingual)
    if (metadata.description) {
        formattedHtml += `
            <div class="mb-3">
                <h6 class="text-primary"><i class="bi bi-card-text"></i> Description:</h6>
                <p class="bg-light p-2 rounded mb-1">${metadata.description.english || metadata.description}</p>
                ${metadata.description.local ? `<p class="bg-light p-2 rounded text-muted small"><em>${metadata.description.local}</em></p>` : ''}
            </div>
        `;
    }

    // Alt text section (bilingual)
    if (metadata.alt_text) {
        formattedHtml += `
            <div class="mb-3">
                <h6 class="text-success"><i class="bi bi-tag"></i> Alt Text:</h6>
                <p class="bg-light p-2 rounded mb-1">${metadata.alt_text.english || metadata.alt_text}</p>
                ${metadata.alt_text.local ? `<p class="bg-light p-2 rounded text-muted small"><em>${metadata.alt_text.local}</em></p>` : ''}
            </div>
        `;
    }

    // Scene analysis section
    if (metadata.scene) {
        formattedHtml += `
            <div class="mb-3">
                <h6 class="text-info"><i class="bi bi-geo-alt"></i> Scene:</h6>
                <div class="row small">
                    ${metadata.scene.setting ? `<div class="col-6"><strong>Setting:</strong> ${metadata.scene.setting}</div>` : ''}
                    ${metadata.scene.location_type ? `<div class="col-6"><strong>Location:</strong> ${metadata.scene.location_type}</div>` : ''}
                    ${metadata.scene.atmosphere ? `<div class="col-6"><strong>Atmosphere:</strong> ${metadata.scene.atmosphere}</div>` : ''}
                    ${metadata.scene.time_of_day ? `<div class="col-6"><strong>Time:</strong> ${metadata.scene.time_of_day}</div>` : ''}
                    ${metadata.scene.season ? `<div class="col-6"><strong>Season:</strong> ${metadata.scene.season}</div>` : ''}
                </div>
            </div>
        `;
    }

    // Event analysis section
    if (metadata.event && (metadata.event.event_type || metadata.event.event_name || metadata.event.activity)) {
        formattedHtml += `
            <div class="mb-3">
                <h6 class="text-danger"><i class="bi bi-calendar-event"></i> Event:</h6>
                <div class="row small">
                    ${metadata.event.event_type ? `<div class="col-6"><strong>Type:</strong> ${metadata.event.event_type}</div>` : ''}
                    ${metadata.event.event_name ? `<div class="col-6"><strong>Name:</strong> ${metadata.event.event_name}</div>` : ''}
                    ${metadata.event.activity ? `<div class="col-12"><strong>Activity:</strong> ${metadata.event.activity}</div>` : ''}
                </div>
            </div>
        `;
    }

    // Media analysis section
    if (metadata.media) {
        formattedHtml += `
            <div class="mb-3">
                <h6 class="text-secondary"><i class="bi bi-camera"></i> Media:</h6>
                <div class="row small">
                    ${metadata.media.composition ? `<div class="col-6"><strong>Composition:</strong> ${metadata.media.composition}</div>` : ''}
                    ${metadata.media.subject_count ? `<div class="col-6"><strong>Subjects:</strong> ${metadata.media.subject_count}</div>` : ''}
                    ${metadata.media.attire ? `<div class="col-12"><strong>Attire:</strong> ${metadata.media.attire}</div>` : ''}
                    ${metadata.media.notable_items && Array.isArray(metadata.media.notable_items) && metadata.media.notable_items.length > 0 ? `<div class="col-12"><strong>Notable items:</strong> ${metadata.media.notable_items.join(', ')}</div>` : ''}
                </div>
            </div>
        `;
    }

    // Objects detected section
    if (metadata.objects && Array.isArray(metadata.objects) && metadata.objects.length > 0) {
        formattedHtml += `
            <div class="mb-3">
                <h6 class="text-warning"><i class="bi bi-eye"></i> Objects (${metadata.objects.length}):</h6>
                <div class="d-flex flex-wrap gap-1">
        `;
        metadata.objects.forEach(obj => {
            formattedHtml += `<span class="badge bg-warning text-dark">${obj}</span>`;
        });
        formattedHtml += `</div></div>`;
    }

    // AI-Identified Persons section (Gemini 3 models)
    if (metadata.identified_persons && Array.isArray(metadata.identified_persons) && metadata.identified_persons.length > 0) {
        formattedHtml += `
            <div class="mb-3">
                <h6 class="text-danger"><i class="bi bi-person-bounding-box"></i> AI Person Recognition (${metadata.identified_persons.length}):</h6>
                <div class="alert alert-info py-2 px-3 small mb-2">
                    <i class="bi bi-info-circle me-1"></i> Public figures identified by ${metadata.model || 'AI'} with confidence levels
                </div>
                <div class="list-group list-group-flush">
        `;
        metadata.identified_persons.forEach(person => {
            const confidenceClass = person.confidence === 'high' ? 'success' : (person.confidence === 'medium' ? 'warning' : 'secondary');
            const confidenceIcon = person.confidence === 'high' ? 'check-circle-fill' : (person.confidence === 'medium' ? 'question-circle-fill' : 'dash-circle');
            const confidenceLabel = person.confidence === 'high' ? 'High' : (person.confidence === 'medium' ? 'Medium' : 'Low');
            formattedHtml += `
                <div class="list-group-item px-0 py-2 bg-transparent border-0">
                    <div class="d-flex align-items-start">
                        <span class="badge bg-${confidenceClass} me-2" title="Confidence: ${confidenceLabel}">
                            <i class="bi bi-${confidenceIcon}"></i> ${confidenceLabel}
                        </span>
                        <div class="flex-grow-1">
                            <strong>${person.name}</strong>
                            ${person.role ? `<span class="text-muted small ms-1">(${person.role})</span>` : ''}
                            ${person.description ? `<div class="small text-muted mt-1">${person.description}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        formattedHtml += `</div></div>`;
    } else if (metadata.model && metadata.model.includes('gemini-3')) {
        // Show note if Gemini 3 is used but no persons identified
        formattedHtml += `
            <div class="mb-3">
                <h6 class="text-muted"><i class="bi bi-person-bounding-box"></i> AI Person Recognition:</h6>
                <div class="alert alert-light py-2 px-3 small mb-0">
                    <i class="bi bi-info-circle me-1"></i> No public figures identified in this image
                </div>
            </div>
        `;
    }

    // Tags section
    if (metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
        formattedHtml += `
            <div class="mb-3">
                <h6 class="text-info"><i class="bi bi-tags"></i> Tags (${metadata.tags.length}):</h6>
                <div class="d-flex flex-wrap gap-1">
        `;
        metadata.tags.forEach(tag => {
            formattedHtml += `<span class="badge bg-info">${tag}</span>`;
        });
        formattedHtml += `</div></div>`;
    }

    // Photo metadata section (EXIF, GPS, Camera info)
    if (metadata.photo_metadata) {
        const pm = metadata.photo_metadata;
        let photoMetaItems = [];

        // GPS coordinates
        if (pm.gps && pm.gps.latitude && pm.gps.longitude) {
            const lat = pm.gps.latitude.toFixed(6);
            const lon = pm.gps.longitude.toFixed(6);
            const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
            photoMetaItems.push(`<div class="col-12"><strong><i class="bi bi-geo-alt-fill text-danger"></i> GPS:</strong> <a href="${mapsLink}" target="_blank">${lat}, ${lon}</a>${pm.gps.altitude ? ` (${pm.gps.altitude}m)` : ''}</div>`);
        }

        // Date/time taken
        if (pm.datetime && pm.datetime.taken) {
            photoMetaItems.push(`<div class="col-6"><strong><i class="bi bi-calendar-event"></i> Taken:</strong> ${pm.datetime.taken}</div>`);
        }

        // Camera info
        if (pm.camera) {
            if (pm.camera.make || pm.camera.model) {
                photoMetaItems.push(`<div class="col-6"><strong><i class="bi bi-camera"></i> Camera:</strong> ${pm.camera.make || ''} ${pm.camera.model || ''}</div>`);
            }
            if (pm.camera.lens) {
                photoMetaItems.push(`<div class="col-6"><strong>Lens:</strong> ${pm.camera.lens}</div>`);
            }
            let settings = [];
            if (pm.camera.focal_length) settings.push(pm.camera.focal_length);
            if (pm.camera.aperture) settings.push(pm.camera.aperture);
            if (pm.camera.shutter_speed) settings.push(pm.camera.shutter_speed);
            if (pm.camera.iso) settings.push(`ISO ${pm.camera.iso}`);
            if (settings.length > 0) {
                photoMetaItems.push(`<div class="col-12"><strong>Settings:</strong> ${settings.join(' | ')}</div>`);
            }
        }

        // Image dimensions
        if (pm.image && pm.image.width && pm.image.height) {
            photoMetaItems.push(`<div class="col-6"><strong>Size:</strong> ${pm.image.width} x ${pm.image.height}</div>`);
        }

        // IPTC info (author, copyright)
        if (pm.iptc) {
            if (pm.iptc.author) {
                photoMetaItems.push(`<div class="col-6"><strong>Author:</strong> ${pm.iptc.author}</div>`);
            }
            if (pm.iptc.copyright) {
                photoMetaItems.push(`<div class="col-12"><strong>Copyright:</strong> ${pm.iptc.copyright}</div>`);
            }
            if (pm.iptc.caption) {
                photoMetaItems.push(`<div class="col-12"><strong>Caption:</strong> ${pm.iptc.caption}</div>`);
            }
        }

        if (photoMetaItems.length > 0) {
            formattedHtml += `
                <div class="mb-3">
                    <h6 class="text-dark"><i class="bi bi-file-earmark-image"></i> Photo Info:</h6>
                    <div class="row small bg-light p-2 rounded">
                        ${photoMetaItems.join('')}
                    </div>
                </div>
            `;
        }
    }

    // Provider info
    if (metadata.provider || metadata.model) {
        formattedHtml += `
            <div class="mt-2 text-muted small">
                <i class="bi bi-cpu"></i> ${metadata.provider || 'AI'}${metadata.model ? ` (${metadata.model})` : ''}
            </div>
        `;
    }

    // Raw data toggle
    formattedHtml += `
        <div class="mt-3">
            <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#rawData" aria-expanded="false">
                Show Raw Data
            </button>
            <div class="collapse mt-2" id="rawData">
                <pre class="bg-light p-3 rounded small">${JSON.stringify(metadata, null, 2)}</pre>
            </div>
        </div>
    `;

    formattedHtml += '</div>';
    result2.innerHTML = formattedHtml;
}

// Handle face recognition independently
async function handleFaceRecognition(file) {
    try {
        const faceData = await makeApiCallDebug(API_CONFIG.faceRecognition.url, file);
        displayFaceRecognitionResult(faceData);
    } catch (error) {
        console.error('Face recognition failed:', error);
        displayFaceRecognitionResult({ error: error.message });
    }
}

// Handle object detection independently with token-based processing
async function handleObjectDetection(file) {
    try {
        const objectData = await makeApiCallDebug(API_CONFIG.objectDetection.url, file);
        
        // Check if we got a token (processing started)
        if (objectData.token && objectData.success) {
            // Show processing message
            displayObjectDetectionResult({
                processing: true,
                message: "Object detection processing has started. Results will be displayed shortly...",
                token: objectData.token
            });
            
            // Socket logic will be implemented separately to handle results
        } else {
            // Direct result (shouldn't happen with async processing, but handle it)
            displayObjectDetectionResult(objectData);
        }
    } catch (error) {
        console.error('Object detection failed:', error);
        displayObjectDetectionResult({ error: error.message });
    }
}

// Display face recognition results
function displayFaceRecognitionResult(faceData) {
    const result1 = document.getElementById('result1');
    
    if (faceData.error) {
        result1.innerHTML = `<div class="alert alert-danger"><strong>Face Recognition Error:</strong><br>${faceData.error}</div>`;
    } else if (faceData.status == 'error') {
        result1.innerHTML = `<div class="alert alert-danger"><strong>Face Recognition Error:</strong><br>${faceData.message}</div>`;
    } else if (faceData.status === 'success' && (faceData.person || faceData.recognized_persons)) {
        // Successful face recognition
        const confidence = faceData.best_match?.confidence_metrics?.confidence_percentage || 0;
        
        // Handle multiple recognized persons
        let recognizedPersonsText = '';
        if (faceData.recognized_persons && Array.isArray(faceData.recognized_persons) && faceData.recognized_persons.length > 0) {
            const personNames = faceData.recognized_persons.map(person => person.name);
            recognizedPersonsText = personNames.join(', ');
        } else if (faceData.person) {
            recognizedPersonsText = faceData.person;
        }
        
        const personCount = faceData.recognized_persons ? faceData.recognized_persons.length : 1;
        const personLabel = personCount > 1 ? 'Recognized persons' : 'Recognized person';
        
        result1.innerHTML = `
            <div class="alert alert-success">
                <div class="d-flex align-items-center">
                    <i class="bi bi-person-check-fill me-2 fs-4"></i>
                    <div>
                        <h6 class="mb-1"><strong>Face Recognition Successful!</strong></h6>
                        <p class="mb-1">${personLabel}: <strong>${recognizedPersonsText}</strong></p>
                        ${personCount > 1 ? `<small class="text-muted">${personCount} persons recognized</small>` : `<small class="text-muted">Confidence: ${confidence.toFixed(2)}%</small>`}
                    </div>
                </div>
                
                <!-- Raw data toggle (for debugging) -->
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#faceRawData" aria-expanded="false">
                        Show Details
                    </button>
                    <div class="collapse mt-2" id="faceRawData">
                        <pre class="bg-light p-3 rounded small">${JSON.stringify(faceData, null, 2)}</pre>
                    </div>
                </div>
            </div>
        `;
    } else if (faceData.status === 'success' && !faceData.person && (!faceData.recognized_persons || faceData.recognized_persons.length === 0)) {
        // No person recognized
        result1.innerHTML = `
            <div class="alert alert-warning">
                <div class="d-flex align-items-center">
                    <i class="bi bi-person-x-fill me-2 fs-4"></i>
                    <div>
                        <h6 class="mb-1"><strong>No Face Recognized</strong></h6>
                        <p class="mb-0">No matching person found in the database.</p>
                    </div>
                </div>
            </div>
        `;
    } else if (faceData.status === 'no_faces') {
        // No valid faces found after validation checks
        result1.innerHTML = `
            <div class="alert alert-warning">
                <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
                    <div>
                        <h6 class="mb-1"><strong>No Valid Faces Found</strong></h6>
                        <p class="mb-0">${faceData.message}.</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Fallback to JSON display for unexpected format
        result1.innerHTML = `<pre class="bg-light p-3 rounded">${JSON.stringify(faceData, null, 2)}</pre>`;
    }
}

// Display object detection results (handles both processing and final results)
function displayObjectDetectionResult(objectData) {
    const result2 = document.getElementById('result2');
    
    if (objectData.error) {
        result2.innerHTML = `<div class="alert alert-danger"><strong>Object Detection Error:</strong><br>${objectData.error}</div>`;
    } else if (objectData.processing) {
        result2.innerHTML = `
            <div class="alert alert-info">
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div>
                        <strong>Processing Started</strong><br>
                        ${objectData.message}<br>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Custom formatted display for object detection results
        let formattedHtml = '<div class="object-detection-results">';
        
        // Check if we have the expected object detection data structure
        if (objectData.description || objectData.objects || objectData.metatags) {
            // Description section
            if (objectData.description) {
                formattedHtml += `
                    <div class="mb-3">
                        <h6 class="text-primary"><i class="bi bi-card-text"></i> Description:</h6>
                        <p class="bg-light p-2 rounded">${objectData.description}</p>
                    </div>
                `;
            }
            
            // Alt text section
            if (objectData.alt) {
                formattedHtml += `
                    <div class="mb-3">
                        <h6 class="text-success"><i class="bi bi-tag"></i> Alt Text:</h6>
                        <p class="bg-light p-2 rounded">${objectData.alt}</p>
                    </div>
                `;
            }
            
            // Objects detected section
            if (objectData.objects && Array.isArray(objectData.objects)) {
                formattedHtml += `
                    <div class="mb-3">
                        <h6 class="text-warning"><i class="bi bi-eye"></i> Objects Detected (${objectData.objects.length}):</h6>
                        <div class="d-flex flex-wrap gap-1">
                `;
                objectData.objects.forEach(obj => {
                    formattedHtml += `<span class="badge bg-warning text-dark">${obj}</span>`;
                });
                formattedHtml += `</div></div>`;
            }
            
            // Metatags section
            if (objectData.metatags && Array.isArray(objectData.metatags)) {
                formattedHtml += `
                    <div class="mb-3">
                        <h6 class="text-info"><i class="bi bi-tags"></i> Meta Tags (${objectData.metatags.length}):</h6>
                        <div class="d-flex flex-wrap gap-1">
                `;
                objectData.metatags.forEach(tag => {
                    formattedHtml += `<span class="badge bg-info">${tag}</span>`;
                });
                formattedHtml += `</div></div>`;
            }
            
            // Raw data toggle (for debugging)
            formattedHtml += `
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#rawData" aria-expanded="false">
                        Show Raw Data
                    </button>
                    <div class="collapse mt-2" id="rawData">
                        <pre class="bg-light p-3 rounded small">${JSON.stringify(objectData, null, 2)}</pre>
                    </div>
                </div>
            `;
        } else {
            // Fallback to JSON display if structure is different
            formattedHtml += `<pre class="bg-light p-3 rounded">${JSON.stringify(objectData, null, 2)}</pre>`;
        }
        
        formattedHtml += '</div>';
        result2.innerHTML = formattedHtml;
    }
}

// Event Handlers
// Upload form handler
async function handleUploadSubmit(e) {
    e.preventDefault();
    
    console.log('Upload form submitted');
    
    // Check authentication first
    if (!isAuthenticated()) {
        alert('Please login first to upload images');
        if (window.authManager) {
            window.authManager.showLoginSection();
        }
        return;
    }
    
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select an image first');
        return;
    }

    // Show loading state for both sections
    document.getElementById('result1').innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Analyzing faces...</p></div>';
    document.getElementById('result2').innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Analyzing image content...</p></div>';

    try {
        await handleFileUploadDebug(file);
    } catch (error) {
        console.error('Error:', error);
        
        // Check if it's an authentication error
        if (error.message.includes('Authentication') || error.message.includes('login')) {
            document.getElementById('result1').innerHTML = `<div class="alert alert-warning"><strong>Authentication Required:</strong><br>Please login again to continue.</div>`;
            document.getElementById('result2').innerHTML = `<div class="alert alert-warning"><strong>Authentication Required:</strong><br>Please login again to continue.</div>`;
        } else {
            document.getElementById('result1').innerHTML = `<div class="alert alert-danger"><strong>Error:</strong><br>${error.message}</div>`;
            document.getElementById('result2').innerHTML = `<div class="alert alert-danger"><strong>Error:</strong><br>${error.message}</div>`;
        }
    }
}

// File input change handler
function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
        try {
            validateImageFile(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
                uploadPrompt.style.display = 'none';
            };
            reader.onerror = () => {
                alert('Error reading file. Please try again.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            alert(error.message);
            fileInput.value = ''; // Clear the input
        }
    }
}

// Remove preview handler
function handleRemovePreview() {
    previewContainer.style.display = 'none';
    uploadPrompt.style.display = 'block';
    fileInput.value = '';
    imagePreview.src = '';
    
    // Clear any existing results
    document.getElementById('result1').innerHTML = '<p class="text-muted">Results will be displayed after upload...</p>';
    document.getElementById('result2').innerHTML = '<p class="text-muted">Results will be displayed after upload...</p>';
}

// Drag handlers
function handleDragEnter() {
    uploadZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    // Only remove drag-over class if we're leaving the upload zone entirely
    if (!uploadZone.contains(e.relatedTarget)) {
        uploadZone.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    uploadZone.classList.remove('drag-over');
    
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        const file = files[0];
        
        try {
            validateImageFile(file);
            
            // Set the file to the input
            fileInput.files = files;
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
                uploadPrompt.style.display = 'none';
            };
            reader.onerror = () => {
                alert('Error reading file. Please try again.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            alert(error.message);
        }
    }
}

function handleZoneClick(e) {
    // Don't trigger if clicking on the file input or buttons
    if (e.target === fileInput || e.target.tagName === 'BUTTON') {
        return;
    }
    fileInput.click();
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Main.js: DOM loaded, initializing...');
    setTimeout(() => {
        initializeDOMElements();
        initializeLanguageSelector();
    }, 200);
});

// Initialize language selector with saved preference
function initializeLanguageSelector() {
    const languageSelector = document.getElementById('languageSelector');
    if (!languageSelector) return;

    // Load saved language preference
    const savedLanguage = localStorage.getItem('photolytics_language') || '';
    if (savedLanguage) {
        languageSelector.value = savedLanguage;
    }

    // Save language preference when changed
    languageSelector.addEventListener('change', function() {
        localStorage.setItem('photolytics_language', this.value);
        console.log('Language preference saved:', this.value || 'English only');
    });
}

// Re-initialize when called from auth manager
window.reinitializeMainApp = function() {
    console.log('Re-initializing main app...');
    setTimeout(() => {
        initializeDOMElements();
        initializeLanguageSelector();
    }, 100);
};

// Utility function to convert Python dictionary format to JSON
function convertPythonDictToJson(pythonDictString) {
    if (typeof pythonDictString !== 'string') {
        return pythonDictString;
    }

    // Check if it's Python dictionary format (single quotes)
    if (pythonDictString.includes("'") && !pythonDictString.includes('"')) {
        console.log('Converting Python dictionary format to JSON...');

        // Convert Python dict format to JSON format
        const jsonString = pythonDictString
            .replace(/'/g, '"')           // Replace single quotes with double quotes
            .replace(/True/g, 'true')     // Replace Python True with JSON true
            .replace(/False/g, 'false')   // Replace Python False with JSON false
            .replace(/None/g, 'null');    // Replace Python None with JSON null

        console.log('Converted to JSON string:', jsonString);
        return JSON.parse(jsonString);
    } else {
        // Regular JSON string
        return JSON.parse(pythonDictString);
    }
}

// ============================================================================
// BATCH TESTING MODULE
// ============================================================================

const BatchProcessor = {
    // State
    files: [],
    results: [],
    isProcessing: false,
    isCancelled: false,
    currentIndex: 0,

    // DOM Elements
    elements: {},

    // Maximum files allowed
    MAX_FILES: 50,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

    // Initialize batch testing functionality
    init: function() {
        this.initializeElements();

        // Check if user is admin - hide batch tab for non-admins
        if (!isAdminUser()) {
            if (this.elements.batchTabItem) {
                this.elements.batchTabItem.style.display = 'none';
            }
            console.log('Batch testing disabled for non-admin user');
            return;
        }

        this.attachEventListeners();
        this.loadHistory();
        console.log('Batch processor initialized for admin user');
    },

    // Initialize DOM element references
    initializeElements: function() {
        this.elements = {
            // Tab elements
            batchTab: document.getElementById('batch-tab'),
            batchTabItem: document.getElementById('batch-tab')?.closest('.nav-item'),
            // History elements
            historySection: document.getElementById('batchHistorySection'),
            historyList: document.getElementById('batchHistoryList'),
            historyEmpty: document.getElementById('batchHistoryEmpty'),
            refreshHistoryBtn: document.getElementById('batchRefreshHistory'),
            // Upload elements
            uploadZone: document.getElementById('batchUploadZone'),
            fileInput: document.getElementById('batchFileInput'),
            selectBtn: document.getElementById('batchSelectBtn'),
            fileListContainer: document.getElementById('batchFileList'),
            filePreviewList: document.getElementById('batchFilePreviewList'),
            fileCount: document.getElementById('batchFileCount'),
            clearAllBtn: document.getElementById('batchClearBtn'),
            processAllBtn: document.getElementById('batchProcessBtn'),
            // Progress elements
            progressSection: document.getElementById('batchProgressSection'),
            progressBar: document.getElementById('batchProgressBar'),
            progressText: document.getElementById('batchProgressText'),
            currentFile: document.getElementById('batchCurrentFile'),
            cancelBtn: document.getElementById('batchCancelBtn'),
            // Results elements
            resultsSection: document.getElementById('batchResultsSection'),
            resultsBody: document.getElementById('batchResultsBody'),
            resultCount: document.getElementById('batchResultCount'),
            exportCsvBtn: document.getElementById('batchExportCsv'),
            clearResultsBtn: document.getElementById('batchClearResults')
        };
    },

    // Attach event listeners
    attachEventListeners: function() {
        const self = this;

        // Upload zone click (excluding the button which has its own handler)
        if (this.elements.uploadZone) {
            this.elements.uploadZone.addEventListener('click', function(e) {
                // Don't trigger if clicking on the button itself
                if (e.target.closest('#batchSelectBtn')) {
                    return;
                }
                self.elements.fileInput.click();
            });

            // Drag and drop events
            this.elements.uploadZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.classList.add('drag-over');
            });

            this.elements.uploadZone.addEventListener('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.classList.remove('drag-over');
            });

            this.elements.uploadZone.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.classList.remove('drag-over');
                const files = Array.from(e.dataTransfer.files);
                self.addFiles(files);
            });
        }

        // Select button click
        if (this.elements.selectBtn) {
            this.elements.selectBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.elements.fileInput.click();
            });
        }

        // File input change
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', function(e) {
                const files = Array.from(e.target.files);
                self.addFiles(files);
                this.value = ''; // Reset input
            });
        }

        // Clear all button
        if (this.elements.clearAllBtn) {
            this.elements.clearAllBtn.addEventListener('click', function() {
                self.clearAllFiles();
            });
        }

        // Process all button
        if (this.elements.processAllBtn) {
            this.elements.processAllBtn.addEventListener('click', function() {
                self.startProcessing();
            });
        }

        // Cancel button
        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.addEventListener('click', function() {
                self.cancelProcessing();
            });
        }

        // Export CSV button
        if (this.elements.exportCsvBtn) {
            this.elements.exportCsvBtn.addEventListener('click', function() {
                self.exportCSV();
            });
        }

        // Clear results button
        if (this.elements.clearResultsBtn) {
            this.elements.clearResultsBtn.addEventListener('click', function() {
                self.clearResults();
            });
        }

        // Refresh history button
        if (this.elements.refreshHistoryBtn) {
            this.elements.refreshHistoryBtn.addEventListener('click', function() {
                self.loadHistory();
            });
        }
    },

    // Add files to the queue
    addFiles: function(newFiles) {
        const self = this;
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
        let addedCount = 0;
        let skippedCount = 0;

        newFiles.forEach(function(file) {
            // Check max files limit
            if (self.files.length >= self.MAX_FILES) {
                skippedCount++;
                return;
            }

            // Validate file type
            if (!validTypes.includes(file.type)) {
                console.warn('Invalid file type:', file.type);
                skippedCount++;
                return;
            }

            // Validate file size
            if (file.size > self.MAX_FILE_SIZE) {
                console.warn('File too large:', file.name);
                skippedCount++;
                return;
            }

            // Check for duplicates
            const isDuplicate = self.files.some(function(f) {
                return f.name === file.name && f.size === file.size;
            });

            if (isDuplicate) {
                skippedCount++;
                return;
            }

            // Add file with dataURL for preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const fileItem = {
                    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    file: file,
                    name: file.name,
                    size: file.size,
                    dataUrl: e.target.result,
                    status: 'pending'
                };
                self.files.push(fileItem);
                self.renderFileList();
                self.updateControls();
            };
            reader.readAsDataURL(file);
            addedCount++;
        });

        if (skippedCount > 0) {
            if (this.files.length >= this.MAX_FILES) {
                alert(`Maximum ${this.MAX_FILES} images allowed. ${skippedCount} file(s) were not added.`);
            } else {
                alert(`${skippedCount} file(s) were skipped (invalid type, too large, or duplicate).`);
            }
        }
    },

    // Render file list
    renderFileList: function() {
        const self = this;
        if (!this.elements.filePreviewList) return;

        // Show/hide the file list container
        if (this.elements.fileListContainer) {
            this.elements.fileListContainer.style.display = this.files.length > 0 ? 'block' : 'none';
        }

        this.elements.filePreviewList.innerHTML = '';

        this.files.forEach(function(item) {
            // Create column wrapper for grid
            const col = document.createElement('div');
            col.className = 'col-4 col-sm-3 col-md-2 col-lg-1';

            const thumb = document.createElement('div');
            thumb.className = 'batch-file-thumb';
            thumb.dataset.id = item.id;

            if (item.status === 'processing') {
                thumb.classList.add('processing');
            } else if (item.status === 'completed') {
                thumb.classList.add('success');
            } else if (item.status === 'error') {
                thumb.classList.add('error');
            } else {
                thumb.classList.add('pending');
            }

            thumb.innerHTML = `
                <img src="${item.dataUrl}" alt="${item.name}">
                <button type="button" class="remove-btn" data-id="${item.id}">&times;</button>
            `;

            col.appendChild(thumb);
            self.elements.filePreviewList.appendChild(col);
        });

        // Attach remove button listeners
        this.elements.filePreviewList.querySelectorAll('.remove-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                self.removeFile(this.dataset.id);
            });
        });

        // Update file count
        if (this.elements.fileCount) {
            this.elements.fileCount.textContent = this.files.length;
        }
    },

    // Remove a single file
    removeFile: function(id) {
        this.files = this.files.filter(function(f) { return f.id !== id; });
        this.renderFileList();
        this.updateControls();
    },

    // Clear all files
    clearAllFiles: function() {
        this.files = [];
        this.renderFileList();
        this.updateControls();
    },

    // Update control buttons state
    updateControls: function() {
        const hasFiles = this.files.length > 0;
        const hasPendingFiles = this.files.some(function(f) { return f.status === 'pending'; });

        if (this.elements.clearAllBtn) {
            this.elements.clearAllBtn.disabled = !hasFiles || this.isProcessing;
        }
        if (this.elements.processAllBtn) {
            this.elements.processAllBtn.disabled = !hasPendingFiles || this.isProcessing;
        }
    },

    // Current session ID for persisting results
    currentSessionId: null,

    // Start batch processing
    startProcessing: async function() {
        const pendingFiles = this.files.filter(function(f) { return f.status === 'pending'; });
        if (pendingFiles.length === 0) return;

        this.isProcessing = true;
        this.isCancelled = false;
        this.currentIndex = 0;

        // Show progress section
        if (this.elements.progressSection) {
            this.elements.progressSection.style.display = 'block';
        }

        // Show results section
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'block';
        }

        this.updateControls();

        // Get current model and language (use same selectors as single photo)
        const modelSelector = document.getElementById('modelSelector');
        const languageSelector = document.getElementById('languageSelector');
        const model = modelSelector ? modelSelector.value : 'gpt-4.1-mini';
        const language = languageSelector ? languageSelector.value : '';

        // Create a new session for persisting results
        try {
            this.currentSessionId = await this.createSession(model);
            console.log('Created batch session:', this.currentSessionId);
        } catch (error) {
            console.error('Failed to create session:', error);
            // Continue without persistence
            this.currentSessionId = null;
        }

        // Process files sequentially
        for (let i = 0; i < pendingFiles.length; i++) {
            if (this.isCancelled) break;

            this.currentIndex = i;
            const item = pendingFiles[i];

            // Update progress
            this.updateProgress(i, pendingFiles.length, item.name);

            // Mark as processing
            item.status = 'processing';
            this.renderFileList();

            try {
                const result = await this.processImage(item, model, language);
                item.status = 'completed';
                item.result = result;
                this.addResultRow(item, result);

                // Save result to backend
                if (this.currentSessionId) {
                    await this.saveResultToBackend(item, result, null);
                }
            } catch (error) {
                console.error('Error processing:', item.name, error);
                item.status = 'error';
                item.error = error.message;
                this.addResultRow(item, null, error.message);

                // Save error result to backend
                if (this.currentSessionId) {
                    await this.saveResultToBackend(item, null, error.message);
                }
            }

            this.renderFileList();
        }

        // Mark session as complete
        if (this.currentSessionId) {
            try {
                await this.completeSession();
                console.log('Session completed:', this.currentSessionId);
            } catch (error) {
                console.error('Failed to complete session:', error);
            }
        }

        // Processing complete
        this.isProcessing = false;
        this.updateProgress(pendingFiles.length, pendingFiles.length, 'Complete');
        this.updateControls();

        // Hide cancel button, show complete message
        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.style.display = 'none';
        }
        if (this.elements.progressText) {
            const processed = this.isCancelled ? this.currentIndex : pendingFiles.length;
            this.elements.progressText.textContent = this.isCancelled ?
                `Cancelled (${processed}/${pendingFiles.length})` :
                `${pendingFiles.length}/${pendingFiles.length}`;
        }
        if (this.elements.currentFile) {
            const span = this.elements.currentFile.querySelector('span');
            if (span) {
                span.textContent = this.isCancelled ? 'Cancelled' : 'Complete!';
            }
        }
    },

    // Create a new batch session on the backend
    createSession: async function(model) {
        const response = await fetch(`${API_BASE_URL}/api/batch-tests/sessions`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `Batch Test - ${new Date().toLocaleString()}`,
                model: model
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create session');
        }

        const data = await response.json();
        return data.session.session_id;
    },

    // Save a single result to the backend
    saveResultToBackend: async function(item, result, errorMsg) {
        if (!this.currentSessionId) return;

        const metadata = result?.metadata || {};

        // Create a smaller thumbnail for storage (resize to max 100px)
        const thumbnail = await this.createThumbnail(item.dataUrl, 100);

        const payload = {
            filename: item.name,
            image_thumbnail: thumbnail,
            model_used: metadata.model || null,
            status: errorMsg ? 'error' : 'success',
            error_message: errorMsg || null,
            recognized_persons: metadata.recognized_persons || [],
            identified_persons: metadata.identified_persons || [],
            description: metadata.description?.english || metadata.description || null,
            full_metadata: metadata
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/batch-tests/sessions/${this.currentSessionId}/results`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error('Failed to save result:', await response.text());
            }
        } catch (error) {
            console.error('Error saving result to backend:', error);
        }
    },

    // Mark the session as complete
    completeSession: async function() {
        if (!this.currentSessionId) return;

        const response = await fetch(`${API_BASE_URL}/api/batch-tests/sessions/${this.currentSessionId}/complete`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to complete session');
        }
    },

    // Create a smaller thumbnail from dataUrl
    createThumbnail: function(dataUrl, maxSize) {
        return new Promise(function(resolve) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round(height * maxSize / width);
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round(width * maxSize / height);
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = function() {
                resolve(null);
            };
            img.src = dataUrl;
        });
    },

    // Process a single image
    processImage: async function(item, model, language) {
        const formData = new FormData();
        // Use 'image' field name to match the single photo endpoint
        formData.append('image', item.file);

        // Build URL with query parameters (like single photo does)
        let analyzeUrl = `${API_BASE_URL}/analyze`;
        const params = new URLSearchParams();
        if (language) {
            params.append('language', language);
        }
        if (model && model !== 'gpt-4.1-mini') {
            params.append('model', model);
            // Determine provider based on model name
            const provider = model.startsWith('gemini') ? 'gemini' : 'openai';
            params.append('provider', provider);
        }
        // Add batch_id to enable logging with top 3 matches
        if (this.currentSessionId) {
            params.append('batch_id', this.currentSessionId);
        }
        if (params.toString()) {
            analyzeUrl += '?' + params.toString();
        }

        // Use the same auth headers as single photo upload
        const headers = getAuthHeaders();

        const response = await fetch(analyzeUrl, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }

        return await response.json();
    },

    // Update progress bar
    updateProgress: function(current, total, filename) {
        const percentage = Math.round((current / total) * 100);

        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = percentage + '%';
            this.elements.progressBar.textContent = percentage + '%';
            this.elements.progressBar.setAttribute('aria-valuenow', percentage);
        }

        if (this.elements.progressText) {
            this.elements.progressText.textContent = `${current}/${total}`;
        }

        if (this.elements.currentFile) {
            const span = this.elements.currentFile.querySelector('span');
            if (span) {
                span.textContent = filename;
            }
        }
    },

    // Cancel processing
    cancelProcessing: function() {
        this.isCancelled = true;
        if (this.elements.progressText) {
            this.elements.progressText.textContent = 'Cancelling...';
        }
    },

    // Add result row to table
    addResultRow: function(item, result, errorMsg) {
        if (!this.elements.resultsBody) return;

        // Debug logging
        console.log('Batch result for', item.name, ':', result);
        console.log('Error message:', errorMsg);

        const row = document.createElement('tr');

        // Handle response structure: { success: true, metadata: {...} }
        let metadata = {};
        if (result && result.success && result.metadata) {
            metadata = result.metadata;
        } else if (result && result.metadata) {
            metadata = result.metadata;
        } else if (result && !result.success && result.error) {
            errorMsg = errorMsg || result.error;
        }

        const model = metadata.model || 'N/A';

        // Face recognition results
        const recognizedPersons = metadata.recognized_persons || [];
        const recognizedHtml = recognizedPersons.length > 0 ?
            recognizedPersons.map(function(p) {
                const confidence = p.confidence ? ` (${Math.round(p.confidence * 100)}%)` : '';
                return `<span class="batch-person-pill">${p.name}${confidence}</span>`;
            }).join('') :
            '<span class="text-muted">None detected</span>';

        // Gemini AI recognition (only for Gemini 3 models)
        const identifiedPersons = metadata.identified_persons || [];
        const isGemini3 = model.includes('gemini-3');
        let identifiedHtml;
        if (!isGemini3) {
            identifiedHtml = '<span class="text-muted">N/A</span>';
        } else if (identifiedPersons.length > 0) {
            identifiedHtml = identifiedPersons.map(function(p) {
                const confidence = p.confidence ? ` (${p.confidence})` : '';
                return `<span class="batch-person-pill gemini">${p.name}${confidence}</span>`;
            }).join('');
        } else {
            identifiedHtml = '<span class="text-muted">None identified</span>';
        }

        // Description - full text, CSS handles truncation to 3 lines
        const description = metadata.description?.english || metadata.description || '';

        // Status
        const statusHtml = errorMsg ?
            `<span class="batch-status-badge error">Error</span>` :
            `<span class="batch-status-badge success">Success</span>`;

        row.innerHTML = `
            <td class="batch-image-cell">
                <img src="${item.dataUrl}" alt="${item.name}" class="batch-image-thumb">
                <div class="batch-image-preview">
                    <img src="${item.dataUrl}" alt="${item.name}">
                </div>
            </td>
            <td><span class="badge bg-secondary">${model}</span></td>
            <td class="batch-persons-list">${recognizedHtml}</td>
            <td class="batch-persons-list">${identifiedHtml}</td>
            <td class="batch-description">${this.escapeHtml(description)}</td>
            <td class="batch-status-cell">${statusHtml}</td>
        `;

        // Store result data for CSV export
        row.dataset.filename = item.name;
        row.dataset.model = model;
        row.dataset.recognized = recognizedPersons.map(function(p) { return p.name; }).join(', ');
        row.dataset.identified = identifiedPersons.map(function(p) { return p.name; }).join(', ');
        row.dataset.description = description;
        row.dataset.status = errorMsg ? 'Error: ' + errorMsg : 'Success';

        this.elements.resultsBody.appendChild(row);
        this.results.push({
            filename: item.name,
            model: model,
            recognized: row.dataset.recognized,
            identified: row.dataset.identified,
            description: description,
            status: row.dataset.status
        });

        // Update result count
        if (this.elements.resultCount) {
            this.elements.resultCount.textContent = this.results.length;
        }
    },

    // Export results to CSV
    exportCSV: async function() {
        if (this.results.length === 0) {
            alert('No results to export');
            return;
        }

        // If we have a batch_id (session), try to download from backend with top 3 matches
        if (this.currentSessionId) {
            try {
                const response = await fetch(`${API_BASE_URL}/batch-logs/${this.currentSessionId}/export`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `batch_${this.currentSessionId}_results.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                    return;
                }
            } catch (error) {
                console.warn('Backend CSV export failed, using client-side export:', error);
            }
        }

        // Fallback to client-side CSV generation
        const headers = ['Filename', 'Model', 'Face Recognition', 'LLM Person ID', 'Description', 'Status'];
        const rows = this.results.map(function(r) {
            return [
                r.filename,
                r.model,
                r.recognized,
                r.identified,
                r.description.replace(/"/g, '""'), // Escape quotes
                r.status
            ].map(function(cell) {
                return '"' + (cell || '') + '"';
            }).join(',');
        });

        const csv = [headers.join(',')].concat(rows).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'batch_results_' + new Date().toISOString().slice(0, 10) + '.csv';
        link.click();

        URL.revokeObjectURL(url);
    },

    // Clear results
    clearResults: function() {
        this.results = [];
        if (this.elements.resultsBody) {
            this.elements.resultsBody.innerHTML = '';
        }
        if (this.elements.resultCount) {
            this.elements.resultCount.textContent = '0';
        }
        if (this.elements.progressSection) {
            this.elements.progressSection.style.display = 'none';
        }
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'none';
        }
        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.style.display = 'inline-block';
        }
        // Reset progress bar
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = '0%';
            this.elements.progressBar.textContent = '0%';
        }
    },

    // Utility: truncate filename
    truncateFilename: function(name, maxLength) {
        if (name.length <= maxLength) return name;
        const ext = name.split('.').pop();
        const base = name.slice(0, -(ext.length + 1));
        const truncatedBase = base.slice(0, maxLength - ext.length - 4) + '...';
        return truncatedBase + '.' + ext;
    },

    // Utility: truncate text
    truncateText: function(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    },

    // Utility: escape HTML
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Load batch test history from backend
    loadHistory: async function() {
        if (!this.elements.historyList) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/batch-tests/sessions?limit=10`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load history');
            }

            const data = await response.json();
            this.renderHistory(data.sessions || []);
        } catch (error) {
            console.error('Error loading batch history:', error);
            // Show empty state on error
            this.renderHistory([]);
        }
    },

    // Render history sessions
    renderHistory: function(sessions) {
        const self = this;
        if (!this.elements.historyList) return;

        // Clear existing content except empty state
        const cards = this.elements.historyList.querySelectorAll('.batch-history-card');
        cards.forEach(function(card) { card.remove(); });

        // Show/hide empty state
        if (this.elements.historyEmpty) {
            this.elements.historyEmpty.style.display = sessions.length === 0 ? 'block' : 'none';
        }

        // Add session cards
        sessions.forEach(function(session) {
            const card = document.createElement('div');
            card.className = 'batch-history-card';
            card.dataset.sessionId = session.session_id;

            const createdDate = new Date(session.created_at).toLocaleString();
            const name = session.name || `Session ${session.session_id.slice(0, 8)}`;

            card.innerHTML = `
                <div class="batch-history-info">
                    <div class="batch-history-name">${self.escapeHtml(name)}</div>
                    <div class="batch-history-meta">
                        <span><i class="bi bi-calendar"></i> ${createdDate}</span>
                        <span><i class="bi bi-cpu"></i> ${session.model_used || 'N/A'}</span>
                    </div>
                </div>
                <div class="batch-history-stats">
                    <span class="batch-history-stat total">${session.total_images} total</span>
                    <span class="batch-history-stat success">${session.successful_count} ok</span>
                    ${session.failed_count > 0 ? `<span class="batch-history-stat error">${session.failed_count} failed</span>` : ''}
                </div>
                <div class="batch-history-actions">
                    <button class="btn btn-sm btn-outline-primary load-session-btn" title="Load Results">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-session-btn" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;

            // Add event listeners
            card.querySelector('.load-session-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                self.loadSession(session.session_id);
            });

            card.querySelector('.delete-session-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                self.deleteSession(session.session_id);
            });

            // Click on card also loads session
            card.addEventListener('click', function() {
                self.loadSession(session.session_id);
            });

            // Insert before empty state
            if (self.elements.historyEmpty) {
                self.elements.historyList.insertBefore(card, self.elements.historyEmpty);
            } else {
                self.elements.historyList.appendChild(card);
            }
        });
    },

    // Load a specific session's results
    loadSession: async function(sessionId) {
        const self = this;

        // Find the card and show loading state
        const card = this.elements.historyList?.querySelector(`[data-session-id="${sessionId}"]`);
        if (card) card.classList.add('loading');

        try {
            const response = await fetch(`${API_BASE_URL}/api/batch-tests/sessions/${sessionId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load session');
            }

            const data = await response.json();
            const session = data.session;

            // Clear current results
            this.clearResults();
            this.results = [];

            // Show results section
            if (this.elements.resultsSection) {
                this.elements.resultsSection.style.display = 'block';
            }

            // Add results from session
            if (session.results && session.results.length > 0) {
                session.results.forEach(function(result) {
                    self.addResultRowFromHistory(result);
                });
            }

            // Update result count
            if (this.elements.resultCount) {
                this.elements.resultCount.textContent = session.results?.length || 0;
            }

            console.log('Loaded session:', sessionId, 'with', session.results?.length || 0, 'results');
        } catch (error) {
            console.error('Error loading session:', error);
            alert('Failed to load session');
        } finally {
            if (card) card.classList.remove('loading');
        }
    },

    // Add a result row from history data
    addResultRowFromHistory: function(result) {
        if (!this.elements.resultsBody) return;

        const row = document.createElement('tr');
        const model = result.model_used || 'N/A';

        // Face recognition results
        const recognizedPersons = result.recognized_persons || [];
        const recognizedHtml = recognizedPersons.length > 0 ?
            recognizedPersons.map(function(p) {
                const confidence = p.confidence ? ` (${Math.round(p.confidence * 100)}%)` : '';
                return `<span class="batch-person-pill">${p.name}${confidence}</span>`;
            }).join('') :
            '<span class="text-muted">None detected</span>';

        // Gemini AI recognition
        const identifiedPersons = result.identified_persons || [];
        const isGemini3 = model.includes('gemini-3');
        let identifiedHtml;
        if (!isGemini3) {
            identifiedHtml = '<span class="text-muted">N/A</span>';
        } else if (identifiedPersons.length > 0) {
            identifiedHtml = identifiedPersons.map(function(p) {
                const confidence = p.confidence ? ` (${p.confidence})` : '';
                return `<span class="batch-person-pill gemini">${p.name}${confidence}</span>`;
            }).join('');
        } else {
            identifiedHtml = '<span class="text-muted">None identified</span>';
        }

        // Description - full text, CSS handles truncation to 3 lines
        const description = result.description || '';

        // Status
        const statusHtml = result.status === 'error' ?
            `<span class="batch-status-badge error">Error</span>` :
            `<span class="batch-status-badge success">Success</span>`;

        // Use thumbnail from backend or placeholder
        const thumbnail = result.image_thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZGVlMmU2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2Yzc1N2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWc8L3RleHQ+PC9zdmc+';

        row.innerHTML = `
            <td class="batch-image-cell">
                <img src="${thumbnail}" alt="${result.filename}" class="batch-image-thumb">
                <div class="batch-image-preview">
                    <img src="${thumbnail}" alt="${result.filename}">
                </div>
            </td>
            <td><span class="badge bg-secondary">${model}</span></td>
            <td class="batch-persons-list">${recognizedHtml}</td>
            <td class="batch-persons-list">${identifiedHtml}</td>
            <td class="batch-description">${this.escapeHtml(description)}</td>
            <td class="batch-status-cell">${statusHtml}</td>
        `;

        this.elements.resultsBody.appendChild(row);

        // Add to results array for CSV export
        this.results.push({
            filename: result.filename,
            model: model,
            recognized: recognizedPersons.map(function(p) { return p.name; }).join(', '),
            identified: identifiedPersons.map(function(p) { return p.name; }).join(', '),
            description: description,
            status: result.status === 'error' ? 'Error: ' + (result.error_message || 'Unknown') : 'Success'
        });
    },

    // Delete a session
    deleteSession: async function(sessionId) {
        if (!confirm('Are you sure you want to delete this test session? This cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/batch-tests/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to delete session');
            }

            // Remove from UI
            const card = this.elements.historyList?.querySelector(`[data-session-id="${sessionId}"]`);
            if (card) {
                card.remove();
            }

            // Check if list is now empty
            const remainingCards = this.elements.historyList?.querySelectorAll('.batch-history-card');
            if (remainingCards && remainingCards.length === 0 && this.elements.historyEmpty) {
                this.elements.historyEmpty.style.display = 'block';
            }

            console.log('Deleted session:', sessionId);
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Failed to delete session');
        }
    }
};

// Initialize batch processor when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are rendered
    setTimeout(function() {
        BatchProcessor.init();
    }, 200);
});
