// actions/createCheckoutSession.ts
"use server";

import Razorpay from "razorpay";
import crypto from "crypto";
import { urlFor } from "@sanity/lib/image";
import { Address } from "@/sanity.types";
import { CartItem } from "@/store";
import { backendClient } from "@/sanity/lib/backendClient"; // server-side Sanity client (must have write token)
import { makeSanityOrderId } from "@/lib/makeSanityOrderId";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

function buildReceiptId(orderNumber?: string) {
  const base = orderNumber?.toString() ?? String(Date.now());
  const safe = base.replace(/[^a-zA-Z0-9-_]/g, "");
  if (safe.length <= 36) return `rcpt_${safe}`.slice(0, 40);
  const prefix = safe.slice(0, 28);
  const suffix = Math.random().toString(36).slice(2, 8); // 6 chars
  return `rcpt_${(prefix + suffix).slice(0, 36)}`.slice(0, 40);
}

export interface Metadata {
  orderNumber?: string; // made optional — we will generate if missing
  customerName: string;
  customerEmail: string;
  clerkUserId?: string;
  address?: Address | null;
}

export interface GroupedCartItems {
  product: CartItem["product"];
  quantity: number;
}

export async function createCheckoutSession(
  items: GroupedCartItems[],
  metadata: Metadata
) {
  // Basic validation
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No items provided for checkout.");
  }
  if (!metadata || !metadata.customerName || !metadata.customerEmail) {
    throw new Error("Missing customer information in metadata.");
  }

  // Ensure we have an orderNumber to reference (client may omit)
  const orderNumber = metadata.orderNumber ?? crypto.randomUUID();

  // compute subtotal in INR
  const subtotalINR = items.reduce((acc, it) => {
    const price = Number(it.product?.price ?? 0);
    return acc + price * (it.quantity ?? 1);
  }, 0);

  // Razorpay expects amount in paise (integer)
  const amountPaise = Math.round(subtotalINR * 100);

  if (amountPaise <= 0) {
    throw new Error("Invalid order amount (must be > 0).");
  }

  try {
    // build safe receipt (<= 40 chars)
    const receipt = buildReceiptId(orderNumber);

    // prepare compact items to store in notes (stringified)
    const notesItems = JSON.stringify(
      items.map((it) => ({
        productId: it.product?._id,
        name: it.product?.name,
        qty: it.quantity,
        price: it.product?.price,
        image:
          it.product?.images && it.product.images.length > 0
            ? urlFor(it.product.images[0]).url()
            : null,
      }))
    );

    const orderOptions = {
      amount: amountPaise,
      currency: "INR",
      receipt,
      payment_capture: 1,
      notes: {
        orderNumber,
        customerName: metadata.customerName,
        customerEmail: metadata.customerEmail,
        clerkUserId: metadata.clerkUserId ?? "",
        address: metadata.address ? JSON.stringify(metadata.address) : "",
        items: notesItems,
      },
    };

    // Create Razorpay order
    const order = await razorpay.orders.create(orderOptions);

    console.log("🟦 Razorpay Order Created:", {
      id: order?.id,
      amount: order?.amount,
      currency: order?.currency,
      receipt: order?.receipt,
      notes: order?.notes,
    });

    // Build response payload for client (unchanged API)
    const responsePayload = {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      items: items.map((it) => ({
        id: it.product?._id,
        name: it.product?.name,
        qty: it.quantity,
        price: it.product?.price,
        image:
          it.product?.images && it.product.images.length > 0
            ? urlFor(it.product.images[0]).url()
            : undefined,
      })),
    };

    // --- Create initial order doc in Sanity (status: "created") ---
    // Deterministic doc id so we can patch later via confirm-payment or webhook
    const docId = makeSanityOrderId(order.id);

    const orderDoc: any = {
      _id: docId,
      _type: "order",
      orderId: order.id,
      orderNumber,
      status: "created",
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      invoice: { number: order.receipt ?? order.id ?? orderNumber },
      customerName: metadata.customerName,
      customerEmail: metadata.customerEmail,
      clerkUserId: metadata.clerkUserId ?? null,
      address: metadata.address ?? null,
      items: JSON.parse(notesItems),
      notes: JSON.stringify({ createdAt: new Date().toISOString(), rawNotes: orderOptions.notes }),
      orderDate: new Date().toISOString(),
    };

    try {
      // safe upsert: create if missing, then patch to set all fields (idempotent)
      await backendClient.createIfNotExists({ _id: docId, _type: "order", orderId: order.id });
      const patched = await backendClient
        .patch(docId)
        .set(orderDoc)
        .commit({ autoGenerateArrayKeys: true });

      console.log("🟪 Initial Order doc created/updated in Sanity:", {
        docId,
        patchedId: patched?._id ?? null,
      });
    } catch (err) {
      console.error("Failed creating initial Sanity order doc:", err);
      // continue — create successful on Razorpay; confirm-payment or webhook will patch later
    }

    return responsePayload;
  } catch (err: any) {
    console.error("Razorpay create order error:", {
      message: err?.message,
      statusCode: err?.statusCode,
      error: err?.error,
    });
    throw err;
  }
}

/**
 * Verify Razorpay signature (HMAC SHA256).
 * Keep async because this module is a server-action module.
 */
export async function verifyRazorpaySignature(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<boolean> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const digest = hmac.digest("hex");
  return digest === razorpay_signature;
}
