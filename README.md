# Photolytics - Face Recognition Web Application

A modern web-based platform for face recognition and object detection, providing real-time image analysis through an intuitive drag-and-drop interface.

## Features

### Authentication
- Email-based authentication with token management
- Multi-domain support for enterprise users
- Persistent sessions with automatic login
- Secure token-based API authorization

### Image Analysis
- **Face Recognition**: Identify people in uploaded images
  - Multi-person detection
  - Confidence metrics for matches
  - Clear feedback for unknown faces

- **Object Detection**: Analyze image content
  - Automatic object identification
  - Image description generation
  - Alt text suggestions
  - Meta tag recommendations

### User Experience
- Drag-and-drop file upload
- Real-time processing updates via WebSockets
- Image preview before upload
- Responsive design (mobile & desktop)
- Smooth animations and transitions
- File validation (type, size, content)

## Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with animations
- **Vanilla JavaScript (ES6+)** - No framework dependencies

### Libraries
- **Bootstrap 5.3.0** - Responsive UI framework
- **Bootstrap Icons 1.11.0** - Icon library
- **Pusher 8.4.0** - Real-time WebSocket communication

### Backend API
- Production endpoint: `https://facerecognition.mpanel.app`

## Project Structure

```
facerecWeb-site/
├── index.html                    # Main application entry point
├── public/
│   ├── iconNew.png              # Application favicon
│   ├── javascript/
│   │   ├── auth.js              # Authentication management (756 lines)
│   │   ├── main.js              # Core application logic (571 lines)
│   │   └── pusher-handler.js    # WebSocket handler (80 lines)
│   └── style/
│       └── style.css            # Application styles (587 lines)
└── README.md                     # This file
```

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A web server for local development (optional)
- Valid authentication credentials for the Photolytics API

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd facerecWeb-site
   ```

2. **No build step required** - This is a static web application

### Running Locally

You can run the application using any static file server:

**Option 1: Python 3**
```bash
python3 -m http.server 8000
```

**Option 2: Node.js**
```bash
npx http-server -p 8000
```

**Option 3: PHP**
```bash
php -S localhost:8000
```

**Option 4: VS Code Live Server**
- Install the "Live Server" extension
- Right-click `index.html` and select "Open with Live Server"

Access the application at: `http://localhost:8000`

## Usage

### Login
1. Enter your email address
2. If you have access to multiple domains, select your organization
3. You'll be automatically logged in with a persistent session

### Upload & Analyze Images
1. Click the upload zone or drag and drop an image
2. Supported formats: JPEG, PNG, GIF, and other image formats
3. Maximum file size: 10MB
4. View real-time results for:
   - Face recognition (synchronous)
   - Object detection (asynchronous via WebSocket)

### Logout
Click the "Logout" button in the top-right corner to end your session.

## Configuration

### API Endpoints
Configuration is defined in `public/javascript/main.js`:

```javascript
const API_CONFIG = {
    faceRecognition: {
        url: 'https://facerecognition.mpanel.app/recognize'
    },
    objectDetection: {
        url: 'https://facerecognition.mpanel.app/upload-for-detection'
    }
};
```

### Pusher Configuration
Real-time updates are configured in `public/javascript/pusher-handler.js`:

```javascript
const pusher = new Pusher('3a3e4e065f86231ecf84', {
    cluster: 'eu'
});
const channel = pusher.subscribe('my-channel');
```

