// sanity/schemas/orderType.ts
import { BasketIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const orderType = defineType({
  name: "order",
  title: "Order",
  type: "document",
  icon: BasketIcon,
  fields: [
    // -----------------------
    // IDENTIFIERS
    // -----------------------
    defineField({
      name: "orderNumber",
      title: "Order Number",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "orderId",
      title: "Razorpay Order ID",
      type: "string",
      description: "Example: order_RoB5NZVxkps3YL",
    }),

    // -----------------------
    // CUSTOMER INFO
    // -----------------------
    defineField({
      name: "customerName",
      title: "Customer Name",
      type: "string",
    }),
    defineField({
      name: "customerEmail",
      title: "Customer Email",
      type: "string",
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: "clerkUserId",
      title: "Clerk User ID",
      type: "string",
    }),

    // -----------------------
    // SHIPPING ADDRESS
    // -----------------------
    defineField({
      name: "address",
      title: "Shipping Address",
      type: "object",
      fields: [
        defineField({ name: "name", title: "Name", type: "string" }),
        defineField({ name: "address", title: "Address", type: "string" }),
        defineField({ name: "city", title: "City", type: "string" }),
        defineField({ name: "state", title: "State", type: "string" }),
        defineField({ name: "zip", title: "Zip Code", type: "string" }),
      ],
    }),

    // -----------------------
    // ORDER ITEMS (flat array)
    // -----------------------
    defineField({
      name: "items",
      title: "Items",
      description: "Flat list stored during checkout (name, qty, price, image).",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "productId", title: "Product ID", type: "string" }),
            defineField({ name: "name", title: "Name", type: "string" }),
            defineField({ name: "qty", title: "Quantity", type: "number" }),
            defineField({ name: "price", title: "Price (INR)", type: "number" }),
            defineField({ name: "image", title: "Image URL", type: "url" }),
          ],
        }),
      ],
    }),

    // -----------------------
    // OPTIONAL PRODUCT REFERENCES
    // -----------------------
    defineField({
      name: "products",
      title: "Products (reference)",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "product",
              title: "Product",
              type: "reference",
              to: [{ type: "product" }],
            }),
            defineField({
              name: "quantity",
              title: "Quantity",
              type: "number",
            }),
          ],
        }),
      ],
    }),

    // -----------------------
    // PRICING
    // -----------------------
    defineField({
      name: "amount",
      title: "Amount (paise)",
      type: "number",
      description: "Example: 75000 paise = ₹750",
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
    }),
    defineField({
      name: "amountDiscount",
      title: "Amount Discount",
      type: "number",
    }),

    // -----------------------
    // PAYMENT DETAILS
    // -----------------------
    defineField({
      name: "payment",
      title: "Payment Details",
      type: "object",
      description: "Stored after Razorpay verification.",
      fields: [
        defineField({ name: "paymentId", title: "Payment ID", type: "string" }),
        defineField({ name: "signature", title: "Signature", type: "string" }),
        defineField({
          name: "verifiedAt",
          title: "Verified At",
          type: "datetime",
        }),
        defineField({
          name: "raw",
          title: "Raw Payment Object (JSON)",
          type: "text",
        }),
      ],
    }),

    // -----------------------
    // ORDER STATUS
    // -----------------------
    defineField({
      name: "status",
      title: "Order Status",
      type: "string",
      options: {
        list: [
          { title: "Created", value: "created" },
          { title: "Paid", value: "paid" },
          { title: "Processing", value: "processing" },
          { title: "Shipped", value: "shipped" },
          { title: "Out for Delivery", value: "out_for_delivery" },
          { title: "Delivered", value: "delivered" },
          { title: "Cancelled", value: "cancelled" },
        ],
      },
    }),

    // -----------------------
    // ORDER DATE
    // -----------------------
    defineField({
      name: "orderDate",
      title: "Order Date",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
  select: {
    customerName: "customerName",
    storeOrder: "orderNumber",
    razorpayOrder: "orderId",
    amount: "amount",
    currency: "currency",
  },
  prepare({ customerName, storeOrder, razorpayOrder, amount, currency }) {
    const snip = storeOrder?.length > 10
      ? `${storeOrder.slice(0, 5)}...${storeOrder.slice(-5)}`
      : storeOrder;

    const rsnip = razorpayOrder?.length > 10
      ? `${razorpayOrder.slice(0, 5)}...${razorpayOrder.slice(-5)}`
      : razorpayOrder;

    return {
      title: `${customerName || "Order"} (${snip})`,
      subtitle: `₹${(amount || 0) / 100} • Razorpay: ${rsnip || "-"}`,
      media: BasketIcon,
    };
  }
}

});
