import { defineConfig } from "vite";
import path from "path";

// Netlify serverless function build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "netlify/functions/api.ts"),
      name: "api",
      fileName: "api",
      formats: ["es"],
    },
    outDir: "dist/serverless/netlify/functions",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        // External dependencies that should be bundled by Vite/Rollup
        // We explicitly exclude 'express' and 'serverless-http' from external to force bundling them.
        // This is the key change to fix the 'Cannot find module 'express'' error.
      ],
      output: {
        format: "es",
        entryFileNames: "[name].js", // Netlify requires .js extension for ES modules
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});