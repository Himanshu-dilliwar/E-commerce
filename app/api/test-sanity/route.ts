// app/api/test-sanity/route.ts
import { NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";

export async function GET() {
  try {
    const doc = await backendClient.create({
      _type: "order",
      test: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, doc });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }
}
