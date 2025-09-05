import { NextResponse } from "next/server";
import { fetchWeather } from "@/lib/weather";

export async function POST(req: Request) {
  try {
    const { latitude, longitude } = await req.json();
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "latitude & longitude required" }, { status: 400 });
    }
    const data = await fetchWeather(latitude, longitude);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Fetch error" }, { status: 500 });
  }
}
