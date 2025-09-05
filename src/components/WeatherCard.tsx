export function WeatherCard({ current }: { current: any }) {
  if (!current) return null;
  return (
    <div className="rounded-xl border p-4 grid gap-2">
      <div className="text-3xl font-semibold">
        {Math.round(current.temperature_2m)}°
      </div>
      <div className="text-sm text-gray-500">
        Feels {Math.round(current.apparent_temperature)}° • Humidity{" "}
        {current.relative_humidity_2m}% • Wind {Math.round(current.wind_speed_10m)} km/h
      </div>
      <div className="text-sm text-gray-500">
        Pressure {Math.round(current.surface_pressure)} hPa • Code {current.weather_code}
      </div>
    </div>
  );
}

type DailyProps = {
  daily: any;
  dateStart: string; // yyyy-mm-dd
  dateEnd: string;   // yyyy-mm-dd
};

export function DailyStrip({ daily, dateStart, dateEnd }: DailyProps) {
  if (!daily?.time?.length) return null;

  // Compute "today → today+4" once (the app's default)
  const today = new Date();
  const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10);
  const defaultEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 4
  )
    .toISOString()
    .slice(0, 10);

  const ds = new Date(dateStart);
  const de = new Date(dateEnd);
  const isValidRange =
    !Number.isNaN(ds.getTime()) && !Number.isNaN(de.getTime()) && ds <= de;

  // Helper to normalize date (ignore time)
  const dayOnly = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // If the range is the default "today → today+4", show exactly 5 days (index 0..4).
  const isDefaultRange = dateStart === todayStr && dateEnd === defaultEnd;

  let rows: { iso: string; i: number }[] = [];

  if (isDefaultRange) {
    rows = daily.time.slice(0, 5).map((iso: string, i: number) => ({ iso, i }));
  } else if (isValidRange) {
    const startDay = dayOnly(ds);
    const endDay = dayOnly(de);
    rows = daily.time
      .map((iso: string, i: number) => ({ iso, i, date: dayOnly(new Date(iso)) }))
      .filter(({ date }) => date >= startDay && date <= endDay)
      .map(({ iso, i }) => ({ iso, i }));
  } else {
    // Fallback: nothing valid to show
    rows = [];
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border p-3 text-sm text-gray-500">
        No forecast days in the selected range.
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-3">
      <div className="font-medium mb-2">
        {rows.length === 1 ? "Selected day" : `Selected ${rows.length} days`}
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(rows.length, 7)}, minmax(0, 1fr))` }}
      >
        {rows.map(({ iso, i }) => (
          <div key={iso} className="rounded-lg border p-2 text-center">
            <div className="text-xs">
              {new Date(iso).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="text-lg">{Math.round(daily.temperature_2m_max[i])}°</div>
            <div className="text-xs text-gray-500">
              min {Math.round(daily.temperature_2m_min[i])}°
            </div>
            <div className="text-xs text-gray-500">
              rain {daily.precipitation_probability_max?.[i] ?? 0}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
