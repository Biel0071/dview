import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: Number(process.env.WEB_PORT || 5000),
    host: "0.0.0.0"
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
