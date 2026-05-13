
import { NextResponse } from "next/server";

export async function POST() {
  try {
    return NextResponse.json(
      { error: "payments_disabled", message: "Payments are temporarily disabled." },
      { status: 503 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to create order" },
      { status: 500 }
    );
  }
}

