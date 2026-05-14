
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Camera, Upload, Sun, Sparkles, User, RefreshCw, AlertCircle, FlipHorizontal } from "lucide-react";
import { useAppContext } from "@/components/app/app-context";
import { useSupabaseClient } from "@/components/supabase-provider";
import { getApiUrl } from "@/lib/api";

type ScanState = "idle" | "live" | "preview" | "analyzing" | "error";

type QuizAnswers = {
  skinFeel: string;
  breakoutFrequency: string;
  poreVisibility: string;
  sensitivity: string;
  pigmentationScore: number;
  dullnessScore: number;
};

type QuizQuestion = {
  id: keyof QuizAnswers;
  title: string;
  type: "select" | "slider";
  options?: string[];
  label?: string;
};

type AnalyzePayload = {
  userId: string;
  city: string;
  photoBase64?: string | null;
  quizAnswers?: QuizAnswers;
};

type AnalyzeResponse = {
  reportId?: string;
  message?: string;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "skinFeel",
    title: "How does your skin feel 2 hours after washing?",
    type: "select",
    options: ["Tight & dry", "Comfortable", "Slightly oily", "Very oily & shiny"]
  },
  {
    id: "breakoutFrequency",
    title: "How often do you get breakouts?",
    type: "select",
    options: ["Rarely", "Once a month", "Weekly", "Almost always"]
  },
  {
    id: "poreVisibility",
    title: "How visible are your pores?",
    type: "select",
    options: ["Not noticeable", "Slightly visible", "Large & visible"]
  },
  {
    id: "sensitivity",
    title: "Does your skin react to new products?",
    type: "select",
    options: ["Never reacts", "Sometimes", "Always reacts"]
  },
  {
    id: "pigmentationScore",
    title: "Rate your pigmentation / dark spots concern",
    type: "slider",
    label: "1 = none, 5 = very concerned"
  },
  {
    id: "dullnessScore",
    title: "Rate your skin dullness concern",
    type: "slider",
    label: "1 = none, 5 = very concerned"
  }
];

