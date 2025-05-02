import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    define: {
      // Only expose VITE_ prefixed variables to the client
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
  };
});
