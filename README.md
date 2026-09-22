# GCS — Gesture Communication System

## Running locally

Install the development dependency once, then start the static server:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The server is required because the project uses ES modules and Firebase imports.

## 📌 Project Overview

**GCS (Gesture Communication System)** is a comprehensive web-based accessibility application designed to break communication barriers for people with different abilities. It provides three distinct modes:

1. **BLIND MODE** — Speech-to-Text (For visually impaired users)
2. **DEAF MODE** — Visual Gesture Recognition (For deaf/hard of hearing users)
3. **NORMAL MODE** — Text-to-Speech (Full-featured experience)

The system uses cutting-edge technologies like the **Web Speech API** and **MediaPipe** for real-time gesture detection, making communication accessible to everyone.

---

## 📁 Project Structure

```
GBCS/
├── index.html              # Main landing page (home)
├── blind2.html              # Speech-to-Text interface
├── deaf02.html              # Visual Gesture Recognition interface
├── normal2.html             # Text-to-Speech interface
│
├── scripts/
│   ├── blind.js             # Speech recognition engine for blind mode
│   ├── double.js            # Gesture detection engine (MediaPipe integration)
│   └── normal.js            # Text-to-Speech engine for normal mode
│
└── styles/
    ├── blind2.css           # Styling for blind mode (pink theme)
    ├── deaf02.css           # Styling for deaf mode (cyan theme)
    └── normal2.css          # Styling for normal mode (yellow theme)
```

---

## 🔗 File Relationships & Data Flow

### **1. HTML Files (User Interface Layer)**

Each HTML file serves as a dedicated interface for different user modes:

#### **blind2.html** → Speech-to-Text Interface
- **Purpose**: Captures voice input and converts to text
- **Dependencies**: 
  - Links to `blind.js` for speech recognition logic
  - Links to `blind2.css` for styling
- **Key Elements**:
  - "START LISTENING" button → Triggers speech recognition
  - Status display → Shows current listening state
  - Output box → Displays recognized text
  - Quick tips card → Provides user guidance
- **Accessibility**: Full keyboard navigation (Space to start, Esc to stop), screen reader support

#### **deaf02.html** → Visual Gesture Recognition Interface
- **Purpose**: Detects hand gestures via camera and converts to text
- **Dependencies**: 
  - Links to `double.js` for gesture detection
  - Links to `deaf02.css` for styling
  - External libraries: MediaPipe (via CDN)
- **Key Elements**:
  - Camera feed display (video + canvas overlay)
  - Detected gesture display
  - Translation output
  - Quick reference chart (sign language symbols)
- **Data Flow**: Camera → MediaPipe → Gesture Detection → Translation Output

#### **normal2.html** → Text-to-Speech Interface
- **Purpose**: Converts text input to audible speech with customization
- **Dependencies**: 
  - Links to `normal.js` for speech synthesis logic
  - Links to `normal2.css` for styling
- **Key Elements**:
  - Text input area
  - Voice selector dropdown
  - Pitch, Speed, Volume sliders
  - Status display
- **Settings**: All voice preferences are saved to localStorage

---

### **2. JavaScript Files (Business Logic Layer)**

#### **blind.js** — Speech Recognition Engine
**Technology**: Web Speech API (SpeechRecognition)

**Key Functions**:
```javascript
setupRecognition()    → Initialize speech recognition
startListening()      → Begin capturing audio input
stopListening()       → Stop audio capture
recognition.onresult → Process recognized speech
recognition.onerror  → Handle errors (no-speech, audio-capture, etc.)
```

**Features**:
- Continuous recognition with interim results
- Auto-restart on "no-speech" error
- Screen reader announcements
- Audio feedback using Speech Synthesis
- Persists user preferences to localStorage
- Full keyboard accessibility (Space/Esc)

**Data Flow**:
1. User clicks "START LISTENING"
2. Browser requests microphone permission
3. Audio stream is captured
4. Speech Recognition API processes audio in real-time
5. Interim results display while speaking
6. Final transcript is saved when user pauses
7. Text appears in output box

