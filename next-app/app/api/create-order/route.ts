
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key",
});

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: "receipt_order_" + Math.random().toString(36).substring(7),
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount }, { status: 200 });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

