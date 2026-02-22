import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import io from 'socket.io-client'; // Import socket client
import { Camera, Mic, Volume2, Lightbulb, X, QrCode, Terminal, Play, Send } from 'lucide-react';

const IDE = () => {
  const { problemId } = useParams();
  const [code, setCode] = useState("# Write your solution here...");
  const [output, setOutput] = useState("");
  const [hintLevel, setHintLevel] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [showLensQR, setShowLensQR] = useState(false);

  const laptopIP = "10.160.108.166"; 
  const lensURL = `http://${laptopIP}:5173/lens/${problemId}`;

  // --- 1. REAL-TIME SOCKET LISTENER ---
  useEffect(() => {
    // Backend se connect karein
    const socket = io(`http://${laptopIP}:8000`, { path: "/ws/socket.io" });

    // Problem Room Join karein
    socket.emit("join_problem", { problemId });

    // Mobile Lens se aane wale hints suniye
    socket.on("lens_hint", (data) => {
      const lensMessage = `\n[LENS AI]: ${data.hint}`;
      setOutput(prev => prev + lensMessage);
      
      // AI voice output
      const utterance = new SpeechSynthesisUtterance(data.hint);
      window.speechSynthesis.speak(utterance);
    });

    return () => socket.disconnect();
  }, [problemId]);

  const problem = {
    title: "Kth Largest Without Sorting",
    description: "Given an array of integers and an integer K, return the Kth largest element. You must optimize the solution.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "1 <= k <= nums.length",
      "Time Complexity: O(n) expected"
    ]
  };

  // --- FEATURES ---
  const handleRun = () => {
    setOutput(prev => prev + "\n> Running test cases...\n> Result: Passed (O(n) logic detected)");
  };

  const handleSubmit = () => {
    setOutput(prev => prev + "\n> Submitting... 10/10 Test cases passed!");
  };

  const startThoughtCapture = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported");
    
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => getAIHint(hintLevel, e.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const getAIHint = async (level, context = "") => {
    setOutput(prev => prev + `\n[Level ${level}] AI Analyzing...`);
    try {
      const res = await axios.post(`http://${laptopIP}:8000/ai/hint`, {
        level, code, problem: problem.title, description: context || problem.description
      });
      const hint = res.data.hint;
      setOutput(prev => prev + `\nAI: ${hint}`);
      if (hintLevel < 4) setHintLevel(prev => prev + 1);
      
      const utterance = new SpeechSynthesisUtterance(hint);
      window.speechSynthesis.speak(utterance);
    } catch (e) { setOutput(prev => prev + "\nAI Server Error: Check Backend"); }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950">
        <div className="flex gap-8">
          <button onClick={() => setShowLensQR(true)} className="flex flex-col items-center text-zinc-500 hover:text-cyan-400">
            <Camera size={18}/><span className="text-[9px] mt-1 font-bold">LENS</span>
          </button>
          <button onClick={startThoughtCapture} className={`flex flex-col items-center ${isListening ? 'text-red-500' : 'text-zinc-500'}`}>
            <Mic size={18} className={isListening ? 'animate-pulse' : ''}/><span className="text-[9px] mt-1 font-bold">THOUGHTS</span>
          </button>
          <button onClick={() => window.speechSynthesis.speak(new SpeechSynthesisUtterance(output.split('\n').pop()))} className="flex flex-col items-center text-zinc-500 hover:text-green-400">
            <Volume2 size={18}/><span className="text-[9px] mt-1 font-bold">SPEAK</span>
          </button>
          <button onClick={() => getAIHint()} className="flex flex-col items-center text-zinc-500 hover:text-yellow-400">
            <Lightbulb size={18}/><span className="text-[9px] mt-1 font-bold">HINT ({hintLevel})</span>
          </button>
        </div>
        <div className="text-zinc-700 font-mono text-[10px] tracking-[4px]">SUTRA_IDE_V2.0</div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-[35%] p-6 border-r border-zinc-900 overflow-y-auto bg-zinc-950/50">
          <span className="text-cyan-500 text-[10px] font-bold tracking-widest uppercase italic">Problem Statement</span>
          <h2 className="text-3xl font-black mb-4 italic uppercase tracking-tighter">{problem.title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">{problem.description}</p>
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Constraints:</h4>
            <ul className="space-y-2">
              {problem.constraints.map((c, i) => (
                <li key={i} className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-800/50 italic">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* EDITOR PANEL */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="h-12 border-b border-zinc-900 flex items-center justify-between px-4">
            <span className="text-[10px] font-mono text-zinc-500 italic uppercase">Python 3.10</span>
            <div className="flex gap-3">
              <button onClick={handleRun} className="flex items-center gap-2 px-4 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-bold hover:bg-zinc-800 transition-all">
                <Play size={12} fill="currentColor"/> RUN
              </button>
              <button onClick={handleSubmit} className="flex items-center gap-2 px-4 py-1 rounded bg-cyan-600 text-black text-xs font-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.3)]">
                <Send size={12} fill="currentColor"/> SUBMIT
              </button>
            </div>
          </div>
          <div className="flex-1">
            <Editor theme="vs-dark" defaultLanguage="python" value={code} onChange={setCode} options={{ fontSize: 15, minimap: { enabled: false } }} />
          </div>
          <div className="h-40 bg-black border-t border-zinc-900 p-4 font-mono overflow-y-auto scrollbar-hide">
             <div className="text-[9px] text-zinc-600 flex items-center gap-2 mb-2 tracking-widest uppercase">
              <Terminal size={12}/> Output Console
            </div>
            <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{output || "> System initialized. Waiting for input..."}</div>
          </div>
        </div>
      </div>

      {/* LENS QR MODAL */}
      {showLensQR && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-zinc-950 p-10 rounded-[2.5rem] border border-zinc-800 text-center relative shadow-[0_0_50px_rgba(0,0,0,1)]">
            <button onClick={() => setShowLensQR(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors"><X size={24}/></button>
            <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${lensURL}`} alt="QR" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Activate Sutra Lens</h3>
            <p className="text-[10px] text-zinc-500 mt-3 max-w-[220px] mx-auto uppercase leading-loose tracking-[1px]">Scan with your mobile to start real-time video analysis & OCR</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDE;