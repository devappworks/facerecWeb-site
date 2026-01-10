# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a face recognition web application with two distinct parts:
1. **Main Application** - Vanilla JavaScript face recognition client (public_html root)
2. **Training UI** - React-based training data management and A/B testing dashboard (training-ui/)

## Repository Structure

```
facerecWeb-site/
├── index.html                     # Main app entry point
├── public/
│   ├── javascript/
│   │   ├── auth.js               # Authentication manager class
│   │   ├── main.js               # Core face recognition logic
│   │   └── pusher-handler.js     # WebSocket handler
│   └── style/style.css
├── training-ui/                   # React training management app
│   ├── src/
│   │   ├── services/             # API layer with mock fallbacks
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Route components
│   │   ├── components/           # Reusable UI components
│   │   ├── contexts/             # React context providers
│   │   └── styles/               # CSS modules
│   ├── vite.config.js
│   ├── vitest.config.js
│   └── package.json
├── training-dist/                 # Built Training UI output
└── docs/                         # Comprehensive documentation
```

## Development Commands

### Training UI (React App)

```bash
cd training-ui

# Development
npm run dev              # Start dev server at http://localhost:5173

# Testing
npm test                 # Run all tests with Vitest
npm test -- --watch      # Watch mode
npm test:coverage        # Generate coverage report
npm test:ui              # Launch Vitest UI
npm test -- path/to/test.jsx  # Run single test file

# Linting
npm run lint             # Run ESLint

# Building
npm run build            # Build to ../training-dist/
npm run preview          # Preview production build
```

### Main Application (Vanilla JS)

The main app requires no build step. Serve with any static file server:

```bash
# From repository root
python3 -m http.server 8000
# OR
npx http-server -p 8000
# OR
php -S localhost:8000
```

## Architecture

### Main Application (Vanilla JS)

**Authentication Flow:**
- Email-based token authentication via `/api/auth/token-by-email`
- Multi-domain support (users may belong to multiple organizations)
- Token stored in localStorage and used as `Authorization: <token>` header
- Class-based architecture in auth.js, functional in main.js

**Image Processing:**
- Face Recognition: Synchronous POST to `/recognize` (main.js:571)
- Object Detection: Asynchronous via POST to `/upload-for-detection` + Pusher WebSocket
- Pusher channel: 'my-channel' on cluster 'eu'

**Key Design Patterns:**
- Drag-and-drop file upload with validation (10MB max)
- Real-time updates via Pusher WebSocket
- Bootstrap 5.3.0 for UI, no framework dependencies

### Training UI (React Application)

**Routing Architecture:**
- React Router v7 with basename="/training"
- All routes protected by `<AuthGuard>` except /login
- Nested routing in ab-testing/ and automated-training/ modules

**Key Architectural Patterns:**

1. **Service Layer Pattern** (src/services/)
   - All services include mock data fallback for offline development
   - Services: api.js (base), auth.js, training.js, abTesting.js, videoRecognition.js, automatedTraining.js
   - Axios interceptors handle auth token injection and 401 redirects

2. **Custom Hooks Pattern** (src/hooks/)
   - `useAuth`: Authentication state management
   - `useTheme`: Dark/light mode toggle with localStorage persistence
   - `usePolling`: Reusable polling with auto-cleanup
   - `useComparison`: A/B testing comparison logic
   - `useMetrics`: Metrics fetching with polling
   - `useVideoStatus`, `useVideoUpload`: Video recognition state
   - `useBatchStatus`, `useCandidates`: Automated training state

3. **Context Providers:**
   - AuthProvider: Global auth state
   - ThemeProvider: Theme state (dark/light mode)
   - HelpProvider: Tutorial and help modal state

4. **A/B Testing System:**
   - Compares VGG-Face (Pipeline A) vs Facenet512 (Pipeline B)
   - Decision algorithm uses weighted scoring (Accuracy: 35%, Confidence: 25%, Performance: 20%, Agreement: 20%)
   - Four recommendation tiers based on total score (0-100)
   - Endpoints: POST /api/test/recognize, GET /api/test/metrics/{daily,weekly}

**Real-time Updates:**
- Polling-based (no WebSocket in Training UI)
- Progress Monitor: 5-second polling
- Metrics Dashboard: 30-second polling with pause/resume
- Queue Manager: Configurable polling interval

**Build Configuration (vite.config.js):**
- Base path: `/training/` (app served at example.com/training/)
- Build output: `../training-dist/` (builds to parent directory)
- Proxy configuration for API calls in development
- Test environment: jsdom with Vitest

**Authentication:**
- Token-based with axios interceptors
- Request interceptor: Adds `Authorization: Bearer <token>` to all requests
- Response interceptor: 401/403 errors clear token and redirect to /training/login
- Token stored in localStorage via authService.js

## API Configuration

### Environment Variables

Training UI uses Vite environment variables:

```bash
# training-ui/.env
VITE_API_BASE_URL=https://facerecognition.mpanel.app
VITE_API_TIMEOUT=30000
```

### Backend Endpoints

**Production API:** `https://facerecognition.mpanel.app`

Main app endpoints:
- POST /api/auth/token-by-email
- POST /recognize
- POST /upload-for-detection

Training UI endpoints:
- POST /api/training/generate
- GET /api/training/queue
- GET /api/training/progress
- POST /api/test/recognize (A/B comparison)
- GET /api/test/metrics/{daily,weekly}
- GET /api/test/history

