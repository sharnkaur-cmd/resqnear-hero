import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip } from "react-leaflet";
import type { HeroMapProps } from "./HeroMap";

export default function HeroMapInner({ userLat, userLon, hero }: HeroMapProps) {
  // Default to Koramangala, Bengaluru when GPS not available
  const center: [number, number] = [userLat ?? 12.9352, userLon ?? 77.6245];

  // Deterministic-ish scatter of other heroes around user
  const heroes = useMemo(() => {
    const seeds = [
      [0.0018, 0.0012], [-0.0024, 0.0008], [0.0009, -0.0021],
      [-0.0011, -0.0018], [0.0026, -0.0006], [-0.0019, 0.0024],
    ];
    return seeds.map(([dy, dx], i) => ({
      pos: [center[0] + dy, center[1] + dx] as [number, number],
      label: `Hero ${i + 1}`,
    }));
  }, [center]);

  // Matched hero — slightly closer to user
  const heroPos: [number, number] = [center[0] + 0.0011, center[1] - 0.0009];

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-white/10">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%", background: "#0F0F1A" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Circle center={center} radius={250} pathOptions={{ color: "#E94560", weight: 1, fillColor: "#E94560", fillOpacity: 0.08 }} />
        <Circle center={center} radius={120} pathOptions={{ color: "#FF2D55", weight: 1, fillOpacity: 0 }} />
        <CircleMarker center={center} radius={9} pathOptions={{ color: "#fff", weight: 2, fillColor: "#E94560", fillOpacity: 1 }}>
          <Tooltip permanent direction="top" offset={[0, -10]} className="!bg-[#0F0F1A] !text-white !border-white/10">You</Tooltip>
        </CircleMarker>
        {heroes.map((h, i) => (
          <CircleMarker key={i} center={h.pos} radius={6} pathOptions={{ color: "#4cc9f0", weight: 2, fillColor: "#4361ee", fillOpacity: 0.9 }} />
        ))}
        <CircleMarker center={heroPos} radius={9} pathOptions={{ color: "#fff", weight: 2, fillColor: "#7209b7", fillOpacity: 1 }}>
          <Tooltip permanent direction="top" offset={[0, -10]} className="!bg-[#0F0F1A] !text-white !border-white/10">{hero.name.split(" ").slice(0, 2).join(" ")}</Tooltip>
        </CircleMarker>
      </MapContainer>
      <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-white/70 backdrop-blur">
        Live · OSM
      </div>
    </div>
  );
}
