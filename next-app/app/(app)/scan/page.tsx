"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, FlipHorizontal, Upload, AlertTriangle } from "lucide-react";
import { useAppContext } from "@/components/app/app-context";
import { useSupabaseClient } from "@/components/supabase-provider";
import { getApiUrl } from "@/lib/api";

type ScanStage = "quiz" | "camera" | "preview" | "analyzing";

type QuizAnswers = {
  skinFeel?: "dry" | "normal" | "combination" | "oily";
  breakouts?: "rarely" | "monthly" | "weekly" | "always";
  pores?: "small" | "moderate" | "large";
  sensitivity?: "low" | "moderate" | "high";
  pigmentation?: number;
  dullness?: number;
};

type QuizOption = {
  label: string;
  value: string;
};

type QuizQuestion = {
  id: keyof QuizAnswers;
  title: string;
  type: "select" | "slider";
  subtext?: string;
  options?: QuizOption[];
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
    options: [
      { label: "Tight and dry", value: "dry" },
      { label: "Feels comfortable", value: "normal" },
      { label: "Slightly oily", value: "combination" },
      { label: "Very oily", value: "oily" },
    ],
  },
  {
    id: "breakouts",
    title: "How often do you get breakouts?",
    type: "select",
    options: [
      { label: "Rarely or never", value: "rarely" },
      { label: "Once a month", value: "monthly" },
      { label: "Weekly", value: "weekly" },
      { label: "Almost always", value: "always" },
    ],
  },
  {
    id: "pores",
    title: "How visible are your pores?",
    type: "select",
    options: [
      { label: "Not noticeable", value: "small" },
      { label: "Slightly visible", value: "moderate" },
      { label: "Large and visible", value: "large" },
    ],
  },
  {
    id: "sensitivity",
    title: "How does your skin react to new products?",
    type: "select",
    options: [
      { label: "Never reacts", value: "low" },
      { label: "Sometimes reacts", value: "moderate" },
      { label: "Always reacts", value: "high" },
    ],
  },
  {
    id: "pigmentation",
    title: "Rate your pigmentation concern",
    subtext: "Dark spots, uneven tone, post-acne marks",
    type: "slider",
  },
  {
    id: "dullness",
    title: "How dull or tired does your skin look?",
    subtext: "Lack of glow, tired appearance, grey tone",
    type: "slider",
  },
];

const stageMotion = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
  transition: { duration: 0.35 },
};

