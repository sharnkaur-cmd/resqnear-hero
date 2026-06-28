import { useState, useCallback } from "react";

export type GpsState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "verified"; accuracy: number; lat: number; lon: number; timestamp: number }
  | { status: "error"; message: string };

const ACCURACY_THRESHOLD_M = 50;

export function useGps() {
  const [state, setState] = useState<GpsState>({ status: "idle" });

  const verify = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "error", message: "Geolocation not supported on this device." });
      return;
    }
    setState({ status: "requesting" });
    let best: GeolocationPosition | null = null;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= ACCURACY_THRESHOLD_M) {
          navigator.geolocation.clearWatch(watchId);
          setState({
            status: "verified",
            accuracy: pos.coords.accuracy,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            timestamp: pos.timestamp,
          });
        }
      },
      (err) => {
        navigator.geolocation.clearWatch(watchId);
        setState({ status: "error", message: err.message || "Couldn't get your location." });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 },
    );
    // Hard cutoff at 8 s — use best-effort fix even if it never broke the threshold.
    window.setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      if (best) {
        setState({
          status: "verified",
          accuracy: best.coords.accuracy,
          lat: best.coords.latitude,
          lon: best.coords.longitude,
          timestamp: best.timestamp,
        });
      } else {
        setState((s) =>
          s.status === "requesting"
            ? { status: "error", message: "Couldn't lock your location. Try again." }
            : s,
        );
      }
    }, 8000);
  }, []);

  return { state, verify, threshold: ACCURACY_THRESHOLD_M };
}
