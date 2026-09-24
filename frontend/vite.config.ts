import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from "vite-plugin-pwa";
import { prerenderPublicPagesPlugin } from "./src/utils/prerenderPlugin";

// https://vitejs.dev/config/
const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip'
          ],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-forms': ['zod', 'react-hook-form', '@hookform/resolvers'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui-utils': ['sonner', 'tailwind-merge', 'clsx', 'class-variance-authority'],
          'vendor-meta': ['react-helmet-async'],
          'vendor-dates': ['date-fns'],
          'vendor-charts': ['recharts'],
          'vendor-lottie': ['@lottiefiles/dotlottie-react'],
          'vendor-reactflow': ['reactflow'],
          'vendor-motion': ['motion'],
        }
      }
    }
  },
  plugins: [
    react(),
    !process.env.VITEST && prerenderPublicPagesPlugin(),
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
      "@": path.resolve(currentDir, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
}));
