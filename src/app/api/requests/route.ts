import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createRequestSchema, dateRangeSchema } from "@/lib/validate";
import { resolveLocation } from "@/lib/geocode";
import { fetchWeather } from "@/lib/weather";

export async function GET() {
  const rows = await prisma.weatherRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { location: true, snapshot: true },
    take: 100
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { input, dateStart, dateEnd, notes } = body;
    const dates = dateRangeSchema.parse({ dateStart, dateEnd });

    const loc = await resolveLocation(input);
    const weather = await fetchWeather(loc.latitude, loc.longitude);

    const snapshot = await prisma.weatherSnapshot.create({ data: { rawJson: weather as any } });

    let existing = await prisma.location.findFirst({
      where: { name: loc.name, latitude: loc.latitude, longitude: loc.longitude }
    });
    if (!existing) {
      existing = await prisma.location.create({
        data: {
          userInput: input,
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          source: loc.source
        }
      });
    }

    const created = await prisma.weatherRequest.create({
      data: {
        locationId: existing.id,
        dateStart: dates.dateStart,
        dateEnd: dates.dateEnd,
        provider: "open-meteo",
        snapshotId: snapshot.id,
        notes: notes ?? null
      },
      include: { location: true, snapshot: true }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Create failed" }, { status: 500 });
  }
}
