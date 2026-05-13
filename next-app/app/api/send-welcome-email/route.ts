import { NextResponse } from "next/server";
import { sendWaitlistWelcomeEmail } from "@/lib/email/send-report";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "missing_field", message: "Missing required fields: email, name" },
        { status: 400 }
      );
    }


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

  } catch (error: unknown) {
    console.error("API Error in send-welcome-email:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred while sending the welcome email.";
    return NextResponse.json(
      {
        error: "server_error",
        message,
      },
      { status: 500 }
    );
  }
}
