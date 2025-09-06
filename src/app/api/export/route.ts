// src/app/api/export/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { create } from "xmlbuilder2";
import MarkdownIt from "markdown-it";

// Keep Node runtime (good for Prisma on Vercel)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Format = "json" | "xml" | "md";

function safeRows(rows: any[]) {
  return rows.map((r) => ({
    id: r.id,
    location: r.location?.name ?? "",
    lat: r.location?.latitude ?? "",
    lon: r.location?.longitude ?? "",
    dateStart: r.dateStart,
    dateEnd: r.dateEnd,
    provider: r.provider,
    fetchedAt: r.fetchedAt,
  }));
}

function toXML(rows: any[]) {
  const root = create({ version: "1.0" }).ele("requests");
  safeRows(rows).forEach((r) => {
    const req = root.ele("request");
    Object.entries(r).forEach(([k, v]) =>
      req.ele(k).txt(v instanceof Date ? v.toISOString() : String(v ?? ""))
    );
  });
  return root.end({ prettyPrint: true });
}

function toMD(rows: any[]) {
  const md = new MarkdownIt();
  const lines: string[] = ["# Weather Requests", ""];
  safeRows(rows).forEach((r, i) => {
    lines.push(- **#${i + 1} – ${r.location}**);
    lines.push(
      `  - Range: ${new Date(r.dateStart).toDateString()} → ${new Date(
        r.dateEnd
      ).toDateString()}`
    );
    lines.push(`  - Coords: ${r.lat}, ${r.lon}`);
    lines.push(`  - Provider: ${r.provider}`);
    lines.push(`  - Fetched: ${new Date(r.fetchedAt).toLocaleString()}`);
    lines.push("");
  });
  return md.render(lines.join("\n"));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fmt = (searchParams.get("format") || "json").toLowerCase() as Format;

    const rows = await prisma.weatherRequest.findMany({
      orderBy: { fetchedAt: "desc" },
      include: { location: true, snapshot: true },
      take: 500,
    });

    if (fmt === "json") {
      return NextResponse.json(rows, {
        headers: { "Content-Disposition": 'attachment; filename="export.json"' },
      });
    }

    if (fmt === "xml") {
      const xml = toXML(rows);
      return new NextResponse(xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Content-Disposition": 'attachment; filename="export.xml"',
        },
      });
    }

    if (fmt === "md") {
      const md = toMD(rows);
      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": 'attachment; filename="export.md"',
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
