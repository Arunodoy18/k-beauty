"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, Sun } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { getApiUrl } from "@/lib/api";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MOCK_ROUTINE = {
  skinType: "Oily / Acne-prone / Pigmentation",
  city: "Mumbai",
  routine: [
    {
      id: "r1",
      stepNumber: 1,
      stepName: "Double Cleanse",
      timing: "Morning & Night",
      why: "Essential to remove Mumbai pollution and excess sebum without stripping the barrier.",
      product: {
        brand: "COSRX",
        name: "Salicylic Acid Daily Gentle Cleanser",
        price: 850,
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80",
        ingredients: ["Salicylic Acid 0.5%", "Tea Tree Oil"],
        whyForYou: "Unclogs pores for oily skin",
      },
    },
    {
      id: "r2",
      stepNumber: 2,
      stepName: "Toner / Essence",
      timing: "Morning & Night",
      why: "Preps the skin and restores pH balance after cleansing.",
      product: {
        brand: "Beauty of Joseon",
        name: "AHA BHA Vitamin C Daily Toner",
        price: 1200,
        image: "https://images.unsplash.com/photo-1608248593842-8021b1990c0a?auto=format&fit=crop&w=200&q=80",
        ingredients: ["AHA", "BHA", "Vitamin C"],
        whyForYou: "Gently exfoliates & brightens",
      },
    },
    {
      id: "r3",
      stepNumber: 3,
      stepName: "Treatment Serum",
      timing: "Night time",
      why: "Targets acne and pigmentation directly.",
      product: {
        brand: "Axis-Y",
        name: "Dark Spot Correcting Glow Serum",
        price: 1550,
        image: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=200&q=80",
        ingredients: ["Niacinamide 5%", "Squalane"],
        whyForYou: "Fades dark spots effectively",
      },
    },
    {
      id: "r4",
      stepNumber: 4,
      stepName: "Moisturizer",
      timing: "Morning & Night",
      why: "Lightweight hydration specifically chosen for humid climates.",
      product: {
        brand: "Isntree",
        name: "Hyaluronic Acid Aqua Gel Cream",
        price: 1350,
        image: "https://images.unsplash.com/photo-1615397323145-2070e633d7b8?auto=format&fit=crop&w=200&q=80",
        ingredients: ["5 Types HA", "Centella"],
        whyForYou: "Gel texture won't clog pores",
      },
    },
    {
      id: "r5",
      stepNumber: 5,
      stepName: "Sun Protection",
      timing: "Morning routines only",
      why: "Crucial defense against UV rays which worsen pigmentation.",
      product: {
        brand: "Round Lab",
        name: "Birch Juice Moisturizing Sun Cream",
        price: 1600,
        image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=200&q=80",
        ingredients: ["SPF50+ PA++++", "Birch Sap"],
        whyForYou: "No white cast, soothing",
      },
    },
  ],
  addons: [
    {
      id: "a1",
      name: "Mugwork Sheet Mask Pack (5x)",
      brand: "I'm From",
      price: 850,
      image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=200&q=80",
      type: "Soothing",
    },
    {
      id: "a2",
      name: "Pimple Master Patch",
      brand: "COSRX",
      price: 350,
      image: "https://images.unsplash.com/photo-1611078519183-fbd9a7e6b815?auto=format&fit=crop&w=200&q=80",
      type: "Spot Treatment",
    },
    {
      id: "a3",
      name: "Matte Sun Stick",
      brand: "Beauty of Joseon",
      price: 1450,
      image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=200&q=80",
      type: "Reapplication",
    },
  ],
};

type ProductRecord = {
  id?: string;
  brand?: string;
  name?: string;
  price_inr?: number;
  image_url?: string;
  key_ingredients?: string[];
  affiliate_url?: string;
  korean_step?: string;
  category?: string;
};

type RoutinePayload = {
  report?: { skin_type?: string; city?: string };
  products?: ProductRecord[];
  personalizedCopy?: Record<string, string>;
};

type RoutineApiResponse = {
  success?: boolean;
  message?: string;
  data?: RoutinePayload;
};

type ReportRecord = {
  id?: string;
  user_id?: string;
};

type MockProduct = (typeof MOCK_ROUTINE)["routine"][number]["product"];

