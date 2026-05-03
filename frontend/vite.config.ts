import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000, // 4MB
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "favicon.svg"],
      manifest: {
        name: "CampusSphere",
        short_name: "CampusSphere",
        description: "Le réseau social qui connecte les étudiants. Connectez-vous, partagez et grandissez avec la communauté.",
        theme_color: "#ff9800",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "favicon-96x96.png",
            sizes: "96x96",
            type: "image/png"
          },
          {
            src: "web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
}));
