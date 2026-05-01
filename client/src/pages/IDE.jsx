import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import {
  Camera, Mic, Lightbulb, X, Terminal, Play, Send,
  CheckCircle, Loader, Bot, ShieldCheck, RotateCcw,
  Clock, BookOpen, ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react';
import PlagReport from './PlagReport';

const JUDGE0_URL  = "https://ce.judge0.com";
const LANGUAGE_ID = { Python: 71, C: 50, python: 71, c: 50 };

const NODE_URL    = import.meta.env.VITE_NODE_URL;
const AI_URL      = import.meta.env.VITE_AI_URL;
const lensBaseURL = import.meta.env.VITE_LENS_URL;

const IDE = () => {
  const { problemId } = useParams();
  const { user }      = useAuth();

  const [problem,     setProblem]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [code,        setCode]        = useState("");
  const [output,      setOutput]      = useState("");
  const [hintLevel,   setHintLevel]   = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [showLensQR,  setShowLensQR]  = useState(false);
  const [submitState, setSubmitState] = useState('idle');

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse,  setAiResponse]  = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);

  const [showPlagModal, setShowPlagModal] = useState(false);
  const [plagReport,    setPlagReport]    = useState(null);
  const [plagLoading,   setPlagLoading]   = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasSolved, setHasSolved] = useState(false);
  
  // NEW: Live Rating State for IDE Header
  const [currentRating, setCurrentRating] = useState("...");

  // Paste & Time Tracking for Anti-Cheat
  const [pastedChars, setPastedChars] = useState(0);
  const startTimeRef = useRef(Date.now());
  
  const hintsUsedRef = useRef(0);
  const lensUsedRef  = useRef(false);
  const voiceUsedRef = useRef(false);
  const hintStatsRef = useRef({ level1: 0, level2: 0, level3: 0, level4: 0, custom_topics: [] });

  const lensURL = `${lensBaseURL}/lens/${problemId}`;

  // Fetch Live Rating on Mount
  useEffect(() => {
    if (user) {
      axios.get(`${NODE_URL}/api/dashboard/${user.uid}`)
        .then(res => {
          if (res.data?.rating?.rating !== undefined) {
            setCurrentRating(res.data.rating.rating);
          } else {
            setCurrentRating(0);
          }
        })
        .catch(() => setCurrentRating("—"));
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        const res = await axios.get(`${NODE_URL}/api/problems`);
        const foundProblem = res.data.find(p => p.problemId === problemId);
        if (foundProblem) {
          setProblem(foundProblem);
          setCode(foundProblem.starterCode || "// Write your code here...");
        } else {
          setOutput("Error: Problem not found in database.");
        }
      } catch (err) {
        setOutput("Error connecting to server to fetch problem data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProblemData();
  }, [problemId]);

  useEffect(() => {
    const socket = io(AI_URL, { path: "/ws/socket.io" });
    socket.emit("join_problem", { problemId });
    socket.on("lens_hint", (data) => {
      lensUsedRef.current = true; // Sets Lens bonus flag
      setAiResponse(data.hint);
      setShowAIModal(true);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.hint));
      if (user) {
        axios.patch(`${NODE_URL}/api/progress/hint`, { userId: user.uid, problemId, lensUsed: true }).catch(() => {});
      }
    });
    return () => socket.disconnect();
  }, [problemId, user]);

  const handleEditorChange = (value, event) => {
    setCode(value);
    if (event.changes && event.changes.length > 0) {
      const textAdded = event.changes[0].text;
      if (textAdded.length > 30) {
        setPastedChars(prev => prev + textAdded.length);
      }
    }
  };

  const saveProgress = async (status, passedCases = 0, totalCases = 1, isPlagiarized = false) => {
    if (!user || !problem) return;
    const solveTimeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      await axios.post(`${NODE_URL}/api/progress`, {
        userId: user.uid, displayName: user.displayName || user.email,
        problemId, problemTitle: problem.title, topic: problem.topic,
        category: problem.category, difficulty: problem.difficulty, status,
        solveTimeSeconds: status === 'solved' ? solveTimeSeconds : 0,
        hintsUsed: hintsUsedRef.current,
        lensUsed:  lensUsedRef.current, // Crucial for +5 bonus
        voiceUsed: voiceUsedRef.current, // Crucial for penalty
        hintAnalytics: hintStatsRef.current,
        code, language: problem.language,
        testCasesPassed: passedCases,
        totalTestCases: totalCases,
        isPlagiarized: isPlagiarized
      });
      await axios.post(`${NODE_URL}/api/submissions`, {
        userId: user.uid, problemId, code, language: problem.language || "python", status,
      });
    } catch (err) {
      console.error("Failed to save data:", err);
    }
  };

  const handlePlagiarismCheck = async () => {
    if (!code.trim() || !user || !problem) return;
    setPlagLoading(true);
    setPlagReport(null);
    const timeTakenSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await axios.post(`${AI_URL}/api/plagiarism`, {
        code, problem_id: problemId, problem_title: problem.title, user_id: user.uid,
        time_taken: timeTakenSeconds, pasted_chars: pastedChars
      });
      setPlagReport(res.data);
      setShowPlagModal(true);
    } catch (err) {
      setPlagReport({ status: "error", verdict: "error", overall_score: 0, message: "Could not reach the plagiarism service.", total_submissions_checked: 0, matches_found: 0 });
      setShowPlagModal(true);
    } finally {
      setPlagLoading(false);
    }
  };

  const handleRun = async () => {
    if (!problem) return;
    setOutput("> Running your code...");
    setSubmitState('submitting');
    const langId = LANGUAGE_ID[problem.language] || 71;
    try {
      const submitRes = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, { source_code: code, language_id: langId, stdin: problem.testCases?.[0]?.input || "" }, { headers: { "Content-Type": "application/json" } });
      const result = submitRes.data;
      if (result.stdout) setOutput(prev => prev + `\n> Output:\n${result.stdout}`);
      if (result.stderr) setOutput(prev => prev + `\n> Error:\n${result.stderr}`);
      if (result.compile_output) setOutput(prev => prev + `\n> Compile Error:\n${result.compile_output}`);
      if (!result.stdout && !result.stderr && !result.compile_output) setOutput(prev => prev + `\n> No output produced.`);
      saveProgress('attempted', 0, 1, false);
    } catch {
      setOutput(prev => prev + `\n> Execution failed. Check your code or try again.`);
    } finally {
      setSubmitState('idle');
    }
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setSubmitState('submitting');
    setOutput("> Submitting — running all test cases...");
    const langId = LANGUAGE_ID[problem.language] || 71;
    const testCases = problem.testCases || [];
    
    if (testCases.length === 0) {
      setOutput(prev => prev + "\n> No test cases found for this problem.");
      setSubmitState('idle');
      return;
    }

    try {
      let passed = 0, failed = 0, results = [];
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const res = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, { source_code: code, language_id: langId, stdin: tc.input || "", expected_output: tc.output || "" }, { headers: { "Content-Type": "application/json" } });
        const r = res.data;
        const actual = (r.stdout || "").trim();
        const expected = (tc.output || "").trim();
        const ok = actual === expected && !r.stderr && !r.compile_output;
        if (ok) { passed++; results.push(`  ✅ Test ${i + 1}: Passed`); } 
        else {
          failed++;
          if (r.compile_output) results.push(`  ❌ Test ${i + 1}: Compile Error — ${r.compile_output.split('\n')[0]}`);
          else if (r.stderr) results.push(`  ❌ Test ${i + 1}: Runtime Error — ${r.stderr.split('\n')[0]}`);
          else { results.push(`  ❌ Test ${i + 1}: Wrong Answer`); results.push(`     Expected: ${expected}`); results.push(`     Got:      ${actual}`); }
        }
      }
      
      const summary = `\n> Results: ${passed}/${testCases.length} test cases passed\n` + results.join('\n');
      setOutput(prev => prev + summary);

      // 🔴 REAL-TIME PLAGIARISM & ANOMALY CHECK 🔴
      let isCopied = false;
      const timeTakenSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      try {
        const plagRes = await axios.post(`${AI_URL}/api/plagiarism`, { 
          code, problem_id: problemId, problem_title: problem.title, user_id: user.uid,
          time_taken: timeTakenSeconds, pasted_chars: pastedChars
        });
        
        const geminiAnalysis = plagRes.data?.gemini_analysis || {};
        if (plagRes.data && (plagRes.data.overall_score >= 80 || geminiAnalysis.penaltyMultiplier < 1.0)) { 
          isCopied = true;
          const reason = geminiAnalysis.verdict || `AST Match: ${plagRes.data.overall_score}%`;
          
          setOutput(prev => prev + `\n\n🚨 ANTI-CHEAT TRIGGERED: [${reason}]`);
          setOutput(prev => prev + `\n> Penalty: -50 Points (Compounding) applied to your Sutra Rating.`);
          
          // Instantly deduct rating in the UI
          setCurrentRating(prev => (typeof prev === 'number' ? prev - 50 : prev));

          if(user) await axios.patch(`${NODE_URL}/api/progress/penalty`, { userId: user.uid, k_value: 50 });
        }
      } catch (err) {
         console.error("Silent plag check failed", err);
      }

      if (passed === testCases.length) {
        setSubmitState('passed');
        if (!isCopied) setOutput(prev => prev + `\n\n🎉 All test cases passed! Problem solved.`);
        await saveProgress('solved', passed, testCases.length, isCopied);
        setHasSolved(true);
        if (problem.explanation) setShowExplanation(true);
      } else {
        setSubmitState('failed');
        if (!isCopied) setOutput(prev => prev + `\n\nKeep trying — ${failed} test case(s) failed.`);
        await saveProgress('attempted', passed, testCases.length, isCopied);
      }
    } catch {
      setOutput(prev => prev + `\n> Submission failed.`);
      setSubmitState('failed');
    }
    setTimeout(() => setSubmitState('idle'), 4000);
  };

  const startThoughtCapture = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Oops! Your browser doesn't support Web Speech API."); return; }
    voiceUsedRef.current = true; // Sets voice penalty flag
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); setShowAIModal(true); setAiLoading(true); setAiResponse("🎤 Listening..."); };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setAiResponse(`🎤 You asked: "${transcript}"\n\n⏳ Sutra AI is thinking...`);
      getAIHint(hintLevel, transcript);
    };
    recognition.onerror = () => { setAiResponse("❌ Microphone Error."); setAiLoading(false); setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const getAIHint = async (level, voiceQuery = "") => {
    if (!problem) return;
    hintsUsedRef.current += 1;
    setShowAIModal(true);
    setAiLoading(true);
    if (!voiceQuery) setAiResponse(`⏳ Fetching Level ${level} Hint...`);
    try {
      const res = await axios.post(`${AI_URL}/ai/hint`, { level, code, problem: problem.title, description: problem.description, voice_query: voiceQuery });
      const rawHint = res.data.hint;
      if (voiceQuery) {
        try {
          const aiData = JSON.parse(rawHint);
          setAiResponse(`💡 Quick Note:\n${aiData.display}\n\n🗣️ Explanation:\n${aiData.spoken}`);
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(aiData.spoken));
        } catch { setAiResponse(rawHint); }
      } else {
        hintStatsRef.current[`level${level}`] += 1;
        setAiResponse(rawHint);
        if (hintLevel < 4) setHintLevel(prev => prev + 1);
      }
      if (user) { axios.patch(`${NODE_URL}/api/progress/hint`, { userId: user.uid, problemId, voiceUsed: voiceUsedRef.current }).catch(() => {}); }
    } catch {
      setAiResponse("❌ Error: Could not connect to AI Server.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleResetCode = () => {
    setCode(problem?.starterCode || "");
    setShowResetConfirm(false);
    setOutput("");
    setPastedChars(0); 
  };

  const submitBtnStyle = {
    idle: 'bg-cyan-600 text-black hover:bg-cyan-400',
    submitting: 'bg-zinc-700 text-zinc-400 cursor-wait',
    passed: 'bg-green-600 text-white',
    failed: 'bg-red-700 text-white',
  };

  if (loading) return <div className="h-screen bg-black text-cyan-500 flex flex-col items-center justify-center"><Loader className="animate-spin mb-4" size={32}/></div>;
  if (!problem) return <div className="h-screen bg-black text-red-500 flex flex-col items-center justify-center"><X size={48}/></div>;

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden relative">
      <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950">
        <div className="flex gap-8">
          <button onClick={() => setShowLensQR(true)} className="flex flex-col items-center text-zinc-500 hover:text-cyan-400 transition-colors">
            <Camera size={18}/><span className="text-[9px] mt-1 font-bold">LENS (+BONUS)</span>
          </button>
          <button onClick={startThoughtCapture} className={`flex flex-col items-center transition-colors ${isListening ? 'text-red-500' : 'text-zinc-500 hover:text-purple-400'}`}>
            <Mic size={18} className={isListening ? 'animate-pulse' : ''}/>
            <span className="text-[9px] mt-1 font-bold">{isListening ? 'LISTENING...' : 'VOICE (PENALTY)'}</span>
          </button>
          <button onClick={() => getAIHint(hintLevel, "")} className="flex flex-col items-center text-zinc-500 hover:text-yellow-400 transition-colors">
            <Lightbulb size={18}/><span className="text-[9px] mt-1 font-bold">TEXT HINT ({hintLevel})</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            <TrendingUp size={11} className="text-cyan-500"/> RATING: <span className="text-cyan-400 ml-1">{currentRating}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
            <Clock size={11} className="text-cyan-500"/><span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[35%] p-6 border-r border-zinc-900 overflow-y-auto bg-zinc-950/50">
          <h2 className="text-3xl font-black mb-4 italic uppercase tracking-tighter">{problem.title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8 whitespace-pre-line">{problem.description}</p>
        </div>

        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="h-12 border-b border-zinc-900 flex items-center justify-between px-4">
            <span className="text-[10px] font-mono text-zinc-500 italic uppercase">Python 3.10</span>
            <div className="flex gap-3 items-center">
              <button onClick={handlePlagiarismCheck} disabled={plagLoading} className={`flex items-center gap-2 px-4 py-1 rounded bg-zinc-900 text-xs font-bold hover:bg-zinc-800 transition-all ${plagLoading ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {plagLoading ? 'CHECKING...' : 'CHECK PLAGIARISM'}
              </button>
              <button onClick={handleRun} className="flex items-center gap-2 px-4 py-1 rounded bg-zinc-900 text-xs font-bold hover:bg-zinc-800 transition-all"><Play size={12} fill="currentColor"/> RUN</button>
              <button onClick={handleSubmit} disabled={submitState === 'submitting'} className={`flex items-center gap-2 px-4 py-1 rounded text-xs font-black transition-all ${submitBtnStyle[submitState]}`}>
                <Send size={12} fill="currentColor"/> SUBMIT
              </button>
            </div>
          </div>
          <div className="flex-1">
            <Editor theme="vs-dark" language="python" value={code} onChange={handleEditorChange} options={{ fontSize: 15, minimap: { enabled: false } }}/>
          </div>
          <div className="h-40 bg-black border-t border-zinc-900 p-4 font-mono overflow-y-auto">
            <div className="text-[9px] text-zinc-600 tracking-widest uppercase mb-2">Output Console</div>
            <div className="text-sm text-zinc-300 whitespace-pre-wrap">{output || "> Waiting for input..."}</div>
          </div>
        </div>
      </div>

      {showAIModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-950 w-full max-w-3xl rounded-3xl border border-zinc-800 p-8 text-zinc-300 font-mono">
             {aiLoading ? <Loader className="animate-spin" /> : aiResponse}
             <button onClick={() => setShowAIModal(false)} className="mt-4 text-red-500 font-bold uppercase tracking-widest text-xs">Close</button>
          </div>
        </div>
      )}
      {showPlagModal && <PlagReport report={plagReport} onClose={() => setShowPlagModal(false)}/>}
    </div>
  );
};

export default IDE;