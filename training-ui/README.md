# Face Recognition Training & Testing UI

A comprehensive React-based web application for managing face recognition model training and A/B testing between different recognition systems (VGG-Face vs Facenet512).

## Overview

This application provides a complete interface for:
- **Model Training Management**: Upload training data, monitor progress, manage training queues
- **A/B Testing Dashboard**: Compare two face recognition systems side-by-side
- **Data Synchronization**: Sync training data between local and remote systems
- **Testing & Validation**: Test recognition accuracy and review results

## Features

### 📚 Training Management (9 Pages)

#### 1. **Dashboard** (`/dashboard`)
- Overview of system status and recent activity
- Quick access to all major functions
- System health monitoring

#### 2. **Generate Names** (`/generate-names`)
- Upload images to create new person profiles
- Batch upload support with drag-and-drop
- Real-time validation and preview
- Automatic name extraction from filenames

#### 3. **Queue Manager** (`/queue`)
- View and manage training queue
- Monitor pending training jobs
- Queue status and prioritization
- Polling for real-time updates

#### 4. **Progress Monitor** (`/progress`)
- Real-time training progress tracking
- Status indicators (pending, in_progress, completed, failed)
- Training metrics and statistics
- Auto-refresh every 5 seconds

#### 5. **Image Gallery** (`/gallery`)
- Browse all uploaded training images
- Filter by person name
- View image metadata
- Delete unwanted images

#### 6. **Sync Manager** (`/sync`)
- Synchronize training data between systems
- Local ↔ Remote sync operations
- Sync status monitoring
- Conflict resolution

#### 7. **Testing** (`/testing`)
- Upload images to test face recognition
- Real-time recognition results
- Confidence scores and match quality
- Multiple image testing support

#### 8. **A/B Testing Legacy** (`/ab-testing-old`)
- Original A/B testing interface
- Basic comparison functionality

#### 9. **Dark Mode Toggle**
- System-wide dark/light theme
- Persistent theme preference
- Smooth transitions

### ⚖️ A/B Testing Dashboard (4 Pages)

#### 1. **Live Comparison** (`/ab-testing/live`)
**Purpose**: Compare VGG-Face (Pipeline A) vs Facenet512 (Pipeline B) in real-time

**Features**:
- Drag-and-drop image upload (max 10MB)
- Optional ground truth for accuracy validation
- Side-by-side results display
- Detailed comparison analysis:
  - Agreement detection (both pipelines match?)
  - Confidence difference calculation
  - Processing time comparison
  - Accuracy validation (when ground truth provided)
- Intelligent recommendations
- Status indicators (success, no faces, error)

#### 2. **Metrics Dashboard** (`/ab-testing/metrics`)
**Purpose**: Visualize aggregated performance metrics

**Features**:
- Period selection (Daily/Weekly)
- Date picker for daily metrics
- Real-time auto-refresh (30s polling)
- **5 Key Metrics Cards**:
  - Total tests count
  - Agreement rate (%)
  - Pipeline B accuracy (%)
  - Pipeline B faster rate (%)
  - Average confidence improvement
- **Status Breakdown** with progress bars:
  - Both succeeded
  - Only Pipeline A succeeded
  - Only Pipeline B succeeded
  - Both failed
- **Accuracy Comparison** visualization
- **Performance Metrics**:
  - Average processing time comparison
  - Average confidence comparison
  - Winner highlighting

#### 3. **Decision Support** (`/ab-testing/decision`)
**Purpose**: Provide intelligent migration recommendations

**Features**:
- **Weighted Decision Matrix** (0-100 score):
  - Accuracy: 35% weight (threshold: 2% improvement)
  - Confidence: 25% weight (threshold: 3% improvement)
  - Performance: 20% weight (threshold: 10% faster)
  - Agreement: 20% weight (threshold: 85% agreement rate)
- **4-Tier Recommendations**:
  - Score ≥80: "Strong Recommendation to Migrate"
  - Score ≥60: "Proceed with Migration"
  - Score ≥40: "Further Testing Recommended"
  - Score <40: "Do Not Migrate"
- **Key Insights** panel with detailed analysis
- **Context-aware Next Steps** based on overall score
- Visual progress bars for each criterion

#### 4. **Test History** (`/ab-testing/history`)
**Purpose**: Browse and analyze historical test results

**Features**:
- **Advanced Filtering**:
  - Search by image ID or person name
  - Filter by status (both success, only A, only B, both failed)
  - Filter by agreement (agree/disagree)
  - Filter by date range (today, week, month, all time)
- **Data Table** with:
  - Timestamps
  - Image IDs
  - Pipeline A & B results with confidence scores
  - Agreement indicators
  - Color-coded status badges
- **Smart Pagination** (10 items/page with ellipsis)
- **Export Functionality**:
  - CSV export for spreadsheet analysis
  - JSON export for data processing
- **Refresh on demand**

## Technology Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **React Router v7** - Client-side routing
- **Axios** - HTTP client
- **React Query** - Server state management
- **Vitest** - Testing framework
- **Testing Library** - Component testing
- **jsdom** - DOM simulation for tests

## Project Structure

