import { textModel, parseGeminiJSON } from "@/lib/gemini";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

type ReportConcern = { name?: string };

export async function GET(req: NextRequest) {
  const reportId = req.nextUrl.searchParams.get("reportId");

  if (!reportId) {
    return NextResponse.json(
      { error: "missing_params", message: "reportId is required" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();

  try {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth?.user) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be signed in." },
        { status: 401 }
      );
    }

    // 1. Fetch report
    const { data: report, error: reportError } = await supabase
      .from("skin_reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", auth.user.id)
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

    let productsQuery = supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (primaryConcern) {
      productsQuery = productsQuery.contains("concerns_targeted", [primaryConcern]);
    }

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) {
      console.error("Error fetching products:", productsError);
    }

    // 3. Use Gemini Flash to write personalized copy for each product
    const topConcerns = Array.isArray(report.concerns)
      ? report.concerns
          .slice(0, 3)
          .map((c: ReportConcern) => c.name)
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
