import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

import fs from "fs";
import dotenv from "dotenv";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Try local.env first if present
  if (fs.existsSync(path.resolve(process.cwd(), "local.env"))) {
    dotenv.config({ path: path.resolve(process.cwd(), "local.env") });
  }

  // Vite natively loads .env, .env.local, .env.[mode], .env.[mode].local
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
        "/gallery": {
          target: "http://localhost:3001",
          changeOrigin: true,
          bypass(req) {
            if (req.headers.accept?.includes("text/html")) {
              return "/index.html";
            }
          },
        },
        "/documents": {
          target: "http://localhost:3001",
          changeOrigin: true,
          bypass(req) {
            if (req.headers.accept?.includes("text/html")) {
              return "/index.html";
            }
          },
        },
        "/feed": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
        "/admin/queues": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "markdown-ai-dev-proxy",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url || '';
            const pathOnly = url.split('?')[0];
            const isMdOrAi = (pathOnly.endsWith('.md') || pathOnly.endsWith('/llms.txt') || pathOnly === '/llms.txt') && !pathOnly.includes('@') && !pathOnly.includes('node_modules');
            
            if (isMdOrAi) {
              try {
                // Forward to Express backend on localhost:3001
                const backendUrl = `http://localhost:3001${url}`;
                const forwardedHeaders: Record<string, string> = {};
                for (const [k, v] of Object.entries(req.headers)) {
                  if (typeof v === 'string') forwardedHeaders[k] = v;
                }
                forwardedHeaders['x-forwarded-host'] = req.headers.host || 'blog.localhost:8080';
                
                const fetchRes = await fetch(backendUrl, {
                  headers: forwardedHeaders
                });
                
                if (fetchRes.ok) {
                  res.setHeader('Content-Type', fetchRes.headers.get('content-type') || 'text/markdown; charset=utf-8');
                  const body = await fetchRes.text();
                  res.end(body);
                  return;
                }
              } catch (err) {
                console.warn('[Vite MD Proxy] Error forwarding to backend:', (err as any)?.message);
              }
            }
            next();
          });
        }
      }
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