const questionMotion = {
  initial: { x: 60, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
  transition: { type: "spring" as const, stiffness: 300, damping: 30 },
};

export default function ScanPage() {
  const router = useRouter();
  const { userId } = useAppContext();
  const supabase = useSupabaseClient();

  const [stage, setStage] = useState<ScanStage>("quiz");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({
    pigmentation: 3,
    dullness: 3,
  });
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [capturedUrl, setCapturedUrl] = useState<string>("");
  const [analysisMessages, setAnalysisMessages] = useState<string[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [profileCity, setProfileCity] = useState("Mumbai");
  const [cameraError, setCameraError] = useState<"permission" | "not_found" | "unknown" | null>(null);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slowMessageRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalQuestions = QUIZ_QUESTIONS.length;
  const currentItem = QUIZ_QUESTIONS[currentQuestion];

  const quizProgress = quizComplete
    ? 100
    : Math.round(((currentQuestion + 1) / totalQuestions) * 100);

  const analysisCopy = useMemo(() => {
    return [
      "Reading your skin texture...",
      "Detecting hydration levels...",
      "Mapping pigmentation zones...",
      "Checking pore health...",
      "Analyzing for Indian skin...",
      `Applying ${profileCity} climate data...`,
      "Building your K-beauty routine...",
    ];
  }, [profileCity]);

  useEffect(() => {
    setAnalysisMessages(analysisCopy);
  }, [analysisCopy]);

  useEffect(() => {
    if (!userId) return;

    let isActive = true;
    const loadProfile = async () => {
      try {
        const { data, error: profileError } = await supabase
          .from("user_profiles")
          .select("city")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) throw profileError;
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

  useEffect(() => {
    setIsMobile(typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") setCameraError("permission");
      else if (name === "NotFoundError") setCameraError("not_found");
      else setCameraError("unknown");
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (stage === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
  }, [stage, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      if (slowMessageRef.current) clearTimeout(slowMessageRef.current);
    };
  }, []);

  const handleQuizOption = (question: QuizQuestion, value: string) => {
    setQuizAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleSliderChange = (question: QuizQuestion, value: number) => {
    setQuizAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleQuizBack = () => {
    if (currentQuestion === 0) {
      router.push("/home");
      return;
    }
    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
  };

  const handleQuizContinue = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }

    setQuizComplete(true);
    setTimeout(() => {
      setQuizComplete(false);
      setStage("camera");
    }, 600);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    setPhotoBase64(base64);
    setCapturedUrl(base64);
    setError(null);
    setStage("preview");
    stopCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("Photo too large. Please use one under 5MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPhotoBase64(base64);
      setCapturedUrl(base64);
      setError(null);
      setStage("preview");
    };
    reader.readAsDataURL(file);
  };

  const clearAnalysisTimers = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    if (slowMessageRef.current) clearTimeout(slowMessageRef.current);
  };

  const handleAnalyze = async () => {
    if (!photoBase64) {
      setError("Capture a photo to continue.");
      return;
    }
    if (!userId) {
      setError("Please sign in to continue.");
      return;
    }

    setStage("analyzing");
    setError(null);
    setProgress(0);
    setMessageIndex(0);
    setShowSlowMessage(false);

    clearAnalysisTimers();

    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress = Math.min(currentProgress + Math.random() * 2.5, 95);
      setProgress(Math.round(currentProgress));
    }, 400);

    const lastMessageIndex = Math.max(analysisMessages.length - 1, 0);
    messageIntervalRef.current = setInterval(() => {
      setMessageIndex((prev) => Math.min(prev + 1, lastMessageIndex));
    }, 2500);

    slowMessageRef.current = setTimeout(() => {
      setShowSlowMessage(true);
    }, 15000);

    try {
      const res = await fetch(getApiUrl("/api/analyze-skin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoBase64,
          quizAnswers,
          userId,
          city: profileCity || "Mumbai",
        }),
      });

      const data: AnalyzeResponse = await res.json();
      clearAnalysisTimers();

      if (!res.ok) {
        throw new Error(data.message ?? "Analysis failed");
      }

      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (data.reportId) {
        router.push("/report?id=" + data.reportId);
        return;
      }

      throw new Error("Missing report id from analysis.");
    } catch (err: unknown) {
      clearAnalysisTimers();
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      setStage("preview");
    }
  };

  const showContinueDisabled = currentItem.type === "select" && !quizAnswers[currentItem.id];

  return (
    <div
      className="min-h-screen bg-[#0D0608] text-[#F5EAE0] relative overflow-hidden"
      style={{ fontFamily: '"DM Sans", sans-serif' }}
    >
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      <AnimatePresence mode="wait">
        {stage === "quiz" && (
          <motion.div key="quiz" {...stageMotion} className="min-h-screen px-5 pt-6 pb-8 flex flex-col">
            <div className="grid grid-cols-[48px_1fr_48px] items-center mb-4">
              <button
                onClick={handleQuizBack}
                className="w-10 h-10 rounded-full border border-[#3A2028] text-[#C49A6C] flex items-center justify-center"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div
                className="text-center text-xl"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, color: "#C49A6C" }}
              >
                AI Skin Scan
              </div>
              <div />
            </div>

            <div className="h-[3px] w-full bg-[#3A2028] rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-[#C49A6C]"
                animate={{ width: `${quizProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="text-[12px] text-[#9A7A70] mb-8">Question {currentQuestion + 1} of {totalQuestions}</div>

            <div className="flex-1 flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div key={currentQuestion} {...questionMotion} className="space-y-6">
                  <div>
                    <h2 className="text-2xl" style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600 }}>
                      {currentItem.title}
                    </h2>
                    {currentItem.subtext && (
                      <p className="text-sm text-[#9A7A70] mt-1">{currentItem.subtext}</p>
                    )}
                  </div>

                  {currentItem.type === "select" && (
                    <div className="flex flex-col gap-3">
                      {currentItem.options?.map((option) => {
                        const selected = quizAnswers[currentItem.id] === option.value;
                        return (
                          <motion.button
                            key={option.value}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleQuizOption(currentItem, option.value)}
                            className={`w-full px-5 py-4 rounded-[14px] border text-left flex items-center justify-between transition-colors hover:border-[#C49A6C] ${
                              selected
                                ? "border-[#C49A6C] bg-[rgba(196,154,108,0.10)] text-[#C49A6C]"
                                : "border-[#3A2028] bg-[#1F1015] text-[#F5EAE0]"
                            }`}
                          >
                            <span className="text-[15px]">{option.label}</span>
                            {selected && <Check className="w-5 h-5" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {currentItem.type === "slider" && (
                    <div className="flex flex-col items-center gap-6">
                      <div
                        className="text-[48px]"
                        style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: "italic", color: "#C49A6C" }}
                      >
                        {quizAnswers[currentItem.id] ?? 3}
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={quizAnswers[currentItem.id] ?? 3}
                        onChange={(event) => handleSliderChange(currentItem, Number(event.target.value))}
                        className="w-full accent-[#C49A6C]"
                      />
                      <div className="flex w-full justify-between text-[11px] text-[#9A7A70]">
                        <span>None</span>
                        <span>Severe</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="pt-8">
                <button
                  onClick={handleQuizContinue}
                  disabled={showContinueDisabled}
                  className="w-full bg-[#D4856A] text-white py-4 rounded-2xl text-[15px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {currentQuestion === totalQuestions - 1 ? "Open Camera ->" : "Continue ->"}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {quizComplete && (
                <motion.div
                  key="quiz-complete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#0D0608]/80 flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border border-[#C49A6C] flex items-center justify-center mx-auto mb-4">
                      <Check className="w-6 h-6 text-[#C49A6C]" />
                    </div>
                    <p className="text-lg" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                      Quiz complete
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {stage === "camera" && (
          <motion.div key="camera" {...stageMotion} className="min-h-screen px-5 pt-6 pb-8 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  setStage("quiz");
                  setCurrentQuestion(totalQuestions - 1);
                }}
                className="w-10 h-10 rounded-full border border-[#3A2028] text-[#C49A6C] flex items-center justify-center"
                aria-label="Back to quiz"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div
                className="text-lg"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600 }}
              >
                Position your face
              </div>
              <div className="w-10" />
            </div>

            <div className="relative w-[min(80vw,320px)] h-[min(80vw,320px)] rounded-full overflow-hidden bg-[#1F1015] border border-[#3A2028] flex items-center justify-center">
              {!cameraError && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                  />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-[rgba(196,154,108,0.3)]"
                  />
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <motion.ellipse
                      cx="50%"
                      cy="50%"
                      rx="27.5%"
                      ry="37.5%"
                      fill="none"
                      stroke="rgba(196,154,108,0.6)"
                      strokeWidth="2"
                      strokeDasharray="8 4"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </svg>
                  <motion.div
                    className="absolute left-[15%] right-[15%] h-[2px] bg-[#C49A6C] opacity-50"
                    animate={{ y: ["-40%", "40%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
                  />
                </>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0D0608]/70 text-center px-6">
                  <div>
                    <AlertTriangle className="w-10 h-10 text-[#C49A6C] mx-auto mb-3" />
                    <div
                      className="text-lg"
                      style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600 }}
                    >
                      Camera access needed
                    </div>
                    <p className="text-[13px] text-[#9A7A70] mt-2">
                      Enable camera in your browser settings to continue
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!cameraError && (
              <div className="mt-auto w-full flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-10 w-full">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-full bg-[#1F1015] border border-[#3A2028] text-[#C49A6C] flex items-center justify-center"
                    aria-label="Upload photo"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={capturePhoto}
                    className="w-[72px] h-[72px] rounded-full border-[2.5px] border-[#C49A6C] flex items-center justify-center"
                    aria-label="Capture photo"
                  >
                    <motion.div
                      className="w-[56px] h-[56px] rounded-full bg-[#C49A6C]"
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    />
                  </motion.button>
                  {isMobile ? (
                    <button
                      onClick={() => setFacingMode((prev) => (prev === "user" ? "environment" : "user"))}
                      className="w-10 h-10 rounded-full bg-[#1F1015] border border-[#3A2028] text-[#C49A6C] flex items-center justify-center"
                      aria-label="Flip camera"
                    >
                      <FlipHorizontal className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="w-10 h-10" />
                  )}
                </div>
                <div className="text-[11px] text-[#9A7A70]">Tap to capture</div>
              </div>
            )}

            {cameraError && (
              <div className="mt-8 w-full flex flex-col gap-3">
                <button
                  onClick={startCamera}
                  className="w-full bg-[#D4856A] text-white py-4 rounded-2xl text-[15px] font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-[#C49A6C] text-[#C49A6C] py-4 rounded-2xl text-[15px] font-medium"
                >
                  Use uploaded photo instead
                </button>
              </div>
            )}
          </motion.div>
        )}

        {stage === "preview" && (
          <motion.div key="preview" {...stageMotion} className="min-h-screen px-5 pt-6 pb-8 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  setStage("camera");
                }}
                className="w-10 h-10 rounded-full border border-[#3A2028] text-[#C49A6C] flex items-center justify-center"
                aria-label="Retake"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div
                className="text-lg"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600 }}
              >
                Review photo
              </div>
              <div className="w-10" />
            </div>

            <div className="relative w-[min(80vw,320px)] h-[min(80vw,320px)] rounded-full overflow-hidden bg-[#1F1015] border border-[#3A2028]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedUrl} alt="Captured" className="w-full h-full object-cover" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-[#C49A6C] flex items-center justify-center"
              >
                <Check className="w-5 h-5 text-[#0D0608]" />
              </motion.div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["Face visible", "Good lighting", "No filter"].map((label) => (
                <div
                  key={label}
                  className="px-3 py-1 rounded-full bg-[#1F1015] border border-[#3A2028] text-[11px] text-[#9A7A70]"
                >
                  {label}
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-[#9A7A70]">Happy with this photo?</p>

            {error && (
              <div className="mt-4 text-sm text-[#D4856A] text-center">Analysis failed: {error}</div>
            )}

            <div className="mt-auto w-full flex gap-3 pt-8">
              <button
                onClick={() => {
                  setCapturedUrl("");
                  setPhotoBase64("");
                  setStage("camera");
                }}
                className="flex-1 border border-[#C49A6C] text-[#C49A6C] py-4 rounded-2xl text-[15px] font-medium"
              >
                Retake
              </button>
              <button
                onClick={handleAnalyze}
                className="flex-[2] bg-[#D4856A] text-white py-4 rounded-2xl text-[15px] font-medium"
              >
                {error ? "Try Again" : "Analyze My Skin"}
              </button>
            </div>
          </motion.div>
        )}

        {stage === "analyzing" && (
          <motion.div
            key="analyzing"
            {...stageMotion}
            className="min-h-screen px-5 pt-10 pb-8 flex flex-col items-center justify-center text-center"
          >
            <div className="relative flex items-center justify-center mb-8">
              <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedUrl} alt="Analyzing" className="w-full h-full object-cover" />
                <motion.div
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(196,154,108,0.2)]"
                />
              </div>

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute w-[120px] h-[120px] rounded-full border-[2px] border-dashed border-[#C49A6C] opacity-70"
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={messageIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="text-[26px] text-[#E8C9A0] mb-6"
                style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: "italic" }}
              >
                {analysisMessages[messageIndex] ?? analysisCopy[messageIndex] ?? ""}
              </motion.div>
            </AnimatePresence>

            <div className="w-[200px] h-[3px] bg-[#3A2028] rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-[#C49A6C]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <div className="text-[11px] text-[#9A7A70]">Powered by AI - Results in about 15 seconds</div>

            {showSlowMessage && (
              <div className="mt-4 text-[12px] text-[#9A7A70]">Still working... almost there</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
