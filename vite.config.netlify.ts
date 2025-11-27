import { defineConfig } from "vite";
import path from "path";

// This configuration is specifically for bundling the Netlify serverless function.
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "netlify/functions/api.ts"),
      name: "api",
      fileName: "api",
      formats: ["es"],
    },
    outDir: "dist/serverless",
    target: "node22",
    ssr: true,
    rollupOptions: {
      // Ensure Node.js built-ins and essential server packages are not bundled.
      // They will be available in the Netlify runtime environment.
      external: [
        "express",
        "cors",
        "serverless-http",
        "zod",
        "@supabase/supabase-js",
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs", // Çıktı uzantısının .mjs olduğunu teyit ediyoruz
      },
    },
    minify: false,
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