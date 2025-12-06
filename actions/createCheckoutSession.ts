// // actions/createCheckoutSession.ts
// "use server";

// import Razorpay from "razorpay";
// import crypto from "crypto";
// import { urlFor } from "@sanity/lib/image";
// import { Address } from "@/sanity.types";
// import { CartItem } from "@/store";

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });

// function buildReceiptId(orderNumber?: string) {
//   const base = orderNumber?.toString() ?? String(Date.now());
//   const safe = base.replace(/[^a-zA-Z0-9-_]/g, "");
//   if (safe.length <= 36) return `rcpt_${safe}`.slice(0, 40);
//   const prefix = safe.slice(0, 28);
//   const suffix = Math.random().toString(36).slice(2, 8); // 6 chars
//   return `rcpt_${(prefix + suffix).slice(0, 36)}`.slice(0, 40);
// }

// export interface Metadata {
//   orderNumber: string;
//   customerName: string;
//   customerEmail: string;
//   clerkUserId?: string;
//   address?: Address | null;
// }

// export interface GroupedCartItems {
//   product: CartItem["product"];
//   quantity: number;
// }

// export async function createCheckoutSession(
//   items: GroupedCartItems[],
//   metadata: Metadata
// ) {
//   const subtotalINR = items.reduce((acc, it) => {
//     const price = Number(it.product?.price ?? 0);
//     return acc + price * (it.quantity ?? 1);
//   }, 0);

//   const amountPaise = Math.round(subtotalINR * 100);

//   try {
//     const receipt = buildReceiptId(metadata.orderNumber ?? Date.now());

//     const orderOptions = {
//       amount: amountPaise,
//       currency: "INR",
//       receipt,
//       payment_capture: 1,
//       notes: {
//         orderNumber: metadata.orderNumber,
//         customerName: metadata.customerName,
//         customerEmail: metadata.customerEmail,
//         clerkUserId: metadata.clerkUserId ?? "",
//         address: metadata.address ? JSON.stringify(metadata.address) : "",
//       },
//     };

//     const order = await razorpay.orders.create(orderOptions);

//     const responsePayload = {
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       receipt: order.receipt,
//       keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
//       items: items.map((it) => ({
//         id: it.product?._id,
//         name: it.product?.name,
//         qty: it.quantity,
//         price: it.product?.price,
//         image:
//           it.product?.images && it.product.images.length > 0
//             ? urlFor(it.product.images[0]).url()
//             : undefined,
//       })),
//     };
//     console.log("🟦 Razorpay Order Created:", order);

//     return responsePayload;
//   } catch (err: any) {
//     // Log more useful debugging info
//     console.error("Razorpay create order error:", {
//       message: err?.message,
//       statusCode: err?.statusCode,
//       error: err?.error,
//     });
//     throw err;
//   }
// }

// export async function verifyRazorpaySignature(payload: {
//   razorpay_order_id: string;
//   razorpay_payment_id: string;
//   razorpay_signature: string;
// }): Promise<boolean> {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
//   const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
//   hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
//   const digest = hmac.digest("hex");
//   return digest === razorpay_signature;
// }

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
  orderNumber: string;
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
  // compute subtotal in INR
  const subtotalINR = items.reduce((acc, it) => {
    const price = Number(it.product?.price ?? 0);
    return acc + price * (it.quantity ?? 1);
  }, 0);

  // Razorpay expects amount in paise (integer)
  const amountPaise = Math.round(subtotalINR * 100);

  try {
    // build safe receipt (<= 40 chars)
    const receipt = buildReceiptId(metadata.orderNumber ?? Date.now());

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
        orderNumber: metadata.orderNumber,
        customerName: metadata.customerName,
        customerEmail: metadata.customerEmail,
        clerkUserId: metadata.clerkUserId ?? "",
        address: metadata.address ? JSON.stringify(metadata.address) : "",
        items: notesItems,
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    console.log("🟦 Razorpay Order Created:", order);

    // Build response payload for client
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
    // Use stable doc id so we can patch it later: `order_<razorpayOrderId>`
    const docId = makeSanityOrderId(order.id);

    try {
      const docId = `${order.id}`;
      const orderDoc: any = {
        _id: docId,
        _type: "order",
        orderId: order.id,
        status: "created",
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        customerName: metadata.customerName,
        customerEmail: metadata.customerEmail,
        userId: metadata.clerkUserId ?? null,
        address: metadata.address ?? null,
        items: JSON.parse(notesItems),
        notes: JSON.stringify({ createdAt: new Date().toISOString() }),
        orderDate: new Date().toISOString(),
      };

      try {
        await backendClient.createIfNotExists(orderDoc);
        await backendClient
          .patch(docId)
          .set(orderDoc)
          .commit({ autoGenerateArrayKeys: true });

        console.log("🟪 Initial Order doc created/updated in Sanity:", docId);
      } catch (err) {
        console.error("Failed creating initial Sanity order doc:", err);
        // proceed — the order was created on Razorpay; we'll still try to handle updates in confirm-payment
      }
    } catch (err) {
      console.error("Failed creating initial Sanity order doc:", err);
      // proceed without failing payment creation - order can be created/updated later by webhook/confirm route
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    payload;
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const digest = hmac.digest("hex");
  return digest === razorpay_signature;
}
