import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // In dev, /users/* and /orders/* are proxied to the gateway (port 8000).
      // This mirrors the nginx routing so dev === production behaviour.
      "/users": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/orders": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
