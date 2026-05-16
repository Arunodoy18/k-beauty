"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Download, MapPin, RefreshCw, Share2, Sparkles } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

type ReportConcern = {
  name?: string;
  score?: number;
  severity?: string;
  explanation?: string;
  recommendedIngredient?: string;
};

type ReportInsight = {
  finding?: string;
  explanation?: string;
  recommendedIngredient?: string;
};

type ReportRecord = {
  overall_glow_score?: number;
  city?: string;
  created_at?: string;
  concerns?: ReportConcern[];
  insights?: ReportInsight[];
  climate_note?: string;
};

type ReportUi = {
  score: number;
  city: string;
  date: string;
  concerns: ReportConcern[];
  insights: ReportInsight[];
  climate: { city: string; text: string };
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MOCK_REPORT: ReportRecord = {
  overall_glow_score: 72,
  city: "Mumbai",
  created_at: "2026-05-01",
  concerns: [
    {
      name: "Acne",
      score: 70,
      severity: "high",
      explanation: "Active congestion along the jawline suggests trapped sebum and hormonal triggers.",
      recommendedIngredient: "Salicylic Acid",
    },
    {
      name: "Pigmentation",
      score: 60,
      severity: "moderate",
      explanation: "Mild sun spots detected on cheeks. Daily SPF and brighteners reduce darkening.",
      recommendedIngredient: "Vitamin C",
    },
    {
      name: "Hydration",
      score: 40,
      severity: "mild",
      explanation: "Your barrier looks stable but needs consistent lightweight hydration.",
      recommendedIngredient: "Hyaluronic Acid",
    },
    {
      name: "Texture",
      score: 55,
      severity: "moderate",
      explanation: "Uneven texture appears in the T-zone. Niacinamide can smooth over time.",
      recommendedIngredient: "Niacinamide",
    },
  ],
  insights: [
    {
      finding: "Excess sebum in T-zone",
      explanation: "Pore mapping shows overactive oil production, likely worsened by humidity.",
      recommendedIngredient: "Niacinamide",
    },
    {
      finding: "Dehydrated cheeks",
      explanation: "Transepidermal water loss detected. Your skin is losing moisture quickly.",
      recommendedIngredient: "Hyaluronic Acid",
    },
    {
      finding: "Early signs of sun damage",
      explanation: "Micro-pigmentation forming under the surface. Needs defensive care.",
      recommendedIngredient: "Vitamin C",
    },
  ],
  climate_note:
    "High humidity worsens oiliness. Your routine needs lightweight, water-based layers to prevent clogged pores.",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const easeCurve: [number, number, number, number] = [0.22, 0.68, 0, 1.1];

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeCurve },
  },
};

const formatReportDate = (value?: string) => {
  if (!value) return "Today";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Today";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const mapReportToUi = (data: ReportRecord | null, fallbackCity: string): ReportUi => {
  const concerns = Array.isArray(data?.concerns) ? data?.concerns : [];
  const insights = Array.isArray(data?.insights) ? data?.insights : [];
  const defaultIngredient = concerns[0]?.recommendedIngredient || "Niacinamide";

  return {
    score: typeof data?.overall_glow_score === "number" ? data.overall_glow_score : MOCK_REPORT.overall_glow_score || 0,
    city: data?.city || fallbackCity,
    date: formatReportDate(data?.created_at),
    concerns: concerns.length ? concerns : MOCK_REPORT.concerns || [],
    insights: insights.length
      ? insights.map((insight) => ({
          finding: insight?.finding || "Insight",
          explanation: insight?.explanation || "No additional details available yet.",
          recommendedIngredient: insight?.recommendedIngredient || defaultIngredient,
        }))
      : MOCK_REPORT.insights || [],
    climate: {
      city: data?.city || fallbackCity,
      text: data?.climate_note || MOCK_REPORT.climate_note || "",
    },
  };
};

function getConcernIcon(name?: string): string {
  const icons: Record<string, string> = {
    acne: "⚡",
    pigmentation: "☀️",
    dryness: "💧",
    dullness: "✨",
    texture: "🌿",
    pores: "🔬",
    sensitivity: "🌸",
    hydration: "💦",
    default: "◉",
  };
  return icons[name?.toLowerCase() || "default"] ?? icons.default;
}

