import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createLogger } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const inlineDynamicImportsWarning = "inlineDynamicImports";
const codeSplittingWarning = "codeSplitting";
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = ((chunk: string | Uint8Array, ...args: unknown[]) => {
  const message = chunk.toString();
  if (message.includes(inlineDynamicImportsWarning) && message.includes(codeSplittingWarning)) {
    return true;
  }
  return originalStderrWrite(chunk, ...args as []);
}) as typeof process.stderr.write;

const logger = createLogger();
const customLogger: typeof logger = {
  ...logger,
  warn(message, options) {
    if (message.includes('The plugin "vite-tsconfig-paths" is detected')) return;
    logger.warn(message, options);
  },
  warnOnce(message, options) {
    if (message.includes('The plugin "vite-tsconfig-paths" is detected')) return;
    logger.warnOnce(message, options);
  },
};

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    customLogger,
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        manifest: false,
        outDir: ".output/public",
        includeAssets: ["icon-192.svg", "icon-512.svg", "manifest.webmanifest"],
        devOptions: { enabled: false },
        workbox: {
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
          globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff,woff2}"],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "html-pages",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            {
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin && /\.(?:js|css|woff2|svg|png|jpg|jpeg|webp)$/.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets",
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: { cacheName: "google-fonts" },
            },
          ],
        },
      }),
    ],
  },
});
