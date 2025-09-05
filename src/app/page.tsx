"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { WeatherCard, DailyStrip } from "@/components/WeatherCard";
import MapView from "@/components/MapView";

type Resolved = { name: string; latitude: number; longitude: number };

export default function Home() {
  const [query, setQuery] = useState("");
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [dateStart, setDateStart] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [dateEnd, setDateEnd] = useState<string>(
    new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10)
  );
  const [message, setMessage] = useState<string | null>(null);

  // --- About Me dropdown (close on outside click) ---
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- live date validation for UI ---
  const invalidReason = (() => {
    const ds = new Date(dateStart);
    const de = new Date(dateEnd);
    if (Number.isNaN(ds.getTime()) || Number.isNaN(de.getTime()))
      return "Pick valid dates";
    if (ds > de) return "Start date must be before end date";
    return null;
  })();

  // --- mutations ---
  const resolveMut = useMutation({
    mutationFn: async (input: string) => {
      const res = await fetch("/api/geo/resolve", {
        method: "POST",
        body: JSON.stringify({ input }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? "resolve failed");
      }
      return res.json();
    },
    onSuccess: (loc: Resolved) => setResolved(loc),
    onError: (e: any) => setMessage(String(e.message || e)),
  });

  const weatherMut = useMutation({
    mutationFn: async (loc: Resolved) => {
      const res = await fetch("/api/weather/fetch", {
        method: "POST",
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("weather failed");
      return res.json();
    },
    onSuccess: (w) => setWeather(w),
    onError: (e: any) => setMessage(String(e.message || e)),
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!resolved) throw new Error("Resolve a location first");
      const ds = new Date(dateStart);
      const de = new Date(dateEnd);
      if (Number.isNaN(ds.getTime())) throw new Error("Invalid start date");
      if (Number.isNaN(de.getTime())) throw new Error("Invalid end date");
      if (ds > de) throw new Error("Start date must be before end date");

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: query, dateStart, dateEnd }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        const zodMsg =
          j?.error?.formErrors?.[0] ||
          Object.values(j?.error?.fieldErrors ?? {}).flat()[0];
        throw new Error(zodMsg || j?.error || "Save failed");
      }
      return res.json();
    },
    onSuccess: () => setMessage("Saved ✓"),
    onError: (e: any) => setMessage(String(e.message || e)),
  });

  // --- actions ---
  async function handleSearch() {
    setMessage(null);
    if (!query.trim())
      return setMessage("Enter a city, ZIP, landmark, or lat,lon");
    const loc = (await resolveMut.mutateAsync(query)) as Resolved;
    await weatherMut.mutateAsync(loc);
  }

  function useMyLocation() {
    setMessage(null);
    if (!navigator.geolocation) return setMessage("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const input = `${pos.coords.latitude},${pos.coords.longitude}`;
        const loc = (await resolveMut.mutateAsync(input)) as Resolved;
        await weatherMut.mutateAsync(loc);
        setQuery(input);
      },
      (err) => setMessage(err.message)
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 grid gap-6">
      <header className="flex items-center justify-between relative">
        <div className="text-xl font-semibold">Meteora — by Rahul Chiranchi</div>
        <div className="flex items-center gap-4">
          <a href="/history" className="text-sm underline">
            History
          </a>

          {/* About Me dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((s) => !s)}
              className="text-sm underline"
            >
              ℹ︎ About Me
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/10 dark:ring-white/10 z-50">
                <div className="py-1 text-sm">
                  <a
                    href="https://www.linkedin.com/in/rahulchiranchi"
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    LinkedIn
                  </a>
                  <a
                    href="https://rahulchiranchi-portfolio.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Portfolio
                  </a>
                  <a
                    href="https://github.com/ChiranchiRahul"
                    target="_blank"
                    rel="noreferrer"
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* PM Accelerator info button */}
          <button
            onClick={() =>
              window.open("https://www.linkedin.com/school/pmaccelerator/", "_blank")
            }
            className="text-sm underline"
          >
            ℹ︎ PM Accelerator
          </button>
        </div>
      </header>

      <div className="grid gap-3 rounded-xl border p-4">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City, ZIP, landmark, or lat,lon"
            className="flex-1 rounded border px-3 py-2"
          />
          <button
            onClick={handleSearch}
            className="rounded bg-black text-white px-3 py-2"
          >
            Search
          </button>
          <button onClick={useMyLocation} className="rounded border px-3 py-2">
            Use my location
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm">
            From{" "}
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="border rounded px-2 py-1 ml-1"
            />
          </label>
          <label className="text-sm">
            To{" "}
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="border rounded px-2 py-1 ml-1"
            />
          </label>

          {/* live validation message */}
          {invalidReason && (
            <span className="text-sm text-amber-600 ml-2">{invalidReason}</span>
          )}

          <button
            onClick={() => createMut.mutate()}
            disabled={!!invalidReason || !resolved}
            className={`ml-auto rounded border px-3 py-2 ${
              invalidReason || !resolved ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={!resolved ? "Resolve a location first" : invalidReason ?? ""}
          >
            Save request
          </button>
        </div>

        {message && <div className="text-sm text-amber-600">{message}</div>}
      </div>

      {resolved && weather && (
        <section className="grid gap-4">
          <div className="text-lg font-medium">{resolved.name}</div>
          <WeatherCard current={weather.current} />
          <DailyStrip daily={weather.daily} dateStart={dateStart} dateEnd={dateEnd} />
          <MapView
            lat={resolved.latitude}
            lon={resolved.longitude}
            name={resolved.name}
          />
        </section>
      )}

      <footer className="text-xs text-gray-500">
        Meteora • Built with Open-Meteo, OpenStreetMap • © {new Date().getFullYear()} Rahul
        Chiranchi
      </footer>
    </main>
  );
}
