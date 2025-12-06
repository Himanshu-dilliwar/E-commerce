//app/create-order/route.ts
import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/actions/createCheckoutSession";

export async function POST(request: Request) {
  try {
    const { items, metadata } = await request.json();

    if (!items || !metadata) {
      return NextResponse.json(
        { error: "Missing items or metadata" },
        { status: 400 }
      );
    }

    const payload = await createCheckoutSession(items, metadata);

    if (!payload?.orderId) {
      return NextResponse.json(
        { error: "Failed to create Razorpay order" },
        { status: 500 }
      );
    }

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("create-order error:", err);
    return NextResponse.json(
      { error: err.message || "Order creation failed" },
      { status: 500 }
    );
  }
}
