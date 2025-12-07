// app/api/addresses/default/route.ts
import { NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { addressId } = body;
    if (!addressId) return NextResponse.json({ ok: false, error: "Missing addressId" }, { status: 400 });

    // Verify the address belongs to this user
    const address = await backendClient.fetch(
      `*[_type == "address" && _id == $id && clerkUserId == $userId][0]{_id, isDefault}`,
      { id: addressId, userId }
    );
    if (!address) return NextResponse.json({ ok: false, error: "Address not found" }, { status: 404 });

    // Unset other defaults for this user
    const others = await backendClient.fetch(
      `*[_type == "address" && clerkUserId == $userId && _id != $id && isDefault == true]{_id}`,
      { userId, id: addressId }
    );

    try {
      for (const o of others || []) {
        await backendClient.patch(o._id).set({ isDefault: false }).commit();
      }

      await backendClient.patch(addressId).set({ isDefault: true }).commit();

      return NextResponse.json({ ok: true });
    } catch (err: any) {
      console.error("Failed set-default patch:", err?.responseBody ?? err?.message ?? err);
      return NextResponse.json({ ok: false, error: "Failed to update defaults" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("POST /api/addresses/default error:", err?.responseBody ?? err?.message ?? err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
