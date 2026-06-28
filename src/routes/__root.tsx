import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Shield, Home, Trophy, UserPlus, Sparkles } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerServiceWorker } from "../lib/register-sw";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-primary">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow-red"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-glow-red"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "ResQNear — Your nearest hero. In seconds." },
      {
        name: "description",
        content:
          "Hyperlocal AI emergency first responder app for India. Tap SOS and reach a trained hero near you in seconds.",
      },
      { name: "theme-color", content: "#0F0F1A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "ResQNear" },
      { property: "og:title", content: "ResQNear — Your nearest hero. In seconds." },
      {
        property: "og:description",
        content: "Hyperlocal AI emergency first responder app for India.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/svg+xml", href: "/icon-192.svg" },
      { rel: "apple-touch-icon", href: "/icon-192.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
        crossOrigin: "",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NavBar() {
  const baseLink =
    "group relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-all hover:text-white sm:flex-row sm:gap-2 sm:text-xs sm:normal-case sm:tracking-normal";
  const activeProps = {
    className:
      baseLink +
      " text-white before:absolute before:inset-0 before:-z-10 before:rounded-xl before:bg-gradient-blue-violet before:opacity-90 before:shadow-glow-blue",
  };
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto mt-3 flex max-w-5xl items-center justify-between gap-3 rounded-2xl px-4 py-2.5 glass">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-glow-red">
            <Shield className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight text-gradient-primary">
              ResQNear
            </span>
            <span className="hidden text-[10px] text-muted-foreground sm:block">
              Your nearest hero.
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <Link
            to="/"
            className={baseLink}
            activeOptions={{ exact: true }}
            activeProps={activeProps}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link to="/heroes" className={baseLink} activeProps={activeProps}>
            <Trophy className="h-4 w-4" />
            <span>Heroes</span>
          </Link>
          <Link to="/resq-hub" className={baseLink} activeProps={activeProps}>
            <Shield className="h-4 w-4" />
            <span>ResQ Hub</span>
          </Link>
          <Link to="/register" className={baseLink} activeProps={activeProps}>
            <UserPlus className="h-4 w-4" />
            <span>Register</span>
          </Link>
          <Link to="/demo" className={baseLink} activeProps={activeProps}>
            <Sparkles className="h-4 w-4" />
            <span>Demo</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  if (online) return null;
  return (
    <div className="mx-auto mt-2 max-w-5xl px-4">
      <div className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-1.5 text-center text-xs font-medium text-warning">
        Offline mode · cached first-aid still available
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    void registerServiceWorker();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen overflow-x-hidden bg-aurora text-foreground">
        <NavBar />
        <OfflineBanner />
        <Outlet />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
