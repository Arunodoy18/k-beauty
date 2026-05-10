
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Droplets, AlertCircle, Sun, Activity, Maximize,
  Share2, Download, RefreshCw, ArrowRight, Sparkles, ChevronDown, CheckCircle2
} from "lucide-react";

// Mock Data (In real app, fetch via reportId or global store)
const MOCK_REPORT = {
  score: 72,
  city: "Mumbai",
  date: "May 2026",
  concerns: [
    { id: "c1", name: "Acne", icon: AlertCircle, score: 30, severity: "Needs attention",
      aiText: "Active clusters along the jawline typically indicate hormonal factors or trapped sebum. Prioritize gentle exfoliation." },
    { id: "c2", name: "Pigmentation", icon: Sun, score: 60, severity: "Moderate",
      aiText: "Mild sun spots detected on cheeks. Daily SPF and Vitamin C will prevent deepening." },
    { id: "c3", name: "Hydration", icon: Droplets, score: 85, severity: "Mild",
      aiText: "Skin barrier looks intact. Keep up with lightweight moisturizing layers." },
    { id: "c4", name: "Texture", icon: Activity, score: 55, severity: "Moderate",
      aiText: "Slight unevenness in the T-zone. Niacinamide can help smooth this over time." },
  ],
  insights: [
    { id: "i1", title: "Excess sebum in T-zone", text: "Pore mapping shows overactive oil production, likely worsened by humidity.", ingredient: "Niacinamide" },
    { id: "i2", title: "Dehydrated cheeks", text: "Transepidermal water loss detected. Your skin is losing moisture quickly.", ingredient: "Hyaluronic Acid" },
    { id: "i3", title: "Early signs of sun damage", text: "Micro-pigmentation forming under the surface. Needs defensive care.", ingredient: "Vitamin C" },
  ],
  climate: {
    city: "Mumbai",
    text: "High humidity worsens oiliness. Your routine needs lightweight, water-based layers to prevent clogged pores while keeping skin hydrated."
  }
};

