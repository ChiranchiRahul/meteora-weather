// src/app/api/requests/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // <-- named import (matches your db.ts)

// Next.js passes params as a Promise in App Router handlers.
// We'll define a Context type and always await context.params.
type Context = { params: Promise<{ id: string }> };

// GET /api/requests/[id]  -> fetch a single saved request
export async function GET(_req: Request, context: Context) {
  const { id } = await context.params;

  const row = await prisma.weatherRequest.findUnique({
    where: { id },
    include: { location: true, snapshot: true },
  });

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

// PATCH /api/requests/[id] -> update dates/notes (with basic validation)
export async function PATCH(req: Request, context: Context) {
  const { id } = await context.params;

  const body = await req.json().catch(() => ({} as any));
  const { dateStart, dateEnd, notes } = body ?? {};

  if (dateStart && dateEnd) {
    const ds = new Date(dateStart);
    const de = new Date(dateEnd);
    if (Number.isNaN(ds.getTime()) || Number.isNaN(de.getTime())) {
      return NextResponse.json({ error: "Invalid date(s)" }, { status: 400 });
    }
    if (ds > de) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.weatherRequest.update({
    where: { id },
    data: {
      ...(dateStart ? { dateStart: new Date(dateStart) } : {}),
      ...(dateEnd ? { dateEnd: new Date(dateEnd) } : {}),
      ...(typeof notes === "string" ? { notes } : {}),
    },
    include: { location: true, snapshot: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/requests/[id] -> remove a request
export async function DELETE(_req: Request, context: Context) {
  const { id } = await context.params;

  await prisma.weatherRequest.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}