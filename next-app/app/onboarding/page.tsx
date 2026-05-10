"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  Image as ImageIcon, 
  Droplets, 
  Wind, 
  Sun, 
  Star, 
  ShieldAlert 
} from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    skin_type: "",
    concerns: [] as string[],
    routine_level: "",
    photo_file: null as File | null,
    photo_preview: null as string | null,
  });

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("Calcutta") || tz.includes("Kolkata")) {
        setFormData(prev => ({...prev, city: "Kolkata"}));
      } else if (tz.includes("Asia/Kolkata")) {
        // Fallback for generalized Indian Standard Time
        setFormData(prev => ({...prev, city: "Mumbai"}));
      }
    } catch(e) {}
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Jaipur", "Other"];
  const SKIN_TYPES = [
    { id: "Oily", icon: Droplets, desc: "Gets shiny quickly, prone to breakouts" },
    { id: "Dry", icon: Wind, desc: "Feels tight, sometimes flaky" },
    { id: "Combination", icon: Sun, desc: "Oily T-zone, dry/normal cheeks" },
    { id: "Normal", icon: Star, desc: "Balanced, rarely breaks out" },
    { id: "Sensitive", icon: ShieldAlert, desc: "Easily irritated, prone to redness" },
  ];
  const CONCERNS = [
    "Acne", "Pigmentation", "Dark circles", "Dullness", 
    "Uneven texture", "Large pores", "Dryness", "Anti-aging"
  ];
  const ROUTINES = [
    "None (I'm starting fresh)",
    "1-2 basics",
    "3-5 steps",
    "Full 7-step"
  ];

  const handleNext = () => {
    setDirection(1);
    // validation
    if (step === 1 && (!formData.name || !formData.city)) return;
    if (step === 2 && !formData.skin_type) return;
    if (step === 3 && formData.concerns.length === 0) return;
    if (step === 4 && !formData.routine_level) return;
    
    if (step < 5) setStep(step + 1);
    else submitOnboarding();
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const submitOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      let photo_url = null;
      
      // Optionally upload photo if selected
      if (formData.photo_file) {
        const fileExt = formData.photo_file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id || 'guest'}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('avatars') 
          .upload(filePath, formData.photo_file);

        if (!uploadError && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          photo_url = publicUrl;
        }
      }

      // Upsert profile
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id: user?.id,
          name: formData.name,
          city: formData.city,
          skin_type: formData.skin_type,
          concerns: formData.concerns,
          routine_level: formData.routine_level,
          photo_url,
          updated_at: new Date().toISOString(),
        });

      if (error) console.error("Could not save to DB:", error);
      
      router.push("/scan");
    } catch (e) {
      console.error(e);
      router.push("/scan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleConcern = (c: string) => {
    setFormData((prev) => {
      const exists = prev.concerns.includes(c);
      if (exists) return { ...prev, concerns: prev.concerns.filter((x) => x !== c) };
      if (prev.concerns.length >= 3) return prev; // max 3
      return { ...prev, concerns: [...prev.concerns, c] };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ 
        ...prev, 
        photo_file: file,
        photo_preview: URL.createObjectURL(file)
      }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0F172A] text-white font-sans selection:bg-[#D4AF37]/30">
      {/* Header / Progress */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#0F172A]/80 backdrop-blur-md">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <div className="flex-1 mx-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#D4AF37]"
            initial={{ width: 0 }}
            animate={{ width: \`\${(step / 5) * 100}%\` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-400">
          {step} / 5
        </span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col px-6 pt-4 pb-32 overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col flex-1"
          >
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Let's get to know you</h1>
                  <p className="text-gray-400 text-sm">Tell us a bit about yourself to start.</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">First Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    placeholder="Your name"
                    className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">City</label>
                  <div className="relative">
                    <select 
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                      className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3.5 appearance-none focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    >
                      <option value="" disabled>Select your city</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">What's your skin type?</h1>
                  <p className="text-gray-400 text-sm">Select the one that best describes your skin.</p>
                </div>
                <div className="flex flex-col gap-3">
                  {SKIN_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.skin_type === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setFormData(prev => ({...prev, skin_type: type.id}))}
                        className={\`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-300 \${
                          isSelected 
                            ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)]" 
                            : "bg-[#111827] border-gray-800 hover:border-gray-700"
                        }\`}
                      >
                        <div className={\`p-3 rounded-lg flex-shrink-0 \${isSelected ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-800/50 text-gray-300'}\`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={\`font-semibold text-lg \${isSelected ? 'text-white' : 'text-gray-200'}\`}>
                            {type.id}
                          </p>
                          <p className="text-sm text-gray-400">{type.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Your main concerns?</h1>
                  <p className="text-gray-400 text-sm">Select up to 3 that you want to focus on.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {CONCERNS.map((c) => {
                    const isSelected = formData.concerns.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleConcern(c)}
                        disabled={!isSelected && formData.concerns.length >= 3}
                        className={\`px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 \${
                          isSelected 
                            ? "bg-[#D4AF37] text-[#0F172A] shadow-md shadow-[#D4AF37]/20" 
                            : "bg-[#111827] border border-gray-800 text-gray-300 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        }\`}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Current routine</h1>
                  <p className="text-gray-400 text-sm">How many steps is your current skincare routine?</p>
                </div>
                <div className="flex flex-col gap-3">
                  {ROUTINES.map((lvl, index) => {
                    const isSelected = formData.routine_level === lvl;
                    const fillPercentage = (index + 1) * 25;
                    return (
                      <button
                        key={lvl}
                        onClick={() => setFormData(prev => ({...prev, routine_level: lvl}))}
                        className={\`relative p-5 text-left rounded-xl border overflow-hidden transition-all duration-300 \${
                          isSelected 
                            ? "border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)]" 
                            : "bg-[#111827] border-gray-800 hover:border-gray-700"
                        }\`}
                      >
                        <div 
                          className={\`absolute left-0 top-0 bottom-0 transition-all duration-500 \${isSelected ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-800/30'}\`} 
                          style={{ width: \`\${fillPercentage}%\` }}
                        />
                        <p className={\`relative z-10 font-medium text-lg \${isSelected ? 'text-[#D4AF37]' : 'text-gray-300'}\`}>
                          {lvl}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Upload a selfie</h1>
                  <p className="text-gray-400 text-sm">
                    For a more accurate AI report. No makeup, good lighting.
                  </p>
                </div>
                
                <div className="flex flex-col items-center justify-center gap-6 mt-8">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    capture="user"
                  />

                  {formData.photo_preview ? (
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formData.photo_preview} alt="Selfie preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setFormData(prev => ({...prev, photo_file: null, photo_preview: null}))}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <span className="text-white text-sm font-medium border border-white/50 px-3 py-1.5 rounded-full">Replace</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 rounded-2xl bg-[#111827] border border-gray-800 flex flex-col items-center justify-center gap-3 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all text-[#D4AF37]"
                      >
                        <Camera className="w-8 h-8" />
                        <span className="text-sm font-medium">Camera</span>
                      </button>

                      <button 
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.removeAttribute('capture');
                            fileInputRef.current.click();
                            fileInputRef.current.setAttribute('capture', 'user');
                          }
                        }}
                        className="w-32 h-32 rounded-2xl bg-[#111827] border border-gray-800 flex flex-col items-center justify-center gap-3 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all text-white"
                      >
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">Gallery</span>
                      </button>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center gap-4 mt-8">
                    <p className="text-xs text-gray-500 text-center max-w-[250px] flex items-center gap-2 justify-center">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Your photo is analyzed privately and never stored anywhere.
                    </p>
                    <button 
                      onClick={submitOnboarding}
                      className="text-sm text-gray-400 font-medium underline underline-offset-4 hover:text-white"
                    >
                      Skip this step
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer / CTA */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-transparent">
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className={\`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all \${
            isSubmitting ? "bg-[#D4856A]/50 text-white/50 cursor-wait" : "bg-[#D4856A] text-white shadow-lg shadow-[#D4856A]/20 hover:bg-[#D4856A]/90 hover:scale-[0.99] active:scale-95"
          }\`}
        >
          {step === 5 ? (
            isSubmitting ? "Saving..." : "Generate My Skin Report ✨"
          ) : (
            "Continue →"
          )}
        </button>
      </footer>
    </div>
  );
}