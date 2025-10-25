# 🎙️ ScriptSpeak - Multilingual Voice-to-Script Converter

ScriptSpeak is a modern, accessible web application that converts live speech into native Indian scripts. Designed for people with hearing loss, especially elderly users.

## ✨ Features

- 🎤 Real-time voice recording through browser microphone
- 🌏 Support for 11+ Indian languages
- 📝 Automatic conversion to native scripts (Devanagari, Gurmukhi, Tamil, etc.)
- 📱 Fully responsive - works on mobile and desktop
- 🌓 Dark mode support
- ♿ Accessible design with large, readable fonts
- 🚀 Modern UI with smooth animations

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Axios
- Lucide React (icons)

**Backend:**
- FastAPI (Python)
- ElevenLabs API (Speech-to-Text)
- indic-transliteration (Script conversion)
- Uvicorn (ASGI server)

## 📋 Prerequisites

- macOS (tested on MacBook Air M1)
- Python 3.10 or higher
- Node.js 18 or higher
- npm 9 or higher
- ElevenLabs API key

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd scriptspeak
```

### 2. Backend Setup
```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file and add your ElevenLabs API key
echo "ELEVENLABS_API_KEY=your_api_key_here" > .env

# Start the backend server
python main.py
```

Backend will run on `http://localhost:8000`

### 3. Frontend Setup

Open a new terminal window:
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_BACKEND_URL=http://localhost:8000" > .env

# Start the development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Test the App

1. Open `http://localhost:5173` in your browser
2. Allow microphone permissions when prompted
3. Select a language
4. Click the microphone button and speak
5. Click again to stop - your speech appears in native script!

## 📦 Supported Languages

- Hindi (हिंदी) - Devanagari
- Punjabi (ਪੰਜਾਬੀ) - Gurmukhi
- Gujarati (ગુજરાતી) - Gujarati
- Bengali (বাংলা) - Bengali
- Tamil (தமிழ்) - Tamil
- Telugu (తెలుగు) - Telugu
- Kannada (ಕನ್ನಡ) - Kannada
- Malayalam (മലയാളം) - Malayalam
- Marathi (मराठी) - Devanagari
- Urdu (اردو) - Urdu
- English - Latin

## 🌐 Deployment

### Deploy Backend to Render

1. Create a `render.yaml` file in the backend folder:
```yaml
services:
  - type: web
    name: scriptspeak-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: ELEVENLABS_API_KEY
        sync: false
```

2. Push to GitHub
3. Go to [Render.com](https://render.com)
4. Click "New +" → "Web Service"
5. Connect your GitHub repository
6. Render will auto-detect the configuration
7. Add environment variable: `ELEVENLABS_API_KEY`
8. Click "Create Web Service"
9. Copy your deployed URL (e.g., `https://scriptspeak-backend.onrender.com`)

### Deploy Frontend to Vercel

1. Update `frontend/.env`:
```bash
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```

2. Push to GitHub
3. Go to [Vercel.com](https://vercel.com)
4. Click "Add New Project"
5. Import your GitHub repository
6. Vercel auto-detects Vite configuration
7. Add environment variable: `VITE_BACKEND_URL`
8. Click "Deploy"
9. Your app is live! Share the Vercel URL

## 🧪 Testing on Mobile

1. Ensure your computer and phone are on the same WiFi network
2. Find your computer's local IP address:
```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
```
3. On your phone, visit: `http://YOUR_IP:5173`
4. Test voice recording and transcription

## 🔧 Troubleshooting

### Microphone not working
- Check browser permissions (click the lock icon in address bar)
- Ensure no other app is using the microphone
- Try a different browser (Chrome/Edge recommended)

### Backend connection error
- Verify backend is running on port 8000
- Check CORS settings in `main.py`
- Ensure `VITE_BACKEND_URL` in frontend `.env` is correct

### API key error
- Verify your ElevenLabs API key is correct
- Check your API usage limits
- Ensure `.env` file exists and is in the correct location

### M1 Mac specific issues
- If Python packages fail to install, try:
```bash
  arch -arm64 brew install python@3.11
```

## 📝 API Endpoints

### GET `/`
Health check endpoint

### POST `/transcribe`
- **Body:** `multipart/form-data`
  - `audio`: Audio file (webm format)
  - `language`: Language code (e.g., "hindi")
- **Response:** Transcribed text in native script

### GET `/languages`
Returns list of supported languages

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- ElevenLabs for excellent multilingual speech-to-text API
- indic-transliteration library for script conversion
- The open-source community for amazing tools

## 📧 Support

For issues or questions, please open a GitHub issue or contact the maintainer.

---

Built with ❤️ for accessibility