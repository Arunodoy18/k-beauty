"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  FileText,
  ListChecks,
  ScanLine,
  Sparkles,
  Zap,
} from "lucide-react";

import { useAppContext } from "@/components/app/app-context";
import { useSupabaseClient } from "@/components/supabase-provider";

const ROUTINE_STEPS = [
  { id: "cleanser", name: "Cleanser", timing: "Morning & Night" },
  { id: "toner", name: "Toner", timing: "Morning & Night" },
  { id: "serum", name: "Serum", timing: "Night" },
  { id: "moisturizer", name: "Moisturizer", timing: "Morning & Night" },
  { id: "spf", name: "SPF", timing: "Morning" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HomeDashboard() {
  const router = useRouter();
  const { userId } = useAppContext();
  const supabase = useSupabaseClient();

  const [profileName, setProfileName] = useState("there");
  const [profileCity, setProfileCity] = useState("Mumbai");
  const [latestReportId, setLatestReportId] = useState<string | null>(null);
  const [glowScore, setGlowScore] = useState<number | null>(null);
  const [routineLog, setRoutineLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const dateStr = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    return new Date().toLocaleDateString("en-US", options);
  }, []);

  const completionPercentage = useMemo(() => {
    if (!ROUTINE_STEPS.length) return 0;
    return Math.round((routineLog.length / ROUTINE_STEPS.length) * 100);
  }, [routineLog]);

  const getScoreColor = (value: number) => {
    if (value > 75) return "var(--green)";
    if (value >= 50) return "var(--amber)";
    return "var(--red)";
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [{ data: profile }, { data: report }, { data: routine }] = await Promise.all([
          supabase
            .from("user_profiles")
            .select("name, city")
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("skin_reports")
            .select("id, overall_glow_score")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("routine_logs")
            .select("steps_completed")
            .eq("user_id", userId)
            .eq("date", new Date().toISOString().slice(0, 10))
            .maybeSingle(),
        ]);

        if (!isMounted) return;

        setProfileName(profile?.name || "there");
        setProfileCity(profile?.city || "Mumbai");
        setLatestReportId(report?.id ?? null);
        setGlowScore(report?.overall_glow_score ?? null);
        setRoutineLog(routine?.steps_completed ?? []);
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Unable to load your dashboard.";
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [supabase, userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans pb-24 overflow-x-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto pt-8"
      >
        <motion.div variants={itemVariants} className="px-6 mb-8">
          <h1 className="text-3xl text-white font-bold mb-1">
            {greeting}, {profileName} <Sparkles className="inline-block w-6 h-6 text-[#D4AF37] mb-2" />
          </h1>
          <p className="text-gray-400 text-sm font-semibold">{dateStr}</p>
          <p className="text-gray-500 text-xs mt-1">{profileCity}</p>
        </motion.div>

        {errorMessage && (
          <motion.div variants={itemVariants} className="px-6 mb-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {errorMessage}
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="px-6 mb-8">
          <div className="bg-gradient-to-br from-[#111827] to-[#0F172A] border border-[#1F2937] rounded-3xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-[0.03] blur-3xl rounded-full" />

            <div className="flex items-center gap-5">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="45" stroke="var(--border)" strokeWidth="8" fill="none" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={getScoreColor(glowScore ?? 0)}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 45}
                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 45 - ((glowScore ?? 0) / 100) * (2 * Math.PI * 45),
                    }}
                    transition={{ duration: 1.2 }}
                  />
                </svg>
                <div className="absolute text-xl font-bold tracking-tighter">
                  {glowScore ?? "--"}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-200 text-lg">Glow Score</h3>
                <p className="text-xs text-gray-500">Latest scan</p>
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

        {!latestReportId && !isLoading && (
          <motion.div variants={itemVariants} className="px-6 mb-8">
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
              <p className="text-sm text-gray-300 mb-3">
                Start your first scan to unlock your personalized routine.
              </p>
              <button
                onClick={() => router.push("/scan")}
                className="w-full bg-[#D4AF37] text-[#0F172A] py-3 rounded-xl font-bold"
              >
                Start Scan
              </button>
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="px-6 mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-xl font-bold">Your routine today</h2>
              <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-1">
                <Zap className="w-4 h-4 text-orange-400" fill="currentColor" />
                Keep your streak going
              </p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-[#D4AF37]">{completionPercentage}%</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Done</span>
            </div>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-2">
            {ROUTINE_STEPS.map((step, idx) => {
              const isDone = routineLog.includes(step.id);
              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    isDone ? "bg-[#1F2937]/30" : "hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-600" />
                    )}
                    <span
                      className={`font-medium ${isDone ? "text-gray-400 line-through" : "text-white"}`}
                    >
                      {step.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 border border-gray-700/50 px-2 py-1 rounded-md">
                    Step {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="px-6 mb-10">
          <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: ScanLine, label: "Rescan", route: "/scan" },
              { icon: FileText, label: "My Report", route: latestReportId ? `/report?id=${latestReportId}` : "/report" },
              { icon: ListChecks, label: "My Routine", route: latestReportId ? `/routine?reportId=${latestReportId}` : "/routine" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.route)}
                className="flex flex-col items-center justify-start gap-2 cursor-pointer group"
              >
                <div className="w-14 h-14 bg-[#111827] rounded-2xl flex items-center justify-center border border-transparent group-hover:border-gray-700 transition-all">
                  <action.icon className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 text-center leading-tight">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
