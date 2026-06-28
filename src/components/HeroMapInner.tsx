import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip } from "react-leaflet";
import type { HeroMapProps } from "./HeroMap";

export default function HeroMapInner({ userLat, userLon, nearby, className }: HeroMapProps) {
  // Default to Koramangala, Bengaluru when GPS unavailable
  const center: [number, number] = [userLat ?? 12.9352, userLon ?? 77.6245];
  const matched = nearby[0];
  const others = nearby.slice(1);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-white/10 ${className ?? "h-72"}`}
    >
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%", background: "#0F0F1A" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {/* Pulsing search rings around user */}
        <Circle
          center={center}
          radius={800}
          pathOptions={{ color: "#E94560", weight: 1, fillColor: "#E94560", fillOpacity: 0.06 }}
        />
        <Circle
          center={center}
          radius={400}
          pathOptions={{ color: "#FF2D55", weight: 1, fillColor: "#FF2D55", fillOpacity: 0.05 }}
        />
        <Circle
          center={center}
          radius={150}
          pathOptions={{ color: "#FF2D55", weight: 1.5, fillOpacity: 0 }}
        />

        {/* User marker — red pulsing */}
        <CircleMarker
          center={center}
          radius={11}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#E94560", fillOpacity: 1 }}
          className="leaflet-pulse-user"
        >
          <Tooltip
            permanent
            direction="top"
            offset={[0, -12]}
            className="!bg-[#0F0F1A] !text-white !border-white/10"
          >
            You · SOS
          </Tooltip>
        </CircleMarker>

        {/* Other heroes — blue */}
        {others.map((h, i) => (
          <CircleMarker
            key={i}
            center={[h.lat, h.lon]}
            radius={8}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#4361ee", fillOpacity: 0.95 }}
          >
            <Tooltip
              direction="top"
              offset={[0, -10]}
              className="!bg-[#0F0F1A] !text-white !border-white/10"
            >
              {h.name.split(" ").slice(0, 2).join(" ")} · {h.etaMin}m
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Matched hero — violet, larger */}
        {matched && (
          <CircleMarker
            center={[matched.lat, matched.lon]}
            radius={11}
            pathOptions={{ color: "#fff", weight: 3, fillColor: "#7209b7", fillOpacity: 1 }}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -12]}
              className="!bg-[#0F0F1A] !text-white !border-white/10"
            >
              {matched.name.split(" ").slice(0, 2).join(" ")} · {matched.etaMin} min
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-0.5 text-[9px] uppercase tracking-widest text-white/70 backdrop-blur">
        Live · OpenStreetMap
      </div>
      <div className="pointer-events-none absolute top-2 left-2 rounded-md bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/85 backdrop-blur">
        {nearby.length} Heroes within 2 km
      </div>
    </div>
  );
}
