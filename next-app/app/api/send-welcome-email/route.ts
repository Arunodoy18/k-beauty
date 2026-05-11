import { NextResponse } from "next/server";
import { sendWaitlistWelcomeEmail } from "@/lib/email/send-report";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "missing_field", message: "Missing required fields: email, name" },
        { status: 400 }
      );
    }

    void supabase;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myglow.in';

    // Dispatch Resend Welcome Email
    const { data, error } = await sendWaitlistWelcomeEmail(
      email, 
      name, 
      appUrl
    );

    if (error) {
      console.error("Resend Welcome delivery failed:", error);
      return NextResponse.json(
        { error: "email_failed", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { messageId: data?.id },
    });

  } catch (error: any) {
    console.error("API Error in send-welcome-email:", error);
    return NextResponse.json(
      {
        error: "server_error",
        message: "An unexpected error occurred while sending the welcome email.",
      },
      { status: 500 }
    );
  }
}
