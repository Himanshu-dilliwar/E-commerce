// app/api/webhooks/razorpay/route.ts
import crypto from "crypto";
import { NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";
import { makeSanityOrderId } from "@/lib/makeSanityOrderId";

/**
 * Razorpay webhook handler
 * - verifies x-razorpay-signature (HMAC SHA256 over raw body)
 * - handles payment.captured and order.paid events
 * - upserts order document in Sanity (deterministic _id)
 * - updates product stock levels (best-effort)
 */

async function updateStockLevels(stockUpdates: { productId: string; quantity: number }[]) {
  for (const { productId, quantity } of stockUpdates) {
    try {
      // fetch current stock (safe cross-version)
      const prod = await backendClient.fetch(
        `*[_type == "product" && _id == $id][0]{_id, stock}`,
        { id: productId }
      );

      if (!prod) {
        console.warn(`Product ${productId} not found`);
        continue;
      }

      const currentStock = typeof prod.stock === "number" ? prod.stock : 0;
      const newStock = Math.max(currentStock - Number(quantity || 0), 0);

      await backendClient.patch(productId).set({ stock: newStock }).commit();
      console.log(`Stock updated for ${productId}: ${currentStock} -> ${newStock}`);
    } catch (err) {
      console.error(`Failed to update stock for ${productId}:`, err);
    }
  }
}

export async function POST(req: Request) {
  try {
    const raw = await req.text(); // raw body required for signature verification
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!signature) {
      console.warn("Missing x-razorpay-signature header");
      return NextResponse.json({ ok: false, message: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("Missing RAZORPAY_KEY_SECRET in environment");
      // reply 200 to acknowledge but log for ops — or use 500 depending on your preference
      return NextResponse.json({ ok: false, message: "Server misconfigured" }, { status: 500 });
    }

    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (expected !== signature) {
      console.warn("Invalid webhook signature", { expected, signature });
      return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(raw);
    console.log("Razorpay webhook event:", event.event);

    if (event.event === "payment.captured" || event.event === "order.paid") {
      // Normalize entity: payment.entity vs order.entity
      const entity =
        event.event === "payment.captured"
          ? event.payload?.payment?.entity
          : event.payload?.order?.entity;

      if (!entity) {
        console.warn("Webhook missing entity payload", event);
        return NextResponse.json({ ok: false, message: "Missing entity" }, { status: 400 });
      }

      // Extract IDs and fields
      const razorpayOrderId = entity.order_id ?? entity.id ?? null;
      // For order.paid, entity may be an order object; pick a payment id if available
      let razorpayPaymentId = entity.id ?? null;
      if (!razorpayPaymentId && event.event === "order.paid" && Array.isArray(entity.payments) && entity.payments.length > 0) {
        razorpayPaymentId = entity.payments[0].id;
      }

      const status = entity.status ?? "unknown";
      const amount = entity.amount ?? entity.amount_paid ?? null;
      const currency = entity.currency ?? "INR";
      const notes = entity.notes ?? {};

      // parse items & address from notes (notes.items is stringified JSON in our create flow)
      let items: any[] = [];
      try {
        if (notes.items) items = typeof notes.items === "string" ? JSON.parse(notes.items) : notes.items;
      } catch (err) {
        console.warn("Failed parsing notes.items", err);
        items = [];
      }

      let parsedAddress = null;
      try {
        if (notes.address) parsedAddress = typeof notes.address === "string" ? JSON.parse(notes.address) : notes.address;
      } catch (err) {
        parsedAddress = null;
      }

      // Build sane order data matching your schema
      const orderIdForDoc = razorpayOrderId ?? `order_${Date.now()}`;
      const docId = makeSanityOrderId(orderIdForDoc); // deterministic _id

      const orderDoc: any = {
        _id: docId,
        _type: "order",
        orderId: orderIdForDoc,
        orderNumber: notes.orderNumber ?? null,
        status: status === "captured" || status === "paid" ? "paid" : status,
        amount: amount ?? null,
        currency,
        receipt: notes.receipt ?? null,
        customerName: notes.customerName ?? notes.name ?? null,
        customerEmail: notes.customerEmail ?? null,
        clerkUserId: notes.clerkUserId ?? notes.userId ?? null,
        address: parsedAddress,
        items,
        notes: typeof notes === "string" ? notes : JSON.stringify(notes),
        orderDate: new Date().toISOString(),
        payment: {
          paymentId: razorpayPaymentId ?? null,
          status,
          verifiedAt: new Date().toISOString(),
          raw: JSON.stringify(entity ?? {}),
        },
      };

      try {
        // Upsert: create minimal doc if missing, then set fields
        await backendClient.createIfNotExists({ _id: docId, _type: "order", orderId: orderDoc.orderId });
        await backendClient.patch(docId).set(orderDoc).commit({ autoGenerateArrayKeys: true });

        // Prepare stock updates
        const stockUpdates: { productId: string; quantity: number }[] = [];
        for (const it of items) {
          const pid = (it.productId || it._id || (it.product && it.product._ref) || "").toString();
          const qty = Number(it.qty ?? it.quantity ?? it.q ?? 1);
          if (pid) stockUpdates.push({ productId: pid, quantity: qty });
        }

        if (stockUpdates.length) {
          await updateStockLevels(stockUpdates);
        }

        console.log("Webhook processed and order upserted:", docId);
      } catch (err) {
        console.error("Failed to upsert order or update stock:", err);
        // Return 200 so Razorpay doesn't keep retrying excessively; review logs & fix
        return NextResponse.json({ ok: true, warning: "Processed but upsert failed" });
      }

      return NextResponse.json({ ok: true });
    }

    // event not handled - respond 200 so Razorpay considers it delivered
    console.log("Ignored razorpay event:", event.event);
    return NextResponse.json({ ok: true, message: "Ignored event" });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    // don't expose error detail to the caller
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
