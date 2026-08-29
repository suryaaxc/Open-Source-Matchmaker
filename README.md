<div align="center">
  <h1>🌌 Open Source Matchmaker</h1>
  <p><strong>The Neural Onboarding Engine for Open Source Contributors</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Status-Active-emerald?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/AI_Engine-Gemini_2.0-indigo?style=for-the-badge" alt="AI Engine" />
    <img src="https://img.shields.io/badge/Frontend-React_19-blue?style=for-the-badge" alt="Frontend" />
    <img src="https://img.shields.io/badge/License-MIT-slate?style=for-the-badge" alt="License" />
  </p>
</div>

<br />

Welcome to the future of open-source contributions.

Finding the right issue and understanding an unfamiliar codebase is the biggest barrier for new contributors. **Open Source Matchmaker** eliminates this friction. By translating GitHub issues and developer profiles into high-dimensional vector space, it mathematically pairs you with the perfect issue. Once matched, an autonomous AI agent clones the repository, reads the context, and generates a bespoke "Starter Guide" just for you.

---

## 🚀 The Architecture (4-Phase Engine)

### 🛰️ Phase 1: The Harvester (Data Pipeline)
An automated backend service that continuously queries the GitHub REST/GraphQL API. It specifically hunts for `good first issue` and `help wanted` tags across top-tier repositories, scraping titles, labels, and issue descriptions. 

### 🧠 Phase 2: The Matchmaker (Vector Recommendation)
We abandoned basic keyword matching. Instead, the backend utilizes `gemini-embedding-2-preview` to convert both the user's bio and the GitHub issue descriptions into dense vector embeddings. A lightning-fast **Cosine Similarity** algorithm runs in memory to return the top 5 absolute best semantic matches for your exact skill set.

### 🤖 Phase 3: The Mentor (Repository RAG)
The crown jewel of the platform. When an issue is selected, the system executes a Retrieval-Augmented Generation (RAG) pipeline:
1. **Fetch Context**: Pulls the `README.md` and (optionally) `CONTRIBUTING.md` of the target repository.
2. **Contextual Analysis**: Feeds the raw repository context + the specific issue details into `gemini-3.7-flash`.
3. **Guide Generation**: Outputs a step-by-step, actionable starter guide explaining *where* to look in the codebase and *how* to approach the fix.
4. **Caching Layer**: Results are cached in-memory (simulating Redis) to ensure subsequent requests for the same issue load instantly with zero LLM API cost.

### 🌌 Phase 4: The Experience (Immersive Frontend)
A zero-compromise, dark-mode-first React interface built with Tailwind CSS v4 and Framer Motion. 
- **Fluid Micro-interactions**: Staggered layout reveals, hovering depth-shadows, and spring-physics side panels.
- **Custom Toasts**: Frosted glass, animated toast notifications for pipeline events.
- **Markdown RAG Render**: The AI Mentor's output is rendered in beautifully styled `prose-invert` Markdown with syntax highlighting.

---

## 🛠️ Tech Stack

- **Core**: React 19, TypeScript, Node.js, Express
- **AI / ML**: `@google/genai` (`gemini-embedding-2-preview`, `gemini-3.7-flash`)
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **Animation**: Framer Motion (`motion/react`)
- **Processing**: `react-markdown`

---

## 💻 Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/open-source-matchmaker.git
   cd open-source-matchmaker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Fire up the engine**
   ```bash
   npm run dev
   ```
   The backend server and Vite frontend will boot up concurrently on `http://localhost:3000`.

---

## 💡 Pro-Tips for Reviewers & Technical Interviews

* **Vector Search over Keyword Search**: By converting profiles and issues to embeddings, the system understands *semantic intent*. If a user types "I like building user interfaces", the math correctly aligns them with issues labeled `frontend` or `React`, even if they never typed those exact words.
* **LLM Caching**: RAG operations are expensive. The backend implements a caching layer mapping `issue_id -> LLM_response`. This drastically reduces latency and API costs on popular issues.

---

<div align="center">
  <p>Built with passion for the Open Source community.</p>
</div>
