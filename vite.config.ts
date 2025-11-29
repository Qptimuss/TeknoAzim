import { defineConfig, Plugin, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Ortam değişkenlerini .env dosyasından yükle
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      fs: {
        allow: ["./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
    },
    build: {
      outDir: "dist/spa",
    },
    plugins: [dyadComponentTagger(), react(), expressPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

function expressPlugin(env: Record<string, string>): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development
    configureServer(server) {
      // Ortam değişkenlerini Express sunucusuna aktar
      const app = createServer(env);

      // Express uygulamasını Vite dev server middleware zincirine ekle
      server.middlewares.use(app);
    },
  };
}
