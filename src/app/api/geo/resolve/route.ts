import { NextResponse } from "next/server";
import { resolveLocation } from "@/lib/geocode";
import { locationInputSchema } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = locationInputSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const loc = await resolveLocation(parsed.data.input);
    return NextResponse.json(loc);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to resolve" }, { status: 500 });
  }
}
