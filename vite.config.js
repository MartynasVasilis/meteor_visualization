import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: "public",
  base: "/assets/r3f_demo",
  build: { outDir: "dist" },
});
