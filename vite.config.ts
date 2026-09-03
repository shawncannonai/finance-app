import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Served from GitHub Pages at /finance-app/, so assets need that base.
export default defineConfig({
  base: "/finance-app/",
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
        start_url: "/finance-app/",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
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
