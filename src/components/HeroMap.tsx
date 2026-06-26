import { lazy, Suspense, useEffect, useState } from "react";
import type { Hero } from "@/lib/heroes";

const Inner = lazy(() => import("./HeroMapInner"));

export type HeroMapProps = {
  userLat?: number;
  userLon?: number;
  hero: Hero;
};

export function HeroMap(props: HeroMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="grid h-56 w-full place-items-center rounded-2xl glass-card text-xs text-muted-foreground">
        Locating heroes near you…
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="grid h-56 w-full place-items-center rounded-2xl glass-card text-xs text-muted-foreground">
          Loading live map…
        </div>
      }
    >
      <Inner {...props} />
    </Suspense>
  );
}
