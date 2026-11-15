
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "logo.PNG",
        "apple-touch-icon.png",
        "favicon.ico"
      ],

      manifest: {
        name: "EduTrack",
        short_name: "EduTrack",
        description:
          "Track your academic progress, GPA, courses and CGPA with EduTrack.",

        theme_color: "#0b3038",
        background_color: "#0b3038",
        display: "standalone",

        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],

        screenshots: [
          {
            src: "/screenshots/desktop.png",
            sizes: "2046x1278",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "/screenshots/mobile.png",
            sizes: "680x1474",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