## Testing Strategy

### Training UI Test Suite

**Test Framework:** Vitest + Testing Library
**Pass Rate:** 96% (52/54 tests passing)

**Coverage:**
- Service layer: 17/17 tests (API calls, mocks, error handling)
- Custom hooks: 24/24 tests (state, async, polling)
- Components: 11/13 tests (rendering, interactions)

**Test Utilities:**
- Setup: src/test/setup.js (jsdom environment)
- Helpers: src/test/utils.jsx (render with providers)
- Mock data: Each service includes mock data for offline testing

**Running Specific Tests:**
```bash
# Service tests
npm test -- src/services/__tests__/abTesting.test.js

# Hook tests
npm test -- src/hooks/__tests__/usePolling.test.jsx

# Component tests
npm test -- src/pages/ab-testing/__tests__/LiveComparison.test.jsx
```

## Key Implementation Details

### Authentication Flow (Training UI)

1. User logs in via Login.jsx → authService.login(email, password)
2. Token stored in localStorage
3. api.js interceptor injects token as `Authorization: Bearer <token>`
4. 401 responses trigger authService.clearToken() + redirect to /training/login

### A/B Testing Decision Algorithm

Located in: src/pages/ab-testing/DecisionSupport.jsx

```javascript
// Weighted scoring system (0-100 scale)
accuracyScore = (pipelineB accuracy improvement) * 0.35
confidenceScore = (pipelineB confidence improvement) * 0.25
performanceScore = (pipelineB speed improvement) * 0.20
agreementScore = (agreement rate) * 0.20

totalScore = accuracyScore + confidenceScore + performanceScore + agreementScore

// Recommendation tiers:
// ≥80: Strong recommendation to migrate
// ≥60: Proceed with migration
// ≥40: Further testing recommended
// <40: Do not migrate
```

### Polling Pattern

All polling uses the `usePolling` hook pattern:

```javascript
const { data, loading, error } = usePolling(
  fetchFunction,      // Async function to call
  interval,           // Milliseconds between polls
  shouldPoll          // Boolean to enable/disable
)
```

Auto-cleanup on unmount prevents memory leaks.

### Mock Data Fallback

All services check for API errors and fall back to mock data:

```javascript
try {
  const response = await api.get('/endpoint')
  return response.data
} catch (error) {
  console.warn('Using mock data:', error.message)
  return mockData
}
```

This enables development without a running backend.

## Common Development Tasks

### Adding a New Page to Training UI

1. Create page component in src/pages/ or appropriate subfolder
2. Import in src/App.jsx
3. Add route within the `<AuthGuard>` protected routes:
   ```jsx
   <Route path="/new-page" element={<NewPage />} />
   ```
4. Add navigation link in src/components/Layout.jsx sidebar

### Adding a New API Endpoint

1. Add function to appropriate service file (src/services/)
2. Include mock data fallback for offline development
3. Add tests in src/services/__tests__/
4. Use in component via custom hook if stateful

### Updating API Base URL

- Main app: Edit API_CONFIG in public/javascript/main.js
- Training UI: Update VITE_API_BASE_URL in training-ui/.env

### Dark Mode Implementation

Uses CSS variables defined in src/styles/global.css:
- Theme toggle in Layout.jsx header
- useTheme hook manages state
- Persisted in localStorage
- All colors use CSS custom properties

## Deployment

### Main Application

Static files, deploy anywhere:
- Copy index.html, public/, and training-dist/ to web root
- No build step required for main app
- Ensure HTTPS for production (auth tokens in headers)

### Training UI

```bash
cd training-ui
npm run build

# Output in training-dist/
# Serve at /training/ path (matches basename in vite.config.js)
```

**Important:** The app expects to be served at `/training/*` path due to `base: '/training/'` in vite.config.js

### CORS Requirements

Backend must allow CORS from deployed domain:
```
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Methods: POST, GET, OPTIONS
```

## Security Notes

- Tokens stored in localStorage (consider httpOnly cookies for production)
- No token expiration currently implemented
- File upload limit: 10MB (client-side, verify backend limit)
- Authorization header format differs between apps:
  - Main app: `Authorization: <token>`
  - Training UI: `Authorization: Bearer <token>`

## Documentation Resources

- docs/README.md - Main project overview
- docs/FRONTEND_DEVELOPER_README.md - Getting started guide
- docs/TRAINING_UI_API_DOCS.md - Complete API documentation (60+ pages)
- docs/TRAINING_UI_QUICK_REFERENCE.md - Quick lookup guide
- docs/TRAINING_DATA_COLLECTION_GUIDE.md - System architecture
- docs/TRAINING_UI_POSTMAN_COLLECTION.json - API testing collection
- training-ui/README.md - Training UI specific documentation

## Known Issues & Limitations

- Main app relies on external CDNs (Bootstrap, Pusher) - no offline capability
- Training UI uses polling instead of WebSockets for real-time updates
- No batch upload in main app (single image at a time)
- No result history in main app (cleared on refresh)
- Two failing tests in Training UI component suite (11/13 passing)

## Git Workflow

- Main branch: `main`
- Connected to: `git@github.com:devappworks/facerecWeb-site.git`
- Recent focus: Training UI A/B testing implementation and documentation
