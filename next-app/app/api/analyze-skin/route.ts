
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { parseGeminiJSON, skinModel } from "@/lib/gemini";

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

    const systemPrompt = `You are an expert Korean skincare dermatologist
specializing in Indian skin types. Indian skin has higher melanin (prone to
post-inflammatory hyperpigmentation), varies greatly by city climate, and has
different oiliness patterns. The user is from ${city}.
Return ONLY raw valid JSON - no markdown, no backticks, no explanation.
Just the JSON object.`;

    const jsonSchema = `{
  "overallGlowScore": number between 0-100,
  "skinType": "oily" | "dry" | "combination" | "normal" | "sensitive",
  "concerns": [
    {
      "name": string,
      "score": number (0-100, higher = more concern),
      "severity": "mild" | "moderate" | "high",
      "explanation": string (2 sentences personalized for Indian skin),
      "recommendedIngredient": string
    }
  ],
  "insights": [
    { "finding": string, "explanation": string }
  ],
  "climateNote": string (skincare advice specific to ${city} weather and pollution),
  "routineComplexity": "basic" | "intermediate" | "advanced"
}`;

    let result;

    // -- PATH 1: PHOTO ANALYSIS --
    try {
      if (photoBase64) {
        const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");

        result = await skinModel.generateContent([
          systemPrompt,
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          `Analyze this person's skin photo carefully.
Focus on: texture, oiliness/dryness, visible pores, acne or blemishes,
pigmentation or dark spots, skin tone evenness, hydration levels,
and any redness or sensitivity signs.
Return this exact JSON schema:
${jsonSchema}`,
        ]);
      } else if (quizAnswers) {
        result = await skinModel.generateContent([
          systemPrompt,
          `Based on this skin quiz data from a user in ${city}:
${JSON.stringify(quizAnswers, null, 2)}

Quiz key:
- skinFeel: how skin feels 2hrs after washing
- breakoutFrequency: how often they get breakouts
- poreVisibility: how visible their pores are
- sensitivity: how often skin reacts to products
- pigmentationScore: 1-5 (5 = very concerned)
- dullnessScore: 1-5 (5 = very concerned)

Generate an accurate skin report estimate.
Return this exact JSON schema:
${jsonSchema}`,
        ]);
      }
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

      console.error("Gemini error:", err);
      return NextResponse.json(
        { error: "ai_error", message: "Failed to analyze the skin report." },
        { status: 500, headers: corsHeaders }
      );
    }

    // -- PARSE GEMINI RESPONSE --
    const raw = result?.response.text() ?? "";
    let report: GeminiReport;
    try {
      report = parseGeminiJSON<GeminiReport>(raw);
    } catch {
      return NextResponse.json(
        { error: "parse_failed", message: "Could not read the skin analysis. Please retake." },
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
      return NextResponse.json({ reportId: "temp-" + Date.now(), ...report }, { headers: corsHeaders });
    }

    return NextResponse.json({ reportId: saved.id, ...report }, { headers: corsHeaders });
  } catch (err: unknown) {
    console.error("Analyze skin error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}