export default function ScanPage() {
  const router = useRouter();
  const { userId } = useAppContext();
  const supabase = useSupabaseClient();
  const [profileCity, setProfileCity] = useState("Mumbai");
  
  const [state, setState] = useState<ScanState>("idle");
  const [activeTab, setActiveTab] = useState<"camera" | "quiz">("camera");
  const [currentQ, setCurrentQ] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({
    skinFeel: "",
    breakoutFrequency: "",
    poreVisibility: "",
    sensitivity: "",
    pigmentationScore: 3,
    dullnessScore: 3
  });
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraError, setCameraError] = useState<"denied" | "notfound" | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [showLongMessage, setShowLongMessage] = useState(false);
  const [retakeCount, setRetakeCount] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [msgIndex, setMsgIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analysisTimedOutRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    if (!userId) return;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("city")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;
        if (isActive && data?.city) {
          setProfileCity(data.city);
        }
      } catch {
        setProfileCity("Mumbai");
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [supabase, userId]);

  const messages = [
    "Reading skin texture...",
    "Detecting hydration levels...",
    "Mapping pigmentation zones...",
    "Checking pore health...",
    "Analyzing for Indian skin type...",
    "Applying climate data for " + profileCity + "...",
    "Building your K-beauty routine..."
  ];
  const messageCount = messages.length;

  // Rotating messages during analysis
  useEffect(() => {
    if (state === "analyzing") {
      setMsgIndex(0);
      const interval = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % messageCount);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [state, messageCount]);

  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      if (longTimerRef.current) clearTimeout(longTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setState("live");
    } catch (err: unknown) {
      console.error(err);
      const errorName = err instanceof DOMException ? err.name : err instanceof Error ? err.name : "";
      if (errorName === "NotAllowedError") {
        setCameraError("denied");
        setState("live");
        return;
      }
      if (errorName === "NotFoundError") {
        setCameraError("notfound");
        setState("live");
        return;
      }
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

  const switchToQuiz = () => {
    stopCamera();
    setCameraError(null);
    setActiveTab("quiz");
    setState("idle");
    setCapturedUrl(null);
    setPhotoBase64(null);
    setCurrentQ(0);
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
    if (file.size > MAX_FILE_BYTES) {
      showToast("Photo too large. Please use one under 5MB.");
      e.target.value = "";
      return;
    }

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
    if (!userId) {
      setErrorMsg("Please sign in to continue.");
      setState("error");
      return;
    }
    setState("analyzing");
    analysisTimedOutRef.current = false;
    setShowSlowMessage(false);
    setShowLongMessage(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    if (longTimerRef.current) clearTimeout(longTimerRef.current);

    slowTimerRef.current = setTimeout(() => {
      setShowSlowMessage(true);
    }, 15000);

    longTimerRef.current = setTimeout(() => {
      analysisTimedOutRef.current = true;
      setShowLongMessage(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    }, 30000);
    
    try {
      const payload: AnalyzePayload = {
        userId,
        city: profileCity
      };

      if (activeTab === "camera") {
        payload.photoBase64 = photoBase64;
      } else {
        payload.quizAnswers = quizAnswers;
      }

      const res = await fetch(getApiUrl("/api/analyze-skin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data: AnalyzeResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to analyze skin");
      }

      if (data.reportId && !analysisTimedOutRef.current) {
        router.push("/report?id=" + data.reportId);
        return;
      }

      throw new Error("Missing report id from analysis.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      setErrorMsg("Analysis failed. " + message);
      setState("error");
    } finally {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      if (longTimerRef.current) clearTimeout(longTimerRef.current);
    }
  };

  const retry = () => {
    setState("idle");
    setCapturedUrl(null);
    setPhotoBase64(null);
    setErrorMsg("");
    setCameraError(null);
  };

  return (
    <div className="min-h-screen bg-[#0D0608] text-[#F5EAE0] font-sans relative overflow-hidden flex flex-col items-center justify-center p-4">
      
      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        accept="image/*" 
        data-max-size={MAX_FILE_BYTES}
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
            <h1 className="text-3xl mb-6 font-heading">AI Skin Scan</h1>
            
            {/* TABS */}
            <div className="flex bg-[#1F1015] rounded-full p-1 mb-8 w-full border border-[#3A2028]">
              <button 
                onClick={() => setActiveTab("camera")}
                className={`flex-1 py-3 text-sm font-bold rounded-full transition-colors ${activeTab === "camera" ? "bg-[#3A2028] text-white" : "text-[#9A7A70]"}`}
              >
                Webcam Scan
              </button>
              <button 
                onClick={() => setActiveTab("quiz")}
                className={`flex-1 py-3 text-sm font-bold rounded-full transition-colors ${activeTab === "quiz" ? "bg-[#3A2028] text-white" : "text-[#9A7A70]"}`}
              >
                Skin Quiz
              </button>
            </div>

            {activeTab === "camera" && (
              <motion.div key="camera-tab" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center w-full">
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
              <span>Note:</span> Your photo is never stored
            </p>
            {retakeCount > 3 && (
              <button
                onClick={switchToQuiz}
                className="mt-4 text-xs text-[#C49A6C] underline underline-offset-4"
              >
                Having trouble? The quiz gives equally accurate results →
              </button>
            )}
            </motion.div>
            )}

            {activeTab === "quiz" && (
              <motion.div key="quiz-tab" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center w-full">
                <div className="w-full flex items-center mb-6">
                  <div className="h-1 w-full bg-[#1F1015] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#C49A6C]" 
                      initial={{ width: `${(currentQ / QUIZ_QUESTIONS.length) * 100}%` }}
                      animate={{ width: `${((currentQ + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#9A7A70] ml-3 whitespace-nowrap">{currentQ + 1} / {QUIZ_QUESTIONS.length}</span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentQ}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full text-left"
                  >
                    <h2 className="text-2xl mb-8 font-heading">
                      {QUIZ_QUESTIONS[currentQ].title}
                    </h2>
                    
                    {QUIZ_QUESTIONS[currentQ].type === "select" && (
                      <div className="flex flex-col gap-3">
                        {QUIZ_QUESTIONS[currentQ].options?.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [QUIZ_QUESTIONS[currentQ].id]: opt }))}
                            className={`p-4 rounded-xl border text-left transition-all ${quizAnswers[QUIZ_QUESTIONS[currentQ].id] === opt ? "border-[#D4856A] bg-[#D4856A]/10 text-[#F5EAE0]" : "border-[#3A2028] bg-[#1F1015] text-[#9A7A70]"}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {QUIZ_QUESTIONS[currentQ].type === "slider" && (
                      <div className="flex flex-col items-center gap-6 mt-4">
                        <div className="text-6xl text-[#D4AF37] font-heading">
                          {quizAnswers[QUIZ_QUESTIONS[currentQ].id]}
                        </div>
                        <input 
                          type="range" 
                          min="1" max="5" step="1"
                          value={quizAnswers[QUIZ_QUESTIONS[currentQ].id] as number}
                          onChange={(e) => setQuizAnswers(prev => ({ ...prev, [QUIZ_QUESTIONS[currentQ].id]: parseInt(e.target.value) }))}
                          className="w-full accent-[#D4856A]"
                        />
                        <span className="text-sm text-[#9A7A70]">{QUIZ_QUESTIONS[currentQ].label}</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex gap-4 w-full mt-10">
                  {currentQ > 0 && (
                    <button 
                      onClick={() => setCurrentQ(prev => prev - 1)}
                      className="flex-1 bg-transparent border border-[#C49A6C] text-[#C49A6C] font-bold py-4 rounded-xl text-lg hover:bg-[#C49A6C]/10 transition-colors"
                    >
                      Back
                    </button>
                  )}
                  {currentQ < QUIZ_QUESTIONS.length - 1 ? (
                    <button 
                      onClick={() => setCurrentQ(prev => prev + 1)}
                      disabled={QUIZ_QUESTIONS[currentQ].type === "select" && !quizAnswers[QUIZ_QUESTIONS[currentQ].id]}
                      className="flex-[2] bg-[#D4856A] text-white font-bold py-4 rounded-xl text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      Continue →
                    </button>
                  ) : (
                    <button 
                      onClick={handleAnalyze}
                      disabled={QUIZ_QUESTIONS[currentQ].type === "select" && !quizAnswers[QUIZ_QUESTIONS[currentQ].id]}
                      className="flex-[2] bg-[#D4856A] text-white font-bold py-4 rounded-xl text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity whitespace-nowrap"
                    >
                      Analyze My Skin
                    </button>
                  )}
                </div>
              </motion.div>
            )}          </motion.div>
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
              {!cameraError && (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`absolute inset-0 w-full h-full object-cover ${
                      facingMode === "user" ? "-scale-x-100" : ""
                    }`}
                  />

                  {/* Face Target Ellipse */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 280 380">
                    <ellipse cx="140" cy="190" rx="90" ry="120" fill="none" stroke="var(--gold)" strokeWidth="2" strokeDasharray="8 8" opacity="0.6"/>
                  </svg>

                  {/* Scanning laser animation overlay */}
                  <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C49A6C] to-transparent opacity-60 z-20 shadow-[0_0_10px_#C49A6C]"
                  />
                </>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0D0608]/70">
                  <div className="w-44 h-44 rounded-full border border-[#3A2028] bg-[#1F1015] flex flex-col items-center justify-center text-center px-4">
                    <AlertCircle className="w-10 h-10 text-[#E06666]" />
                    <span className="text-sm text-[#F5EAE0] mt-2">
                      {cameraError === "denied" ? "Camera access denied" : "No camera detected on this device"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!cameraError && (
              <>
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
              </>
            )}
            {cameraError === "denied" && (
              <div className="w-full text-center">
                <p className="text-[#9A7A70] text-sm mb-4">Open your browser settings and allow camera for this site</p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={startCamera}
                    className="flex-1 bg-transparent border border-[#C49A6C] text-[#C49A6C] font-bold py-3 rounded-xl text-sm hover:bg-[#C49A6C]/10 transition-colors"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={switchToQuiz}
                    className="flex-1 bg-[#D4856A] text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
                  >
                    Use Quiz Instead
                  </button>
                </div>
              </div>
            )}
            {cameraError === "notfound" && (
              <div className="w-full text-center">
                <p className="text-[#9A7A70] text-sm mb-4">No camera detected on this device</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-transparent border border-[#C49A6C] text-[#C49A6C] font-bold py-3 rounded-xl text-sm hover:bg-[#C49A6C]/10 transition-colors"
                >
                  Upload a photo instead
                </button>
              </div>
            )}
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
            <h2 className="text-2xl mb-6 font-heading">Review Scan</h2>
            
            <div className="relative w-[280px] h-[380px] rounded-[100px] overflow-hidden mb-8 border border-[#3A2028] bg-[#1F1015]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedUrl} alt="Captured scan" className="absolute inset-0 w-full h-full object-cover" />
            </div>

            <p className="text-sm text-[#9A7A70] mb-6 text-center">Make sure your face is clear and well-lit.</p>

            <div className="flex gap-4 w-full">
              <button 
                onClick={() => {
                  setRetakeCount(prev => prev + 1);
                  setState("idle");
                  setCapturedUrl(null);
                  setPhotoBase64(null);
                }}
                className="flex-1 bg-transparent border border-[#C49A6C] text-[#C49A6C] font-bold py-4 rounded-xl text-lg hover:bg-[#C49A6C]/10 transition-colors"
              >
                Retake
              </button>
              <button 
                onClick={handleAnalyze}
                className="flex-[2] bg-[#D4856A] text-white font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
              >
                Analyze
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
                {messages[msgIndex]}
              </motion.p>
            </AnimatePresence>

            <AnimatePresence>
              {showSlowMessage && (
                <motion.p
                  key="slow-message"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-sm text-[#9A7A70] text-center mb-2"
                >
                  Still working on your report...
                </motion.p>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showLongMessage && (
                <motion.p
                  key="long-message"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-sm text-[#C49A6C] text-center mb-4"
                >
                  Taking longer than usual. You&apos;ll get your report by email.
                </motion.p>
              )}
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

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1F1015] border border-[#3A2028] text-[#F5EAE0] px-4 py-3 rounded-full text-sm shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

