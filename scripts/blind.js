const authReady = import("./auth.js").then(({ requireAuth }) => requireAuth());

// Speech Recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Check browser support
if (!SpeechRecognition) {
    alert('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
}

// DOM elements
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const statusDiv = document.getElementById('status');
const outputDiv = document.getElementById('output');
const audioFeedbackToggle = document.getElementById('audio-feedback-toggle');
const srAnnouncements = document.getElementById('sr-announcements');

// State variables
let recognition = null;
let isListening = false;
let fullTranscript = '';
let audioFeedbackEnabled = false;

// Speech Synthesis for audio feedback

const synth = window.speechSynthesis;

// Initialize
function init() {
    if (SpeechRecognition) {
        setupRecognition();
    }
    
    // Event listeners
    startBtn.addEventListener('click', startListening);
    stopBtn.addEventListener('click', stopListening);
    clearBtn.addEventListener('click', clearText);
    audioFeedbackToggle?.addEventListener('change', toggleAudioFeedback);
    
    // Load saved preferences
    loadPreferences();
}

// Setup speech recognition
function setupRecognition() {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isListening = true;
        updateStatus('Listening...', 'listening');
        updateButtons();
        speak('Started listening');
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        if (finalTranscript) {
            fullTranscript += finalTranscript;
        }
        
        displayTranscript(fullTranscript + interimTranscript);
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Error occurred';
        
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                // Auto-restart for no-speech
                if (isListening) {
                    restartRecognition();
                    return;
                }
                break;
            case 'audio-capture':
                errorMessage = 'No microphone found. Please connect a microphone.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission denied. Please allow microphone access.';
                break;
            case 'network':
                errorMessage = 'Network error occurred. Please check your connection.';
                break;
            case 'aborted':
                errorMessage = 'Speech recognition aborted.';
                break;
            default:
                errorMessage = `Error: ${event.error}`;
        }
        
        updateStatus(errorMessage, 'error');
        announceToScreenReader(errorMessage);
        speak(errorMessage);
        
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
            stopListening();
        }
    };
    
    recognition.onend = () => {
        // Auto-restart if still supposed to be listening
        if (isListening) {
            restartRecognition();
        } else {
            updateStatus('Stopped', '');
            updateButtons();
        }
    };
}

// Start listening
function startListening() {
    if (!recognition) {
        alert('Speech Recognition is not available.');
        return;
    }
    
    if (isListening) {
        return;
    }
    
    try {
        recognition.start();
        announceToScreenReader('Started listening to your voice');
    } catch (error) {
        console.error('Error starting recognition:', error);
        updateStatus('Failed to start. Please try again.', 'error');
        speak('Failed to start recognition');
    }
}

// Stop listening
function stopListening() {
    if (!recognition || !isListening) {
        return;
    }
    
    isListening = false;
    recognition.stop();
    updateStatus('Stopped', '');
    updateButtons();
    announceToScreenReader('Stopped listening');
    speak('Stopped listening');
}

// Restart recognition (for auto-recovery)
function restartRecognition() {
    if (!isListening) {
        return;
    }
    
    try {
        recognition.start();
    } catch (error) {
        console.error('Error restarting recognition:', error);
        isListening = false;
        updateStatus('Recognition stopped unexpectedly', 'error');
        updateButtons();
    }
}

// Clear text
function clearText() {
    fullTranscript = '';
    outputDiv.innerHTML = '<p class="placeholder">Your spoken words will appear here...</p>';
    announceToScreenReader('Text cleared');
    speak('Text cleared');
}

// Update status display
function updateStatus(message, className) {
    statusDiv.textContent = message;
    statusDiv.className = 'status';
    if (className) {
        statusDiv.classList.add(className);
    }
}

// Update button states
function updateButtons() {
    startBtn.disabled = isListening;
    stopBtn.disabled = !isListening;
}

// Display transcript
function displayTranscript(text) {
    if (text.trim()) {
        outputDiv.innerHTML = `<p class="transcript">${escapeHtml(text)}</p>`;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle audio feedback
function toggleAudioFeedback() {
    audioFeedbackEnabled = audioFeedbackToggle.checked;
    localStorage.setItem('audioFeedbackEnabled', audioFeedbackEnabled);
    
    const message = audioFeedbackEnabled ? 'Voice feedback enabled' : 'Voice feedback disabled';
    announceToScreenReader(message);
    speak(message);
}

// Speak using Speech Synthesis
function speak(text) {
    if (!audioFeedbackEnabled || !synth) {
        return;
    }
    
    // Cancel any ongoing speech
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    synth.speak(utterance);
}

// Announce to screen reader only
function announceToScreenReader(message) {
    srAnnouncements.textContent = message;
    
    // Clear after a delay to allow re-announcements of the same message
    setTimeout(() => {
        srAnnouncements.textContent = '';
    }, 1000);
}

// Load saved preferences
function loadPreferences() {
    const savedAudioFeedback = localStorage.getItem('audioFeedbackEnabled');
    if (savedAudioFeedback === 'true') {
        if (audioFeedbackToggle) audioFeedbackToggle.checked = true;
        audioFeedbackEnabled = true;
    }
}

// Initialize on page load
authReady.then(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
});