# ⚡ AI Resume Matcher & Interview Strategist

An immersive, full-stack web application that leverages Google's Generative AI (Gemini) to analyze candidates' PDF resumes against specific Job Descriptions. It provides a real-time preparation score, structured technical and behavioral interview questionnaires, a tailored day-by-day preparation roadmap, and downloads high-fidelity dynamically generated resume PDFs.

![AI Resume Builder & Interview Strategist Dashboard UI Mockup](./dashboard_mockup.png)

---

## 🎯 The Core Idea
Preparing for modern technical interviews is highly fragmented. Candidates struggle to identify where their resumes fall short against specific job descriptions and lack structured roadmaps to address those gaps. 

This application bridges that gap by offering a **Single-Page Preparation Dashboard**:
1. **Match-Score Analysis**: Calculates a radial job-fit match score.
2. **Targeted Questions**: Generates direct technical and behavioral questions mapped to specific resume shortcomings.
3. **Structured Roadmap**: Builds a custom preparation timeline.
4. **Dynamic Resume Builder**: Renders customized resume PDF documents using headless browser automation based on AI suggestions.

---

## ⚙️ Project Architecture

The project is structured as a full-stack monorepo featuring a decoupled React frontend and a robust Express.js backend.

### System Topology Diagram
```mermaid
graph TD
    User([Candidate Client Browser]) <--> |React Router / SASS| Frontend[Vite React Client]
    Frontend <--> |Axios / CORS / Secure Cookies| Backend[Express.js API Server]
    Backend <--> |Mongoose / TLS| DB[(MongoDB Atlas Cloud Database)]
    Backend <--> |Google GenAI SDK| Gemini[Gemini 1.5 Flash Model]
    Backend <--> |Headless Chrome automation| Puppeteer[Puppeteer PDF Engine]
```

### Directory Structure
```bash
Resume_Builder_GenAI/
├── Frontend/               # Vite React Client
│   ├── src/
│   │   ├── features/       # Feature-based modular structure
│   │   │   ├── auth/       # Hooks, Pages, Context for user management
│   │   │   └── interview/  # Steppers, radial matchers, roadmaps
│   │   └── app.routes.jsx  # React-Router central route mappings
│   └── vite.config.js
├── Backend/                # Express.js REST API
│   ├── src/
│   │   ├── config/         # Database and environment initialization
│   │   ├── controllers/    # Authentication and AI report handlers
│   │   ├── models/         # Mongoose User and Interview schemas
│   │   ├── routes/         # REST API endpoints
│   │   └── services/       # Gemini AI and Puppeteer engines
│   └── server.js
└── .gitignore              # Unified monorepo ignore mapping
```

---

## 🔁 Complete Work Flow

### 1. Authentication & Safety Guard
```mermaid
sequenceDiagram
    participant User as Candidate Client
    participant API as Express API
    participant DB as MongoDB Atlas
    
    User->>API: 1. Input credentials (Gmail account check)
    alt is Gmail Address
        API->>API: Generate 6-Digit OTP
        API->>User: Staged code in Node terminal & Dev HUD
        User->>API: 2. Input OTP along with details
    end
    API->>DB: Save user (hashed password via bcrypt)
    API->>User: Write JWT token cookie (httpOnly, Secure, sameSite: none)
    User->>User: Secure redirect to Dashboard
```

### 2. Analysis & Interactive Stepper
```mermaid
sequenceDiagram
    participant User as Dashboard Client
    participant API as Express API
    participant Gemini as Google Gemini
    participant DB as MongoDB
    
    User->>API: Upload PDF Resume + Job Description
    API->>User: Trigger 5-Phase Animated Stepper (Min 4s)
    API->>Gemini: Parse PDF text + apply Native JSON schemas
    Gemini->>API: Return structured JSON (Match Score, Q&A, Roadmap)
    API->>DB: Store report linked to User ID
    API->>User: Render match-score, roadmap, and collapsible questionnaires
```

---

