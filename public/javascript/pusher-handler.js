// Pusher Socket Handler
// This file handles real-time communication for object detection results

// Initialize Pusher
function initializePusher() {
    Pusher.logToConsole = true;

    const pusher = new Pusher('3a3e4e065f86231ecf84', {
        cluster: 'eu'
    });

    const channel = pusher.subscribe('my-channel');
    
    // Handle incoming socket messages
    channel.bind('my-event', function(data) {
        console.log('Received socket data:', data);
        
        try {
            const parsedData = parseSocketData(data);
            console.log('Parsed socket data:', parsedData);
            
            // Extract object detection data from message property if needed
            const objectDetectionData = extractObjectDetectionData(parsedData);
            
            // Display the results
            if (typeof displayObjectDetectionResult === 'function') {
                displayObjectDetectionResult(objectDetectionData);
            } else {
                console.error('displayObjectDetectionResult function not available');
            }
            
        } catch (error) {
            console.error('Error processing socket data:', error);
            console.error('Raw data received:', data);
            
            // Display error message
            if (typeof displayObjectDetectionResult === 'function') {
                displayObjectDetectionResult({
                    error: 'Failed to process socket data: ' + error.message
                });
            }
        }
    });
    
    return { pusher, channel };
}

// Parse incoming socket data
function parseSocketData(data) {
    if (typeof data === 'string') {
        return convertPythonDictToJson(data);
    } else {
        return data; // Already an object
    }
}

// Extract object detection data from parsed socket data
function extractObjectDetectionData(parsedData) {
    // Check if the actual data is in the message property
    if (parsedData.message && typeof parsedData.message === 'string') {
        console.log('Found message property, parsing it...');
        return convertPythonDictToJson(parsedData.message);
    }
    
    // Data is directly in the parsed object
    return parsedData;
}

// Initialize Pusher when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure main.js functions are loaded
    setTimeout(() => {
        if (typeof convertPythonDictToJson === 'function') {
            initializePusher();
            console.log('Pusher initialized successfully');
        } else {
            console.error('convertPythonDictToJson function not found. Make sure main.js is loaded first.');
        }
    }, 100);
}); 