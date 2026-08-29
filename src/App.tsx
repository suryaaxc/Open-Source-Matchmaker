import { useState, useEffect } from "react";
import { Github, Search, Sparkles, AlertCircle, Database, CheckCircle2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";

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
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
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
        showToast(`Pipeline complete! Embedded ${data.count} issues.`, "success");
      } else {
        showToast(data.error, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to sync database.", "error");
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
        showToast("Vector match complete.", "success");
      } else {
        showToast(data.error, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to get recommendations.", "error");
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
        showToast(data.error, "error");
        setSelectedIssue(null);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to generate guide.", "error");
      setSelectedIssue(null);
    }
    setGuideLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-slate-300 font-sans overflow-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 text-sm font-bold flex items-center gap-3 border backdrop-blur-md ${
              toast.type === "error" 
                ? "bg-red-950/80 text-red-400 border-red-500/30" 
                : "bg-emerald-950/90 text-emerald-400 border-emerald-500/30"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Nav */}
      <motion.nav 
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-16 flex flex-col items-center py-6 border-r border-white/5 bg-[#030303] shrink-0 hidden md:flex z-30"
      >
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-10 shadow-[0_0_15px_rgba(79,70,229,0.4)] cursor-pointer"
        >
          <Github className="w-5 h-5 text-white" />
        </motion.div>
        <div className="flex flex-col gap-8 opacity-40">
          <div className="w-6 h-6 border-2 border-slate-400 rounded-full hover:border-white transition-colors cursor-pointer"></div>
          <div className="w-6 h-6 bg-slate-400 rounded-sm hover:bg-white transition-colors cursor-pointer"></div>
          <div className="w-6 h-6 border-2 border-slate-400 rounded-md hover:border-white transition-colors cursor-pointer"></div>
          <div className="w-6 h-6 bg-slate-400 rounded-full hover:bg-white transition-colors cursor-pointer"></div>
        </div>
        <div className="mt-auto w-8 h-8 rounded-full bg-slate-800 border border-white/10 hover:border-white/30 cursor-pointer transition-colors"></div>
      </motion.nav>

      <div className="flex-1 flex flex-col relative min-w-0">
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-16 border-b border-white/5 flex items-center px-4 md:px-8 gap-6 bg-gradient-to-r from-[#09090b] to-[#111114] shrink-0 z-20"
        >
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg text-white tracking-tight">Open Source Matchmaker</h1>
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={syncDatabase}
              disabled={syncing}
              className="text-xs bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded font-bold uppercase tracking-widest transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(79,70,229,0.1)] cursor-pointer"
            >
              {syncing ? "Syncing..." : "Run Harvester"}
            </motion.button>
          </div>
        </motion.header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Main Content Area */}
          <motion.section 
            layout
            className="flex-1 p-4 md:p-6 lg:p-8 border-r border-white/5 bg-[#0a0a0c] overflow-y-auto flex flex-col transition-all duration-300 z-10"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col xl:flex-row gap-6 mb-8"
            >
               <div className="flex-1 bg-white/[0.02] p-5 md:p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors"></div>
                  <h2 className="font-semibold text-white flex items-center gap-2 mb-3 text-sm tracking-wide">
                    <Search className="w-4 h-4 text-indigo-400" />
                    The Matchmaker
                  </h2>
                  <textarea
                    className="w-full h-24 p-4 text-sm bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-slate-300 resize-none mb-4 transition-all"
                    placeholder="E.g., I know Python and FastAPI..."
                    value={profile}
                    onChange={(e) => setProfile(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 max-w-xs hidden sm:block">
                      Semantic matching via <span className="text-indigo-400/80 font-mono">gemini-embedding-2-preview</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={getRecommendations}
                      disabled={loading || dbStatus === "empty"}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] w-full sm:w-auto cursor-pointer"
                    >
                      {loading ? "Searching..." : <><Sparkles className="w-4 h-4" /> Find Matches</>}
                    </motion.button>
                  </div>
               </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-end justify-between mb-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Recommended Issues</h2>
                <p className="text-xs text-slate-500 mt-1">Vector-matched based on your profile</p>
              </div>
            </motion.div>

            {issues.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-slate-600 bg-white/[0.01] border border-white/5 border-dashed rounded-2xl"
               >
                 <Github className="w-10 h-10 mb-3 opacity-20" />
                 <p className="text-sm">No issues loaded. Run the pipeline and search!</p>
               </motion.div>
            ) : (
               <motion.div 
                 variants={containerVariants}
                 initial="hidden"
                 animate="show"
                 className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-6"
               >
                 {issues.map((issue) => (
                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      key={issue.id} 
                      onClick={() => openGuide(issue)} 
                      className={`bg-white/[0.03] border ${selectedIssue?.id === issue.id ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.15)] bg-white/[0.05]' : 'border-white/10 hover:border-white/20'} rounded-2xl p-5 md:p-6 relative group overflow-hidden cursor-pointer transition-colors flex flex-col h-full min-h-[220px]`}
                    >
                      {issue.score !== undefined && (
                        <div className="absolute top-0 right-0 p-3 md:p-4">
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-1 rounded-full font-bold border border-emerald-500/20 backdrop-blur-md">
                             {(issue.score * 100).toFixed(0)}% MATCH
                          </span>
                        </div>
                      )}
                      <div className="text-[10px] text-indigo-400 font-mono mb-2 uppercase tracking-tighter">
                        {issue.repo}
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-white leading-snug mb-3 pr-16 line-clamp-3 group-hover:text-indigo-100 transition-colors">{issue.title}</h3>
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
                        <div className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${selectedIssue?.id === issue.id ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-slate-300 bg-white/10 group-hover:bg-white/20 group-hover:text-white'}`}>
                          {selectedIssue?.id === issue.id ? "Analyzing..." : "Analyze Guide"}
                        </div>
                      </div>
                    </motion.div>
                 ))}
               </motion.div>
            )}
          </motion.section>

          {/* Side Panel (The Mentor) */}
          <AnimatePresence>
            {selectedIssue && (
              <motion.aside 
                initial={{ x: "100%", opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute md:relative top-0 right-0 h-full w-full md:w-[450px] lg:w-[500px] xl:w-[600px] bg-[#0d0d10] p-6 md:p-8 flex flex-col gap-6 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] overflow-y-auto shrink-0 border-l border-white/5 z-20"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400/80">The Mentor</h2>
                  </div>
                  <button onClick={() => setSelectedIssue(null)} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer">
                     <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                  >
                    <h1 className="text-xl font-bold text-white mb-2 leading-tight">{selectedIssue.title}</h1>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Generated via RAG Analysis of <span className="text-indigo-400 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded">{selectedIssue.repo}</span>
                    </p>
                  </motion.div>

                  {guideLoading ? (
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="py-24 flex flex-col items-center justify-center space-y-6 text-indigo-400"
                     >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="w-16 h-16 rounded-full border border-indigo-500/30 flex items-center justify-center bg-indigo-500/10 shadow-[0_0_30px_rgba(79,70,229,0.2)]"
                        >
                          <Sparkles className="w-7 h-7" />
                        </motion.div>
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-sm font-bold text-slate-200 tracking-wide">Cloning repository...</p>
                          <p className="text-xs text-indigo-400/60 font-mono uppercase tracking-widest">Vectorizing context via RAG</p>
                        </div>
                     </motion.div>
                  ) : guide ? (
                     <motion.div 
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.4 }}
                       className="space-y-6"
                     >
                        {guide.cached && (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-start gap-3 text-xs text-amber-300 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 backdrop-blur-sm"
                          >
                            <div className="bg-amber-500/20 p-1.5 rounded-lg">
                              <Database className="w-4 h-4 shrink-0" />
                            </div>
                            <p className="mt-0.5"><strong className="text-amber-400">Cache Hit:</strong> Guide served instantly from Redis cache layer, bypassing LLM generation and reducing latency.</p>
                          </motion.div>
                        )}
                        <div className="prose prose-invert prose-indigo prose-sm md:prose-base max-w-none prose-headings:text-white prose-a:text-indigo-400 prose-code:bg-indigo-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-indigo-300 prose-code:font-mono prose-pre:bg-[#050505] prose-pre:border prose-pre:border-white/10 prose-strong:text-white">
                          <ReactMarkdown>{guide.text}</ReactMarkdown>
                        </div>
                     </motion.div>
                  ) : (
                     <div className="text-center text-slate-500 py-10">Failed to load guide.</div>
                  )}
                </div>

                <motion.a 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={selectedIssue.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-4 bg-white hover:bg-slate-200 text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors mt-auto shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer"
                >
                  View on GitHub
                  <span className="text-lg leading-none">&rarr;</span>
                </motion.a>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
