import { lazy, Suspense, useEffect, useState } from "react";
import type { Hero } from "@/lib/heroes";
import type { NearbyHero } from "@/lib/nearby";

const Inner = lazy(() => import("./HeroMapInner"));

export type HeroMapProps = {
  userLat?: number;
  userLon?: number;
  hero: Hero;
  nearby: NearbyHero[];
  className?: string;
};

export function HeroMap(props: HeroMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const cls = props.className ?? "h-72";
  if (!mounted) {
    return (
      <div
        className={`grid w-full place-items-center rounded-2xl glass-card text-xs text-muted-foreground ${cls}`}
      >
        Locating heroes near you…
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div
          className={`grid w-full place-items-center rounded-2xl glass-card text-xs text-muted-foreground ${cls}`}
        >
          Loading live map…
        </div>
      }
    >
      <Inner {...props} />
    </Suspense>
  );
}
