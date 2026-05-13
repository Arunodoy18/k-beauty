import { NextResponse } from "next/server";
import { sendSkinReportEmail } from "@/lib/email/send-report";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { userId, reportId, email, name } = body;

    if (!userId || !reportId || !email || !name) {
      return NextResponse.json(
        {
          error: "missing_field",
          message: "Missing required fields: userId, reportId, email, name",
        },
        { status: 400 }
      );
    }

    // Fetch the parsed JSON report from Supabase
    const { data: reportRecord, error: fetchError } = await supabase
      .from("skin_reports")
      .select(
        "overall_glow_score, skin_type, concerns, insights, climate_note, routine_complexity"
      )
      .eq("id", reportId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !reportRecord) {
      console.error("Error fetching skin report:", fetchError);
      return NextResponse.json(
        { error: "not_found", message: "Report not found or unavailable" },
        { status: 404 }
      );
    }

    const reportPayload = {
      overallGlowScore: reportRecord.overall_glow_score,
      skinType: reportRecord.skin_type,
      concerns: reportRecord.concerns,
      insights: reportRecord.insights,
      climateNote: reportRecord.climate_note,
      routineComplexity: reportRecord.routine_complexity,
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myglow.in';

    // Dispatch Resend Email
    const { data, error } = await sendSkinReportEmail(
      email,
      name,
      reportPayload,
      reportId,
      appUrl
    );

    if (error) {
      console.error("Resend delivery failed:", error);
      return NextResponse.json(
        { error: "email_failed", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { messageId: data?.id },
    });

  } catch (error: unknown) {
    console.error("API Error in send-report-email:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred while sending the email.";
    return NextResponse.json(
      {
        error: "server_error",
        message,
      },
      { status: 500 }
    );
  }
}
