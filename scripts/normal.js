const authReady = import("./auth.js").then(({ requireAuth }) => requireAuth());

// Check browser support
if (!('speechSynthesis' in window)) {
    alert('Text-to-Speech is not supported in this browser. Please use Chrome, Edge, Safari, or Firefox.');
}

// DOM elements
const textInput = document.getElementById('text-input');
const voiceSelect = document.getElementById('voice-select');
const pitchSlider = document.getElementById('pitch-slider');
const rateSlider = document.getElementById('rate-slider');
const volumeSlider = document.getElementById('volume-slider');
const pitchValue = document.getElementById('pitch-value');
const rateValue = document.getElementById('rate-value');
const volumeValue = document.getElementById('volume-value');
const charCount = document.getElementById('char-count');
const speakBtn = document.getElementById('speak-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const statusDiv = document.getElementById('status');
const srAnnouncements = document.getElementById('sr-announcements');

// Speech synthesis
const synth = window.speechSynthesis;
let voices = [];
let isSpeaking = false;

// Initialize
function init() {
    loadVoices();
    setupEventListeners();
    loadSavedSettings();
    updateCharCount();
    
    // Load voices when they become available
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }
}

// Load available voices
function loadVoices() {
    voices = synth.getVoices();
    
    if (voices.length > 0) {
        populateVoiceList();
    }
}

// Populate voice dropdown
function populateVoiceList() {
    voiceSelect.innerHTML = '';
    
    // Group voices by language
    const groupedVoices = {};
    
    voices.forEach((voice, index) => {
        const lang = voice.lang.split('-')[0];
        if (!groupedVoices[lang]) {
            groupedVoices[lang] = [];
        }
        groupedVoices[lang].push({ voice, index });
    });
    
    // Add English voices first
    if (groupedVoices['en']) {
        const enGroup = document.createElement('optgroup');
        enGroup.label = 'English';
        groupedVoices['en'].forEach(({ voice, index }) => {
            const option = createVoiceOption(voice, index);
            enGroup.appendChild(option);
        });
        voiceSelect.appendChild(enGroup);
    }
    
    // Add other languages
    Object.keys(groupedVoices).sort().forEach(lang => {
        if (lang !== 'en') {
            const group = document.createElement('optgroup');
            group.label = getLanguageName(lang);
            groupedVoices[lang].forEach(({ voice, index }) => {
                const option = createVoiceOption(voice, index);
                group.appendChild(option);
            });
            voiceSelect.appendChild(group);
        }
    });
    
    // Load saved voice or select default
    const savedVoice = localStorage.getItem('selectedVoice');
    if (savedVoice) {
        voiceSelect.value = savedVoice;
    } else {
        selectDefaultVoice();
    }
}

// Create voice option element
function createVoiceOption(voice, index) {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    
    if (voice.default) {
        option.textContent += ' - Default';
    }
    
    return option;
}

// Select default voice (prefer English)
function selectDefaultVoice() {
    const defaultVoice = voices.findIndex(voice => voice.default);
    const englishVoice = voices.findIndex(voice => voice.lang.startsWith('en'));
    
    if (englishVoice !== -1) {
        voiceSelect.selectedIndex = englishVoice;
    } else if (defaultVoice !== -1) {
        voiceSelect.selectedIndex = defaultVoice;
    } else if (voices.length > 0) {
        voiceSelect.selectedIndex = 0;
    }
}

// Get language name from code
function getLanguageName(code) {
    const languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ar': 'Arabic',
        'hi': 'Hindi'
    };
    return languages[code] || code.toUpperCase();
}

// Setup event listeners
function setupEventListeners() {
    speakBtn.addEventListener('click', speak);
    stopBtn.addEventListener('click', stop);
    clearBtn.addEventListener('click', clearText);
    
    textInput.addEventListener('input', updateCharCount);
    
    pitchSlider.addEventListener('input', updatePitchValue);
    rateSlider.addEventListener('input', updateRateValue);
    volumeSlider.addEventListener('input', updateVolumeValue);
    
    voiceSelect.addEventListener('change', saveVoiceSelection);
    
    // Save settings on change
    pitchSlider.addEventListener('change', saveSettings);
    rateSlider.addEventListener('change', saveSettings);
    volumeSlider.addEventListener('change', saveSettings);
}

