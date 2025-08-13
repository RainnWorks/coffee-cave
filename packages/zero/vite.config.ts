import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";
import { injectDmnoConfigVitePlugin } from '@dmno/vite-integration';

export default defineConfig({
  plugins: [injectDmnoConfigVitePlugin(), tailwindcss(), reactRouter()],
  publicDir: "./public", // Static assets directory
  build: {
    outDir: "../dist/frontend", // Output to dist/client (relative to root)
    emptyOutDir: true, // Clean the output directory before build
    sourcemap: true, // Generate sourcemaps for better debugging
    reportCompressedSize: false, // Disable compressed size reporting for faster builds
  },
});
