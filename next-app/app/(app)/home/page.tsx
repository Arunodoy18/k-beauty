
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Sun, Moon, Cloud, CheckCircle2, Circle, TrendingUp, 
  ScanLine, FileText, Package, Plus, Sparkles, ChevronRight, Zap
} from "lucide-react";

// --- MOCK DATA ---
const USER_NAME = "Priya";
const SCORE_DATA = { score: 72, lastScan: "3 days ago", trend: 8 };

const MOCK_JOURNAL = [
  { day: "Mon", score: 65 }, { day: "Tue", score: 68 }, { day: "Wed", score: 64 },
  { day: "Thu", score: 70 }, { day: "Fri", score: 72 }, { day: "Sat", score: 70 },
  { day: "Sun", score: 72 }
];

const MOCK_TIPS = [
  "Double cleansing removes 98% more sunscreen residue than a single cleanse.",
  "Apply hyaluronic acid on damp skin to seal in 3x more hydration.",
  "Never skip SPF, even indoors. UVA rays penetrate through glass."
];

// For the Routine Checklist
const ROUTINE_STEPS = [
  { id: "s1", name: "Cleanser", type: "Morning & Night" },
  { id: "s2", name: "Toner", type: "Morning & Night" },
  { id: "s3", name: "Vitamin C Serum", type: "Morning" },
  { id: "s4", name: "SPF 50", type: "Morning" }
];

