import express from "express";
import cors from "cors";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Gemini Client
// The API key is automatically injected by AI Studio into process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// --- IN-MEMORY DATABASE & CACHE ---
// In a real production system, this would be PostgreSQL (Phase 1) and Redis (Phase 3).
// We use in-memory stores here to make the prototype instantly runnable in the sandbox.
interface Issue {
  id: number;
  title: string;
  body: string;
  url: string;
  repo: string;
  labels: string[];
  embedding?: number[];
}

let issuesDB: Issue[] = [];
const guideCache = new Map<number, string>();

// Helper: Cosine Similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- PHASE 1: GitHub Data Pipeline (The Harvester) ---
app.post("/api/sync", async (req, res) => {
  try {
    console.log("Fetching issues from GitHub...");
    // Fetch 'good first issue' from GitHub REST API
    const ghRes = await fetch(
      'https://api.github.com/search/issues?q=label:"good first issue"+state:open&sort=updated&order=desc&per_page=15',
      {
        headers: {
          "User-Agent": "Open-Source-Matchmaker",
        }
      }
    );

    if (!ghRes.ok) {
      throw new Error(`GitHub API error: ${ghRes.statusText}`);
    }

    const data = await ghRes.json();
    const fetchedIssues: Issue[] = data.items.map((item: any) => {
      // Extract repo name from repository_url
      const repoUrlParts = item.repository_url.split("/");
      const repoName = `${repoUrlParts[repoUrlParts.length - 2]}/${repoUrlParts[repoUrlParts.length - 1]}`;

      return {
        id: item.id,
        title: item.title,
        body: item.body ? item.body.substring(0, 1000) : "No description provided.", // limit body length
        url: item.html_url,
        repo: repoName,
        labels: item.labels.map((l: any) => l.name),
      };
    });

    console.log(`Fetched ${fetchedIssues.length} issues. Generating embeddings...`);

    // Generate embeddings for the issues to power the Matchmaker
    // In production, we'd batch this and store in PostgreSQL using pgvector.
    for (const issue of fetchedIssues) {
      const textToEmbed = `Title: ${issue.title}\nLabels: ${issue.labels.join(", ")}\nDescription: ${issue.body}`;
      try {
        const embedRes = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: textToEmbed,
        });
        issue.embedding = embedRes.embeddings?.[0]?.values;
      } catch (e) {
        console.error(`Failed to embed issue ${issue.id}:`, e);
      }
    }

    // Save to our in-memory "PostgreSQL" db
    issuesDB = fetchedIssues.filter((i) => i.embedding != null);

    res.json({ success: true, count: issuesDB.length, message: "Issues synced and embedded successfully." });
  } catch (error: any) {
    console.error("Sync error:", error);
    res.status(500).json({ error: error.message || "Failed to sync issues." });
  }
});

app.get("/api/issues", (req, res) => {
  // Return issues without embeddings to save bandwidth
  const cleanIssues = issuesDB.map(({ embedding, ...rest }) => rest);
  res.json(cleanIssues);
});

// --- PHASE 2: Recommendation Engine (The Matchmaker) ---
app.post("/api/recommend", async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "Profile description is required." });
    }

    if (issuesDB.length === 0) {
      return res.status(400).json({ error: "Database is empty. Please run the sync pipeline first." });
    }

    // 1. Embed the user profile
    const embedRes = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: profile,
    });
    
    const profileEmbedding = embedRes.embeddings?.[0]?.values;
    if (!profileEmbedding) {
      throw new Error("Failed to generate embedding for profile.");
    }

    // 2. Compute cosine similarity with all issues
    const scoredIssues = issuesDB.map((issue) => {
      const score = cosineSimilarity(profileEmbedding, issue.embedding!);
      return { ...issue, score };
    });

    // 3. Sort by highest score (closest match) and return top 5
    scoredIssues.sort((a, b) => b.score - a.score);
    const topMatches = scoredIssues.slice(0, 5).map(({ embedding, ...rest }) => rest);

    res.json(topMatches);
  } catch (error: any) {
    console.error("Recommendation error:", error);
    res.status(500).json({ error: error.message || "Failed to recommend issues." });
  }
});

// --- PHASE 3: Repository RAG & Starter Guide (The Mentor) ---
app.post("/api/guide", async (req, res) => {
  try {
    const { issueId } = req.body;
    const issue = issuesDB.find((i) => i.id === issueId);

    if (!issue) {
      return res.status(404).json({ error: "Issue not found in database." });
    }

    // Pro-Tip: Check the Redis cache first!
    if (guideCache.has(issue.id)) {
      console.log(`Cache hit for issue ${issue.id}`);
      return res.json({ guide: guideCache.get(issue.id), cached: true });
    }

    console.log(`Cache miss for issue ${issue.id}. Generating guide via RAG...`);

    // 1. Fetch Repository Context (README.md)
    let repoContext = "No README found.";
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${issue.repo}/readme`, {
        headers: { "User-Agent": "Open-Source-Matchmaker", "Accept": "application/vnd.github.v3.raw" }
      });
      if (readmeRes.ok) {
        repoContext = await readmeRes.text();
        // Truncate to avoid context window explosion for huge readmes
        repoContext = repoContext.substring(0, 15000); 
      }
    } catch (e) {
      console.warn("Failed to fetch README", e);
    }

    // 2. Generate Guide using Gemini (Acting as LangChain/RAG pipeline)
    const prompt = `
You are a senior developer mentoring a junior open-source contributor.
They want to solve the following GitHub issue.

--- ISSUE DETAILS ---
Title: ${issue.title}
Repository: ${issue.repo}
Labels: ${issue.labels.join(", ")}
Description: ${issue.body}

--- REPOSITORY CONTEXT (README) ---
${repoContext}

--- INSTRUCTIONS ---
Generate a 'Starter Guide' for this contributor. Include:
1. A brief summary of what the issue is about.
2. Where they should likely start looking in the codebase based on the context.
3. High-level steps to approach the fix.
4. Words of encouragement.

Keep it concise, actionable, and formatted in clean Markdown.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    const guideText = response.text || "Failed to generate guide.";

    // Save to our in-memory "Redis" cache
    guideCache.set(issue.id, guideText);

    res.json({ guide: guideText, cached: false });
  } catch (error: any) {
    console.error("Guide generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate guide." });
  }
});

// --- VITE MIDDLEWARE (PHASE 4: Frontend) ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
