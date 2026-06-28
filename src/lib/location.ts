export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=16`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return "Your current area";
    const data = (await res.json()) as { display_name?: string };
    if (!data.display_name) return "Your current area";
    return data.display_name.split(",").slice(0, 3).join(", ").trim();
  } catch {
    return "Your current area";
  }
}