**Error Handling**:
- `no-speech` → Auto-restart listening
- `audio-capture` → Alert user to connect microphone
- `not-allowed` → Alert user to grant permission
- `network` → Inform user of connectivity issues

---

#### **normal.js** — Text-to-Speech Engine
**Technology**: Web Speech API (SpeechSynthesis)

**Key Functions**:
```javascript
loadVoices()              → Fetch available system voices
populateVoiceList()       → Organize voices by language and display
speak()                   → Convert text to speech with settings
stop()                    → Cancel ongoing speech
updateCharCount()         → Track character count
saveSettings()            → Persist pitch/rate/volume to localStorage
```

**Customization Parameters**:
- **Voice Selection**: Grouped by language (English first)
- **Pitch**: 0.5x to 2.0x (default: 1.0)
- **Speed (Rate)**: 0.5x to 2.0x (default: 1.0)
- **Volume**: 0% to 100% (default: 100%)

**Data Flow**:
1. User enters text in textarea
2. Character count updates live
3. User adjusts voice settings
4. User clicks "SPEAK"
5. Settings are applied to SpeechSynthesisUtterance
6. Selected voice speaks the text
7. Status updates during speaking
8. User can stop at any time

**Technology Details**:
- Groups voices by language code (e.g., 'en', 'es', 'fr')
- Falls back to system default voice if English unavailable
- Uses ARIA attributes for screen reader compatibility
- Announcements for status changes

---

#### **double.js** — Gesture Detection Engine (MediaPipe Integration)
**Technology**: MediaPipe Hands + Custom Gesture Recognition

**Architecture**:

```
Video Input (Camera)
        ↓
MediaPipe Hands Detection
        ↓
Hand Landmarks (21 points per hand)
        ↓
Custom Gesture Pattern Matching
        ↓
Gesture Identification
        ↓
Translation & Display Output
```

**MediaPipe CDN Libraries Loaded** (deaf02.html):
```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"></script>
```

---

### **3. CSS Files (Presentation Layer)**

