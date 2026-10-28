# PlacementOS 🎓🚀

**PlacementOS** is a comprehensive, AI-powered Placement Operating System designed for college students and placement cells. It streamlines the entire campus recruitment journey—from resume parsing and skill gap analysis to intelligent job matching, readiness scoring, and real-time AI video mock interviews.

---

## 🌟 Key Features

1. **AI-Powered Resume Parsing & Optimization**
   - Upload PDF or DOCX resumes.
   - Automatically extract skills, education, and experience.
   - AI-driven suggestions to optimize resumes for target job descriptions.

2. **Smart Job Matching & Campus Drives**
   - Browse active company placement drives and job listings.
   - Real-time compatibility scoring between student profiles and job requirements.
   - One-click application tracking and status updates.

3. **Skill Gap Analysis & Personalized Roadmaps**
   - Evaluate proficiency across DSA, Aptitude, Core Subjects, and Communication.
   - Generate custom step-by-step learning roadmaps to bridge skill gaps.

4. **Readiness Scoring Engine**
   - Comprehensive student placement readiness dashboard.
   - Metric tracking for mock interviews, coding tests, and resume strength.

5. **Real-Time AI Video Mock Interviews**
   - Interactive practice interviews powered by Gemini AI and camera/microphone integration.
   - Real-time feedback on confidence, clarity, technical accuracy, and communication.

6. **Secure Student & Admin Portals**
   - Role-based authentication and authorization.
   - Secure student registration, login, and profile management.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router DOM, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js, Express, TypeScript (`tsx`), Mongoose / MongoDB.
- **AI & Document Processing:** `@google/genai` (Gemini SDK), `pdf-parse`, `mammoth`, `multer`.
- **Security & Utilities:** `bcryptjs`, `cookie-parser`, `dotenv`.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd placement-os
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_google_gemini_api_key
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build & Production

To build the application for production:
```bash
npm run build
```

To start the production server:
```bash
npm start
```

---

## 📜 License
This project is open-source and available under the MIT License.
