import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Shield, Home, Trophy, UserPlus, Sparkles } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ResQNear — Your nearest hero. In seconds." },
      { name: "description", content: "Hyperlocal AI emergency first responder app for India. Tap SOS and reach a trained hero near you." },
      { name: "theme-color", content: "#0A0A2E" },
      { property: "og:title", content: "ResQNear — Your nearest hero. In seconds." },
      { property: "og:description", content: "Hyperlocal AI emergency first responder app for India." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
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
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function NavBar() {
  const linkBase = "flex flex-col items-center gap-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground sm:flex-row sm:gap-2 sm:text-xs sm:normal-case sm:tracking-normal";
  const activeProps = { className: linkBase + " text-foreground" };
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">ResQNear</span>
            <span className="hidden text-[10px] text-muted-foreground sm:block">Your nearest hero.</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link to="/" className={linkBase} activeOptions={{ exact: true }} activeProps={activeProps}>
            <Home className="h-4 w-4" /><span>Home</span>
          </Link>
          <Link to="/heroes" className={linkBase} activeProps={activeProps}>
            <Trophy className="h-4 w-4" /><span>Heroes</span>
          </Link>
          <Link to="/register" className={linkBase} activeProps={activeProps}>
            <UserPlus className="h-4 w-4" /><span>Register</span>
          </Link>
          <Link to="/demo" className={linkBase} activeProps={activeProps}>
            <Sparkles className="h-4 w-4" /><span>Demo</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <Outlet />
      </div>
    </QueryClientProvider>
  );
}
