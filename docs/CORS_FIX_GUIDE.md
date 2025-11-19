# CORS Configuration Fix for Backend

## Problem:
Frontend at `https://photolytics.mpanel.app` cannot access backend API at `https://facerecognition.mpanel.app` due to CORS policy blocking.

## Error:
```
Access to XMLHttpRequest at 'https://facerecognition.mpanel.app/api/training/queue-status'
from origin 'https://photolytics.mpanel.app' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
It does not have HTTP ok status.
```

---

## Solution 1: Flask-CORS (Recommended)

### Install Flask-CORS:
```bash
pip install flask-cors
```

### Update Your Flask App:

**Option A: Allow Specific Origin (Most Secure)**
```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Allow only the Training UI domain
CORS(app, origins=[
    'https://photolytics.mpanel.app',
    'http://localhost:5173',  # For local development
])
```

**Option B: Allow Multiple Origins**
```python
from flask_cors import CORS

app = Flask(__name__)

CORS(app, origins=[
    'https://photolytics.mpanel.app',
    'https://facerecognition.mpanel.app',
    'http://localhost:5173',
    'http://localhost:5000',
])
```

**Option C: Allow All Origins (Development Only - NOT for Production)**
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allows all origins - USE ONLY FOR TESTING
```

---

## Solution 2: Manual CORS Headers

If you can't use Flask-CORS, add headers manually:

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    # Allow Training UI domain
    allowed_origins = [
        'https://photolytics.mpanel.app',
        'http://localhost:5173',
    ]

    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Credentials'] = 'true'

    return response

@app.route('/api/training/queue-status', methods=['OPTIONS'])
def handle_preflight_queue_status():
    """Handle preflight request for queue-status endpoint"""
    return '', 204

# Add OPTIONS handler for all endpoints
@app.route('/api/training/queue-list', methods=['OPTIONS'])
def handle_preflight_queue_list():
    return '', 204

@app.route('/api/training/queue', methods=['OPTIONS'])
def handle_preflight_queue_delete():
    return '', 204

@app.route('/api/training/progress', methods=['OPTIONS'])
def handle_preflight_progress():
    return '', 204

@app.route('/api/excel/check-excel', methods=['OPTIONS'])
def handle_preflight_generate():
    return '', 204

@app.route('/api/excel/process', methods=['OPTIONS'])
def handle_preflight_process():
    return '', 204
```

---

## Solution 3: Nginx Reverse Proxy (If Using Nginx)

If your backend is behind Nginx, add CORS headers in Nginx config:

```nginx
server {
    listen 443 ssl;
    server_name facerecognition.mpanel.app;

    location /api/ {
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://photolytics.mpanel.app' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        # Handle preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://photolytics.mpanel.app';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Recommended Implementation (Flask-CORS):

**Step 1: Install**
```bash
pip install flask-cors
```

**Step 2: Update app.py (or main Flask file)**
```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Production-ready CORS configuration
CORS(app,
     origins=[
         'https://photolytics.mpanel.app',    # Production frontend
         'http://localhost:5173',              # Local development
     ],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     supports_credentials=True
)

# Your existing routes...
@app.route('/api/training/queue-status')
def get_queue_status():
    # ... existing code
    pass
```

**Step 3: Restart Flask**
```bash
# Stop the current Flask process
# Then restart:
python app.py
# or
flask run
```

---

## Testing the Fix:

After backend changes, test with curl:

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS https://facerecognition.mpanel.app/api/training/queue-status \
  -H "Origin: https://photolytics.mpanel.app" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Expected response headers:
# Access-Control-Allow-Origin: https://photolytics.mpanel.app
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## Why This Happens:

1. **Browser Security**: Browsers block cross-origin requests by default
2. **Different Domains**: Frontend (photolytics) ≠ Backend (facerecognition)
3. **Preflight Request**: Browser sends OPTIONS request first
4. **Backend Must Approve**: Backend must respond with CORS headers

---

## Quick Check - Is CORS Already Configured?

Check if Flask-CORS is already installed:
```bash
pip list | grep -i cors
```

If it shows `Flask-CORS`, then it might just need configuration update.

---

## Priority: HIGH

This is blocking all API calls from the frontend. The Training UI cannot function until this is fixed.

**Recommend**: Use Solution 1 (Flask-CORS) - it's the cleanest and most maintainable approach.
