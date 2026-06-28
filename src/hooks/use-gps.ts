import { useState, useCallback, useEffect, useRef } from "react";

export type GpsState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "verified"; accuracy: number; lat: number; lon: number; timestamp: number }
  | { status: "error"; message: string };

const ACCURACY_THRESHOLD_M = 50;

export function useGps() {
  const [state, setState] = useState<GpsState>({ status: "idle" });
  const watchIdRef = useRef<number | null>(null);

  const clearWatch = useCallback(() => {
    if (typeof navigator === "undefined" || watchIdRef.current === null) return;
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearWatch();
  }, [clearWatch]);

  const verify = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      clearWatch();
      setState({ status: "error", message: "Geolocation not supported on this device." });
      return;
    }

    clearWatch();
    setState({ status: "requesting" });

    const onPosition = (pos: GeolocationPosition) => {
      setState({
        status: "verified",
        accuracy: pos.coords.accuracy,
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        timestamp: pos.timestamp,
      });
    };

    const onError = (err: GeolocationPositionError) => {
      clearWatch();
      setState({ status: "error", message: err.message || "Couldn't get your location." });
    };

    navigator.geolocation.getCurrentPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    });

    const watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    });
    watchIdRef.current = watchId;
  }, [clearWatch]);

  return { state, verify, threshold: ACCURACY_THRESHOLD_M };
}
