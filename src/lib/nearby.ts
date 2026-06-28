import { createServerFn } from "@tanstack/react-start";
import { HERO_POOL, type Hero } from "./heroes";

export type NearbyHero = Hero & {
  lat: number;
  lon: number;
  distanceKm: number;
  etaMin: number;
};

export type NearbyDoctorResult = {
  name: string;
  address: string;
  lat: number;
  lon: number;
};

// Haversine distance in km
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Offset (degrees) for given meters at latitude
function metersToDegrees(meters: number, lat: number) {
  const dLat = meters / 111320;
  const dLon = meters / (111320 * Math.cos((lat * Math.PI) / 180));
  return { dLat, dLon };
}

// Build 3-5 nearby heroes around user with realistic offsets, distances, ETAs.
// First entry is the "matched" hero (closest).
export const findNearbyDoctors = createServerFn({ method: "POST" })
  .validator(
    (input: unknown) => input as { lat: number; lon: number; radius?: number; limit?: number },
  )
  .handler(async ({ data }): Promise<NearbyHero[]> => {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key || !Number.isFinite(data.lat) || !Number.isFinite(data.lon)) {
      return [];
    }

    const radius = Math.min(20000, Math.max(2000, data.radius ?? 8000));
    const limit = Math.min(8, Math.max(3, data.limit ?? 5));
    const requests = [
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${data.lat},${data.lon}&radius=${radius}&keyword=doctor&key=${key}`,
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${data.lat},${data.lon}&radius=${radius}&keyword=hospital&key=${key}`,
    ];

    const results: NearbyDoctorResult[] = [];
    for (const url of requests) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const json = await res.json();
        const items = Array.isArray(json.results) ? json.results : [];
        for (const item of items) {
          const name = typeof item?.name === "string" ? item.name : "Nearby Clinic";
          if (!name || results.some((entry) => entry.name === name)) continue;
          results.push({
            name,
            address: typeof item?.vicinity === "string" ? item.vicinity : "Nearby medical center",
            lat: item?.geometry?.location?.lat,
            lon: item?.geometry?.location?.lng,
          });
          if (results.length >= limit * 2) break;
        }
      } catch {
        // ignore and fall back gracefully
      }
    }

    return results.slice(0, limit).map((doctor, idx) => {
      const distanceKm = haversineKm(data.lat, data.lon, doctor.lat, doctor.lon);
      return {
        name: doctor.name,
        skill: "Hospital",
        area: doctor.address.split(",")[0] || "Nearby",
        responses: 20 + idx * 5,
        distanceM: Math.round(distanceKm * 1000),
        avgResponse: `${Math.max(1, Math.round((distanceKm / 28) * 60 + 0.75))} min`,
        lat: doctor.lat,
        lon: doctor.lon,
        distanceKm: Number(distanceKm.toFixed(2)),
        etaMin: Math.max(1, Math.round((distanceKm / 28) * 60 + 0.75)),
      };
    });
  });

export function buildNearbyHeroes(
  userLat: number,
  userLon: number,
  matched: Hero,
  count = 5,
): NearbyHero[] {
  // Pick unique heroes from pool, ensuring matched is first
  const pool = HERO_POOL.filter((h) => h.name !== matched.name);
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picks: Hero[] = [matched, ...pool.slice(0, Math.max(2, count - 1))];

  // Average urban responder speed ~ 28 km/h
  const SPEED_KMH = 28;

  return picks.map((h, idx) => {
    // Place matched hero ~120-400m away; others 300m-1.5km
    const meters = idx === 0 ? 120 + Math.random() * 280 : 300 + Math.random() * 1200;
    const angle = Math.random() * Math.PI * 2;
    const { dLat, dLon } = metersToDegrees(meters, userLat);
    const lat = userLat + dLat * Math.sin(angle);
    const lon = userLon + dLon * Math.cos(angle);
    const distanceKm = haversineKm(userLat, userLon, lat, lon);
    // ETA: travel time + 45s prep
    const etaMin = Math.max(1, Math.round((distanceKm / SPEED_KMH) * 60 + 0.75));
    return { ...h, lat, lon, distanceKm, etaMin };
  });
}
