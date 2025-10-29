import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Disable source maps for Poki
    sourcemap: false,
    
    // Create single bundle without chunk splitting
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
    
    // Inline small assets to reduce HTTP requests
    assetsInlineLimit: 10000,
    
    // Minification with esbuild (faster, no extra deps)
    minify: true,
    esbuild: {
      drop: ['console', 'debugger'],
    },
  },
}));
