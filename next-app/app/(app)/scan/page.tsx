
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Camera, Upload, Sun, Sparkles, User, RefreshCw, AlertCircle, FlipHorizontal } from "lucide-react";

type ScanState = "idle" | "live" | "preview" | "analyzing" | "error";

const MESSAGES = [
  "Reading skin texture...",
  "Detecting hydration levels...",
  "Mapping pigmentation zones...",
  "Checking pore health...",
  "Building your K-beauty report..."
];

export default function ScanPage() {
  const router = useRouter();
  
  const [state, setState] = useState<ScanState>("idle");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [msgIndex, setMsgIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rotating messages during analysis
  useEffect(() => {
    if (state === "analyzing") {
      const interval = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [state]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setState("live");
    } catch (err) {
      console.error(err);
      setErrorMsg("Enable camera in browser settings to continue.");
      setState("error");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const toggleFacingMode = () => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    setTimeout(startCamera, 300);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Mirror the image horizontally if using user camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Full = canvas.toDataURL("image/jpeg", 0.85);
    const base64Data = base64Full.split(",")[1];
    
    setPhotoBase64(base64Data);
    setCapturedUrl(base64Full);
    setState("preview");
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Full = event.target?.result as string;
      const base64Data = base64Full.split(",")[1];
      setPhotoBase64(base64Data);
      setCapturedUrl(base64Full);
      setState("preview");
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    setState("analyzing");
    
    try {
      const res = await fetch("/api/analyze-skin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          photoBase64, 
          userId: "123e4567-e89b-12d3-a456-426614174000", // MOCK USER ID
          city: "Mumbai" // MOCK CITY
        })
      });
      
      const data = await res.json();
      
      if (data.reportId) {
        router.push("/report?id=" + data.reportId);
      } else {
        throw new Error(data.message || "Failed to analyze skin");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Analysis failed. " + err.message);
      setState("error");
    }
  };

  const retry = () => {
    setState("idle");
    setCapturedUrl(null);
    setPhotoBase64(null);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-[#0D0608] text-[#F5EAE0] font-sans relative overflow-hidden flex flex-col items-center justify-center p-4">
      
      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      <AnimatePresence mode="wait">
        
        {/* IDLE STATE */}
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center w-full max-w-sm text-center"
          >
            <h1 className="text-3xl mb-8" style={{ fontFamily: "Cormorant Garamond, serif" }}>AI Skin Scan</h1>
            
            <div className="relative w-[220px] h-[220px] mb-8 rounded-full flex items-center justify-center border border-[#3A2028] bg-[#1F1015]">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-[#C49A6C] opacity-50"
              />
              <div className="flex flex-col items-center z-10">
                <Camera className="w-10 h-10 text-[#C49A6C] mb-2 opacity-80" />
                <span className="text-sm text-[#9A7A70]">Position your face here</span>
              </div>
            </div>

            <div className="flex justify-center gap-2 mb-10 w-full">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1F1015] border border-[#3A2028] text-xs text-[#9A7A70]">
                <Sun className="w-3 h-3 text-[#C49A6C]" /> Natural light
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1F1015] border border-[#3A2028] text-xs text-[#9A7A70]">
                <Sparkles className="w-3 h-3 text-[#C49A6C]" /> No filter
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1F1015] border border-[#3A2028] text-xs text-[#9A7A70]">
                <User className="w-3 h-3 text-[#C49A6C]" /> Face forward
              </div>
            </div>

            <div className="w-full space-y-4">
              <button 
                onClick={startCamera}
                className="w-full bg-[#D4856A] text-white font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
              >
                Open Camera
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-transparent border border-[#C49A6C] text-[#C49A6C] font-bold py-4 rounded-xl text-lg hover:bg-[#C49A6C]/10 transition-colors"
              >
                Upload photo instead
              </button>
            </div>
            
            <p className="mt-6 text-[10px] text-[#9A7A70] flex items-center justify-center gap-1">
              <span>??</span> Your photo is never stored
            </p>
          </motion.div>
        )}

        {/* LIVE WEBCAM STATE */}
        {state === "live" && (
          <motion.div
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full max-w-sm"
          >
            <div className="relative w-[280px] h-[380px] rounded-[100px] overflow-hidden mb-8 border border-[#3A2028] bg-[#1F1015] shadow-[0_0_40px_rgba(196,154,108,0.15)] flex justify-center items-center">
              
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />

              {/* Face Target Ellipse */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 280 380">
                <ellipse cx="140" cy="190" rx="90" ry="120" fill="none" stroke="#C49A6C" strokeWidth="2" strokeDasharray="8 8" opacity="0.6"/>
              </svg>

              {/* Scanning laser animation overlay */}
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C49A6C] to-transparent opacity-60 z-20 shadow-[0_0_10px_#C49A6C]"
              />
            </div>

            <div className="flex items-center justify-between w-full px-4 mb-4">
              <button onClick={toggleFacingMode} className="p-3 bg-[#1F1015] rounded-full border border-[#3A2028] text-[#C49A6C]">
                <FlipHorizontal className="w-5 h-5" />
              </button>
              
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-[#C49A6C] p-1 flex items-center justify-center hover:scale-95 transition-transform"
              >
                <div className="w-full h-full bg-white rounded-full"></div>
              </button>
              
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-[#1F1015] rounded-full border border-[#3A2028] text-[#C49A6C]">
                <Upload className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-[#9A7A70] text-sm">Tap to capture</p>
          </motion.div>
        )}

        {/* PREVIEW STATE */}
        {state === "preview" && capturedUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center w-full max-w-sm"
          >
            <h2 className="text-2xl mb-6" style={{ fontFamily: "Cormorant Garamond, serif" }}>Review Scan</h2>
            
            <div className="relative w-[280px] h-[380px] rounded-[100px] overflow-hidden mb-8 border border-[#3A2028] bg-[#1F1015]">
              <img src={capturedUrl} alt="Captured scan" className="absolute inset-0 w-full h-full object-cover" />
            </div>

            <p className="text-sm text-[#9A7A70] mb-6 text-center">Make sure your face is clear and well-lit.</p>

            <div className="flex gap-4 w-full">
              <button 
                onClick={() => { setState("idle"); setCapturedUrl(null); }}
                className="flex-1 bg-transparent border border-[#C49A6C] text-[#C49A6C] font-bold py-4 rounded-xl text-lg hover:bg-[#C49A6C]/10 transition-colors"
              >
                Retake
              </button>
              <button 
                onClick={handleAnalyze}
                className="flex-[2] bg-[#D4856A] text-white font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
              >
                Analyze ?
              </button>
            </div>
          </motion.div>
        )}

        {/* ERROR STATE */}
        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center w-full max-w-sm text-center"
          >
            <AlertCircle className="w-16 h-16 text-[#D4856A] mb-6" />
            <h2 className="text-2xl mb-4 font-bold">Something went wrong</h2>
            <p className="text-[#9A7A70] mb-8">{errorMsg}</p>
            <button 
              onClick={retry}
              className="w-full bg-[#D4856A] text-white font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN ANALYZING OVERLAY */}
      <AnimatePresence>
        {state === "analyzing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0D0608] z-50 flex flex-col items-center justify-center p-6"
          >
            {capturedUrl && (
              <motion.div 
                initial={{ scale: 1, borderRadius: "100px", width: "280px", height: "380px" }}
                animate={{ scale: 0.5, borderRadius: "20px", width: "160px", height: "160px" }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="relative overflow-hidden mb-12 border-2 border-[#C49A6C] shadow-[0_0_50px_rgba(196,154,108,0.3)]"
              >
                <img src={capturedUrl} alt="Analyzing scan" className="w-full h-full object-cover" />
                <motion.div 
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-[#D4856A] opacity-80 z-20 shadow-[0_0_15px_#D4856A]"
                />
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-xl text-[#F5EAE0] font-bold text-center mb-8"
              >
                {MESSAGES[msgIndex]}
              </motion.p>
            </AnimatePresence>

            <div className="w-full max-w-xs h-2 bg-[#1F1015] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 10, ease: "linear" }}
                className="h-full bg-gradient-to-r from-[#D4856A] to-[#C49A6C]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