## 🛠️ Major Challenges & Elegant Solutions

During development and deployment, we tackled several high-level engineering hurdles:

### 1. MongoDB Legacy Unique Index Collision (`name_1`)
* **The Challenge**: During early development, a schema iteration contained a unique index on a `name` attribute. When the schema was updated to use `username`, Mongoose retained the index definitions inside MongoDB. Omitting `name` during new registrations forced it to default to `null` database-wide, causing MongoDB to throw unique duplicate key errors (`name_1 dup key: { name: null }`) on subsequent signups, locking out new users.
* **The Solution**: Implemented a programmatic index cleanup trigger in the database connection layer [database.js](file:///c:/Users/HP/Desktop/Resume_Builder_GenAI/Backend/src/config/database.js). The backend automatically scans the `users` collection upon startup and drops the legacy index `name_1`, clearing the block permanently without manual database patching.

### 2. Schema Translation Failure in Gemini (Zod v4 Mismatch)
* **The Challenge**: The AI service used `zod-to-json-schema` to format output expectations for Google Gemini. However, a serialization bug with Zod v4 resulted in empty schemas (`{ "$schema": "..." }`), causing Gemini to return unstructured text data which triggered schema database validation crashes.
* **The Solution**: Bypassed the translation library entirely. We hand-coded **Native JSON Schema Definitions** inside [ai.service.js](file:///c:/Users/HP/Desktop/Resume_Builder_GenAI/Backend/src/services/ai.service.js) directly feeding the Gemini API pure schemas. This guarantees highly structured, deterministic JSON payloads from Gemini.

### 3. Case-Sensitive Imports on Cloud Linux Containers
* **The Challenge**: The local development machine (Windows) has a case-insensitive filesystem. Imports like `./features/auth/pages/Login` successfully matched lowercase files on disk (like `login.jsx`). When deploying to Vercel (which runs on case-sensitive Linux containers), the build crashed with `UNRESOLVED_IMPORT` errors due to the mismatched casing.
* **The Solution**: Standardized all routing and component imports inside [app.routes.jsx](file:///c:/Users/HP/Desktop/Resume_Builder_GenAI/Frontend/src/app.routes.jsx) to match the lowercase file structures on disk.

### 4. Cross-Domain Cookie Rejection in Production
* **The Challenge**: Hosting the frontend on Vercel and the backend on Render meant modern browsers blocked the JWT session cookie exchanges due to cross-domain privacy blocks, preventing users from logging in.
* **The Solution**: Implemented dynamic CORS origin validation in [app.js](file:///c:/Users/HP/Desktop/Resume_Builder_GenAI/Backend/src/app.js) to accept dynamic Vercel preview domains (`*.vercel.app`). We then upgraded the backend cookie settings in [auth.controller.js](file:///c:/Users/HP/Desktop/Resume_Builder_GenAI/Backend/src/controllers/auth.controller.js) with production attributes:
  ```javascript
  const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  };
  ```

---

## 🚀 Local Installation & Configuration

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MongoDB](https://www.mongodb.com/) (Local server or Atlas cloud cluster)
* A [Google GenAI API Key](https://aistudio.google.com/) (Gemini API)

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `Backend/` folder:
   ```env
   PORT=3000
   MONGO_URI=mongodb+srv://your_user:your_pass@your_cluster.mongodb.net/interview-master
   JWT_SECRET=your_long_cryptographically_secure_random_string
   GOOGLE_GENAI_API_KEY=AIzaSyAz...your_gemini_api_key...
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```
4. Start the backend:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. *(Optional)* Create a `.env` file in the `Frontend/` folder for production URL targeting:
   ```env
   VITE_API_URL=http://localhost:3000
   ```
   *(Note: The client is programmed to automatically fall back to the live Render URL if running in production, or localhost if run locally).*
4. Start the Vite client:
   ```bash
   npm run dev
   ```

---

## 👥 Authors & License
* Developed by **Rohit Tiwari**.
* Licensed under the ISC License.
