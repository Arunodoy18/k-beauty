
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          error: "missing_field",
          message: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
        },
        { status: 400 }
      );
    }

    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const paymentsEnabled = Boolean(
      razorpayKeySecret && razorpayKeySecret !== "placeholder_secret_key"
    );

    if (!paymentsEnabled) {
      return NextResponse.json(
        { error: "payments_disabled", message: "Payments are temporarily disabled." },
        { status: 503 }
      );
    }

    void supabase;

    const secret = razorpayKeySecret;

    // Create expected signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = hmac.digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Signature is valid
      // Note for real usage: Insert order into Supabase here
      return NextResponse.json(
        { success: true, data: { message: "Payment successfully verified." } },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "payment_verification_failed", message: "Payment verification failed." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying signature:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to verify signature" },
      { status: 500 }
    );
  }
}