// --- ANIMATION CONFIG ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function HomeDashboard() {
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good morning");
  const [dateStr, setDateStr] = useState("");
  const [weatherStr, setWeatherStr] = useState("Loading weather...");
  const [weatherTip, setWeatherTip] = useState("Your skin will love a lighter routine today.");
  const [weatherIcon, setWeatherIcon] = useState(<Sun className="w-5 h-5 text-[#D4AF37]" />);
  
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const completionPercentage = Math.round((completedSteps.length / ROUTINE_STEPS.length) * 100);

  // Time & Weather initial fetch
  useEffect(() => {
    // Basic Time Logic
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    setDateStr(new Date().toLocaleDateString("en-US", options));

    // Fetch Weather from Open-Meteo for Mumbai (approx lat/long)
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=19.0760&longitude=72.8777&current=temperature_2m,relative_humidity_2m,weather_code");
        const data = await res.json();
        const current = data.current;
        const temp = Math.round(current.temperature_2m);
        const humidity = current.relative_humidity_2m;
        
        setWeatherStr(`${temp}°C, ${humidity}% Humidity (Mumbai)`);
        
        if (humidity > 70) {
          setWeatherTip("High humidity today! Use lightweight gel moisturizers to avoid clogged pores.");
          setWeatherIcon(<Cloud className="w-5 h-5 text-[#D4AF37]" />);
        } else if (temp > 30) {
          setWeatherTip("It's hot outside. Don't forget to reapply your SPF every 2 hours!");
          setWeatherIcon(<Sun className="w-5 h-5 text-[#D4AF37]" />);
        } else {
          setWeatherTip("Weather is balanced. Perfect day for your standard hydrating routine.");
          setWeatherIcon(<Moon className="w-5 h-5 text-[#D4AF37]" />);
        }
      } catch (err) {
        setWeatherStr("Weather unavailable");
      }
    };
    
    fetchWeather();
  }, []);

  const toggleStep = async (id: string) => {
    // Locally update UI instantly
    setCompletedSteps(prev => 
      prev.includes(id) ? prev.filter(step => step !== id) : [...prev, id]
    );

    // TODO: Connect to Supabase
    // await supabase.from("routine_logs").upsert({ user_id: USER_ID, step_id: id, completed: true })
  };

  const getScoreColor = (value: number) => {
    if (value > 75) return "#10B981"; // green
    if (value >= 50) return "#F59E0B"; // amber
    return "#F43F5E"; // rose
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans pb-24 overflow-x-hidden">
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        className="max-w-md mx-auto pt-8"
      >
        {/* HEADER: GREETING & WEATHER */}
        <motion.div variants={itemVariants} className="px-6 mb-8">
          <h1 className="text-3xl text-white font-bold mb-1">
            {greeting}, {USER_NAME} <Sparkles className="inline-block w-6 h-6 text-[#D4AF37] mb-2" />
          </h1>
          
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 mt-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-semibold">{dateStr}</span>
              <div className="flex items-center gap-1.5 text-[#D4AF37] text-sm font-medium">
                {weatherIcon} {weatherStr}
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {weatherTip}
            </p>
          </div>
        </motion.div>

        {/* GLOW SCORE WIDGET */}
        <motion.div variants={itemVariants} className="px-6 mb-8">
          <div className="bg-gradient-to-br from-[#111827] to-[#0F172A] border border-[#1F2937] rounded-3xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-[0.03] blur-3xl rounded-full" />
            
            <div className="flex items-center gap-5">
              {/* Mini Score Ring */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="45" stroke="#1F2937" strokeWidth="8" fill="none" />
                  <motion.circle 
                    cx="50" cy="50" r="45" 
                    stroke={getScoreColor(SCORE_DATA.score)} 
                    strokeWidth="8" fill="none" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 45}
                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 45) - ((SCORE_DATA.score / 100) * (2 * Math.PI * 45)) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute text-xl font-bold tracking-tighter">
                  {SCORE_DATA.score}
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-200 text-lg">Glow Score</h3>
                <p className="text-xs text-gray-500 mb-1">Scanned {SCORE_DATA.lastScan}</p>
                <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" /> {SCORE_DATA.trend} points since last week
                </div>
              </div>
            </div>

            <button 
              onClick={() => router.push("/scan")}
              className="bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              Rescan
            </button>
          </div>
        </motion.div>

        {/* TODAY'S ROUTINE CHECKLIST */}
        <motion.div variants={itemVariants} className="px-6 mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-xl font-bold">Your morning routine</h2>
              <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1">
                <Zap className="w-4 h-4 text-orange-400" fill="currentColor" /> 5 day streak!
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-[#D4AF37]">{completionPercentage}%</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Done</span>
            </div>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-2">
            {ROUTINE_STEPS.map((step, idx) => {
              const isDone = completedSteps.includes(step.id);
              return (
                <div 
                  key={step.id} 
                  onClick={() => toggleStep(step.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isDone ? "bg-[#1F2937]/30" : "hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-[#10B981] drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-600 transition-all" />
                    )}
                    <span className={`font-medium transition-all ${isDone ? "text-gray-400 line-through" : "text-white"}`}>
                      {step.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 border border-gray-700/50 px-2 py-1 rounded-md">Step {idx + 1}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* QUICK ACTIONS ROW */}
        <motion.div variants={itemVariants} className="px-6 mb-10">
          <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: ScanLine, label: "Rescan", route: "/scan", color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: FileText, label: "My Report", route: "/report", color: "text-purple-400", bg: "bg-purple-400/10" },
              { icon: Package, label: "My Kit", route: "/routine", color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
              { icon: Plus, label: "Add Product", route: "#", color: "text-emerald-400", bg: "bg-emerald-400/10" },
            ].map((action, i) => (
              <div 
                key={i} 
                onClick={() => action.route !== "#" && router.push(action.route)}
                className="flex flex-col items-center justify-start gap-2 cursor-pointer group"
              >
                <div className={`w-14 h-14 ${action.bg} rounded-2xl flex items-center justify-center border border-transparent group-hover:border-gray-700 transition-all`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 text-center leading-tight">
                  {action.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SKIN JOURNAL (TREND) */}
        <motion.div variants={itemVariants} className="px-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Your glow trend</h2>
            <button className="text-xs text-[#D4AF37] font-semibold flex items-center">
              View Journal <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 pt-8 h-48 flex items-end justify-between gap-2 overflow-hidden shadow-inner">
            {MOCK_JOURNAL.map((entry, idx) => {
              const height = `${entry.score}%`;
              const isToday = idx === MOCK_JOURNAL.length - 1;
              return (
                <div key={idx} className="flex flex-col items-center w-full relative group cursor-crosshair">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-gray-800 text-xs px-2 py-1 rounded transition-opacity">
                    {entry.score}
                  </div>
                  <div className="w-full bg-[#1F2937] rounded-t-sm flex items-end" style={{ height: "100px" }}>
                    <motion.div 
                      className="w-full rounded-t-sm transition-colors"
                      style={{ backgroundColor: isToday ? "#D4AF37" : getScoreColor(entry.score) }}
                      initial={{ height: 0 }}
                      animate={{ height: height }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      // Dim past days slightly
                      style={{ backgroundColor: isToday ? "#D4AF37" : `${getScoreColor(entry.score)}80` }}
                    />
                  </div>
                  <span className={`text-[10px] mt-2 font-medium ${isToday ? "text-[#D4AF37]" : "text-gray-500"}`}>
                    {entry.day}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* TIPS CAROUSEL */}
        <motion.div variants={itemVariants} className="px-6 mb-10">
          <h2 className="text-lg font-bold mb-3">Today's K-Beauty Tip</h2>
          <div className="flex overflow-x-auto snap-x hide-scrollbar gap-3 pb-2">
            {MOCK_TIPS.map((tip, i) => (
              <div 
                key={i} 
                className="snap-start shrink-0 w-64 bg-gradient-to-r from-gray-800/80 to-[#111827] border border-gray-700/50 rounded-2xl p-4 shadow flex flex-col justify-between"
              >
                <Sparkles className="w-4 h-4 text-[#D4AF37] mb-2" />
                <p className="text-sm text-gray-200 font-medium leading-relaxed">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SHOP REMINDER BANNER */}
        <motion.div variants={itemVariants} className="px-6 mb-6">
          <div className="bg-[#D4AF37] bg-opacity-[0.08] border border-[#D4AF37]/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(212,175,55,0.05)] cursor-pointer hover:bg-opacity-[0.12] transition-colors" onClick={() => router.push("/routine")}>
            <div>
              <h3 className="text-[#D4AF37] font-bold text-sm mb-1">Your kit is waiting</h3>
              <p className="text-xs text-gray-300 font-medium">Complete your routine <ArrowRight className="inline-block w-3 h-3 ml-1" /></p>
            </div>
            {/* Mock thumbnails overlapping */}
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#111827] bg-white overflow-hidden shadow">
                 <img src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=100&q=80" alt="product 1" className="w-full h-full object-cover" />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-[#111827] bg-white overflow-hidden shadow">
                 <img src="https://images.unsplash.com/photo-1608248593842-8021b1990c0a?auto=format&fit=crop&w=100&q=80" alt="product 2" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>

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

