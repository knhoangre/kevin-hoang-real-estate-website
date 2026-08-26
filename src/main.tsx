import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './AppRoutes';
import './index.css';

/**
 * Entry point for both the client and the static generator.
 *
 * ViteReactSSG owns the router and the HelmetProvider on both sides — see the
 * note in App.tsx. Providers that must wrap every page belong in App.tsx, which
 * is the root layout route.
 */
export const createRoot = ViteReactSSG({ routes });
