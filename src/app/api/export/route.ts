// src/app/api/export/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Parser as Json2CsvParser } from "json2csv";
import { create } from "xmlbuilder2";
import MarkdownIt from "markdown-it";
import PDFDocument from "pdfkit";

// Force Node.js runtime (Edge breaks Prisma & PDFKit on Vercel)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Format = "json" | "csv" | "xml" | "md" | "pdf";

function safeRows(rows: any[]) {
  // strip heavy fields for CSV/XML/MD if needed; keep it simple here
  return rows.map((r) => ({
    id: r.id,
    location: r.location?.name ?? "",
    lat: r.location?.latitude ?? "",
    lon: r.location?.longitude ?? "",
    dateStart: r.dateStart,
    dateEnd: r.dateEnd,
    provider: r.provider,
    fetchedAt: r.fetchedAt
  }));
}

function toCSV(rows: any[]) {
  const parser = new Json2CsvParser();
  // Add BOM so Excel opens UTF-8 cleanly
  const csv = parser.parse(safeRows(rows));
  return "\uFEFF" + csv;
}

function toXML(rows: any[]) {
  const root = create({ version: "1.0" }).ele("requests");
  safeRows(rows).forEach((r) => {
    const req = root.ele("request");
    Object.entries(r).forEach(([k, v]) => {
      req.ele(k).txt(v instanceof Date ? v.toISOString() : String(v ?? ""));
    });
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

function pdfBuffer(rows: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (d) => chunks.push(d as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Weather Requests Export", { underline: true });
    doc.moveDown();

    safeRows(rows).forEach((r, i) => {
      doc.fontSize(12).text(#${i + 1});
      doc.text(Location: ${r.location});
      doc.text(
        `Range: ${new Date(r.dateStart).toDateString()} → ${new Date(
          r.dateEnd
        ).toDateString()}`
      );
      doc.text(Coords: ${r.lat}, ${r.lon});
      doc.text(Provider: ${r.provider});
      doc.text(Fetched: ${new Date(r.fetchedAt).toLocaleString()});
      doc.moveDown();
    });

    doc.end();
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fmt = (searchParams.get("format") || "json").toLowerCase() as Format;

    // Fetch rows (include relations)
    const rows = await prisma.weatherRequest.findMany({
      orderBy: { fetchedAt: "desc" },
      include: { location: true, snapshot: true },
      take: 500
    });

    if (fmt === "json") {
      return NextResponse.json(rows, {
        headers: { "Content-Disposition": attachment; filename="export.json" }
      });
    }

    if (fmt === "csv") {
      const csv = toCSV(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": attachment; filename="export.csv"
        }
      });
    }

    if (fmt === "xml") {
      const xml = toXML(rows);
      return new NextResponse(xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Content-Disposition": attachment; filename="export.xml"
        }
      });
    }

    if (fmt === "md") {
      const md = toMD(rows);
      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": attachment; filename="export.md"
        }
      });
    }

    if (fmt === "pdf") {
      const buf = await pdfBuffer(rows);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": attachment; filename="export.pdf",
          "Cache-Control": "no-store"
        }
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (e: any) {
    console.error("Export error:", e); // check in Vercel → Functions → Logs
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
