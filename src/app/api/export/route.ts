import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stringify as toCSV } from "json2csv";
import { create as toXMLBuilder } from "xmlbuilder2";
import MarkdownIt from "markdown-it";
import PDFDocument from "pdfkit";

function flattenForCsv(rows: any[]) {
  return rows.map(r => ({
    id: r.id,
    location: r.location.name,
    lat: r.location.latitude,
    lon: r.location.longitude,
    dateStart: r.dateStart,
    dateEnd: r.dateEnd,
    provider: r.provider,
    fetchedAt: r.fetchedAt
  }));
}

function toXML(rows: any[]) {
  const root = { weatherExport: { request: rows.map(r => ({
    id: r.id,
    location: { name: r.location.name, latitude: r.location.latitude, longitude: r.location.longitude },
    dateStart: r.dateStart, dateEnd: r.dateEnd, provider: r.provider, fetchedAt: r.fetchedAt
  }))}};
  return toXMLBuilder(root).end({ prettyPrint: true });
}

function toMarkdown(rows: any[]) {
  const md = new MarkdownIt();
  let out = `# Weather Export\n\nTotal: **${rows.length}**\n\n`;
  for (const r of rows) {
    out += `## ${r.location.name}\n- ID: ${r.id}\n- Coords: ${r.location.latitude}, ${r.location.longitude}\n- Range: ${new Date(r.dateStart).toDateString()} → ${new Date(r.dateEnd).toDateString()}\n- Provider: ${r.provider}\n- Fetched: ${new Date(r.fetchedAt).toLocaleString()}\n\n`;
  }
  return md.render(out);
}

async function toPDF(rows: any[]) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  doc.on("data", (c) => chunks.push(Buffer.from(c)));

  doc.fontSize(18).text("Weather Export", { underline: true });
  doc.moveDown();

  rows.forEach((r: any, i: number) => {
    doc.fontSize(12).text(`${i+1}. ${r.location.name}`);
    doc.text(`   ID: ${r.id}`);
    doc.text(`   Coords: ${r.location.latitude}, ${r.location.longitude}`);
    doc.text(`   Range: ${new Date(r.dateStart).toDateString()} → ${new Date(r.dateEnd).toDateString()}`);
    doc.text(`   Provider: ${r.provider}`);
    doc.text(`   Fetched: ${new Date(r.fetchedAt).toLocaleString()}`);
    doc.moveDown(0.5);
  });

  doc.end();
  return done;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("ids") ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const format = (searchParams.get("format") ?? "json").toLowerCase();

  const rows = await prisma.weatherRequest.findMany({
    where: ids.length ? { id: { in: ids } } : undefined,
    include: { location: true, snapshot: true },
    orderBy: { createdAt: "desc" }
  });

  if (format === "json") return NextResponse.json(rows);

  if (format === "csv") {
    const csv = toCSV(flattenForCsv(rows));
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=weather.csv" } });
  }

  if (format === "xml") {
    const xml = toXML(rows);
    return new NextResponse(xml, { headers: { "Content-Type": "application/xml", "Content-Disposition": "attachment; filename=weather.xml" } });
  }

  if (format === "md" || format === "markdown") {
    const md = toMarkdown(rows);
    return new NextResponse(md, { headers: { "Content-Type": "text/markdown", "Content-Disposition": "attachment; filename=weather.md" } });
  }

  if (format === "pdf") {
    const pdf = await toPDF(rows);
    return new NextResponse(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=weather.pdf" }});
  }

  return NextResponse.json({ error: "Unknown format" }, { status: 400 });
}