// Speak function
function speak() {
    const text = textInput.value.trim();
    
    if (!text) {
        updateStatus('Please enter some text', 'error');
        announceToScreenReader('Please enter some text to speak');
        return;
    }
    
    if (isSpeaking) {
        return;
    }
    
    // Cancel any ongoing speech
    synth.cancel();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const selectedVoiceIndex = voiceSelect.value;
    if (selectedVoiceIndex && voices[selectedVoiceIndex]) {
        utterance.voice = voices[selectedVoiceIndex];
    }
    
    // Set properties
    utterance.pitch = parseFloat(pitchSlider.value);
    utterance.rate = parseFloat(rateSlider.value);
    utterance.volume = parseFloat(volumeSlider.value);
    
    // Event handlers
    utterance.onstart = () => {
        isSpeaking = true;
        updateStatus('Speaking...', 'speaking');
        updateButtons();
        announceToScreenReader('Started speaking');
    };
    
    utterance.onend = () => {
        isSpeaking = false;
        updateStatus('Finished', '');
        updateButtons();
        announceToScreenReader('Finished speaking');
        
        // Reset to ready after a delay
        setTimeout(() => {
            if (!isSpeaking) {
                updateStatus('Ready', '');
            }
        }, 2000);
    };
    
    utterance.onerror = (event) => {
        console.error('Speech error:', event);
        isSpeaking = false;
        
        let errorMessage = 'An error occurred';
        
        switch (event.error) {
            case 'canceled':
                errorMessage = 'Speech canceled';
                break;
            case 'interrupted':
                errorMessage = 'Speech interrupted';
                break;
            case 'audio-busy':
                errorMessage = 'Audio system is busy';
                break;
            case 'network':
                errorMessage = 'Network error occurred';
                break;
            case 'not-allowed':
                errorMessage = 'Speech not allowed';
                break;
            default:
                errorMessage = `Error: ${event.error}`;
        }
        
        updateStatus(errorMessage, 'error');
        updateButtons();
        announceToScreenReader(errorMessage);
    };
    
    // Speak
    synth.speak(utterance);
}

// Stop speaking
function stop() {
    if (synth.speaking) {
        synth.cancel();
        isSpeaking = false;
        updateStatus('Stopped', '');
        updateButtons();
        announceToScreenReader('Speech stopped');
    }
}

// Clear text
function clearText() {
    textInput.value = '';
    updateCharCount();
    textInput.focus();
    announceToScreenReader('Text cleared');
}

// Update character count
function updateCharCount() {
    const count = textInput.value.length;
    charCount.textContent = count;
}

// Update slider value displays
function updatePitchValue() {
    const value = parseFloat(pitchSlider.value).toFixed(1);
    pitchValue.textContent = value;
    pitchSlider.setAttribute('aria-valuenow', value);
}

function updateRateValue() {
    const value = parseFloat(rateSlider.value).toFixed(1);
    rateValue.textContent = value;
    rateSlider.setAttribute('aria-valuenow', value);
}

function updateVolumeValue() {
    const value = parseFloat(volumeSlider.value).toFixed(1);
    volumeValue.textContent = value;
    volumeSlider.setAttribute('aria-valuenow', value);
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
    speakBtn.disabled = isSpeaking;
    stopBtn.disabled = !isSpeaking;
}

// Announce to screen reader
function announceToScreenReader(message) {
    srAnnouncements.textContent = message;
    
    setTimeout(() => {
        srAnnouncements.textContent = '';
    }, 1000);
}

// Save voice selection
function saveVoiceSelection() {
    localStorage.setItem('selectedVoice', voiceSelect.value);
}

// Save all settings
function saveSettings() {
    localStorage.setItem('pitch', pitchSlider.value);
    localStorage.setItem('rate', rateSlider.value);
    localStorage.setItem('volume', volumeSlider.value);
}

// Load saved settings
function loadSavedSettings() {
    const savedPitch = localStorage.getItem('pitch');
    const savedRate = localStorage.getItem('rate');
    const savedVolume = localStorage.getItem('volume');
    
    if (savedPitch) {
        pitchSlider.value = savedPitch;
        updatePitchValue();
    }
    
    if (savedRate) {
        rateSlider.value = savedRate;
        updateRateValue();
    }
    
    if (savedVolume) {
        volumeSlider.value = savedVolume;
        updateVolumeValue();
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

// Handle page visibility change (stop speaking when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isSpeaking) {
        stop();
    }
});