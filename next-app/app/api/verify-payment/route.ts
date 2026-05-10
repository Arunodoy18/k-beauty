
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key";

    // Create expected signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = hmac.digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Signature is valid
      // Note for real usage: Insert order into Supabase here
      return NextResponse.json(
        { success: true, message: "Payment successfully verified." },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Payment verification failed." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying signature:", error);
    return NextResponse.json({ error: "Failed to verify signature" }, { status: 500 });
  }
}

