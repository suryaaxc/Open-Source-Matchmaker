/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Github, Search, Sparkles, BookOpen, AlertCircle, Database, CheckCircle2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Issue {
  id: number;
  title: string;
  body: string;
  url: string;
  repo: string;
  labels: string[];
  score?: number;
}

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [profile, setProfile] = useState("I am a frontend developer with experience in React, TypeScript, and Tailwind CSS. I want to contribute to UI components or documentation.");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [guide, setGuide] = useState<{ text: string; cached: boolean } | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<"empty" | "synced">("empty");

  useEffect(() => {
    // Check initial issues to see if DB is synced
    fetch("/api/issues")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.length > 0) {
          setDbStatus("synced");
          setIssues(data);
        }
      });
  }, []);

  const syncDatabase = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setDbStatus("synced");
        alert(`Success! Fetched and embedded ${data.count} issues.`);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to sync database.");
    }
    setSyncing(false);
  };

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (res.ok) {
        setIssues(data);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to get recommendations.");
    }
    setLoading(false);
  };

  const openGuide = async (issue: Issue) => {
    setSelectedIssue(issue);
    setGuide(null);
    setGuideLoading(true);
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId: issue.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setGuide({ text: data.guide, cached: data.cached });
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate guide.");
    }
    setGuideLoading(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-slate-300 font-sans overflow-hidden">
      {/* Left Nav */}
      <nav className="w-16 flex flex-col items-center py-6 border-r border-white/5 bg-[#030303] shrink-0 hidden md:flex">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-10 shadow-[0_0_15px_rgba(79,70,229,0.4)]">
          <Github className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col gap-8 opacity-40">
          <div className="w-6 h-6 border-2 border-slate-400 rounded-full"></div>
          <div className="w-6 h-6 bg-slate-400 rounded-sm"></div>
          <div className="w-6 h-6 border-2 border-slate-400 rounded-md"></div>
          <div className="w-6 h-6 bg-slate-400 rounded-full"></div>
        </div>
        <div className="mt-auto w-8 h-8 rounded-full bg-slate-800 border border-white/10"></div>
      </nav>

      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 border-b border-white/5 flex items-center px-4 md:px-8 gap-6 bg-gradient-to-r from-[#09090b] to-[#111114] shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg text-white">Open Source Matchmaker</h1>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <Database className="w-3 h-3 text-slate-400" />
              {dbStatus === "synced" ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle2 className="w-3 h-3" /> Synced</span>
              ) : (
                <span className="text-slate-500 font-bold">Empty</span>
              )}
            </div>
            <button
              onClick={syncDatabase}
              disabled={syncing}
              className="text-xs bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Run Harvester"}
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Content Area */}
          <section className={`flex-1 p-4 md:p-6 lg:p-8 border-r border-white/5 bg-[#0a0a0c] overflow-y-auto flex flex-col transition-all duration-300`}>
            <div className="flex flex-col xl:flex-row gap-6 mb-8">
               <div className="flex-1 bg-white/[0.02] p-5 md:p-6 rounded-2xl border border-white/10">
                  <h2 className="font-semibold text-white flex items-center gap-2 mb-3 text-sm">
                    <Search className="w-4 h-4 text-indigo-400" />
                    The Matchmaker
                  </h2>
                  <textarea
                    className="w-full h-24 p-4 text-sm bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500/50 text-slate-300 resize-none mb-4"
                    placeholder="E.g., I know Python and FastAPI..."
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 max-w-xs hidden sm:block">
                      Semantic matching via Gemini embeddings
                    </div>
                    <button
                      onClick={getRecommendations}
                      disabled={loading || dbStatus === "empty"}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.2)] w-full sm:w-auto"
                    >
                      {loading ? "Searching..." : <><Sparkles className="w-4 h-4" /> Find Matches</>}
                    </button>
                  </div>
               </div>
            </div>

            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Recommended Issues</h2>
                <p className="text-xs text-slate-500 mt-1">Vector-matched based on your profile</p>
              </div>
            </div>

            {issues.length === 0 ? (
               <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-slate-600 bg-white/[0.01] border border-white/5 border-dashed rounded-2xl">
                 <Github className="w-10 h-10 mb-3 opacity-20" />
                 <p className="text-sm">No issues loaded. Run the pipeline and search!</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-6">
                 {issues.map((issue) => (
                    <div key={issue.id} onClick={() => openGuide(issue)} className={`bg-white/[0.03] border ${selectedIssue?.id === issue.id ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.1)]' : 'border-white/10 hover:border-white/20'} rounded-2xl p-5 md:p-6 relative group overflow-hidden cursor-pointer transition-all flex flex-col h-full min-h-[220px]`}>
                      {issue.score !== undefined && (
                        <div className="absolute top-0 right-0 p-3 md:p-4">
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded-full font-bold border border-emerald-500/30">
                             {(issue.score * 100).toFixed(0)}% MATCH
                          </span>
                        </div>
                      )}
                      <div className="text-[10px] text-indigo-400 font-mono mb-2 uppercase tracking-tighter">
                        {issue.repo}
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-white leading-snug mb-3 pr-16 line-clamp-3">{issue.title}</h3>
                      <div className="flex gap-2 flex-wrap mb-8 mt-auto">
                        {issue.labels.slice(0, 3).map(label => (
                          <span key={label} className="text-[9px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-slate-400 uppercase">
                            {label}
                          </span>
                        ))}
                        {issue.labels.length > 3 && (
                          <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-slate-400 uppercase">
                            +{issue.labels.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-5 left-5 right-5 md:left-6 md:right-6 flex items-center justify-between">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-900 border border-slate-900 flex items-center justify-center text-[10px] text-white">U</div>
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[10px] text-white">M</div>
                        </div>
                        <button className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${selectedIssue?.id === issue.id ? 'bg-indigo-600 text-white' : 'text-white bg-white/10 hover:bg-white/20'}`}>
                          {selectedIssue?.id === issue.id ? "Analyzing..." : "Analyze Guide"}
                        </button>
                      </div>
                    </div>
                 ))}
               </div>
            )}
          </section>

          {/* Side Panel */}
          {selectedIssue && (
            <aside className="w-full md:w-[450px] lg:w-[500px] xl:w-[600px] bg-[#0d0d10] p-6 md:p-8 flex flex-col gap-6 relative shadow-[-20px_0_40px_rgba(0,0,0,0.5)] overflow-y-auto shrink-0 border-l border-white/5 z-20">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">The Mentor</h2>
                </div>
                <button onClick={() => setSelectedIssue(null)} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                   <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-white mb-2 leading-tight">{selectedIssue.title}</h1>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Generated via RAG Analysis of <span className="text-indigo-400 font-mono">{selectedIssue.repo}</span>
                  </p>
                </div>

                {guideLoading ? (
                   <div className="py-16 flex flex-col items-center justify-center space-y-4 text-slate-500">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-medium">Cloning repo & generating guide...</p>
                   </div>
                ) : guide ? (
                   <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      {guide.cached && (
                        <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <p><strong>Cache Hit:</strong> Guide served instantly from Redis cache layer, bypassing LLM generation.</p>
                        </div>
                      )}
                      <div className="prose prose-invert prose-indigo prose-sm md:prose-base max-w-none prose-headings:text-white prose-a:text-indigo-400 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-indigo-300 prose-pre:bg-[#0a0a0c] prose-pre:border prose-pre:border-white/10 prose-strong:text-white">
                        <ReactMarkdown>{guide.text}</ReactMarkdown>
                      </div>
                   </div>
                ) : (
                   <div className="text-center text-slate-500 py-10">Failed to load guide.</div>
                )}
              </div>

              <a 
                href={selectedIssue.url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-white text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors mt-auto shrink-0"
              >
                View on GitHub
                <span className="text-lg leading-none">&rarr;</span>
              </a>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
