
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  skinModel,
  textModel,
  parseGeminiJSON,
  analyzeWithGroq,
} from "@/lib/gemini";

type GeminiReport = {
  overallGlowScore: number;
  skinType: string;
  concerns: unknown[];
  insights: unknown[];
  climateNote: string;
  routineComplexity: string;
};

const corsOrigin = process.env.CORS_ALLOW_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": corsOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function getJsonSchema(city: string) {
  return `{
  "overallGlowScore": number 0-100,
  "skinType": "oily"|"dry"|"combination"|"normal"|"sensitive",
  "concerns": [{
    "name": string,
    "score": number 0-100,
    "severity": "mild"|"moderate"|"high",
    "explanation": string (2 sentences for Indian skin),
    "recommendedIngredient": string
  }],
  "insights": [{ "finding": string, "explanation": string }],
  "climateNote": string (specific to ${city}),
  "routineComplexity": "basic"|"intermediate"|"advanced"
}`
}

async function runAnalysis(
  photoBase64: string | undefined,
  quizAnswers: object | undefined,
  city: string
) {
  const systemPrompt = `You are an expert Korean skincare dermatologist 
specializing in Indian skin. The user is from ${city}. 
Return ONLY raw valid JSON — no markdown, no backticks.`

  if (photoBase64) {
    try {
      const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");

      const result = await skinModel.generateContent([
        systemPrompt,
        {
          inlineData: { mimeType: "image/jpeg", data: base64Data },
        },
        `Analyze this skin photo carefully. Return this JSON: ${getJsonSchema(city)}`,
      ]);

      const report = parseGeminiJSON(result.response.text());
      return { report, usedFallback: false };
    } catch (geminiErr: unknown) {
      console.error("Gemini photo failed:", geminiErr);
      try {
        const report = await analyzeWithGroq(city);
        return { report, usedFallback: true };
      } catch (groqErr: unknown) {
        console.error("Groq also failed:", groqErr);
        throw new Error("Both AI services failed. Please try again.");
      }
    }
  }

  if (quizAnswers) {
    try {
      const result = await textModel.generateContent(
        `${systemPrompt}\n\nQuiz: ${JSON.stringify(quizAnswers)}\n\nReturn: ${getJsonSchema(city)}`
      );
      const report = parseGeminiJSON(result.response.text());
      return { report, usedFallback: false };
    } catch (geminiErr: unknown) {
      console.error("Gemini quiz failed:", geminiErr);
      try {
        const report = await analyzeWithGroq(city, quizAnswers);
        return { report, usedFallback: true };
      } catch (groqErr: unknown) {
        console.error("Groq also failed:", groqErr);
        throw new Error("Both AI services failed. Please try again.");
      }
    }
  }

  throw new Error("Send either photoBase64 or quizAnswers");
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { photoBase64, quizAnswers, userId, city } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "missing_field", message: "userId is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!city) {
      return NextResponse.json(
        { error: "missing_field", message: "city is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!photoBase64 && !quizAnswers) {
      return NextResponse.json(
        { error: "missing_field", message: "Send either photoBase64 or quizAnswers" },
        { status: 400, headers: corsHeaders }
      );
    }

    // -- RATE LIMIT: 1 scan per user per 24h --
    const since = new Date(Date.now() - 86400000).toISOString();
    const { data: recent } = await supabase
      .from("skin_reports")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", since)
      .single();

    if (recent) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: "You already scanned today. Check back tomorrow.",
        },
        { status: 429, headers: corsHeaders }
      );
    }

different oiliness patterns. The user is from ${city}.
    let report: GeminiReport;
    let usedFallback = false;

    try {
      const result = await runAnalysis(
        photoBase64,
        quizAnswers,
        city ?? "Mumbai"
      );
      report = result.report as GeminiReport;
      usedFallback = result.usedFallback;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("SAFETY")) {
        return NextResponse.json(
          {
            error: "unclear_image",
            message: "Please retake in better lighting with a clear face shot.",
          },
          { status: 422, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: "ai_error", message: message || "Failed to analyze the skin report." },
        { status: 500, headers: corsHeaders }
      );
    }

    // -- SAVE TO SUPABASE --
    const { data: saved, error: dbError } = await supabase
      .from("skin_reports")
      .insert({
        user_id: userId,
        overall_glow_score: report.overallGlowScore,
        skin_type: report.skinType,
        concerns: report.concerns,
        insights: report.insights,
        climate_note: report.climateNote,
        routine_complexity: report.routineComplexity,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return NextResponse.json(
        { reportId: "temp-" + Date.now(), usedFallback, ...report },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { reportId: saved.id, usedFallback, ...report },
      { headers: corsHeaders }
    );
  } catch (err: unknown) {
    console.error("Analyze skin error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}

