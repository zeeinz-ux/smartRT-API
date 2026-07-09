import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import adonisjs from "@adonisjs/vite/client";

export default defineConfig({
  server: {
    port: Number(process.env.VITE_PORT) || 5173,
  },
  plugins: [
    adonisjs({
      // Sesuaikan dengan file utama di folder src kamu
      entrypoints: ["src/App.jsx"],
      buildDirectory: "../public/assets",
    }),
    react(),
    tailwindcss(),
  ],
});
