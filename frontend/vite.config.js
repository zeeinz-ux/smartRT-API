import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import adonisjs from "@adonisjs/vite/client";

export default defineConfig({
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
