
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const paymentsEnabled = Boolean(
      razorpayKeyId &&
        razorpayKeySecret &&
        razorpayKeyId !== "rzp_test_placeholder_key" &&
        razorpayKeySecret !== "placeholder_secret_key"
    );

    if (!paymentsEnabled) {
      return NextResponse.json(
        { error: "payments_disabled", message: "Payments are temporarily disabled." },
        { status: 503 }
      );
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const { amount } = await req.json();

    if (!amount) {
      return NextResponse.json(
        { error: "missing_field", message: "amount is required" },
        { status: 400 }
      );
    }

    void supabase;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: "receipt_order_" + Math.random().toString(36).substring(7),
    });

    return NextResponse.json(
      { success: true, data: { orderId: order.id, amount: order.amount } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to create order" },
      { status: 500 }
    );
  }
}

