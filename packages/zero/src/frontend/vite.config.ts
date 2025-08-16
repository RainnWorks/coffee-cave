import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { injectDmnoConfigVitePlugin } from '@dmno/vite-integration';

export default defineConfig({
  plugins: [injectDmnoConfigVitePlugin(), tailwindcss(), react()],

  publicDir: "./frontend", // Static assets directory
  build: {
    outDir: "../dist/frontend", // Output to dist/client (relative to root)
    emptyOutDir: true, // Clean the output directory before build
    sourcemap: true, // Generate sourcemaps for better debugging
    reportCompressedSize: false, // Disable compressed size reporting for faster builds
  },
});
