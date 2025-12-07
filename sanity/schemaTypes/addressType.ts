import { HomeIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const addressType = defineType({
  name: "address",
  title: "Addresses",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({
      name: "clerkUserId",
      title: "User ID",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "name",
      title: "Address Name",
      type: "string",
      description: "Home, Work, etc.",
      validation: (Rule) => Rule.required().max(50),
    }),

    defineField({
      name: "email",
      title: "Email",
      type: "string",
    }),

    defineField({
      name: "address",
      title: "Street Address",
      type: "string",
      validation: (Rule) => Rule.required().min(5).max(200),
    }),

    defineField({
      name: "city",
      title: "City",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "state",
      title: "State (India)",
      type: "string",
      options: {
        list: [
          { title: "Andhra Pradesh", value: "Andhra Pradesh" },
          { title: "Assam", value: "Assam" },
          { title: "Bihar", value: "Bihar" },
          { title: "Chhattisgarh", value: "Chhattisgarh" },
          { title: "Delhi", value: "Delhi" },
          { title: "Goa", value: "Goa" },
          { title: "Gujarat", value: "Gujarat" },
          { title: "Haryana", value: "Haryana" },
          { title: "Himachal Pradesh", value: "Himachal Pradesh" },
          { title: "Jammu and Kashmir", value: "Jammu and Kashmir" },
          { title: "Jharkhand", value: "Jharkhand" },
          { title: "Karnataka", value: "Karnataka" },
          { title: "Kerala", value: "Kerala" },
          { title: "Madhya Pradesh", value: "Madhya Pradesh" },
          { title: "Maharashtra", value: "Maharashtra" },
          { title: "Manipur", value: "Manipur" },
          { title: "Meghalaya", value: "Meghalaya" },
          { title: "Mizoram", value: "Mizoram" },
          { title: "Nagaland", value: "Nagaland" },
          { title: "Odisha", value: "Odisha" },
          { title: "Punjab", value: "Punjab" },
          { title: "Rajasthan", value: "Rajasthan" },
          { title: "Sikkim", value: "Sikkim" },
          { title: "Tamil Nadu", value: "Tamil Nadu" },
          { title: "Telangana", value: "Telangana" },
          { title: "Tripura", value: "Tripura" },
          { title: "Uttar Pradesh", value: "Uttar Pradesh" },
          { title: "Uttarakhand", value: "Uttarakhand" },
          { title: "West Bengal", value: "West Bengal" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "pincode",
      title: "Pincode",
      type: "string",
      validation: (Rule) =>
  Rule.required()
    .regex(/^[1-9][0-9]{5}$/, { name: "pincode" })
    .error("Pincode must be a 6-digit Indian PIN code"),

    }),

    defineField({
      name: "isDefault",
      title: "Is Default Address?",
      type: "boolean",
      initialValue: false,
    }),

    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],

  preview: {
    select: {
      title: "name",
      subtitle: "address",
      city: "city",
      state: "state",
      isDefault: "isDefault",
    },
    prepare({ title, subtitle, city, state, isDefault }) {
      return {
        title: `${title} ${isDefault ? "(Default)" : ""}`,
        subtitle: `${subtitle}, ${city}, ${state}`,
      };
    },
  },
});
