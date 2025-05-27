// DOM Elements
const uploadZone = document.querySelector('.upload-zone');
const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');
const previewContainer = document.getElementById('previewContainer');
const uploadPrompt = document.getElementById('uploadPrompt');
const imagePreview = document.getElementById('imagePreview');
const removePreviewButton = document.getElementById('removePreview');

// API Configuration - Changed back to original endpoints
const API_CONFIG = {
    faceRecognition: {
        url: 'http://127.0.0.1:5000/recognize',
        headers: {
            'Authorization': 'd9OLEFYdx18bUTGkIpaKyDFCcko1jYu0Ha1'
        }
    },
    objectDetection: {
        url: 'http://127.0.0.1:5000/upload-for-detection',
        headers: {
            'Authorization': 'd9OLEFYdx18bUTGkIpaKyDFCcko1jYu0Ha1'
        }
    }
};

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
    // Method 1: Try with FormData (current approach)
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'd9OLEFYdx18bUTGkIpaKyDFCcko1jYu0Ha1'
            },
            body: formData
        });

        const text = await response.text();
        
        if (response.ok) {
            return JSON.parse(text);
        }
    } catch (error) {
        console.log('Method 1 failed:', error.message);
    }
    
}

// Modified handleFileUploadDebug to handle responses independently
async function handleFileUploadDebug(file) {
    try {
        validateImageFile(file);
        // Start both API calls simultaneously but handle them independently
        handleFaceRecognition(file);
        handleObjectDetection(file);

    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
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
    } else if (faceData.status === 'success' && faceData.person) {
        // Successful face recognition
        const confidence = faceData.best_match?.confidence_metrics?.confidence_percentage || 0;
        
        result1.innerHTML = `
            <div class="alert alert-success">
                <div class="d-flex align-items-center">
                    <i class="bi bi-person-check-fill me-2 fs-4"></i>
                    <div>
                        <h6 class="mb-1"><strong>Face Recognition Successful!</strong></h6>
                        <p class="mb-1">Recognized person: <strong>${faceData.person}</strong></p>
                        <small class="text-muted">Confidence: ${confidence.toFixed(2)}%</small>
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
    } else if (faceData.status === 'success' && !faceData.person) {
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
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select an image first');
        return;
    }

    // Show loading state for both sections
    document.getElementById('result1').innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Processing face recognition...</p></div>';
    document.getElementById('result2').innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Starting object detection...</p></div>';

    try {
        await handleFileUploadDebug(file);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result1').innerHTML = `<div class="alert alert-danger"><strong>Error:</strong><br>${error.message}</div>`;
        document.getElementById('result2').innerHTML = `<div class="alert alert-danger"><strong>Error:</strong><br>${error.message}</div>`;
    }
});

// File Preview Handler
fileInput.addEventListener('change', (e) => {
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
});

// Remove Preview Handler
removePreviewButton.addEventListener('click', () => {
    previewContainer.style.display = 'none';
    uploadPrompt.style.display = 'block';
    fileInput.value = '';
    imagePreview.src = '';
    
    // Clear any existing results
    document.getElementById('result1').innerHTML = '<p class="text-muted">Results will be displayed after upload...</p>';
    document.getElementById('result2').innerHTML = '<p class="text-muted">Results will be displayed after upload...</p>';
});

// Drag and Drop Handlers
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Add visual feedback for drag and drop
uploadZone.addEventListener('dragenter', () => {
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', (e) => {
    // Only remove drag-over class if we're leaving the upload zone entirely
    if (!uploadZone.contains(e.relatedTarget)) {
        uploadZone.classList.remove('drag-over');
    }
});

uploadZone.addEventListener('drop', (e) => {
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
});

// Add click handler to upload zone
uploadZone.addEventListener('click', (e) => {
    // Don't trigger if clicking on the file input or buttons
    if (e.target === fileInput || e.target.tagName === 'BUTTON') {
        return;
    }
    fileInput.click();
});

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