function ReportSkeleton() {
  return (
    <div style={{ padding: "24px 20px", maxWidth: 640, margin: "0 auto" }}>
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "#1F1015",
          margin: "0 auto 24px",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 90,
              borderRadius: 14,
              background: "#1F1015",
              animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 80,
            borderRadius: 14,
            background: "#1F1015",
            marginBottom: 12,
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4 }
          50% { opacity: 0.8 }
        }
      `}</style>
    </div>
  );
}

function ConcernCard({ concern }: { concern: ReportConcern }) {
  const [expanded, setExpanded] = useState(false);
  const score = typeof concern.score === "number" ? concern.score : 0;
  const severity = (concern.severity || "moderate").toLowerCase();

  const severityColor =
    severity === "high"
      ? "#C05060"
      : severity === "moderate"
      ? "#C49A30"
      : "#5A9A7A";

  return (
    <motion.div
      layout
      onClick={() => setExpanded(!expanded)}
      style={{
        background: "#1F1015",
        border: "1px solid #3A2028",
        borderRadius: 14,
        padding: "14px 14px",
        cursor: "pointer",
        overflow: "hidden",
        minWidth: 0,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#2A1520",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14 }}>{getConcernIcon(concern.name)}</span>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontWeight: 500,
              fontSize: 13,
              color: "#E8C9A0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {concern.name}
          </p>
          <p style={{ fontSize: 11, color: "#9A7A70" }}>{concern.severity}</p>
        </div>
      </div>

      <div
        style={{
          height: 3,
          background: "#3A2028",
          borderRadius: 2,
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          style={{
            height: "100%",
            background: severityColor,
            borderRadius: 2,
          }}
        />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p style={{ fontSize: 12, color: "#9A7A70", lineHeight: 1.5, marginBottom: 8 }}>
              {concern.explanation}
            </p>
            <span
              style={{
                fontSize: 11,
                color: "#C49A6C",
                background: "rgba(196,154,108,0.1)",
                border: "1px solid rgba(196,154,108,0.2)",
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              Try: {concern.recommendedIngredient}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams?.get("id") ?? null;
  const fallbackCity = searchParams?.get("city") ?? MOCK_REPORT.city ?? "Mumbai";

  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        setLoading(false);
        return;
      }

      let query = supabase
        .from("skin_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (reportId) {
        query = query.eq("id", reportId);
      }

      const { data, error: dbErr } = await query.limit(1).single();

      if (dbErr || !data) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const { data: retry } = await supabase
          .from("skin_reports")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!retry) {
          setError("No scan found. Take your first AI skin scan!");
          setLoading(false);
          return;
        }
        setReport(retry);
      } else {
        setReport(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Could not load report: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [reportId, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return <ReportSkeleton />;
  }

  if (error || !report) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: 26,
            color: "#C49A6C",
            marginBottom: 12,
          }}
        >
          No report yet
        </p>
        <p style={{ color: "#9A7A70", fontSize: 14, marginBottom: 28 }}>
          {error ?? "Take your first AI skin scan to see your report"}
        </p>
        <button
          onClick={() => router.push("/scan")}
          style={{
            background: "#D4856A",
            color: "white",
            border: "none",
            borderRadius: 14,
            padding: "14px 32px",
            fontSize: 15,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Take a Skin Scan ✨
        </button>
      </div>
    );
  }

  const ui = mapReportToUi(report, fallbackCity);
  const ringCircumference = 2 * Math.PI * 54;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Glow Report",
          text: "Check out my personalized AI Skin Report from MY GLOW!",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard.");
      }
    } catch {
      setError("Unable to share the report right now.");
    }
  };

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans pb-24 overflow-x-hidden">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-md mx-auto">
        <motion.div variants={itemVariants} className="px-6 pt-12 pb-6 flex flex-col items-center">
          <p className="text-gray-400 text-sm font-medium tracking-wide uppercase mb-2">
            {ui.city} · {ui.date}
          </p>
          <h1 className="text-4xl text-center text-[#D4AF37] italic mb-10 font-heading">
            Your Glow Report
          </h1>

          <div className="relative w-[160px] h-[160px] flex items-center justify-center mb-4">
            <svg width="160" height="160" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#3A2028" strokeWidth="8" />
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#C49A6C"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${ringCircumference}`}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{
                  strokeDashoffset: ringCircumference * (1 - ui.score / 100),
                }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white tracking-tighter">{ui.score}</span>
              <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Glow Score</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="px-6 mb-10">
          <h2 className="text-xl font-bold mb-4">Target Areas</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
              width: "100%",
              padding: "0 4px",
            }}
          >
            {ui.concerns?.map((concern, idx) => (
              <ConcernCard key={`${concern.name}-${idx}`} concern={concern} />
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="px-6 mb-10">
          <div className="flex items-center gap-2 mb-4 text-[#D4AF37]">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-xl font-bold text-white">What your skin is telling us</h2>
          </div>
          <div className="space-y-4">
            {ui.insights.map((insight, idx) => (
              <div
                key={`${insight.finding}-${idx}`}
                className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]/50" />
                <h3 className="font-semibold text-[17px] mb-2 text-white">{insight.finding}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{insight.explanation}</p>
                <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 text-[#D4AF37] px-3 py-1.5 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Try: {insight.recommendedIngredient}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="px-6 mb-12">
          <div className="bg-gradient-to-br from-[#111827] to-[#0F172A] border border-[#1F2937] rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <MapPin className="w-24 h-24" />
            </div>
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              Your {ui.climate.city} Formula
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed relative z-10">{ui.climate.text}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="px-6 mb-10">
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-3xl p-6 text-center shadow-[0_0_30px_rgba(212,175,55,0.05)]">
            <h2 className="text-lg font-semibold text-white mb-6">Your 5-step K-Beauty routine is ready</h2>
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#111827] border border-[#D4AF37]/30 flex items-center justify-center shadow-inner relative">
                    <span className="text-[#D4AF37] font-bold text-sm">0{step}</span>
                  </div>
                  {idx < 4 && <div className="w-4 h-[1px] bg-[#D4AF37]/30" />}
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                router.push(reportId ? `/routine?reportId=${encodeURIComponent(reportId)}` : "/routine")
              }
              className="w-full bg-[#D4AF37] text-[#0F172A] py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#D4AF37]/90 active:scale-[0.98] transition-all"
            >
              See My Routine Kit <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

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
    </div>
  );
}
