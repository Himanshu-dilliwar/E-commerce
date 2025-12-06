// app/api/confirm-payment/route.ts
import { NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/actions/createCheckoutSession";
import { backendClient } from "@/sanity/lib/backendClient";
import { makeSanityOrderId } from "@/lib/makeSanityOrderId";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      metadata, // passed from client (orderNumber, customerName, address, etc.)
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing required razorpay params" },
        { status: 400 }
      );
    }

    // Verify signature (server-side, using your secret)
    const verified = await verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!verified) {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    // Build doc id used in createCheckoutSession: order_<razorpayOrderId>
    const docId = makeSanityOrderId(razorpay_order_id);

    // Payment object we want to save
    const paymentObj = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
      verifiedAt: new Date().toISOString(),
    };

    // The patch we want to apply
    const patchPayload: any = {
      status: "paid",
      paymentId: razorpay_payment_id,
      payment: paymentObj,
      // keep metadata if provided (customerName, orderNumber, address, etc.)
      metadata: metadata ?? {},
      // record verification time
      notes: JSON.stringify({
        paidAt: new Date().toISOString(),
        ...(metadata?.notes ? { previousNotes: metadata.notes } : {}),
      }),
    };

    // Try to patch existing doc. If it doesn't exist, create a minimal one.
    try {
      // ensure doc exists and then update
      await backendClient.createIfNotExists({
        _id: docId,
        _type: "order",
        orderId: razorpay_order_id,
      });
      await backendClient
        .patch(docId)
        .set(patchPayload)
        .commit({ autoGenerateArrayKeys: true });
      console.log("Sanity order patched:", docId);
    } catch (patchErr) {
      console.error(
        "Patch/createIfNotExists failed in confirm-payment:",
        patchErr
      );
      // try createIfNotExists with a full minimal doc
      const orderDoc: any = {
        _id: docId,
        _type: "order",
        orderId: razorpay_order_id,
        orderNumber: metadata?.orderNumber ?? null,
        status: "paid",
        customerName: metadata?.customerName ?? null,
        customerEmail: metadata?.customerEmail ?? null,
        userId: metadata?.clerkUserId ?? null,
        address: metadata?.address ?? null,
        payment: paymentObj,
        metadata: metadata ?? {},
        notes: JSON.stringify({ paidAt: new Date().toISOString() }),
        orderDate: new Date().toISOString(),
      };

      try {
        await backendClient.createIfNotExists(orderDoc);
        console.log("Created minimal Sanity order doc:", docId);
      } catch (createErr) {
        console.error(
          "Failed to create Sanity order doc after patch error:",
          createErr
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("confirm-payment route error:", err);
    return NextResponse.json(
      { success: false, message: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
