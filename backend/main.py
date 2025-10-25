"""
ScriptSpeak Backend API (CORRECTED VERSION)
This FastAPI server handles:
1. Receiving audio from the frontend
2. Sending audio to ElevenLabs for speech-to-text using their official SDK
3. Converting text to native Indian scripts
4. Returning transcribed text to frontend
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from io import BytesIO
from typing import Optional
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate
from elevenlabs.client import ElevenLabs

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="ScriptSpeak API",
    description="Multilingual voice-to-text API for Indian languages",
    version="1.0.0"
)

# Enable CORS (Cross-Origin Resource Sharing)
# This allows your React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Initialize ElevenLabs client with API key from environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Create ElevenLabs client instance
if ELEVENLABS_API_KEY:
    elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
else:
    elevenlabs_client = None

# Mapping of language names to their native scripts
# This tells the app which script to use for each language
LANGUAGE_SCRIPT_MAP = {
    "hindi": "devanagari",
    "punjabi": "gurmukhi",
    "gujarati": "gujarati",
    "bengali": "bengali",
    "tamil": "tamil",
    "telugu": "telugu",
    "kannada": "kannada",
    "malayalam": "malayalam",
    "marathi": "devanagari",
    "urdu": "urdu",
    "odia": "oriya",
    "assamese": "bengali",
    "english": None  # English doesn't need transliteration
}

# Mapping of language names to ElevenLabs language codes
# Based on ElevenLabs documentation: https://elevenlabs.io/docs/speech-to-text/supported-languages
ELEVENLABS_LANGUAGE_CODES = {
    "hindi": "hin",      # Hindi
    "punjabi": "pan",    # Punjabi
    "gujarati": "guj",   # Gujarati
    "bengali": "ben",    # Bengali
    "tamil": "tam",      # Tamil
    "telugu": "tel",     # Telugu
    "kannada": "kan",    # Kannada
    "malayalam": "mal",  # Malayalam
    "marathi": "mar",    # Marathi
    "urdu": "urd",       # Urdu
    "odia": "ori",       # Odia
    "assamese": "asm",   # Assamese
    "english": "eng"     # English
}


def convert_to_native_script(text: str, language: str) -> str:
    """
    Converts text to the appropriate Indian script
    
    Args:
        text: The text to convert (usually in Latin/English script)
        language: Target language (e.g., "hindi", "tamil")
    
    Returns:
        Text in native script (e.g., Devanagari, Tamil script)
    """
    # Get the target script for this language
    target_script = LANGUAGE_SCRIPT_MAP.get(language.lower())
    
    # If no script mapping exists or language is English, return original text
    if not target_script or language.lower() == "english":
        return text
    
    try:
        # Use indic-transliteration library to convert
        # From ITRANS (Latin representation) to native script
        converted_text = transliterate(
            text,
            sanscript.ITRANS,  # Source: Latin/English representation
            getattr(sanscript, target_script.upper())  # Target: Native script
        )
        return converted_text
    except Exception as e:
        # If conversion fails, return original text
        print(f"Transliteration error: {e}")
        return text


@app.get("/")
async def root():
    """
    Health check endpoint
    Visit this URL to verify the server is running
    """
    return {
        "message": "ScriptSpeak API is running!",
        "status": "healthy",
        "version": "1.0.0",
        "elevenlabs_configured": elevenlabs_client is not None
    }


@app.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),  # Audio file from frontend
    language: str = Form("hindi")    # Target language (default: Hindi)
):
    """
    Main endpoint for speech-to-text transcription
    
    Process:
    1. Receive audio file from frontend
    2. Send to ElevenLabs API for transcription using official SDK
    3. Convert transcribed text to native script
    4. Return result to frontend
    """
    
    # Validate ElevenLabs client is configured
    if not elevenlabs_client:
        raise HTTPException(
            status_code=500,
            detail="ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY in .env file"
        )
    
    try:
        # Read the uploaded audio file into memory
        audio_content = await audio.read()
        
        # Create a BytesIO object (file-like object in memory)
        # ElevenLabs SDK expects a file-like object
        audio_file = BytesIO(audio_content)
        
        # Get the ElevenLabs language code for the selected language
        language_code = ELEVENLABS_LANGUAGE_CODES.get(
            language.lower(), 
            "eng"  # Default to English if language not found
        )
        
        print(f"Transcribing audio for language: {language} (code: {language_code})")
        
        # Use ElevenLabs SDK to transcribe audio
        # Following the official documentation pattern
        transcription = elevenlabs_client.speech_to_text.convert(
            file=audio_file,
            model_id="scribe_v1",  # Currently only scribe_v1 is supported
            tag_audio_events=False,  # We don't need audio event tagging
            language_code=language_code,  # Language of the audio
            diarize=False  # We don't need speaker diarization
        )
        
        # Extract the transcribed text from the response
        # The transcription object has a 'text' attribute
        transcribed_text = transcription.text if hasattr(transcription, 'text') else str(transcription)
        
        # If no text was detected
        if not transcribed_text or transcribed_text.strip() == "":
            return {
                "success": False,
                "message": "No speech detected in audio. Please try speaking more clearly."
            }
        
        print(f"Transcription successful: {transcribed_text[:50]}...")
        
        # Convert to native script if not English
        if language.lower() != "english":
            print(f"Converting to native script for {language}...")
            native_text = convert_to_native_script(transcribed_text, language)
        else:
            native_text = transcribed_text
        
        # Return successful response
        return {
            "success": True,
            "original_text": transcribed_text,  # Latin/English version
            "native_text": native_text,          # Native script version
            "language": language,
            "language_code": language_code,
            "message": "Transcription successful"
        }
    
    except AttributeError as e:
        # Handle SDK attribute errors
        print(f"ElevenLabs SDK error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error with ElevenLabs SDK: {str(e)}. Please check if you're using the latest SDK version."
        )
    
    except Exception as e:
        # Handle any other errors
        print(f"Transcription error: {e}")
        error_message = str(e)
        
        # Check for common errors
        if "401" in error_message or "unauthorized" in error_message.lower():
            raise HTTPException(
                status_code=401,
                detail="Invalid ElevenLabs API key. Please check your API key in .env file."
            )
        elif "quota" in error_message.lower() or "limit" in error_message.lower():
            raise HTTPException(
                status_code=429,
                detail="ElevenLabs API quota exceeded. Please check your usage limits."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Transcription failed: {error_message}"
            )


@app.get("/languages")
async def get_supported_languages():
    """
    Returns list of supported languages
    Frontend can use this to populate language selector
    """
    return {
        "languages": [
            {"code": "hindi", "name": "Hindi (हिंदी)", "script": "Devanagari", "elevenlabs_code": "hin"},
            {"code": "punjabi", "name": "Punjabi (ਪੰਜਾਬੀ)", "script": "Gurmukhi", "elevenlabs_code": "pan"},
            {"code": "gujarati", "name": "Gujarati (ગુજરાતી)", "script": "Gujarati", "elevenlabs_code": "guj"},
            {"code": "bengali", "name": "Bengali (বাংলা)", "script": "Bengali", "elevenlabs_code": "ben"},
            {"code": "tamil", "name": "Tamil (தமிழ்)", "script": "Tamil", "elevenlabs_code": "tam"},
            {"code": "telugu", "name": "Telugu (తెలుగు)", "script": "Telugu", "elevenlabs_code": "tel"},
            {"code": "kannada", "name": "Kannada (ಕನ್ನಡ)", "script": "Kannada", "elevenlabs_code": "kan"},
            {"code": "malayalam", "name": "Malayalam (മലയാളം)", "script": "Malayalam", "elevenlabs_code": "mal"},
            {"code": "marathi", "name": "Marathi (मराठी)", "script": "Devanagari", "elevenlabs_code": "mar"},
            {"code": "urdu", "name": "Urdu (اردو)", "script": "Urdu", "elevenlabs_code": "urd"},
            {"code": "english", "name": "English", "script": "Latin", "elevenlabs_code": "eng"},
        ]
    }


@app.get("/health")
async def health_check():
    """
    Detailed health check endpoint
    Shows system status and configuration
    """
    return {
        "status": "healthy",
        "elevenlabs_api_configured": elevenlabs_client is not None,
        "supported_languages": len(ELEVENLABS_LANGUAGE_CODES),
        "version": "1.0.0"
    }


# Run the server when this file is executed directly
if __name__ == "__main__":
    import uvicorn
    # Run on port 8000, accessible from all network interfaces
    uvicorn.run(app, host="0.0.0.0", port=8000)