// lib/makeSanityOrderId.ts
export function makeSanityOrderId(razorpayOrderId: string) {
  if (!razorpayOrderId) return `order_${Date.now()}`;
  // remove any leading "order_" (one or more) and any accidental whitespace
  const bare = razorpayOrderId.toString().trim().replace(/^order_+/, "");
  return `order_${bare}`;
}
