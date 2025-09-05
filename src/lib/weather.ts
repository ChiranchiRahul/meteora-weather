export type WeatherBundle = {
  current: any;
  hourly: any;
  daily: any;
  air?: any;
};

export async function fetchWeather(lat: number, lon: number): Promise<WeatherBundle> {
  const base = new URL("https://api.open-meteo.com/v1/forecast");
  base.searchParams.set("latitude", String(lat));
  base.searchParams.set("longitude", String(lon));
  base.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure");
  base.searchParams.set("hourly", "temperature_2m,precipitation_probability,wind_speed_10m");
  base.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max");
  base.searchParams.set("timezone", "auto");
  base.searchParams.set("forecast_days", "7");

  const [wRes, aRes] = await Promise.all([
    fetch(base.toString()),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,us_aqi`)
  ]);

  if (!wRes.ok) throw new Error("Weather fetch failed");
  const w = await wRes.json();
  const air = aRes.ok ? await aRes.json() : undefined;

  return { current: w.current, hourly: w.hourly, daily: w.daily, air };
}
