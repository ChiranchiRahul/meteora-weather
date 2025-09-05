type ResolvedLocation = {
  name: string;
  latitude: number;
  longitude: number;
  source: "open-meteo" | "reverse" | "coords";
};

export function parseLatLon(raw: string): { lat: number; lon: number } | null {
  const m = raw.trim().match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lon = parseFloat(m[3]);
  if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    return { lat, lon };
  }
  return null;
}

export async function resolveLocation(input: string): Promise<ResolvedLocation> {
  const asCoords = parseLatLon(input);
  if (asCoords) {
    return {
      name: `${asCoords.lat.toFixed(4)}, ${asCoords.lon.toFixed(4)}`,
      latitude: asCoords.lat,
      longitude: asCoords.lon,
      source: "coords",
    };
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", input);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to resolve location");
  const data = await res.json();

  if (!data?.results?.length) {
    throw new Error("No matching location found. Try being more specific.");
  }

  const best = data.results[0];
  const display = [best.name, best.admin1, best.country].filter(Boolean).join(", ");
  return {
    name: display,
    latitude: best.latitude,
    longitude: best.longitude,
    source: "open-meteo",
  };
}

export async function reverseGeocode(lat: number, lon: number): Promise<ResolvedLocation> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const data = await res.json();
  const best = data?.results?.[0];
  const display = best ? [best.name, best.admin1, best.country].filter(Boolean).join(", ") : `${lat}, ${lon}`;
  return { name: display, latitude: lat, longitude: lon, source: "reverse" };
}
