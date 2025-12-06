// sanity/lib/backendClient.ts
import { createClient } from "next-sanity";

// IMPORTANT:
// This token MUST have write permissions.
// Add SANITY_API_WRITE_TOKEN to your .env.local (DO NOT expose it to browser)

export const backendClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false, // must be false for writes
  token: process.env.SANITY_API_WRITE_TOKEN!, // private write token
});
