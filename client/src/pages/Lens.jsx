import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

// UPDATE: Aapka current laptop IP aur backend path
const socket = io("http://10.160.108.166:8000", {
  path: "/ws/socket.io",
  transports: ["websocket"] // Connection stability ke liye
});

const Lens = () => {
  const { problemId } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Tap to Start Camera");
  const [isStreaming, setIsStreaming] = useState(false);

  const startCamera = async () => {
    try {
      setStatus("Requesting Camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Back camera use karne ke liye
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Mobile browsers par manually play() call karna padta hai
        await videoRef.current.play();
        setStatus("Live: Streaming to Sutra AI");
        setIsStreaming(true);
        
        // Socket room join karein
        socket.emit("join_problem", { problemId });
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setStatus("Camera Error: " + err.message);
    }
  };

  useEffect(() => {
    let interval;
    if (isStreaming) {
      interval = setInterval(() => {
        captureAndSendFrame();
      }, 3000); // 3 seconds interval
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, problemId]);

  const captureAndSendFrame = () => {
    if (!videoRef.current || !isStreaming) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);
    
    // Image quality 0.4 rakhi hai taaki upload fast ho
    const frameData = canvas.toDataURL("image/jpeg", 0.4);
    socket.emit("lens_frame", { frame: frameData, problemId });
    console.log("Frame sent for:", problemId);
  };

  return (
    <div 
      className="h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden"
      onClick={!isStreaming ? startCamera : null} // Screen tap karne par camera start hoga
    >
      {/* Phone Case Style UI */}
      <div className="relative w-full aspect-[3/4] max-w-sm rounded-[3rem] border-[6px] border-zinc-800 overflow-hidden shadow-2xl shadow-cyan-500/20 bg-zinc-900">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* Status Overlay */}
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="text-[10px] font-bold tracking-widest uppercase">{status}</span>
        </div>

        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-cyan-400 font-bold animate-bounce">TAP TO START</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="mt-10 text-center">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
          Sutra Lens
        </h2>
        <div className="mt-2 space-y-1">
          <p className="text-cyan-500 text-[10px] font-bold uppercase tracking-[2px]">
            Problem ID: {problemId || "Not Selected"}
          </p>
          <p className="text-zinc-500 text-[9px] uppercase tracking-[1px] leading-relaxed">
            Keep your phone steady over your code or screen<br/>
            Frames are analyzed in real-time by AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default Lens;