import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      // Use our custom manifest.json from public folder (editable after deployment)
      // Don't generate manifest.webmanifest
      manifest: false,
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // Don't cache index.html - always fetch fresh
        navigateFallback: null,
        // Exclude config.js and manifest.json from precaching so they can be edited after deployment
        globIgnores: ['**/config.js', '**/manifest.json'],
        runtimeCaching: [
          {
            // Always fetch config.js and manifest.json from network (never cache)
            urlPattern: /\/(config\.js|manifest\.json)$/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\.(js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    }),
    react(),
  ],
   resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@public": fileURLToPath(new URL("./public", import.meta.url)),
    },
  },
  publicDir: "public",
  // envDir defaults to project root where .env files are located
  server: {
    port: 3000,
    proxy: {
      // Backend API routes (no /api prefix)
      "/auth": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/events": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/eventtypes": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/theme": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/clubs": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/users": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/membershiptypes": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/membershipdurations": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/membershippayments": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/asset": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/utility": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/family": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/payments": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      "/swagger": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
