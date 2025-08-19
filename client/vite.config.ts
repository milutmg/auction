import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: false, // Allow port switching if 8080 is occupied
    open: false, // Don't auto-open browser
    cors: true,
    // HMR configuration
    hmr: {
      port: 8080,
      host: "localhost"
    }
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: false,
    cors: true
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure proper asset handling
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: mode === "development",
  },
  // Define environment variables
  define: {
    __DEV__: mode === "development",
  },
}));
