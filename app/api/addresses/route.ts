// app/api/addresses/route.ts
import { NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";
import { auth } from "@clerk/nextjs/server";

export async function GET(_req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

    const query = `*[_type == "address" && clerkUserId == $userId] | order(isDefault desc, createdAt desc) {
      _id, name, email, address, city, state, pincode, isDefault, createdAt
    }`;
    const data = await backendClient.fetch(query, { userId });
    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    console.error("GET /api/addresses error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: "Server error: " + message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

    const body = (await req.json()) as unknown;
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    const required = ["name", "address", "city", "state", "pincode"];
    for (const f of required) {
      if (!b[f]) {
        return NextResponse.json({ ok: false, error: `Missing field: ${f}` }, { status: 400 });
      }
    }

    const pincode = String(b.pincode || "").trim();
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return NextResponse.json({ ok: false, error: "Invalid pincode (must be 6 digits)" }, { status: 400 });
    }

    const doc = {
      _type: "address",
      clerkUserId: userId,
      name: String(b.name),
      email: b.email ? String(b.email) : null,
      address: String(b.address),
      city: String(b.city),
      state: String(b.state),
      pincode,
      isDefault: !!b.isDefault,
      createdAt: new Date().toISOString(),
    };

    const created = await backendClient.create(doc);

    if (doc.isDefault) {
      const others = (await backendClient.fetch(
        `*[_type == "address" && clerkUserId == $userId && _id != $id && isDefault == true]._id`,
        { userId, id: created._id }
      )) as string[] | null;
      for (const otherId of others || []) {
        try {
          await backendClient.patch(otherId).set({ isDefault: false }).commit();
        } catch (e: unknown) {
          console.warn("Could not unset isDefault for", otherId, e);
        }
      }
    }

    return NextResponse.json({ ok: true, doc: created });
  } catch (err: unknown) {
    console.error("POST /api/addresses error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: "Server error: " + message }, { status: 500 });
  }
}