#### **blind2.css** — Pink Theme
- Color scheme: Pinks (#E91E63, light pinks)
- Typography: Audio-focused, large text for screen readers
- Layout: Two-column (controls + output)
- Components: Status indicators, audio visualizer

#### **deaf02.css** — Cyan Theme
- Color scheme: Cyans (#00BCD4, light cyans)
- Typography: Visual-focused, clear gesture labels
- Layout: Two-column (camera + translation)
- Components: Camera viewport, gesture display, sign reference

#### **normal2.css** — Yellow Theme
- Color scheme: Yellows (#FFC107, light yellows)
- Typography: Balanced for all users
- Layout: Two-column (input + voice settings)
- Components: Sliders, dropdowns, waveform visualization

---

## 🤖 MediaPipe Gesture Detection Explained

### **What is MediaPipe?**

MediaPipe is a **framework for building perception pipelines**. For hand gesture recognition, it:

1. **Detects hands** in video using ML-based detection
2. **Extracts hand landmarks** (21 key points per hand)
3. **Provides 3D coordinates** (x, y, z values)
4. **Runs in real-time** (optimized for web browsers)

### **Hand Landmarks (21 Points)**

MediaPipe identifies 21 landmarks on each hand:

```
        Index (8)
       Middle (12)
        Ring (16)
       Pinky (20)
         ↓↓↓↓
        (Tips)
         
Thumb(4)  Wrist(0)  Palm(9)
```

**Full Landmark Tree**:
- **0**: Wrist (base)
- **1-4**: Thumb (CMC, MCP, IP, Tip)
- **5-8**: Index (MCP, PIP, DIP, Tip)
- **9-12**: Middle (MCP, PIP, DIP, Tip)
- **13-16**: Ring (MCP, PIP, DIP, Tip)
- **17-20**: Pinky (MCP, PIP, DIP, Tip)

### **Gesture Recognition Pipeline in double.js**

#### **Step 1: Extract Finger States**
```javascript
function fingerState(lm, f) {
  // Calculate angle between MCP→PIP→Tip joints
  const angle = angleDeg(lm[mcp], lm[pip], lm[tip]);
  
  if (angle > 160) return 'open';   // Finger extended
  if (angle > 120) return 'half';   // Partially bent
  return 'closed';                  // Fully bent
}
```

This determines if each finger (index, middle, ring, pinky) is open, half-open, or closed.

#### **Step 2: Analyze Hand Geometry**
```javascript
// Helper functions calculate:
- thumbIndexDist() → Distance between thumb and index finger
- fingersSpread() → How far apart fingers are
- handPointsUp() → Is hand palm-up?
- wristRollDeg() → Rotation angle of wrist
- palmNormal() → 3D normal vector of palm
```

#### **Step 3: Match Gesture Patterns**
Each gesture is defined as a test function:

```javascript
const Gestures = [
  {
    emoji: "👍",
    label: "Thumbs Up",
    test(lm, hand) {
      // Thumb must be open AND above other fingers
      return isOpen(thumb) && 
             isClosed(index) && 
             isClosed(middle) && 
             lm[4].y < Math.min(lm[5].y, lm[9].y);
    }
  },
  // ... more gestures
]
```

### **Supported Gestures (23 Total)**

#### **Single-Hand Gestures**:
| Emoji | Gesture | Recognition Logic |
|-------|---------|-------------------|
| 👍 | Thumbs Up | Thumb open, all fingers closed, thumb above palm |
| 👎 | Thumbs Down | Thumb open, all fingers closed, thumb below palm |
| 🤟 | Love You | Thumb open, Index open, Middle closed, Pinky open |
| 🤘 | Rock/Horns | Thumb closed, Index open, Pinky open, Middle closed |
| 🤙 | Call Me | Thumb open, Index closed, Pinky open, Middle closed |
| ✌️ | Peace | Index open, Middle open, Ring closed, Pinky closed, fingers > 0.6px apart |
| 👌 | OK | All fingers open, thumb-index distance < 0.45px (forming O) |
| 🤌 | Pinched Fingers | All fingers pinched toward thumb (distance < 0.5px) |
| 🤏 | Pinch | Thumb-index pinched, others extended |
| 🖖 | Vulcan Salute | All fingers open, middle-ring gap > index-middle gap |
| 👋 | Wave | All fingers open, wrist rolling 30°-150° |
| ✋ | Stop Hand | All fingers open, palm up, pointing up |
| 🖐️ | Hi Five | All fingers open, thumb open, fingers > 1.4px apart |
| 🫵 | Pointing at You | Index open, others closed, index towards camera (z-depth) |
| 👆 | Pointing Up | Index extended upward (y < wrist - 0.2px) |
| 👇 | Pointing Down | Index extended downward (y > wrist + 0.2px) |
| 👈 | Pointing Left | Index pointing left (x-distance > y-distance) |
| 👉 | Pointing Right | Index pointing right (x-distance reversed) |
| ✊ | Fist | All fingers closed |
| 🤲 | Palm Up | All fingers open, palm normal y < -0.3 |
| 🫳 | Palm Down | All fingers open, palm normal y > 0.3 |

#### **Two-Hand Gestures**:
| Emoji | Gesture | Recognition Logic |
|-------|---------|-------------------|
| 👏 | Clap | Both hand palms < 0.5px apart |
| 🙏 | Namaste | Palms together < 1.0px, both pointing up |
| 🤜🤛 | Fist Bump | Both hands in fist, knuckles < 1.5px apart |
| 🫶 | Heart Hands | Thumbs < 0.6px apart (forming heart) |

### **Real-Time Detection Loop**

```javascript
// Pseudo-code from double.js
function onVideoFrame() {
  // 1. Capture video frame
  const results = await detector.estimateHands(canvas);
  
  // 2. For each detected hand
  for (let hand of results.multiHandLandmarks) {
    const landmarks = hand[0].landmarks;
    const handedness = hand[1]; // 'Left' or 'Right'
    
    // 3. Test each gesture
    for (let gesture of Gestures) {
      if (gesture.test(landmarks, handedness)) {
        window.onGestureDetected(gesture.emoji, gesture.label);
        break; // Only one gesture per hand
      }
    }
  }
  
  // 4. Draw visualizations
  drawLandmarks(landmarks);
}
```

### **Data Flow for Gesture-to-Text**

```
Camera Video Feed
       ↓
MediaPipe Hand Pose Estimation
(Outputs 21 landmarks per hand with x, y, z coordinates)
       ↓
Geometry Analysis
(Calculate distances, angles, palm orientation)
       ↓
Pattern Matching
(Test landmarks against 23 gesture definitions)
       ↓
Gesture Identification
(e.g., "👍 Thumbs Up" detected)
       ↓
Callback: onGestureDetected(emoji, label)
       ↓
Update DOM
(Display emoji + label in gesture display)
       ↓
Append to Output Log
(Show translation history with timestamp)
```

---

## 🔊 Text-to-Speech (Normal Mode) Workflow

### **Process Flow**:

```
1. User types text in textarea
2. Character count updates
3. User selects voice from dropdown
4. User adjusts: Pitch, Speed, Volume
5. User clicks "SPEAK"
         ↓
6. Settings are packaged into SpeechSynthesisUtterance object:
   - text: user input
   - voice: selected voice from system
   - rate: 0.5x to 2.0x
   - pitch: 0.5x to 2.0x
   - volume: 0% to 100%
         ↓
7. speechSynthesis.speak(utterance) called
         ↓
8. Browser's audio engine converts text to speech
         ↓
9. Playback via speaker/headphones
         ↓
10. Status updates: "Speaking" → "Finished"
11. If user clicks "STOP", synthesis.cancel() aborts
```

### **Key Code (normal.js)**:

```javascript
function speak() {
  const utterance = new SpeechSynthesisUtterance(textInput.value);
  utterance.voice = voices[voiceSelect.value];
  utterance.pitch = parseFloat(pitchSlider.value);
  utterance.rate = parseFloat(rateSlider.value);
  utterance.volume = parseFloat(volumeSlider.value);
  
  synth.speak(utterance); // Browser handles rest
}
```

---

## 🎤 Speech-to-Text (Blind Mode) Workflow

### **Process Flow**:

```
1. User clicks "START LISTENING"
   (Browser requests microphone permission)
         ↓
2. Microphone access granted
   (Or permission dialog shown)
         ↓
3. Speech Recognition API initialized:
   - continuous: true (keeps listening)
   - interimResults: true (shows partial text)
   - lang: 'en-US'
         ↓
4. User speaks into microphone
         ↓
5. Real-time processing:
   - Interim results show while speaking
   - Final transcripts appended when pause detected
         ↓
6. Recognized text displays in output box
         ↓
7. On error:
   - "no-speech" → Auto-retry
   - "audio-capture" → Alert to connect mic
   - "not-allowed" → Alert to grant permission
         ↓
8. User clicks "STOP LISTENING"
   - Stops recording
   - Final text persists
```

### **Key Code (blind.js)**:

```javascript
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

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
  
  fullTranscript += finalTranscript;
  displayTranscript(fullTranscript + interimTranscript);
};
```

---

## 🎯 Gesture-to-Text (Deaf Mode) Workflow

### **Process Flow**:

```
1. User clicks "START CAMERA"
   (Browser requests camera permission)
         ↓
2. Camera video stream started
   Canvas overlays landmarks visualization
         ↓
3. MediaPipe processing begins:
   - Runs on each video frame (~30fps)
   - Detects hands in frame
   - Extracts 21 landmarks per hand
   - Calculates hand geometry
         ↓
4. Custom gesture matching:
   - Tests each hand against 23 gesture patterns
   - Compares angles, distances, orientation
   - Returns matching gesture or "NO GESTURE"
         ↓
5. Gesture detected:
   - Emoji + label displayed
   - Brief animation flash (500ms)
   - Added to translation log
         ↓
6. Translation output accumulates:
   - Each detection appends emoji + label
   - Scrolls automatically as added
   - Old entries removed after 60 gestures (prevents memory bloat)
         ↓
7. User clicks "STOP" to end camera
   - Camera feed closes
   - Gesture detection stops
   - Translation history preserved
```

### **Key Insights**:

- **Real-time**: Gesture detection happens 30+ times per second
- **Non-blocking**: Video continues even if no hand detected
- **Debouncing**: 350ms timer prevents logging same gesture rapidly
- **Canvas overlay**: Draws skeleton of hands for user feedback

---

## 🔄 How Files Communicate

### **Data Flow Diagram**:

```
┌─────────────────────────────────────────────────────────┐
│                   HTML Files (UI)                       │
│  blind2.html │ deaf02.html │ normal2.html               │
└──────┬───────────────┬──────────────────┬─────────────┘
       │               │                  │
       ↓               ↓                  ↓
   blind.js       double.js           normal.js
   (Logic)        (Logic)             (Logic)
       │               │                  │
       ↓               ↓                  ↓
   Web Speech API MediaPipe API    Web Speech API
                    ↓
              external CDN libs
```

### **State Management**:

```
localStorage
├── selectedVoice (normal.js)
├── audioFeedbackEnabled (blind.js)
├── pitch, rate, volume settings (normal.js)
└── user preferences (all modes)
```

### **DOM Event Flow**:

```
User Interaction (click, input, change)
        ↓
Event Listener (in JS)
        ↓
Browser API Call (Speech API, MediaPipe)
        ↓
Real-time Processing
        ↓
Update DOM Elements
        ↓
Display Feedback to User
```

---

## 🌐 Browser Compatibility

### **Required APIs**:

| Feature | Required API | Browser Support |
|---------|-------------|-----------------|
| Speech Recognition | Web Speech API | Chrome, Edge, Safari |
| Text-to-Speech | Speech Synthesis (SpeechSynthesisUtterance) | Chrome, Edge, Firefox, Safari |
| Camera Access | getUserMedia (MediaDevices) | All modern browsers |
| MediaPipe Hands | TensorFlow.js + MediaPipe JS | All modern browsers |

---

## 🚀 How to Use

### **Blind Mode** (Speech-to-Text):
1. Open `blind2.html`
2. Click "START LISTENING"
3. Speak clearly
4. Recognized text appears in output
5. Click "STOP" when finished

### **Deaf Mode** (Gesture-to-Text):
1. Open `deaf02.html`
2. Click "START CAMERA"
3. Make hand gestures in front of camera
4. Detected gestures appear below
5. Click "STOP" when finished

### **Normal Mode** (Text-to-Speech):
1. Open `normal2.html`
2. Type or paste text
3. Select voice, adjust pitch/speed/volume
4. Click "SPEAK"
5. Listen to the audio output
6. Adjust settings and repeat as needed

---

## 💡 Key Takeaways

1. **Three Modes**: Each serves a specific accessibility need
2. **Web APIs**: Uses standard browser APIs (no server needed)
3. **Real-time**: All modes work with live input/output
4. **MediaPipe**: Powers gesture detection with 21-point hand tracking
5. **Customizable**: Voice settings, gesture detection, full keyboard nav
6. **Persistent**: Saves user preferences to localStorage
7. **Accessible**: ARIA labels, screen reader support, keyboard shortcuts

---

## 📝 Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Speech Recognition**: Web Speech API (SpeechRecognition)
- **Speech Synthesis**: Web Speech API (SpeechSynthesisUtterance)
- **Gesture Detection**: MediaPipe Hands (TensorFlow.js)
- **Storage**: localStorage (client-side)
- **CDN**: MediaPipe libraries (jsDelivr)
- **Deployment**: Static website (no backend required)

---

## 🎨 UI/UX Design

- **Color-coded modes**: Pink (Blind), Cyan (Deaf), Yellow (Normal)
- **Responsive layout**: Two-column design for all modes
- **Live feedback**: Real-time status updates, visual indicators
- **Keyboard first**: Full keyboard navigation support
- **Screen reader ready**: ARIA labels on all interactive elements
- **Waveform animations**: Visual feedback for audio activity

---

**Created**: 2026 | **Accessibility**: WCAG 2.1 AA Compliant
