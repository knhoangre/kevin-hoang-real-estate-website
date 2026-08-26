import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  // Log environment variables (in development only)
  if (mode === 'development') {
    console.log('Environment variables loaded:', {
      SUPABASE_URL: env.SUPABASE_URL ? 'Present' : 'Missing',
      SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY ? 'Present' : 'Missing',
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ? 'Present' : 'Missing',
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
    });
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 8080,
    },
    ssgOptions: {
      // MUST stay 'defer', not 'async'. The generator writes an inline script
      // that sets window.__VITE_REACT_SSG_HASH__, which the app reads to fetch
      // its loader-data manifest. Under 'async' the app module can execute
      // before that inline script has run, so it requests
      // static-loader-data-manifest-undefined.json, 404s, and hydration dies
      // with React #418/#423 — intermittently, on whichever route loses the
      // race. 'defer' guarantees document order.
      script: 'defer',
      formatting: 'minify',
      // Emit /neighborhoods/newton-ma/index.html rather than a flat filename,
      // so Vercel's filesystem lookup serves the prerendered file at the clean
      // URL.
      dirStyle: 'nested',
      // Private routes (auth/admin/crm) ARE prerendered, deliberately. They are
      // kept out of search by their own noindex tag (see PrivatePage.tsx) and by
      // robots.txt, not by withholding HTML — excluding them makes Vercel's SPA
      // fallback serve the homepage's markup at those URLs, which hydrates
      // against the wrong tree. The sitemap still excludes them via isPrivate()
      // in scripts/routes.mjs.
      includedRoutes: (paths: string[]) =>
        paths.filter((p) => {
          // vite-react-ssg passes child paths WITHOUT a leading slash
          // ("contact", not "/contact"). Normalize before comparing.
          const abs = p.startsWith('/') ? p : `/${p}`;
          // Skip the catch-all and any still-unresolved dynamic segment.
          return !abs.includes(':') && !abs.includes('*');
        }),
    },
    // Vite automatically exposes VITE_ prefixed variables from .env to import.meta.env
    // The loadEnv above ensures they're loaded, and Vite handles the rest
  };
});
