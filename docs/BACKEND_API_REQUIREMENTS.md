# Backend API Requirements for Training UI Improvements

## Overview
This document lists backend API endpoints needed to support requested Training UI features.

---

## 1. Queue Management - List Generated Names

**Feature Request**: Show generated celebrity names in the UI and allow users to remove names they don't want to train.

### Required Endpoint: Get Queue List

**Endpoint**: `GET /api/training/queue-list` or `GET /api/excel/queue`

**Purpose**: Retrieve the list of names currently in the training queue (from `data.xlsx`)

**Headers**:
```http
Authorization: Bearer <token>
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "queue": [
      {
        "id": 1,
        "name": "Dragan",
        "last_name": "Bjelogrlic",
        "occupation": "Actor",
        "country": "Serbia"
      },
      {
        "id": 2,
        "name": "Novak",
        "last_name": "Djokovic",
        "occupation": "Athlete",
        "country": "Serbia"
      }
    ],
    "total": 45,
    "processed": 5,
    "remaining": 40
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "message": "Queue file not found or empty"
}
```

### Required Endpoint: Remove from Queue

**Endpoint**: `DELETE /api/training/queue` or `POST /api/excel/delete-entry`

**Purpose**: Remove a specific person from the training queue

**Headers**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "id": 1,
  "name": "Dragan",
  "last_name": "Bjelogrlic"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Entry removed from queue",
  "remaining_count": 44
}
```

**What It Should Do**:
1. Remove the specified row from `storage/excel/data.xlsx`
2. Return updated queue count
3. Handle case where entry doesn't exist

---

## 2. Occupation/Type Filtering

**Feature Request**: Allow users to select which celebrity types/occupations to generate (Actor, Politician, Athlete, etc.)

### Option A: Modify Existing Endpoint

**Endpoint**: `GET /api/excel/check-excel`

**Add Query Parameter**: `occupation` (optional)

**Examples**:
```bash
# Generate all occupations (current behavior)
GET /api/excel/check-excel?country=Serbia

# Generate only actors
GET /api/excel/check-excel?country=Serbia&occupation=Actor

