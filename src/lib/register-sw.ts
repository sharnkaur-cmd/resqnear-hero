// Guarded service worker registration — only in published production builds.
// Refuses to register in dev, preview, iframes, or when ?sw=off.
export async function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const inIframe = window.self !== window.top;
  const host = window.location.hostname;
  const blocked =
    !import.meta.env.PROD ||
    inIframe ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" || host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev") ||
    url.searchParams.get("sw") === "off";

  if (blocked) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        regs
          .filter((r) => r.active?.scriptURL?.endsWith("/sw.js"))
          .map((r) => r.unregister()),
      );
    } catch {}
    return;
  }

  try {
    const { Workbox } = await import("workbox-window");
    const wb = new Workbox("/sw.js");
    wb.register();
  } catch (err) {
    console.warn("SW registration failed", err);
  }
}
