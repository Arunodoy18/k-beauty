
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, AlertCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const SCAN_MESSAGES = [
  "Reading skin texture...",
  "Detecting hydration zones...",
  "Mapping pigmentation...",
  "Building your report..."
];

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"photo" | "quiz">("photo");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [quizAnswers, setQuizAnswers] = useState({
    feelAfterWash: "",
    breakouts: "",
    pores: "",
    reaction: "",
    pigmentation: 3,
    dullness: 3
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanMessageIndex, setScanMessageIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
        setUserProfile(data);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    let messageInterval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    if (isScanning) {
      setScanMessageIndex(0);
      setScanProgress(0);

      messageInterval = setInterval(() => {
        setScanMessageIndex((prev) => (prev + 1) % SCAN_MESSAGES.length);
      }, 2000);

      progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + (100 / (8000 / 50)); // reaches 100 in ~8 seconds
        });
      }, 50);

      // Simulate API Call duration
      setTimeout(async () => {
        clearInterval(messageInterval);
        clearInterval(progressInterval);
        
        // Simulating the API Call
        /*
        await fetch("/api/analyze-skin", {
          method: "POST",
          body: JSON.stringify({
            photoBase64: photoBase64,
            quizAnswers: activeTab === "quiz" ? quizAnswers : null,
            userId: userProfile?.id,
            city: userProfile?.city
          })
        });
        */

        router.push("/report");
      }, 8500);
    }

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [isScanning, activeTab, quizAnswers, photoBase64, router, userProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoBase64(event.target?.result as string);
      setPhotoPreview(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  };

  const handleStartAnalysis = () => {
    if (activeTab === "photo" && !photoBase64) {
      setError("Please upload a photo first to continue.");
      return;
    }
    setError(null);
    setIsScanning(true);
  };

  return (
    <div className="relative min-h-screen bg-[#0F172A] text-white flex flex-col pb-24">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col items-center justify-center px-6"
          >
            <div className="relative w-64 h-64 flex items-center justify-center mb-12">
              {photoPreview && activeTab === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Scanning" className="absolute inset-0 w-full h-full object-cover rounded-full opacity-50" />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-[#111827] rounded-full border border-gray-800" />
              )}
              
              {/* Scanning animations */}
              <motion.div 
                className="absolute inset-x-0 h-1 bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full border-[3px] border-[#D4AF37]"
                animate={{ scale: [1, 1.1, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <div className="h-8 mb-8 relative w-full text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={scanMessageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 text-xl font-medium text-[#D4AF37]"
                >
                  {SCAN_MESSAGES[scanMessageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="w-full max-w-xs h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#D4AF37]"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 pt-12 pb-6 flex flex-col items-center flex-1">
        <h1 
          className="text-[38px] leading-tight text-center mb-3 text-[#F9FAFB]" 
          style={{ fontFamily: "Cormorant Garamond, serif" }}
        >
          Your skin story starts here
        </h1>
        <p className="text-center text-gray-400 text-sm max-w-[280px] mb-8">
          Upload a clear selfie. Our AI reads 12 skin signals in seconds.
        </p>

        {/* Tabs */}
        <div className="flex bg-[#111827] p-1.5 rounded-full mb-10 w-full max-w-sm border border-gray-800">
          <button 
            onClick={() => setActiveTab("photo")}
            className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all relative ${activeTab === "photo" ? "text-white" : "text-gray-400 hover:text-gray-300"}`}
          >
            {activeTab === "photo" && (
              <motion.div layoutId="scan-tab-bubble" className="absolute inset-0 bg-gray-800 rounded-full" />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              Photo Scan
              <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded-full font-bold ml-1">BEST</span>
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab("quiz")}
            className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all relative ${activeTab === "quiz" ? "text-white" : "text-gray-400 hover:text-gray-300"}`}
          >
            {activeTab === "quiz" && (
              <motion.div layoutId="scan-tab-bubble" className="absolute inset-0 bg-gray-800 rounded-full" />
            )}
            <span className="relative z-10">Skin Quiz</span>
          </button>
        </div>

        {/* Photo Upload Zone */}
        {activeTab === "photo" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full"
          >
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              capture="user"
            />
            
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {/* Soft animated pulse behind */}
              <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 animate-pulse scale-[1.15]" />
              <div className="absolute inset-0 rounded-full bg-[#D4AF37]/5 animate-ping scale-[1.3]" style={{ animationDuration: "3s" }} />
              
              <div className="relative w-[240px] h-[240px] rounded-full flex flex-col items-center justify-center bg-[#111827] overflow-hidden group-hover:bg-[#111827]/80 transition-colors z-10">
                {/* Rotating Dashed Border */}
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#D4AF37]/40 group-hover:border-[#D4AF37] group-hover:rotate-180 transition-all duration-[3000ms] ease-linear" />
                
                {photoPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Selected selfie" className="w-full h-full object-cover rounded-full p-3" />
                    <div className="absolute bottom-6 right-6 bg-[#0F172A] rounded-full p-1 border-2 border-[#D4AF37]">
                      <CheckCircle2 className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]/20" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center p-6 gap-3">
                    <Camera className="w-10 h-10 text-[#D4AF37]" strokeWidth={1.5} />
                    <span className="text-[#D4AF37] font-medium text-base">Take or upload photo</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 mt-6 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </motion.div>
        )}

        {/* Skin Quiz Zone */}
        {activeTab === "quiz" && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm flex flex-col gap-8 pb-12"
          >
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-200">1. How does your skin feel 2hrs after washing?</label>
              <select 
                title="Feel after washing"
                value={quizAnswers.feelAfterWash}
                onChange={(e) => setQuizAnswers(p => ({...p, feelAfterWash: e.target.value}))}
                className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all"
              >
                <option value="" disabled>Select option</option>
                <option value="tight">Tight & Dry</option>
                <option value="normal">Normal / Balanced</option>
                <option value="slightly_oily">Slightly Oily in T-Zone</option>
                <option value="very_oily">Very Oily all over</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-200">2. How often do you get breakouts?</label>
              <div className="grid grid-cols-2 gap-2">
                {["Rarely", "Sometimes", "Often", "Always"].map(opt => (
                  <button 
                    key={opt}
                    onClick={() => setQuizAnswers(p => ({...p, breakouts: opt}))}
                    className={`py-2 px-3 rounded-lg border text-sm transition-all ${quizAnswers.breakouts === opt ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" : "border-gray-800 bg-[#111827] text-gray-400"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-200">3. Do you have visible pores?</label>
              <select 
                title="Visible pores"
                value={quizAnswers.pores}
                onChange={(e) => setQuizAnswers(p => ({...p, pores: e.target.value}))}
                className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-all"
              >
                <option value="" disabled>Select option</option>
                <option value="not_really">Not really</option>
                <option value="some">Some visible pores</option>
                <option value="large">Large and very visible</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-200">4. Does your skin react to new products?</label>
              <div className="flex gap-2">
                {["Never", "Sometimes", "Always"].map(opt => (
                  <button 
                    key={opt}
                    onClick={() => setQuizAnswers(p => ({...p, reaction: opt}))}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${quizAnswers.reaction === opt ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]" : "border-gray-800 bg-[#111827] text-gray-400"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-200 flex justify-between">
                <span>5. Rate your pigmentation concern</span>
                <span className="text-[#D4AF37] font-semibold">{quizAnswers.pigmentation}/5</span>
              </label>
              <input 
                type="range" min="1" max="5" 
                title="Pigmentation slider"
                value={quizAnswers.pigmentation}
                onChange={(e) => setQuizAnswers(p => ({...p, pigmentation: parseInt(e.target.value)}))}
                className="w-full accent-[#D4AF37]" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-200 flex justify-between">
                <span>6. Rate your dullness concern</span>
                <span className="text-[#D4AF37] font-semibold">{quizAnswers.dullness}/5</span>
              </label>
              <input 
                type="range" min="1" max="5" 
                title="Dullness slider"
                value={quizAnswers.dullness}
                onChange={(e) => setQuizAnswers(p => ({...p, dullness: parseInt(e.target.value)}))}
                className="w-full accent-[#D4AF37]" 
              />
            </div>
            
          </motion.div>
        )}
      </div>

      {/* CTA Button */}
      <div className="fixed bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-transparent">
        <button
          onClick={handleStartAnalysis}
          className="w-full bg-[#D4856A] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[#D4856A]/90 transform hover:scale-[0.99] active:scale-95 transition-all shadow-lg shadow-[#D4856A]/20"
        >
          {activeTab === "photo" ? "Analyze My Skin ?" : "Get My Skin Report ?"}
        </button>
      </div>

    </div>
  );
}

