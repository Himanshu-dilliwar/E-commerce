// app/api/addresses/route.ts
import { NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";
import { auth } from "@clerk/nextjs/server";

/**
 * GET  /api/addresses  -> returns current user's addresses
 * POST /api/addresses  -> create a new address for the current user
 */

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

    const query = `*[_type == "address" && clerkUserId == $userId] | order(isDefault desc, createdAt desc) {
      _id, name, email, address, city, state, pincode, isDefault, createdAt
    }`;
    const data = await backendClient.fetch(query, { userId });
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("GET /api/addresses error:", err?.responseBody ?? err?.message ?? err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

    const body = await req.json();

    // minimal validation (use more strict on client or server if needed)
    const required = ["name", "address", "city", "state", "pincode"];
    for (const f of required) {
      if (!body?.[f]) {
        return NextResponse.json({ ok: false, error: `Missing field: ${f}` }, { status: 400 });
      }
    }

    // validate pincode server-side (6-digit Indian PIN)
    const pincode = String(body.pincode || "").trim();
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return NextResponse.json({ ok: false, error: "Invalid pincode (must be 6 digits)" }, { status: 400 });
    }

    const doc = {
      _type: "address",
      clerkUserId: userId,
      name: String(body.name),
      email: body.email ? String(body.email) : null,
      address: String(body.address),
      city: String(body.city),
      state: String(body.state),
      pincode,
      isDefault: !!body.isDefault,
      createdAt: new Date().toISOString(),
    };

    // create address
    const created = await backendClient.create(doc);

    // if it's default, unset others (loop safe approach)
    if (doc.isDefault) {
      const others: string[] = await backendClient.fetch(
        `*[_type == "address" && clerkUserId == $userId && _id != $id && isDefault == true]._id`,
        { userId, id: created._id }
      );
      for (const otherId of others || []) {
        try {
          await backendClient.patch(otherId).set({ isDefault: false }).commit();
        } catch (e) {
          console.warn("Could not unset isDefault for", otherId, e);
        }
      }
    }

    return NextResponse.json({ ok: true, doc: created });
  } catch (err: any) {
    console.error("POST /api/addresses error:", err?.responseBody ?? err?.message ?? err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