# Generate multiple (comma-separated)
GET /api/excel/check-excel?country=Serbia&occupation=Actor,Athlete,Musician
```

**Response** (same as current):
```json
{
  "success": true,
  "message": "Excel file exists and contains 20 rows. Processing started...",
  "row_count": 20,
  "occupations_processed": ["Actor"],
  "country": "Serbia"
}
```

### Option B: New Endpoint to List Available Occupations

**Endpoint**: `GET /api/training/occupations` or `GET /api/excel/occupations`

**Purpose**: Get list of available occupations from `occupation.xlsx`

**Response**:
```json
{
  "success": true,
  "data": {
    "occupations": [
      "Actor",
      "Politician",
      "Athlete",
      "Musician",
      "Writer",
      "Director"
    ],
    "total": 6
  }
}
```

**What It Should Do**:
1. Read all rows from `storage/excel/occupation.xlsx`
2. Return unique list of occupation values
3. Frontend can use this for dropdown selection

---

## 3. Enhanced Queue Status

**Feature Request**: Show real-time queue statistics in Dashboard

### Required Endpoint: Queue Status

**Endpoint**: `GET /api/training/queue-status`

**Purpose**: Get current status of training queue and processing

**Headers**:
```http
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "queue": {
      "total_in_queue": 45,
      "processed_today": 12,
      "failed_today": 2,
      "remaining": 33
    },
    "processing": {
      "is_processing": true,
      "current_person": {
        "name": "Novak Djokovic",
        "occupation": "Athlete",
        "started_at": "2024-01-15T14:30:00Z"
      }
    },
    "generation": {
      "is_generating": false,
      "last_generated": "2024-01-15T12:00:00Z",
      "last_generated_count": 50
    }
  }
}
```

**What It Should Do**:
1. Count rows in `storage/excel/data.xlsx` (queue size)
2. Track processing state (if background thread is active)
3. Return generation status if GPT call is in progress

---

## 4. Training Progress - Detailed Folder Info

**Feature Request**: Show detailed progress of each person's image collection

### Required Endpoint: Training Progress

**Endpoint**: `GET /api/training/progress` or `GET /api/training/folder-status`

**Purpose**: Get status of all training folders with image counts

**Headers**:
```http
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "name": "Dragan_Bjelogrlic",
        "display_name": "Dragan Bjelogrlić",
        "occupation": "Actor",
        "image_count": 38,
        "status": "ready",
        "folder_path": "storage/trainingPassSerbia/Dragan_Bjelogrlic",
        "last_modified": "2024-01-15T14:30:00Z"
      },
      {
        "name": "Novak_Djokovic",
        "display_name": "Novak Đoković",
        "occupation": "Athlete",
        "image_count": 15,
        "status": "insufficient",
        "folder_path": "storage/trainingPassSerbia/Novak_Djokovic",
        "last_modified": "2024-01-15T14:25:00Z"
      }
    ],
    "summary": {
      "total_people": 120,
      "total_images": 4800,
      "ready_for_training": 85,
      "insufficient_images": 25,
      "empty_folders": 10
    }
  }
}
```

**Status Values**:
- `empty`: 0 images
- `insufficient`: 1-19 images
- `adequate`: 20-39 images
- `ready`: 40+ images

**What It Should Do**:
1. Scan `storage/trainingPassSerbia/` directory
2. Count images in each person's folder
3. Return name mappings (normalized vs original with special chars)
4. Include last modified timestamps

---

## Priority

**High Priority** (blocking current features):
1. ✅ **Queue List** - Users want to see and manage generated names
2. ✅ **Training Progress** - Essential for monitoring workflow

**Medium Priority** (nice to have):
3. **Occupation Filtering** - More control over generated names
4. **Queue Status** - Better real-time updates

**Low Priority** (optional):
5. **Remove from Queue** - Can work around by manually editing Excel file

---

## Implementation Notes

### Performance Considerations
- Queue list endpoint should be fast (<100ms) - just reading Excel file
- Training progress might be slower (100-500ms) - scanning directories
- Consider caching for training progress (refresh every 10-15 seconds)

### Authentication
- All endpoints should require Bearer token authentication
- Use existing auth middleware

### Error Handling
- Return consistent error format:
  ```json
  {
    "success": false,
    "message": "Human-readable error message",
    "error_code": "QUEUE_NOT_FOUND"
  }
  ```

### CORS
- Ensure all new endpoints support CORS for frontend access
- Allow methods: GET, POST, DELETE
- Allow headers: Authorization, Content-Type

---

## Testing Recommendations

### Manual Testing
1. Generate names for Serbia → Check queue list shows ~50 entries
2. Process one person → Check training progress shows their folder
3. Delete from queue → Verify row removed from data.xlsx
4. Generate with occupation filter → Verify only requested types generated

### Edge Cases
- Empty queue (no data.xlsx)
- Empty training folder
- Queue with 1000+ entries (performance test)
- Concurrent processing while listing queue
- Special characters in names (Serbian, Korean, Japanese, etc.)

---

## Questions for Backend Team

1. What's the preferred endpoint naming convention?
   - `/api/training/*` or `/api/excel/*`?

2. Should we use REST conventions?
   - DELETE vs POST for removing queue entries?

3. Do we need pagination for queue list?
   - What if there are 500+ names in queue?

4. Should training progress be cached?
   - Scanning folders might be slow with thousands of images

5. Can we add WebSocket support for real-time updates?
   - Would be better than polling every 10 seconds

---

## Frontend Integration Plan

Once backend endpoints are ready, frontend will:

1. **Queue Management Page**:
   - Fetch queue list on load
   - Display in sortable/filterable table
   - Add "Remove" button for each entry
   - Show total count and processing status

2. **Generate Names UI**:
   - Add occupation multi-select dropdown
   - Show estimated names count before generating
   - Display success with link to queue list

3. **Progress Monitor**:
   - Use new endpoint instead of mock data
   - Show detailed folder status
   - Add refresh button and auto-polling
   - Visual indicators for status (ready, insufficient, etc.)

4. **Dashboard**:
   - Real-time queue statistics
   - Show current processing status
   - Quick actions to process next/process all
