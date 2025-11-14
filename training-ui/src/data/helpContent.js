export const helpContent = {
  dashboard: {
    title: 'Dashboard',
    sections: [
      {
        heading: 'Overview',
        content:
          'The Dashboard provides a quick overview of your training system status, including queue statistics, recent activity, and system health.',
      },
      {
        heading: 'Key Metrics',
        content:
          'Monitor total people trained, pending items in queue, active training sessions, and completion rates.',
      },
      {
        heading: 'Quick Actions',
        content:
          'Use the dashboard to quickly navigate to different sections like generating new training names, managing the queue, or monitoring progress.',
      },
    ],
  },

  generate: {
    title: 'Generate Names',
    sections: [
      {
        heading: 'What is This?',
        content:
          'This page allows you to manually add people to the training queue by entering their names.',
      },
      {
        heading: 'How to Use',
        content:
          'Enter a person\'s name in the input field and click "Add to Queue". The system will process the name and prepare it for training.',
      },
      {
        heading: 'Best Practices',
        content:
          'Use full names for better results. Check the queue manager to verify entries before processing.',
      },
    ],
  },

  queue: {
    title: 'Queue Manager',
    sections: [
      {
        heading: 'Managing Your Queue',
        content:
          'View all pending training requests in the queue. You can reorder, remove, or modify entries before processing.',
      },
      {
        heading: 'Queue Actions',
        content:
          'Click on any entry to edit details. Use drag-and-drop to reorder priorities. Remove entries that are no longer needed.',
      },
      {
        heading: 'Processing',
        content:
          'When ready, start processing the queue. The system will handle entries in order from top to bottom.',
      },
    ],
  },

  progress: {
    title: 'Progress Monitor',
    sections: [
      {
        heading: 'Real-Time Monitoring',
        content:
          'Track active training sessions in real-time. See download progress, validation status, and completion rates.',
      },
      {
        heading: 'Status Indicators',
        content:
          'Green = Completed, Blue = Processing, Yellow = Pending, Red = Failed. Click on any entry for detailed logs.',
      },
      {
        heading: 'Troubleshooting',
        content:
          'If training fails, check the error message. Common issues include insufficient images or network problems.',
      },
    ],
  },

  gallery: {
    title: 'Image Gallery',
    sections: [
      {
        heading: 'Browse Training Images',
        content:
          'View all images collected during the training process. Filter by person, quality, or validation status.',
      },
      {
        heading: 'Quality Control',
        content:
          'Mark images as approved or rejected. Only high-quality face images should be kept for training.',
      },
      {
        heading: 'Bulk Actions',
        content:
          'Select multiple images to delete, move, or re-validate in batch operations.',
      },
    ],
  },

  sync: {
    title: 'Sync Manager',
    sections: [
      {
        heading: 'Database Synchronization',
        content:
          'Keep your training database in sync with the production environment. Push updates or pull latest changes.',
      },
      {
        heading: 'Sync Operations',
        content:
          'Pull: Get latest data from production. Push: Send your changes to production. Always backup before major operations.',
      },
      {
        heading: 'Conflict Resolution',
        content:
          'If conflicts arise, review changes carefully. The system will show differences and let you choose which version to keep.',
      },
    ],
  },

  testing: {
    title: 'Testing',
    sections: [
      {
        heading: 'Model Testing',
        content:
          'Test the trained face recognition model by uploading sample images. See recognition results and confidence scores.',
      },
      {
        heading: 'Upload Test Images',
        content:
          'Upload clear face photos to test recognition accuracy. The system will identify the person and show confidence level.',
      },
      {
        heading: 'Interpreting Results',
        content:
          'Confidence above 80% is generally reliable. Below 60% may indicate the person is not in the database or image quality is poor.',
      },
    ],
  },

  'ab-testing-live': {
    title: 'A/B Testing - Live Comparison',
    sections: [
      {
        heading: 'Compare Models',
        content:
          'Upload images to compare two different face recognition models (Model A vs Model B) side-by-side.',
      },
      {
        heading: 'Running Tests',
        content:
          'Upload test images, select both models, and click "Run Comparison". Results show which model performs better.',
      },
      {
        heading: 'Analyzing Results',
        content:
          'Compare accuracy, confidence scores, and processing time. Use these insights to determine which model to deploy.',
      },
    ],
  },

  'ab-testing-metrics': {
    title: 'A/B Testing - Metrics Dashboard',
    sections: [
      {
        heading: 'Performance Metrics',
        content:
          'View comprehensive metrics for your A/B tests including accuracy rates, average confidence, and processing times.',
      },
      {
        heading: 'Key Metrics',
        content:
          'Accuracy Rate: Percentage of correct identifications. Confidence: Average confidence scores. Speed: Processing time per image.',
      },
      {
        heading: 'Trend Analysis',
        content:
          'Charts show performance trends over time. Look for consistent improvements or degradation in model performance.',
      },
    ],
  },

  'ab-testing-decision': {
    title: 'A/B Testing - Decision Support',
    sections: [
      {
        heading: 'Statistical Analysis',
        content:
          'Get data-driven recommendations on which model to deploy based on statistical significance and performance metrics.',
      },
      {
        heading: 'Decision Criteria',
        content:
          'The system evaluates accuracy, confidence, speed, and consistency. Recommendations are based on predefined thresholds.',
      },
      {
        heading: 'Making Decisions',
        content:
          'Review recommendations carefully. Consider business requirements alongside statistical analysis before deploying.',
      },
    ],
  },

  'ab-testing-history': {
    title: 'A/B Testing - Test History',
    sections: [
      {
        heading: 'Historical Tests',
        content:
          'Browse all previous A/B tests with complete results, metrics, and decisions made.',
      },
      {
        heading: 'Learning from History',
        content:
          'Review past tests to understand model evolution. Identify patterns in what works and what doesn\'t.',
      },
      {
        heading: 'Reproducing Tests',
        content:
          'Click on any historical test to view full details. You can re-run similar tests with updated models.',
      },
    ],
  },

  'automated-generate': {
    title: 'Automated Training - Generate Candidates',
    sections: [
      {
        heading: 'Wikidata Integration',
        content:
          'Automatically find celebrities from Wikipedia/Wikidata based on country and occupation. This is FREE and uses real public data.',
      },
      {
        heading: 'How It Works',
        content:
          '1. Select a country and occupation. 2. Click "Generate from Wikidata". 3. Review the list of candidates. 4. Select people to train. 5. Start training.',
      },
      {
        heading: 'New vs Existing',
        content:
          'Green "NEW" badge = Not in database yet. Gray "EXISTS" badge = Already in database. New people are auto-selected for training.',
      },
      {
        heading: 'Batch Training',
        content:
          'Select multiple people and train them in one batch. The system downloads images from Google and validates them automatically.',
      },
    ],
  },

  'automated-batch': {
    title: 'Automated Training - Batch Progress',
    sections: [
      {
        heading: 'Real-Time Progress',
        content:
          'Monitor your batch training in real-time. The page auto-refreshes every 3 seconds to show current status.',
      },
      {
        heading: 'Status Icons',
        content:
          '⏳ Pending, 🔄 Processing, ✅ Completed, ✗ Failed. Each person has separate download and validation progress bars.',
      },
      {
        heading: 'Download & Validation',
        content:
          'First, images are downloaded from Google using SERP API. Then, DeepFace validates each image for face quality and detection.',
      },
      {
        heading: 'Canceling Batches',
        content:
          'Click "Cancel Batch" to stop processing. Already-completed people will remain in staging.',
      },
      {
        heading: 'After Completion',
        content:
          'When batch finishes, you\'re auto-redirected to Review & Deploy page. People with ≥5 valid photos are ready for production.',
      },
    ],
  },

  'automated-review': {
    title: 'Automated Training - Review & Deploy',
    sections: [
      {
        heading: 'Staging Area',
        content:
          'Review all trained people in the staging area. Only people with ≥5 valid photos can be deployed to production.',
      },
      {
        heading: 'Ready vs Not Ready',
        content:
          'Green section = Ready for production (≥5 photos). Yellow section = Not ready (<5 photos, will be auto-deleted).',
      },
      {
        heading: 'Deployment',
        content:
          'Select people to deploy and click "Deploy to Production". They\'ll be moved from trainingPassSerbia to recognized_faces_prod.',
      },
      {
        heading: 'Photo Requirements',
        content:
          'Minimum 5 valid photos required for production. More photos = better recognition accuracy. Low-quality photos are automatically filtered out.',
      },
      {
        heading: 'Automatic Cleanup',
        content:
          'People with <5 photos are automatically deleted from staging. They won\'t waste storage space.',
      },
    ],
  },

  'training-workflow': {
    title: 'Training Workflow',
    sections: [
      {
        heading: 'Complete Pipeline',
        content:
          'The unified Training Workflow combines three steps into one page: Generate Names → Process Queue → Monitor Progress. This eliminates page navigation and shows the entire pipeline at once.',
      },
      {
        heading: 'Step 1: Generate Names',
        content:
          'AI generates ~50 celebrity names for the selected country. This takes 30-60 seconds. Generated names are automatically added to the processing queue.',
      },
      {
        heading: 'Step 2: Process Queue',
        content:
          '"Process Next" downloads images for one person (5-15s). "Process All" processes the entire queue sequentially. Background validation runs automatically after download.',
      },
      {
        heading: 'Step 3: Monitor Progress',
        content:
          'Real-time monitoring shows all training folders with image counts and readiness status. Auto-updates every 15 seconds. Minimum 20 images recommended per person, 40+ is optimal.',
      },
      {
        heading: 'Status Indicators',
        content:
          'Empty (0 images), Insufficient (<20), Adequate (20-39), Ready (40+). Ready status means optimal for high-quality training.',
      },
      {
        heading: 'Workflow Tips',
        content:
          'Start by generating names, then process them one-by-one or in batch. Monitor progress in real-time on the right side. The progress monitor automatically refreshes as you process.',
      },
    ],
  },

  'video-recognition': {
    title: 'Video Face Recognition',
    sections: [
      {
        heading: 'What is This?',
        content:
          'Upload videos to automatically extract frames and recognize faces in each frame. Perfect for analyzing video footage, surveillance videos, or batch processing multiple faces at once.',
      },
      {
        heading: 'How It Works',
        content:
          '1. Upload a video file (MP4, AVI, MOV, MKV, WebM, FLV, or WMV). 2. Configure frame extraction interval (default: 3 seconds). 3. Select recognition domain (Serbia, Croatia, Bosnia). 4. Click "Upload and Process". 5. Wait for processing to complete. 6. View results with statistics and frame-by-frame recognition.',
      },
      {
        heading: 'Frame Extraction Interval',
        content:
          'The interval determines how often frames are extracted from the video. Lower interval = more frames = longer processing time. Default is 3 seconds (1 frame every 3 seconds). Range: 0.1 to 60 seconds.',
      },
      {
        heading: 'Processing Time',
        content:
          'Processing is done asynchronously in the background. A 30-second video with 3-second interval extracts ~10 frames. Processing typically takes 1-3 minutes depending on video length and frame count.',
      },
      {
        heading: 'Results Overview',
        content:
          'After processing, you\'ll see: 1. Recognition Statistics (total frames, recognized frames, recognition rate, unique persons). 2. System Performance (processing time, FPS, CPU usage, memory usage). 3. Frame-by-Frame Results (timestamp, person identified, confidence level).',
      },
      {
        heading: 'Recognition Rate',
        content:
          'Recognition Rate = (Recognized Frames / Total Frames) × 100%. Green (≥70%) = Excellent, Yellow (40-69%) = Moderate, Red (<40%) = Poor. Low rates may indicate poor video quality or unknown persons.',
      },
      {
        heading: 'File Requirements',
        content:
          'Maximum file size: 100 MB. Supported formats: MP4, AVI, MOV, MKV, WebM, FLV, WMV. Videos must contain visible faces for recognition to work.',
      },
      {
        heading: 'Best Practices',
        content:
          'Use high-quality videos with clear face visibility. Set appropriate interval (shorter for fast-moving videos). Choose the correct recognition domain for your use case. Review frame-by-frame results to identify any issues.',
      },
    ],
  },
}
