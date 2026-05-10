
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { photoBase64, userId, city } = body;

    if (!userId) {
      return NextResponse.json({ error: "unauthorized", message: "User ID is required" }, { status: 401 });
    }

    if (!city) {
      return NextResponse.json({ error: "bad_request", message: "City is required for climate analysis" }, { status: 400 });
    }

    if (!photoBase64) {
      return NextResponse.json({ error: "bad_request", message: "photoBase64 is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Rate Limiting: 1 scan per user per 24 hours
    const { data: recentScans } = await supabase
      .from("skin_reports")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentScans && recentScans.length > 0) {
      const lastScanDate = new Date(recentScans[0].created_at);
      const now = new Date();
      const diffInHours = (now.getTime() - lastScanDate.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return NextResponse.json({ 
          error: "rate_limited", 
          message: "Only 1 scan per 24 hours is allowed. Please try again tomorrow." 
        }, { status: 429 });
      }
    }

    // STEP 1 — Strip the base64 prefix
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");

    // STEP 2 — Call OpenAI GPT Vision
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Swap to gpt-5 when access is available
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content: `You are an expert Korean skincare dermatologist specializing in Indian skin.\nIndian skin has higher melanin (prone to PIH), varies by city climate, and has different oiliness than East Asian skin.\nThe user is from ${city}. Analyze their skin photo carefully.\nReturn ONLY valid JSON — no markdown, no explanation, just raw JSON.`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Data}`, detail: "high" }
            },
            {
              type: "text",
              text: `Analyze this person s skin. Return this exact JSON:\n{\n  "overallGlowScore": number (0-100),\n  "skinType": "oily" | "dry" | "combination" | "normal" | "sensitive",\n  "concerns": [\n    {\n      "name": string,\n      "score": number (0-100, higher = worse),\n      "severity": "mild" | "moderate" | "high",\n      "explanation": string (2 sentences, personalized for Indian skin),\n      "recommendedIngredient": string\n    }\n  ],\n  "insights": [\n    { "finding": string, "explanation": string }\n  ],\n  "climateNote": string (advice specific to ${city} climate),\n  "routineComplexity": "basic" | "intermediate" | "advanced"\n}`
            }
          ]
        }
      ]
    });

    // STEP 3 — Parse and validate
    const raw = completion.choices[0].message.content ?? "";
    
    let report;
    try {
      // Strip markdown code blocks if the model accidentally includes them
      const jsonStr = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      report = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse OpenAI JSON:", raw);
      return NextResponse.json({ error: "parse_failed", message: "Could not read skin report" }, { status: 500 });
    }

    // Safety fallback for bad images determined by the model text
    if (report.error || report.unclear_image) {
      return NextResponse.json({ 
        error: "unclear_image", 
        message: report.message || "Please retake in better lighting" 
      }, { status: 400 });
    }

    // STEP 4 — Save to Supabase
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
      // Return with temp ID if db fails
      return NextResponse.json({
        reportId: `temp_${Date.now()}`,
        ...report
      });
    }

    // STEP 5 — Return
    return NextResponse.json({
      reportId: saved.id,
      ...report
    });

  } catch (error: any) {
    console.error("API Error in analyze-skin:", error);

    if (error?.status === 400 && error?.error?.message?.includes("image")) {
       return NextResponse.json({ error: "unclear_image", message: "Please retake in better lighting" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "server_error", message: "An unexpected error occurred while analyzing your skin." }, 
      { status: 500 }
    );
  }
}

