import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import "./i18n";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Analytics from "@/components/Analytics";
import LanguagePreference from "@/components/LanguagePreference";

const queryClient = new QueryClient();

/**
 * Root layout route. The route table itself lives in src/AppRoutes.tsx.
 *
 * This deliberately contains NO <BrowserRouter> and NO <HelmetProvider>:
 * ViteReactSSG owns both, on the client and inside the static generator.
 * Nesting either one here shadows the generator's own and head tags silently
 * stop being collected at build time.
 *
 * Providers that must wrap every page belong here.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <ScrollToTop />
        <LanguagePreference />
        <Analytics />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main id="main-content" className="flex-grow">
            <Outlet />
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
