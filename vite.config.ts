import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Self-hosted at the domain root by default; VITE_BASE overrides it (e.g. for
// GitHub Pages, which serves from /finance-app/).
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Finance",
        short_name: "Finance",
        description: "What I can spend today, and where the money goes.",
        theme_color: "#0e1014",
        background_color: "#0e1014",
        display: "standalone",
        start_url: base,
        icons: [
          { src: base + "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        // Never cache Supabase responses; the whole point is live numbers.
        navigateFallbackDenylist: [/^\/rest\//],
        runtimeCaching: [{ urlPattern: /supabase\.co/, handler: "NetworkOnly" }],
      },
    }),
  ],
});
