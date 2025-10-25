/**
 * ScriptSpeak Frontend - Main React Component
 * 
 * This component handles:
 * 1. Recording audio from user's microphone
 * 2. Sending audio to backend API
 * 3. Displaying transcribed text in native script
 * 4. Language selection
 * 5. Dark mode toggle
 */

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Mic, MicOff, Moon, Sun, Globe, Volume2 } from 'lucide-react'
import './App.css'

function App() {
  // ===== STATE MANAGEMENT =====
  // State holds data that can change over time
  
  // Transcribed text to display
  const [transcribedText, setTranscribedText] = useState('')
  
  // Is the app currently recording?
  const [isRecording, setIsRecording] = useState(false)
  
  // Is the app processing audio?
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Selected language for transcription
  const [selectedLanguage, setSelectedLanguage] = useState('hindi')
  
  // Dark mode toggle
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // List of available languages (fetched from backend)
  const [languages, setLanguages] = useState([])
  
  // Error message to display
  const [error, setError] = useState('')
  
  // ===== REFS =====
  // Refs allow us to store values that persist between renders
  // without causing re-renders
  
  // Reference to MediaRecorder API
  const mediaRecorderRef = useRef(null)
  
  // Array to store recorded audio chunks
  const audioChunksRef = useRef([])
  
  // Reference to audio stream from microphone
  const streamRef = useRef(null)

  // ===== BACKEND URL CONFIGURATION =====
  // Change this to your deployed backend URL after deployment
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  // ===== EFFECTS =====
  // Effects run after component renders
  
  // Fetch available languages when component mounts
  useEffect(() => {
    fetchLanguages()
  }, [])
  
  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  /**
   * Fetches list of supported languages from backend
   */
  const fetchLanguages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/languages`)
      setLanguages(response.data.languages)
    } catch (err) {
      console.error('Error fetching languages:', err)
      // Fallback languages if API fails
      setLanguages([
        { code: 'hindi', name: 'Hindi (हिंदी)', script: 'Devanagari' },
        { code: 'punjabi', name: 'Punjabi (ਪੰਜਾਬੀ)', script: 'Gurmukhi' },
        { code: 'english', name: 'English', script: 'Latin' },
      ])
    }
  }

  /**
   * Starts recording audio from user's microphone
   */
  const startRecording = async () => {
    try {
      // Clear any previous errors
      setError('')
      
      // Request microphone access from browser
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          // Optimize audio settings for speech
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })
      
      // Store stream reference
      streamRef.current = stream
      
      // Create MediaRecorder to capture audio
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      // Clear previous audio chunks
      audioChunksRef.current = []
      
      // Event: When audio data is available, store it
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      // Event: When recording stops, process the audio
      mediaRecorder.onstop = async () => {
        // Create a single audio blob from all chunks
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm' 
        })
        
        // Send audio to backend for transcription
        await sendAudioToBackend(audioBlob)
        
        // Stop all audio tracks (releases microphone)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }
      
      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
      
    } catch (err) {
      // Handle errors (e.g., user denies microphone access)
      console.error('Error accessing microphone:', err)
      setError('Could not access microphone. Please allow microphone permissions.')
    }
  }

  /**
   * Stops recording audio
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop the MediaRecorder
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
    }
  }

  /**
   * Sends recorded audio to backend API for transcription
   */
  const sendAudioToBackend = async (audioBlob) => {
    try {
      // Create FormData to send file
      const formData = new FormData()
      
      // Append audio file with a name
      formData.append('audio', audioBlob, 'recording.webm')
      
      // Append selected language
      formData.append('language', selectedLanguage)
      
      // Send POST request to backend
      const response = await axios.post(
        `${BACKEND_URL}/transcribe`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      )
      
      // Check if transcription was successful
      if (response.data.success) {
        // Display the native script text
        setTranscribedText(response.data.native_text)
        setError('')
      } else {
        setError(response.data.message || 'No speech detected')
      }
      
    } catch (err) {
      // Handle errors
      console.error('Error sending audio:', err)
      
      if (err.response) {
        // Backend returned an error
        setError(`Error: ${err.response.data.detail || 'Failed to transcribe audio'}`)
      } else if (err.request) {
        // Request was made but no response
        setError('Could not connect to server. Please check your internet connection.')
      } else {
        // Other errors
        setError('An unexpected error occurred.')
      }
    } finally {
      // Always stop processing indicator
      setIsProcessing(false)
    }
  }

  /**
   * Toggles between light and dark mode
   */
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  /**
   * Clears the transcribed text display
   */
  const clearText = () => {
    setTranscribedText('')
    setError('')
  }

  // ===== RENDER =====
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      
      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header Section */}
        <header className="text-center mb-12 animate-slide-up">
          
          {/* Dark Mode Toggle Button - Top Right */}
          <button
            onClick={toggleDarkMode}
            className={`absolute top-8 right-8 p-3 rounded-full transition-all duration-300 ${
              isDarkMode 
                ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          
          {/* App Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className={`p-6 rounded-full ${
              isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
            } shadow-2xl`}>
              <Volume2 size={48} className="text-white" />
            </div>
          </div>
          
          {/* App Title */}
          <h1 className={`text-5xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'gradient-text'
          }`}>
            ScriptSpeak
          </h1>
          
          {/* App Subtitle */}
          <p className={`text-xl ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Voice to Native Script Converter
          </p>
          
          {/* App Description */}
          <p className={`mt-2 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Speak naturally and see your words in your native script
          </p>
        </header>

        {/* Language Selector */}
        <div className="mb-8 animate-fade-in">
          <label className={`flex items-center justify-center gap-2 mb-3 text-lg font-medium ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            <Globe size={20} />
            Select Language
          </label>
          
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isRecording || isProcessing}
            className={`w-full max-w-md mx-auto block px-6 py-4 text-lg rounded-xl border-2 transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 border-purple-500 text-white focus:border-purple-400' 
                : 'bg-white border-purple-300 text-gray-800 focus:border-purple-500'
            } focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} - {lang.script}
              </option>
            ))}
          </select>
        </div>

        {/* Recording Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative p-8 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 mic-pulse' 
                : isDarkMode
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-purple-500 hover:bg-purple-600'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {/* Microphone Icon */}
            {isRecording ? (
              <MicOff size={48} className="text-white" />
            ) : (
              <Mic size={48} className="text-white" />
            )}
            
            {/* Recording Indicator Dot */}
            {isRecording && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full recording-dot"></span>
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="text-center mb-8">
          {isRecording && (
            <p className={`text-lg font-medium animate-pulse ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              🎙️ Recording... Click again to stop
            </p>
          )}
          
          {isProcessing && (
            <p className={`text-lg font-medium animate-pulse ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              ⏳ Processing your speech...
            </p>
          )}
          
          {!isRecording && !isProcessing && !transcribedText && !error && (
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Click the microphone to start speaking
            </p>
          )}
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="mb-8 animate-fade-in">
            <div className={`max-w-2xl mx-auto p-6 rounded-xl ${
              isDarkMode 
                ? 'bg-red-900 bg-opacity-50 border-2 border-red-500' 
                : 'bg-red-50 border-2 border-red-300'
            }`}>
              <p className={`text-center text-lg ${
                isDarkMode ? 'text-red-200' : 'text-red-700'
              }`}>
                ⚠️ {error}
              </p>
            </div>
          </div>
        )}

        {/* Transcribed Text Display */}
        {transcribedText && (
          <div className="animate-fade-in">
            {/* Text Display Card */}
            <div className={`max-w-3xl mx-auto p-8 rounded-2xl shadow-2xl ${
              isDarkMode 
                ? 'bg-gray-800 bg-opacity-50 glass-effect' 
                : 'bg-white'
            }`}>
              
              {/* Card Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-semibold ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  Transcribed Text
                </h2>
                
                {/* Clear Button */}
                <button
                  onClick={clearText}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Clear
                </button>
              </div>
              
              {/* Transcribed Text - Large, readable font for elderly users */}
              <div className={`p-6 rounded-xl min-h-[200px] ${
                isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
              }`}>
                <p className={`text-4xl leading-relaxed font-script text-fade-in ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`} style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                  {transcribedText}
                </p>
              </div>
              
              {/* Language Badge */}
              <div className="mt-4 flex justify-end">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-purple-900 text-purple-200' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {languages.find(l => l.code === selectedLanguage)?.name || selectedLanguage}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className={`p-8 rounded-2xl ${
            isDarkMode 
              ? 'bg-gray-800 bg-opacity-50 glass-effect' 
              : 'bg-white shadow-lg'
          }`}>
            <h3 className={`text-2xl font-semibold mb-4 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              How to Use
            </h3>
            
            <ol className={`space-y-3 text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <li className="flex items-start gap-3">
                <span className={`font-bold ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>1.</span>
                <span>Select your preferred language from the dropdown menu</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`font-bold ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>2.</span>
                <span>Click the microphone button to start recording</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`font-bold ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>3.</span>
                <span>Speak clearly into your device's microphone</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`font-bold ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>4.</span>
                <span>Click the microphone again to stop recording</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`font-bold ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>5.</span>
                <span>Your speech will appear in native script within seconds!</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <footer className={`mt-16 text-center pb-8 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <p className="text-sm">
            Made with ❤️ for accessibility • ScriptSpeak v1.0
          </p>
          <p className="text-xs mt-2">
            Powered by ElevenLabs AI
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App