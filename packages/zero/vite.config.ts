import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  root: "src/client", // Set the root directory to client where React code lives
  publicDir: "src/client/public", // Static assets directory
  appType: "spa",
  build: {
    outDir: "../dist/client", // Output to dist/client (relative to root)
    emptyOutDir: true, // Clean the output directory before build
    sourcemap: true, // Generate sourcemaps for better debugging
    reportCompressedSize: false, // Disable compressed size reporting for faster builds
  },
});