### File Upload Limits
- Maximum file size: 10MB
- Allowed types: All image formats (image/*)
- Files must have non-zero size

## Deployment

### Static Hosting Options

This application can be deployed to any static file hosting service:

**GitHub Pages**
```bash
git push origin main
# Enable GitHub Pages in repository settings
```

**Netlify**
1. Connect your repository or drag-and-drop files
2. No build configuration needed
3. Automatic deployments on push

**Vercel**
1. Import your repository
2. No framework preset needed
3. Deploy with default settings

**Traditional Web Server (Nginx, Apache)**
```bash
# Copy files to web server document root
scp -r * user@server:/var/www/html/photolytics/
```

**AWS S3 + CloudFront**
1. Upload files to S3 bucket
2. Enable static website hosting
3. Configure CloudFront distribution (optional)

### CORS Requirements

Ensure your backend API allows CORS from your deployed domain:
```
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Methods: POST, OPTIONS
```

## API Reference

### Authentication

**Endpoint**: `POST /api/auth/token-by-email`

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response** (Single Domain):
```json
{
  "token": "your-auth-token",
  "domain": "example.com"
}
```

**Response** (Multiple Domains):
```json
{
  "domains": [
    {
      "domain": "example.com",
      "token": "token-1"
    },
    {
      "domain": "company.com",
      "token": "token-2"
    }
  ]
}
```

### Face Recognition

**Endpoint**: `POST /recognize`

**Headers**:
```
Authorization: your-auth-token
Content-Type: multipart/form-data
```

**Request**:
- Form data with `image` field containing the file

**Response**:
```json
{
  "status": "success",
  "recognized_persons": [
    {
      "name": "John Doe",
      "confidence_metrics": {
        "confidence_percentage": 95.5
      }
    }
  ],
  "best_match": {
    "confidence_metrics": {
      "confidence_percentage": 95.5
    }
  }
}
```

**Error Response**:
```json
{
  "status": "error",
  "message": "Error description"
}
```

### Object Detection

**Endpoint**: `POST /upload-for-detection`

**Headers**:
```
Authorization: your-auth-token
Content-Type: multipart/form-data
```

**Request**:
- Form data with `image` field containing the file

**Response**:
```json
{
  "success": true,
  "token": "processing-token-123"
}
```

**WebSocket Result** (via Pusher):
```json
{
  "description": "A detailed description of the image",
  "alt_text": "Alt text suggestion",
  "detected_objects": ["object1", "object2"],
  "meta_tags": ["tag1", "tag2"]
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Modern browsers with ES6+ support required.

## Security Considerations

### Current Implementation
- Tokens stored in localStorage
- HTTPS recommended for production
- Authorization header format: `Authorization: <token>`

### Recommendations for Production
1. Use HTTPS only
2. Implement Content Security Policy (CSP) headers
3. Add token expiration and refresh mechanism
4. Consider moving sensitive tokens to httpOnly cookies
5. Enable CORS only for trusted domains

## Known Limitations

1. **No offline support** - Requires internet connection
2. **No batch upload** - One image at a time
3. **No result history** - Results cleared on refresh
4. **No image compression** - Full-resolution images uploaded
5. **CDN dependencies** - Relies on external CDNs for Bootstrap and Pusher

## Troubleshooting

### "Authentication failed" error
- Clear browser localStorage: `localStorage.clear()`
- Verify your email has access to the system
- Check browser console for detailed error messages

### Image upload fails
- Verify file is under 10MB
- Ensure file is a valid image format
- Check network connection
- Verify authentication token is valid

### Object detection not showing results
- Ensure WebSocket connection is established
- Check browser console for Pusher errors
- Verify network allows WebSocket connections
- Wait up to 30 seconds for processing

### Application not loading
- Check browser console for errors
- Verify CDN resources are loading (check Network tab)
- Try clearing browser cache
- Ensure JavaScript is enabled

## Development

### Code Style
- ES6+ JavaScript features
- Async/await for asynchronous operations
- Class-based architecture for auth management
- Functional approach for main application logic

### Key Files
- **auth.js**: Authentication manager class with login, logout, and session management
- **main.js**: Core application logic including upload, validation, and API calls
- **pusher-handler.js**: WebSocket event handling for real-time updates
- **style.css**: Custom styles with animations and responsive design

### Making Changes
1. Edit files directly (no build step)
2. Refresh browser to see changes
3. Use browser DevTools for debugging
4. Test on multiple screen sizes

## Contributing

### Development Workflow
1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly in multiple browsers
4. Commit with descriptive messages
5. Push to remote and create pull request

### Commit Message Format
```
<type>: <description>

Examples:
- feat: Add batch upload functionality
- fix: Resolve authentication timeout issue
- docs: Update API documentation
- style: Improve mobile responsiveness
- refactor: Simplify error handling logic
```

## License

[Specify your license here]

## Support

For issues, questions, or feature requests, please contact the development team or create an issue in the repository.

## Changelog

See git commit history for detailed changes.

### Recent Updates
- Enhanced multi-person face recognition support
- Improved handling of edge cases (no faces, unknown persons)
- Updated to production API endpoints
- Enhanced mobile responsiveness
- Added domain selection for multi-domain accounts

---

**Built with modern web technologies for fast, reliable image analysis.**
