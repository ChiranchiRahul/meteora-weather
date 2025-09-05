"use client";

import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { useMemo } from "react";

// Dynamically import each react-leaflet component (no SSR)
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

type Props = {
  lat: number;
  lon: number;
  name?: string;
  height?: number;
};

export default function MapView({ lat, lon, name, height = 220 }: Props) {
  const position = useMemo(() => [lat, lon] as [number, number], [lat, lon]);

  return (
    <div className="rounded-lg overflow-hidden border">
      <MapContainer center={position} zoom={11} style={{ height }}>
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>{name ?? `${lat}, ${lon}`}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
