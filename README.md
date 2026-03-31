# 🚀 KnowNow — Meme-to-Knowledge Converter

> Transform boring academic updates into engaging, shareable memes using AI.

---

## 🧠 Problem Statement

Gen-Z students often ignore important academic communications such as:

* Exam schedules
* Assignment deadlines
* Official announcements

These are typically delivered via:

* Notice boards
* Emails
* Messaging groups

📉 Result:

* Low engagement
* Missed deadlines
* Poor information retention

---

## 💡 Solution

**KnowNow** converts academic text into **meme-style content** using AI.

By leveraging:

* Humor
* Visual memory
* Relatable formats

👉 We transform passive information into **high-engagement communication**

---

## 🎯 Core Idea

> “Students don’t ignore information — they ignore boring formats.”

KnowNow bridges this gap by converting:

```
Text → AI Caption → Meme → Engagement
```

---

## ⚙️ Features

### 🧩 1. Customizable Meme Generation

* AI-generated captions
* Editable text on canvas
* Drag & position text
* Font styling (Google Fonts)
* Stroke, color, alignment controls

---

### ⚡ 2. Instant Meme Generation

* One-click meme creation
* Auto template selection
* Tone + situation-based matching
* Regenerate option

---

### 🤖 3. AI-Based Caption Generation

* Extracts key information
* Detects:

  * Context (exam, deadline, etc.)
  * Tone (sarcastic, relatable, etc.)
  * Situation (decision, procrastination, etc.)

---

### 🧠 4. Smart Template Matching

* Uses:

  * **Situation (Primary)**
  * **Tone (Secondary)**
* Ensures high relevance and accuracy

---

### 🔍 5. Explainable AI (Reasoning)

Each template shows:

```
Matches deadline + stress
```

👉 Improves transparency and trust

---

### 🎨 6. Professional Meme Editor

* Konva-based canvas
* Inline editing (double-click)
* Draggable text
* Snap guides
* Dynamic layout (single/double caption)

---

### 📱 7. Fully Responsive Design

* Mobile-first experience
* Canvas scaling
* Touch-friendly controls

---

### 🔗 8. Share & Export

* Export as image (PNG)
* Direct sharing (WhatsApp-ready)

---

## 🏗️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Konva.js (Canvas rendering)

### Backend

* Node.js
* Express.js

### AI Integration

* OpenAI API (Caption generation)

---

## 🧠 System Architecture

```
User Input
   ↓
AI Processing (Caption + Tone + Situation)
   ↓
Normalization Layer
   ↓
Template Matching Engine
   ↓
Konva Canvas Rendering
   ↓
User Editing / Export
```

---

## 🔬 Technical Deep Dive

### 1. AI Processing Layer

* Extracts:

  * Key message
  * Tone
  * Situation

---

### 2. Normalization Layer

AI outputs are mapped to fixed values:

Example:

```
"midsem" → "exam"
"panic" → "stress"
```

👉 Ensures consistency

---

### 3. Template Matching Engine

Scoring logic:

```
Score = (Situation Match × 5) + (Tone Match × 2)
```

👉 Situation has higher priority

---

### 4. Smart Selection

* Top 8 templates shortlisted
* Weighted random selection → Top 4 shown

---

### 5. Konva Canvas Engine

* Pixel-perfect rendering
* Dynamic scaling
* Real-time editing

---

### 6. Inline Editing System

* Double-click to edit text
* HTML overlay input
* Sync with canvas state

---

### 7. Export Engine

* Uses canvas rendering
* Ensures exported image matches UI exactly

---

## 🚀 Deployment

### 1. Backend (Render)

* **Service Type**: Web Service
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Environment Variables**:
  * `PORT`: 5000 (standard)
  * `GEMINI_API_KEY`: Your Google AI Key
  * `IMGFLIP_USERNAME`: Your Imgflip username
  * `IMGFLIP_PASSWORD`: Your Imgflip password

### 2. Frontend (Firebase)

* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Deployment**:
  1. `npm install -g firebase-tools`
  2. `firebase login`
  3. `firebase init` (Select Hosting, use `dist` as public directory)
  4. `firebase deploy`
* **Environment Variables**:
  * `VITE_BACKEND_URL`: Your Render backend URL (e.g., `https://knownow-backend.onrender.com`)