const circleVariants = {
  hidden: { strokeDashoffset: 2 * Math.PI * 45 },
  visible: (score: number) => ({
    strokeDashoffset: 2 * Math.PI * 45 - (score / 100) * (2 * Math.PI * 45),
    transition: { duration: 1.5, ease: "easeOut", delay: 0.5 }
  })
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState(MOCK_REPORT);
  const [expandedConcern, setExpandedConcern] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Score Color Logic
  const getScoreColor = (value: number) => {
    if (value > 75) return "#10B981"; // green
    if (value >= 50) return "#F59E0B"; // amber
    return "#F43F5E"; // rose
  };

  const circumference = 2 * Math.PI * 45;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Glow Report",
          text: "Check out my personalized AI Skin Report from MY GLOW!",
          url: window.location.href,
        });
      } else {
        alert("Sharing not supported on this browser.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDownload = () => {
    window.print(); // Simple fallback for PDF export
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans pb-24 overflow-x-hidden" ref={reportRef}>
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        className="max-w-md mx-auto"
      >
        {/* HEADER */}
        <motion.div variants={itemVariants} className="px-6 pt-12 pb-6 flex flex-col items-center">
          <p className="text-gray-400 text-sm font-medium tracking-wide uppercase mb-2">
            {report.city} &middot; {report.date}
          </p>
          <h1 
            className="text-4xl text-center text-[#D4AF37] italic mb-10"
            style={{ fontFamily: "Cormorant Garamond, serif" }}
          >
            Your Glow Report
          </h1>

          {/* Animated Score Ring */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-4">
            <svg width="192" height="192" viewBox="0 0 100 100" className="transform -rotate-90">
              <circle 
                cx="50" cy="50" r="45" 
                stroke="#1F2937" strokeWidth="6" fill="none" 
              />
              <motion.circle 
                cx="50" cy="50" r="45" 
                stroke={getScoreColor(report.score)} 
                strokeWidth="6" 
                fill="none" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                custom={report.score}
                variants={circleVariants}
                initial="hidden"
                animate="visible"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-5xl font-bold text-white tracking-tighter"
              >
                {report.score}
              </motion.span>
              <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Glow Score</span>
            </div>
          </div>
        </motion.div>

        {/* CONCERN CARDS (Horizontal Scroll) */}
        <motion.div variants={itemVariants} className="mb-10 w-full">
          <h2 className="px-6 text-xl font-bold mb-4">Target Areas</h2>
          <div className="flex overflow-x-auto gap-4 px-6 pb-6 snap-x snap-mandatory hide-scrollbar">
            {report.concerns.map(concern => {
              const Icon = concern.icon;
              const isExpanded = expandedConcern === concern.id;
              
              return (
                <motion.div 
                  key={concern.id}
                  layout
                  onClick={() => setExpandedConcern(isExpanded ? null : concern.id)}
                  className="snap-start shrink-0 w-64 bg-[#111827] border border-gray-800 rounded-2xl p-5 cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#1F2937] rounded-xl text-[#D4AF37]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{concern.name}</h3>
                        <p className="text-xs text-gray-400">{concern.severity}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>

                  <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden mb-3">
                    <motion.div 
                      className="h-full"
                      style={{ backgroundColor: getScoreColor(concern.score) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${concern.score}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-gray-300 leading-relaxed pt-2 border-t border-gray-800/50 mt-2"
                      >
                        {concern.aiText}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* AI INSIGHTS SECTION */}
        <motion.div variants={itemVariants} className="px-6 mb-10">
          <div className="flex items-center gap-2 mb-4 text-[#D4AF37]">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-xl font-bold text-white">What your skin is telling us</h2>
          </div>
          <div className="space-y-4">
            {report.insights.map((insight, idx) => (
              <div key={insight.id} className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]/50" />
                <h3 className="font-semibold text-[17px] mb-2 text-white">{insight.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{insight.text}</p>
                <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1.5 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Try: {insight.ingredient}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CLIMATE SECTION */}
        <motion.div variants={itemVariants} className="px-6 mb-12">
          <div className="bg-gradient-to-br from-[#111827] to-[#0F172A] border border-[#1F2937] rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <MapPin className="w-24 h-24" />
            </div>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              Your {report.climate.city} Formula
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed relative z-10">
              {report.climate.text}
            </p>
          </div>
        </motion.div>

        {/* ROUTINE PREVIEW */}
        <motion.div variants={itemVariants} className="px-6 mb-10">
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-3xl p-6 text-center shadow-[0_0_30px_rgba(212,175,55,0.05)]">
            <h2 className="text-lg font-semibold text-white mb-6">Your 4-step K-Beauty routine is ready</h2>
            
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3, 4].map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#111827] border border-[#D4AF37]/30 flex items-center justify-center shadow-inner relative">
                    <span className="text-[#D4AF37] font-bold text-sm">0{step}</span>
                  </div>
                  {idx < 3 && <div className="w-4 h-[1px] bg-[#D4AF37]/30" />}
                </div>
              ))}
            </div>

            <button 
              onClick={() => router.push("/routine")}
              className="w-full bg-[#D4AF37] text-[#0F172A] py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#D4AF37]/90 active:scale-[0.98] transition-all"
            >
              See My Routine Kit <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* SHARE + ACTIONS */}
        <motion.div variants={itemVariants} className="px-6 flex flex-col gap-3">
          <button 
            onClick={handleShare}
            className="w-full py-4 rounded-xl flex items-center justify-center gap-2 bg-[#111827] border border-gray-800 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            <Share2 className="w-5 h-5" /> Share my report
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleDownload}
              className="py-4 rounded-xl flex items-center justify-center gap-2 bg-transparent border border-gray-800 text-gray-300 font-medium hover:text-white hover:border-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button 
              onClick={() => router.push("/scan")}
              className="py-4 rounded-xl flex items-center justify-center gap-2 bg-transparent border border-gray-800 text-gray-300 font-medium hover:text-white hover:border-gray-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retake scan
            </button>
          </div>
        </motion.div>

      </motion.div>

      {/* Internal CSS for horizontal scrollbar hide */}
      <style dangerouslySetContent={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

