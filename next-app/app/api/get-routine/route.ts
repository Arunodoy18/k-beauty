import { textModel, parseGeminiJSON } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const reportId = req.nextUrl.searchParams.get("reportId");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!reportId || !userId) {
    return NextResponse.json(
      { error: "missing_params", message: "reportId and userId are required" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Fetch report
    const { data: report, error: reportError } = await supabase
      .from("skin_reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", userId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: "report_not_found", message: "Report not found" },
        { status: 404 }
      );
    }

    // 2. Fetch matching products from catalog
    const primaryConcern = Array.isArray(report.concerns)
      ? report.concerns[0]?.name?.toLowerCase()
      : undefined;

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .contains("concerns_targeted", primaryConcern ? [primaryConcern] : []);

    if (productsError) {
      console.error("Error fetching products:", productsError);
    }

    // 3. Use Gemini Flash to write personalized copy for each product
    const topConcerns = Array.isArray(report.concerns)
      ? report.concerns
          .slice(0, 3)
          .map((c: any) => c.name)
          .filter(Boolean)
          .join(", ")
      : "";

    const prompt = `You are a Korean skincare expert writing personalized
product recommendations for an Indian woman.

Her skin type: ${report.skin_type}
Top concerns: ${topConcerns || "general skin health"}
City: from a city with this climate note: ${report.climate_note}

For each of these routine steps, write a "why this works for you"
explanation in exactly 1 sentence (max 18 words), warm and specific.

Steps: Cleanser, Toner, Serum, Moisturizer, SPF

Return ONLY this JSON:
{
  "cleanser": string,
  "toner": string,
  "serum": string,
  "moisturizer": string,
  "spf": string
}`;

    let whyCopy;
    try {
      const result = await textModel.generateContent(prompt);
      whyCopy = parseGeminiJSON(result.response.text());
    } catch (err) {
      console.error("Gemini routine copy error:", err);
      return NextResponse.json(
        { error: "ai_error", message: "Failed to generate routine copy" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        report,
        products: products ?? [],
        personalizedCopy: whyCopy,
      },
    });
  } catch (error) {
    console.error("Error building routine:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to build routine" },
      { status: 500 }
    );
  }
}
