# Gemini Person Recognition with Confidence Levels

## Overview

The photoanalytics application now supports **AI-powered person recognition** using Google's Gemini 3 models. This feature can identify public figures (celebrities, athletes, politicians, etc.) directly from images with confidence scores.

## Features

✅ **Person Identification**: Recognizes well-known public figures in photos
✅ **Confidence Levels**: Returns HIGH, MEDIUM, or LOW confidence scores
✅ **Role Information**: Provides the person's profession/role (e.g., "Tennis player", "Actor")
✅ **Contextual Description**: Brief description of the person in the specific image

## Supported Models

### Gemini 3 Models (with Person Recognition)
- `gemini-3-flash-preview` ⭐ - Fast, supports person ID
- `gemini-3-pro-preview` ⭐ - Best quality, supports person ID

### Gemini 2.x Models (NO Person Recognition)
- `gemini-2.0-flash` - Fast general vision
- `gemini-2.5-flash` - Balanced vision
- `gemini-2.5-pro` - High quality vision

**Note**: Only Gemini 3 models support person identification. Other models will only provide scene analysis, objects, and descriptions.

## How to Use

### Web Interface

1. **Login** to the application at https://facerecognition.mpanel.app
2. **Access Model Selector** (Admin users only):
   - Look for the model dropdown in the header
   - Select `Gemini 3 Flash ⭐ (Person ID)` or `Gemini 3 Pro ⭐ (Person ID)`
3. **Upload an Image** containing a public figure
4. **View Results** in the "Object Detection Result" section:
   - Look for the "AI Person Recognition" section
   - See confidence badges (🟢 High, 🟡 Medium, ⚪ Low)
   - View person's name, role, and description

### API Endpoint

```bash
POST https://facerecognition.mpanel.app/analyze
```

**Parameters:**
- `model`: `gemini-3-flash-preview` or `gemini-3-pro-preview`
- `provider`: `gemini`
- `language`: Optional (e.g., `serbian`, `slovenian`)
- `face_recognition`: `true` or `false`

**Headers:**
- `Authorization`: Your auth token
- `X-User-Email`: Your email address

**Example Request:**

```bash
curl -X POST "https://facerecognition.mpanel.app/analyze?model=gemini-3-flash-preview&provider=gemini" \
  -H "Authorization: YOUR_TOKEN" \
  -H "X-User-Email: your@email.com" \
  -F "image=@photo.jpg"
```

**Example Response:**

```json
{
  "success": true,
  "metadata": {
    "description": {
      "english": "A professional portrait of a person at a business event"
    },
    "identified_persons": [
      {
        "name": "Novak Djokovic",
        "confidence": "high",
        "role": "Professional tennis player",
        "description": "Man wearing a suit at a formal event"
      }
    ],
    "provider": "gemini",
    "model": "gemini-3-flash-preview"
  }
}
```

## Confidence Levels

### 🟢 HIGH
- The AI is very confident in the identification
- Person is clearly visible and well-known
- High likelihood of correct identification

### 🟡 MEDIUM
- Moderate confidence in the identification
- Person may be partially obscured or less well-known
- Reasonable likelihood of correct identification

### ⚪ LOW
- Low confidence in the identification
- Person is unclear, obscured, or ambiguous
- May require verification

## Display in Web Interface

The results are displayed with:
- **Color-coded badges** indicating confidence level
- **Person's name** in bold
- **Role/profession** in parentheses (if available)
- **Description** of the person in the specific image
- **Info alert** showing which model was used

## Differences from Face Recognition

| Feature | Face Recognition | AI Person Identification |
|---------|-----------------|-------------------------|
| **Source** | Local database | Gemini 3 AI vision model |
| **Persons** | Your uploaded faces | Public figures only |
| **Confidence** | Numeric % | HIGH/MEDIUM/LOW |
| **Models** | ArcFace/DeepFace | Gemini 3 Flash/Pro |
| **Database** | Requires training | No training needed |

## Test Results

**Test Image**: Serbian celebrity photo
**Model**: gemini-3-flash-preview
**Result**: ✅ Successfully identified person with HIGH confidence
**Response Time**: ~5 seconds
**Cost**: $0.000558 per image

## Limitations

1. **Public Figures Only**: Cannot identify private individuals or people not in Gemini's training data
2. **Gemini 3 Required**: Feature only works with Gemini 3 models (preview versions)
3. **Admin Only**: Model selector is only visible to admin users
4. **No Guarantees**: AI may misidentify or fail to identify less-known figures
5. **Privacy**: Should not be used as sole verification method for security purposes

## Best Use Cases

✅ Media/News agencies identifying celebrities in photos
✅ Event photography with public figures
✅ Sports photography with athletes
✅ Political/press conference coverage
✅ Entertainment industry photo tagging

## Privacy & Ethics

- This feature identifies **public figures only**
- It does NOT create or store facial recognition models
- Identifications are provided by Google's Gemini AI
- Always verify identifications for critical use cases
- Respect privacy laws and regulations in your jurisdiction

## Pricing

**Gemini 3 Flash Preview:**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- Typical cost: ~$0.0005-$0.001 per image

**Gemini 3 Pro Preview:**
- Input: $1.25 per 1M tokens
- Output: $5.00 per 1M tokens
- Typical cost: ~$0.003-$0.005 per image

## Technical Implementation

- **Backend**: Python Flask API with Gemini integration
- **Provider**: `app/services/vision/gemini_provider.py`
- **Prompt**: Special person recognition prompt for Gemini 3 models
- **Response Parsing**: Structured JSON with confidence levels
- **Frontend Display**: Bootstrap-based UI with color-coded badges

## Support

For issues or questions:
- Check the application logs
- Verify you're using a Gemini 3 model
- Ensure your API key has access to Gemini 3 preview models
- Contact the admin team

---

**Last Updated**: December 20, 2025
**Version**: 1.0
**Status**: ✅ Production Ready
