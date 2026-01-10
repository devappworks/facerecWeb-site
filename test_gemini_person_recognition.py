#!/usr/bin/env python3
"""
Test script to verify Gemini 3 person identification with confidence levels.
"""

import requests
import sys
import json
from pathlib import Path

# Configuration
API_BASE_URL = "https://facerecognition.mpanel.app"
AUTH_TOKEN = "d9OLEFYdx18bUTGkIpaKyDFCcko1jYu0Ha1"  # Slovenia token
USER_EMAIL = "nikola1jankovic@gmail.com"

# Test image - using a known celebrity photo
TEST_IMAGE = "./public/nenad_jezdic_serp_full_test/002_Nenad_Jezdić_–_Jahorina_ekonomski_forum.jpg"


def test_person_recognition(model="gemini-3-flash-preview"):
    """Test person recognition with specified model."""

    print(f"\n{'='*80}")
    print(f"Testing Person Recognition with {model}")
    print(f"{'='*80}\n")

    # Check if test image exists
    if not Path(TEST_IMAGE).exists():
        print(f"❌ Test image not found: {TEST_IMAGE}")
        return False

    # Prepare the request
    url = f"{API_BASE_URL}/analyze"
    params = {
        "model": model,
        "provider": "gemini",
        "face_recognition": "true"
    }

    headers = {
        "Authorization": AUTH_TOKEN,
        "X-User-Email": USER_EMAIL
    }

    # Read and upload the image
    with open(TEST_IMAGE, 'rb') as f:
        files = {'image': ('test.jpg', f, 'image/jpeg')}

        print(f"📤 Uploading image: {TEST_IMAGE}")
        print(f"🤖 Model: {model}")
        print(f"⏳ Analyzing...\n")

        try:
            response = requests.post(url, params=params, headers=headers, files=files, timeout=60)
            response.raise_for_status()

            result = response.json()

            if result.get('success'):
                metadata = result.get('metadata', {})

                # Display results
                print("✅ Analysis successful!\n")

                # Face recognition results (from database)
                recognized = metadata.get('recognized_persons', [])
                if recognized:
                    print("👤 Face Recognition (Database):")
                    for person in recognized:
                        print(f"   - {person.get('name')}")
                else:
                    print("👤 Face Recognition: None found in database")

                print()

                # AI person identification results (from Gemini)
                identified = metadata.get('identified_persons', [])
                if identified:
                    print(f"🌟 AI Person Identification ({model}):")
                    for person in identified:
                        name = person.get('name', 'Unknown')
                        confidence = person.get('confidence', 'unknown')
                        role = person.get('role', '')
                        description = person.get('description', '')

                        # Format confidence with emoji
                        conf_emoji = {
                            'high': '🟢',
                            'medium': '🟡',
                            'low': '🔴'
                        }.get(confidence.lower(), '⚪')

                        print(f"\n   {conf_emoji} {name}")
                        print(f"      Confidence: {confidence.upper()}")
                        if role:
                            print(f"      Role: {role}")
                        if description:
                            print(f"      Description: {description}")
                else:
                    print(f"🌟 AI Person Identification: No public figures identified")

                # Model and usage info
                print(f"\n📊 Analysis Info:")
                print(f"   Provider: {metadata.get('provider', 'unknown')}")
                print(f"   Model: {metadata.get('model', 'unknown')}")

                if metadata.get('usage'):
                    usage = metadata['usage']
                    print(f"\n💰 Usage (Admin):")
                    print(f"   Tokens: {usage.get('total_tokens', 0):,}")
                    print(f"   Cost: ${usage.get('cost_usd', 0):.6f}")

                print("\n" + "="*80 + "\n")
                return True
            else:
                print(f"❌ Analysis failed: {result.get('error', 'Unknown error')}")
                return False

        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False


def main():
    """Run tests with different models."""

    print("\n" + "="*80)
    print("Gemini Person Recognition Test")
    print("="*80)

    # Test with Gemini 3 models (should identify persons)
    print("\n🧪 Testing Gemini 3 models (with person identification)...")
    test_person_recognition("gemini-3-flash-preview")

    # Optional: Test with Gemini 2.5 (should NOT identify persons)
    print("\n🧪 Testing Gemini 2.5 model (without person identification)...")
    test_person_recognition("gemini-2.5-flash")


if __name__ == "__main__":
    main()
