import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveLocation } from "@/lib/geocode";
import { fetchWeather } from "@/lib/weather";
import { dateRangeSchema } from "@/lib/validate";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const row = await prisma.weatherRequest.findUnique({
    where: { id: params.id },
    include: { location: true, snapshot: true }
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const existing = await prisma.weatherRequest.findUnique({ where: { id: params.id }, include: { location: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let loc = existing.location;
    if (typeof body.input === "string" && body.input.trim().length > 0) {
      const newLoc = await resolveLocation(body.input);
      let l = await prisma.location.findFirst({ where: { name: newLoc.name, latitude: newLoc.latitude, longitude: newLoc.longitude }});
      if (!l) {
        l = await prisma.location.create({ data: {
          userInput: body.input,
          name: newLoc.name, latitude: newLoc.latitude, longitude: newLoc.longitude, source: newLoc.source
        }});
      }
      loc = l;
    }

    let ds = existing.dateStart;
    let de = existing.dateEnd;
    if (body.dateStart || body.dateEnd) {
      const parsed = dateRangeSchema.parse({
        dateStart: body.dateStart ?? existing.dateStart,
        dateEnd:   body.dateEnd   ?? existing.dateEnd,
      });
      ds = parsed.dateStart; de = parsed.dateEnd;
    }

    const weather = await fetchWeather(loc.latitude, loc.longitude);
    const snap = await prisma.weatherSnapshot.create({ data: { rawJson: weather as any }});

    const updated = await prisma.weatherRequest.update({
      where: { id: params.id },
      data: {
        locationId: loc.id,
        dateStart: ds,
        dateEnd: de,
        snapshotId: snap.id,
        notes: body.notes ?? existing.notes
      },
      include: { location: true, snapshot: true }
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.weatherRequest.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