type RoutineProductCard = {
  brand: string;
  name: string;
  price: number;
  image: string;
  ingredients: string[];
  whyForYou: string;
  affiliateUrl: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const STEP_DEFINITIONS = [
  { key: "cleanser", stepName: "Cleanser", timing: "Morning & Night" },
  { key: "toner", stepName: "Toner / Essence", timing: "Morning & Night" },
  { key: "serum", stepName: "Treatment Serum", timing: "Night time" },
  { key: "moisturizer", stepName: "Moisturizer", timing: "Morning & Night" },
  { key: "spf", stepName: "Sun Protection", timing: "Morning routines only" },
];

const normalizeStep = (value?: string) => (value || "").toLowerCase();

const pickProductForStep = (products: ProductRecord[], stepKey: string, stepName: string, usedIds: Set<string>) => {
  const stepNeedle = normalizeStep(stepKey);
  const nameNeedle = normalizeStep(stepName);

  const match = products.find((product) => {
    if (!product?.id || usedIds.has(product.id)) return false;
    const tag = `${product.korean_step || ""} ${product.category || ""}`.toLowerCase();
    return tag.includes(stepNeedle) || tag.includes(nameNeedle);
  });

  const fallback = match || products.find((product) => product?.id && !usedIds.has(product.id));
  if (fallback?.id) {
    usedIds.add(fallback.id);
  }
  return fallback;
};

const mapProductCard = (
  product: ProductRecord | null | undefined,
  fallback: MockProduct,
  whyText?: string
): RoutineProductCard => {
  return {
    brand: product?.brand || fallback?.brand || "MY GLOW",
    name: product?.name || fallback?.name || "Recommended product",
    price: typeof product?.price_inr === "number" ? product.price_inr : fallback?.price || 0,
    image: product?.image_url || fallback?.image || "",
    ingredients: Array.isArray(product?.key_ingredients) ? product.key_ingredients : fallback?.ingredients || [],
    whyForYou: whyText || fallback?.whyForYou || "Tailored for your skin profile.",
    affiliateUrl: product?.affiliate_url || "",
  };
};

const getAffiliateUrl = (product: { affiliateUrl?: string; brand?: string; name?: string }) => {
  if (product?.affiliateUrl) return product.affiliateUrl;
  const query = [product?.brand, product?.name].filter(Boolean).join(" ").trim();
  if (!query) return "https://www.amazon.in";
  return `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
};

const buildPlaceholder = (name?: string) => {
  const text = (name || "PR").slice(0, 2).toUpperCase();
  return `https://placehold.co/200x200/1F1015/C49A6C/png?text=${encodeURIComponent(text)}`;
};

const buildRoutineFromApi = (payload: RoutinePayload) => {
  const report = payload?.report || {};
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const personalizedCopy = payload?.personalizedCopy || {};
  const usedIds = new Set<string>();

  const routine = STEP_DEFINITIONS.map((step, idx) => {
    const fallbackStep = MOCK_ROUTINE.routine[idx];
    const matched = pickProductForStep(products, step.key, step.stepName, usedIds);
    const whyCopy = personalizedCopy?.[step.key];

    return {
      id: matched?.id || fallbackStep?.id || `step-${idx}`,
      stepNumber: idx + 1,
      stepName: step.stepName,
      timing: step.timing,
      why: whyCopy || fallbackStep?.why || "Tailored to your skin profile.",
      product: mapProductCard(matched, fallbackStep?.product, whyCopy),
    };
  });

  return {
    skinType: report?.skin_type || MOCK_ROUTINE.skinType,
    city: report?.city || MOCK_ROUTINE.city,
    routine,
    addons: MOCK_ROUTINE.addons,
  };
};

function RoutineSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6 pb-32">
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-800 rounded w-3/4 mx-auto mt-12"></div>
        <div className="h-4 bg-gray-800 rounded w-1/2 mx-auto"></div>
        <div className="h-6 bg-gray-800 rounded-full w-2/3 mx-auto"></div>

        <div className="space-y-6 mt-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-800 rounded-2xl w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RoutinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams?.get("reportId") || searchParams?.get("id");

  const [loading, setLoading] = useState(true);
  const [routineData, setRoutineData] = useState<typeof MOCK_ROUTINE | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setErrorMessage("No report ID in URL");
      setLoading(false);
      return;
    }

    const fetchRoutine = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const { data, error: dbError } = await supabase
          .from("skin_reports")
          .select("id,user_id")
          .eq("id", reportId)
          .single();

        let reportRow: ReportRecord | null = data;

        if (dbError || !data) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const { data: retry, error: retryErr } = await supabase
            .from("skin_reports")
            .select("id,user_id")
            .eq("id", reportId)
            .single();

          if (retryErr || !retry) {
            setErrorMessage("Could not load your report. Please try scanning again.");
            setLoading(false);
            return;
          }
          reportRow = retry;
        }

        if (!reportRow?.user_id) {
          setErrorMessage("Could not load your report. Please try scanning again.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          getApiUrl(
            `/api/get-routine?reportId=${encodeURIComponent(reportId)}&userId=${encodeURIComponent(reportRow.user_id)}`
          )
        );
        const payload: RoutineApiResponse = await res.json();

        if (!res.ok || !payload?.success) {
          throw new Error(payload?.message || "Unable to load routine.");
        }

        const nextRoutine = buildRoutineFromApi(payload.data ?? {});
        setRoutineData(nextRoutine);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unable to load routine.";
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutine();
  }, [reportId]);

  if (loading) {
    return <RoutineSkeleton />;
  }

  if (errorMessage || !routineData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <p style={{ fontFamily: "Cormorant Garamond", fontSize: 28, color: "#C49A6C" }}>
          Something went wrong
        </p>
        <p style={{ color: "#9A7A70", marginTop: 8, fontSize: 14 }}>
          {errorMessage ?? "Report not found"}
        </p>
        <button
          onClick={() => router.push("/scan")}
          style={{
            marginTop: 24,
            padding: "14px 32px",
            background: "#D4856A",
            color: "white",
            borderRadius: 12,
            border: "none",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Take a New Scan
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans pb-32">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-md mx-auto pt-10">
        <motion.div className="px-6 text-center mb-8">
          <h1 className="text-4xl text-[#D4AF37] italic mb-3 leading-tight font-heading">
            Your K-Beauty Routine
          </h1>
          <p className="text-gray-300 text-sm mb-4">
            {routineData.routine.length} steps. Matched to your skin + {routineData.city} climate.
          </p>
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] px-4 py-2 rounded-full text-xs font-semibold tracking-wide">
            {routineData.skinType}
          </div>
        </motion.div>

        {errorMessage && (
          <motion.div className="px-6 mb-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {errorMessage}
            </div>
          </motion.div>
        )}

        <div className="px-5 space-y-6 mb-12">
          {routineData.routine.map((step, index) => {
            const affiliateUrl = getAffiliateUrl(step.product);
            const imageUrl = step.product.image || buildPlaceholder(step.product.name);

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.4, ease: [0.22, 0.68, 0, 1.1] }}
                className="bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden relative shadow-lg"
              >
                <div className="bg-[#1F2937]/50 p-4 border-b border-gray-800 flex justify-between items-start">
                  <div>
                    <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-wider block mb-1">
                      Step {step.stepNumber} · {step.timing}
                    </span>
                    <h2 className="text-lg font-bold">{step.stepName}</h2>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">{step.why}</p>
                  </div>
                </div>

                <div className="p-4 flex gap-4">
                  <div className="w-24 h-24 shrink-0 rounded-2xl bg-gray-800 overflow-hidden relative border border-gray-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={step.product.name}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-product.png";
                        e.currentTarget.onerror = null;
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-0.5">{step.product.brand}</p>
                      <h3 className="font-medium text-sm leading-tight mb-2 line-clamp-2">{step.product.name}</h3>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {step.product.ingredients.map((ingredient) => (
                          <span key={ingredient} className="bg-gray-800 text-[10px] px-2 py-0.5 rounded text-gray-300">
                            {ingredient}
                          </span>
                        ))}
                      </div>

                      <p className="text-[11px] text-[#D4AF37] flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> {step.product.whyForYou}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                      <span className="font-bold">?{step.product.price}</span>
                      <a
                        href={affiliateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold px-4 py-2 rounded-full bg-white text-black"
                      >
                        Buy on Amazon/Nykaa
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div className="mb-10 w-full overflow-hidden">
          <div className="px-6 mb-4 flex items-center gap-2">
            <h2 className="text-lg font-bold">Add-ons for your concerns</h2>
          </div>

          <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x hide-scrollbar">
            {routineData.addons.map((addon) => {
              const affiliateUrl = getAffiliateUrl(addon);
              const imageUrl = addon.image || buildPlaceholder(addon.name);

              return (
                <div
                  key={addon.id}
                  className="snap-start shrink-0 w-40 bg-[#111827] border border-gray-800 rounded-2xl p-3 flex flex-col relative"
                >
                  <div className="h-32 w-full rounded-xl bg-gray-800 mb-3 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={addon.name}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-product.png";
                        e.currentTarget.onerror = null;
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[9px] px-2 py-0.5 rounded-full text-white font-medium uppercase tracking-wide">
                      {addon.type}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold truncate">{addon.brand}</p>
                  <h3 className="font-medium text-xs mb-2 line-clamp-2 leading-tight flex-1">{addon.name}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-sm">?{addon.price}</span>
                    <a
                      href={affiliateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white text-black"
                    >
                      Buy
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div className="px-6 mb-8 flex justify-center gap-6 text-xs text-gray-400 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Authentic
          </div>
          <div className="flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-[#D4AF37]" /> Dermatologist vetted
          </div>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
      }} />
    </div>
  );
}
