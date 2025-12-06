// app/api/webhooks/razorpay/route.ts
import crypto from "crypto";
import { NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";

/**
 * Razorpay sends webhook signature in header: x-razorpay-signature
 * The signature = HMAC_SHA256(rawBody, RAZORPAY_KEY_SECRET)
 *
 * This route handles events like 'payment.captured' and 'order.paid'
 * and creates/updates an order doc in Sanity, then updates product stock.
 */

async function updateStockLevels(stockUpdates: { productId: string; quantity: number }[]) {
  for (const { productId, quantity } of stockUpdates) {
    try {
      const product = await backendClient.getDocument(productId);
      if (!product || typeof product.stock !== "number") {
        console.warn(`Product ${productId} not found or invalid stock`);
        continue;
      }
      const newStock = Math.max(product.stock - quantity, 0);
      await backendClient.patch(productId).set({ stock: newStock }).commit();
    } catch (err) {
      console.error(`Failed to update stock for ${productId}:`, err);
    }
  }
}

export async function POST(req: Request) {
  try {
    const raw = await req.text(); // *** important: use raw body for signature verification
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!signature) {
      console.warn("No x-razorpay-signature header present");
      return NextResponse.json({ ok: false, message: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is not configured on the server");
      return NextResponse.json({ ok: false, message: "Server missing config" }, { status: 500 });
    }

    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (expected !== signature) {
      console.warn("Invalid webhook signature", { expected, signature });
      return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(raw);

    // DEBUG
    console.log("Razorpay webhook received:", event.event);

    // Handle payment.captured and order.paid (you can extend for other events)
    if (event.event === "payment.captured" || event.event === "order.paid") {
      // When payment.captured -> payload.payment.entity
      // When order.paid -> payload.order.entity (may include payments array)
      const entity =
        event.event === "payment.captured"
          ? event.payload?.payment?.entity
          : event.payload?.order?.entity;

      if (!entity) {
        console.warn("Webhook event missing entity", event);
        return NextResponse.json({ ok: false, message: "Missing entity" }, { status: 400 });
      }

      // Extract relevant fields (Razorpay object shape)
      const razorpayOrderId = entity.order_id ?? entity.id; // payment.entity has order_id; order.entity has id
      const razorpayPaymentId = entity.id; // payment id if payment.entity; for order.paid you may need to read payments array
      const status = entity.status ?? "unknown";
      const amount = entity.amount ?? entity.amount_paid ?? null;
      const currency = entity.currency ?? "INR";
      const notes = entity.notes ?? {};

      // If this is an order object with payments array (order.paid), pick first payment
      let paymentId = razorpayPaymentId;
      if (!paymentId && event.event === "order.paid" && entity.payments && entity.payments.length > 0) {
        paymentId = entity.payments[0].id;
      }

      // Parse items & address from notes (we expect these to be stored as JSON strings when creating order)
      let items = [];
      try {
        if (notes.items) items = typeof notes.items === "string" ? JSON.parse(notes.items) : notes.items;
      } catch (err) {
        console.warn("Failed to parse notes.items", err);
        items = [];
      }

      let parsedAddress = null;
      try {
        if (notes.address) parsedAddress = typeof notes.address === "string" ? JSON.parse(notes.address) : notes.address;
      } catch (err) {
        parsedAddress = null;
      }

      // Build order document for Sanity
      const orderDoc: any = {
        _type: "order",
        orderId: razorpayOrderId ?? `order_${Date.now()}`,
        paymentId: paymentId ?? null,
        status,
        amount,
        currency,
        receipt: notes.receipt ?? null,
        customerName: notes.customerName ?? notes.name ?? null,
        customerEmail: notes.customerEmail ?? null,
        userId: notes.clerkUserId ?? null,
        address: parsedAddress,
        items: items,
        notes: JSON.stringify(notes),
        orderDate: new Date().toISOString(),
      };

      // optionally use a stable _id so we can patch later: e.g. order_<razorpayOrderId>
      const docId = `order_${orderDoc.orderId}`;

      try {
        // Upsert pattern: create if missing, otherwise patch existing document
        await backendClient
          .patch(docId)
          .setIfMissing({ _type: "order", orderId: orderDoc.orderId })
          .set(orderDoc)
          .commit({ autoGenerateArrayKeys: true });

        // Prepare stock updates from items (items should include productId and quantity)
        const stockUpdates: { productId: string; quantity: number }[] = [];
        for (const it of items) {
          // Expect each item: { productId, qty } or { productId, quantity } or { productId, qty: number }
          const pid = it.productId || it._id || it.product?._ref;
          const qty = it.qty ?? it.quantity ?? it.q ?? 1;
          if (pid) stockUpdates.push({ productId: pid, quantity: Number(qty) });
        }

        // Update stock levels
        await updateStockLevels(stockUpdates);

        console.log("Order saved to Sanity:", orderDoc.orderId);
      } catch (err) {
        console.error("Failed to save order or update stock:", err);
        // still return 200 to acknowledge webhook, but log the error for manual fix
        return NextResponse.json({ ok: true, message: "Webhook processed but saving failed" });
      }

      return NextResponse.json({ ok: true });
    }

    // Not handled event
    console.log("Unhandled razorpay event:", event.event);
    return NextResponse.json({ ok: true, message: "Ignored event" });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
