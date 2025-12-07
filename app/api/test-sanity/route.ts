// app/api/test-sanity/route.ts
import { NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";

export async function GET() {
  try {
    const docId = `test_${Date.now()}`;

    const doc = await backendClient.create({
      _id: docId,
      _type: "order",
      test: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, doc });
  } catch (err: any) {
    console.error("Sanity write error:", err?.responseBody || err);
    return NextResponse.json(
      { ok: false, error: err?.responseBody || err?.message },
      { status: 500 }
    );
  }
}