```
training-ui/
├── src/
│   ├── components/
│   │   ├── Layout.jsx              # Main layout with sidebar
│   │   ├── Login.jsx               # Authentication
│   │   └── ProtectedRoute.jsx     # Route protection
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── GenerateNames.jsx
│   │   ├── Queue.jsx
│   │   ├── Progress.jsx
│   │   ├── Gallery.jsx
│   │   ├── Sync.jsx
│   │   ├── Testing.jsx
│   │   └── ab-testing/            # A/B Testing module
│   │       ├── LiveComparison.jsx
│   │       ├── MetricsDashboard.jsx
│   │       ├── DecisionSupport.jsx
│   │       ├── TestHistory.jsx
│   │       └── __tests__/         # Component tests
│   ├── services/
│   │   ├── api.js                 # Axios instance
│   │   ├── auth.js                # Authentication service
│   │   ├── training.js            # Training API
│   │   ├── abTesting.js           # A/B testing API
│   │   └── __tests__/             # Service tests
│   ├── hooks/
│   │   ├── usePolling.jsx         # Polling hook
│   │   ├── useAuth.jsx            # Auth state
│   │   ├── useTheme.jsx           # Theme management
│   │   ├── useComparison.jsx      # A/B comparison
│   │   ├── useMetrics.jsx         # Metrics with polling
│   │   └── __tests__/             # Hook tests
│   ├── styles/
│   │   ├── layout.css             # Layout & navigation
│   │   └── global.css             # Global styles
│   ├── test/
│   │   ├── setup.js               # Test environment setup
│   │   └── utils.jsx              # Test utilities
│   ├── App.jsx                    # Main app component
│   └── main.jsx                   # Entry point
├── vitest.config.js               # Test configuration
├── package.json
└── vite.config.js                 # Build configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API server running (or use mock data)

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server (http://localhost:5173)
npm run dev
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests with UI
npm test:ui

# Run specific test file
npm test -- path/to/test.jsx
```

## API Integration

### Mock Data Fallback

All services include mock data fallback for development without a backend:
- Training operations return simulated data
- A/B testing shows realistic comparison results
- Metrics display sample statistics

### Real API Endpoints

The application expects the following backend endpoints:

**Training API** (`/api/training/*`):
- `POST /generate` - Upload training images
- `GET /queue` - Get training queue
- `GET /progress` - Get training progress
- `GET /gallery` - Get image gallery
- `POST /sync` - Sync training data
- `POST /recognize` - Test recognition

**A/B Testing API** (`/api/test/*`):
- `POST /recognize` - Run comparison test
- `GET /metrics/daily` - Get daily metrics
- `GET /metrics/weekly` - Get weekly metrics
- `GET /health` - Health check
- `GET /history` - Get test history

### Configuration

Update `src/services/api.js` to point to your backend:

```javascript
const api = axios.create({
  baseURL: 'http://your-backend-url',
  timeout: 30000,
})
```

## Authentication

The app uses token-based authentication:
- Login with email/password
- Token stored in localStorage
- Automatic token refresh
- Protected routes require authentication
- Multi-domain support

## Testing

### Test Coverage

**96% pass rate** - 52 out of 54 tests passing

**Service Layer** (17/17 tests):
- API integration
- Mock data fallback
- Error handling
- Pagination

**Custom Hooks** (24/24 tests):
- State management
- Async operations
- Polling integration
- Error states

**Components** (11/13 tests):
- Rendering
- User interactions
- Data flow
- Error handling

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test:coverage

# Specific test suite
npm test -- src/services/__tests__/abTesting.test.js
```

## Dark Mode

The application supports dark mode with:
- Toggle in sidebar header
- Persistent preference (localStorage)
- CSS variable-based theming
- Smooth transitions

## Key Features Explained

### Real-time Updates

The application uses polling for real-time updates:
- **Progress Monitor**: 5-second polling
- **Metrics Dashboard**: 30-second polling with pause/resume
- **Queue Manager**: Configurable polling interval

### File Upload

Drag-and-drop file upload with:
- File type validation (images only)
- File size limits (10MB)
- Preview generation
- Batch upload support
- Progress feedback

### Data Export

Export functionality includes:
- **CSV**: For spreadsheet analysis
- **JSON**: For programmatic processing
- Filtered data export (only exports current filter results)
- Date-stamped filenames

### Decision Algorithm

The Decision Support page uses a weighted scoring system:

```
Total Score = (Accuracy × 0.35) + (Confidence × 0.25) +
              (Performance × 0.20) + (Agreement × 0.20)

Where each metric scores:
- 100 points: Exceeds threshold
- 50 points: Positive but below threshold
- 0 points: Below expectations
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ support required
- No IE11 support

## Performance Considerations

- **Code splitting**: Automatic route-based splitting
- **Lazy loading**: Components loaded on demand
- **Memoization**: Expensive calculations cached
- **Polling optimization**: Pause when inactive
- **Image optimization**: Client-side compression

## Future Enhancements

Potential improvements:
- WebSocket for real-time updates (replace polling)
- Image annotation tools
- Bulk comparison testing
- PDF report generation
- Custom threshold configuration
- Test scheduling
- More visualization charts

## Troubleshooting

### Common Issues

**1. API Connection Errors**
- Check `src/services/api.js` baseURL
- Ensure backend is running
- Check CORS configuration
- Mock data will be used as fallback

**2. Authentication Errors**
- Clear localStorage
- Check token expiration
- Verify backend auth endpoint

**3. Build Errors**
- Clear `node_modules` and reinstall
- Update Node.js to 18+
- Check for dependency conflicts

**4. Test Failures**
- Clear test cache: `npm test -- --clearCache`
- Update snapshots if needed
- Check vitest.config.js setup

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run test suite
6. Submit pull request

## Support

For issues or questions:
- Check existing GitHub issues
- Review documentation
- Contact development team
