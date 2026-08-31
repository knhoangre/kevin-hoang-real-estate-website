import type { RouteRecord } from 'vite-react-ssg';
import App from './App';
import PrivatePage from './components/PrivatePage';

/**
 * Route table for vite-react-ssg.
 *
 * This replaced a JSX <Routes> tree, which the static generator cannot walk.
 * Every route is code-split: `lazy` maps our default exports onto react-router's
 * expected `Component` named export, and `entry` points at the source file so
 * the generator can resolve that route's CSS and avoid a flash of unstyled
 * content before hydration.
 *
 * IMPORTANT: adding a route here is only half the job. It must also be added to
 * scripts/routes.mjs, or it will be missing from the sitemap — and because
 * Vercel checks the filesystem before applying rewrites, a route with no
 * prerendered file 404s on hard refresh even though in-app navigation works.
 */
const page = (
  path: string,
  importer: () => Promise<{ default: React.ComponentType }>,
  entry: string
): RouteRecord => ({
  path,
  lazy: async () => ({ Component: (await importer()).default }),
  entry,
});

/** Same as `page`, but wraps the component so the route carries `noindex`. */
const privatePage = (
  path: string,
  title: string,
  importer: () => Promise<{ default: React.ComponentType }>,
  entry: string
): RouteRecord => ({
  path,
  lazy: async () => {
    const Component = (await importer()).default;
    return {
      Component: () => (
        <PrivatePage title={title}>
          <Component />
        </PrivatePage>
      ),
    };
  },
  entry,
});

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <App />,
    entry: 'src/App.tsx',
    children: [
      // Loaded lazily like every sibling. Rendering the index eagerly while its
      // siblings resolve lazily makes the homepage hydrate against a tree React
      // has not finished resolving.
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/Index')).default }),
        entry: 'src/pages/Index.tsx',
      },

      // --- Commercial landing pages -------------------------------------
      // Each owns ONE axis and none may reuse another's <h1>/<h2> strings.
      // Convergent pages compete for the same query and neither ranks.
      //   /needham-real-estate-agent    intent  — "who do I hire"
      //   /home-valuation               seller intent
      //   /vietnamese-speaking-...      language
      //   /relocation                   origin market (CT -> MA)
      // The town guides under /neighborhoods stay purely informational.
      page(
        'needham-real-estate-agent',
        () => import('./pages/NeedhamAgent'),
        'src/pages/NeedhamAgent.tsx'
      ),
      page('home-valuation', () => import('./pages/HomeValuation'), 'src/pages/HomeValuation.tsx'),
      page(
        'vietnamese-speaking-real-estate-agent',
        () => import('./pages/VietnameseAgent'),
        'src/pages/VietnameseAgent.tsx'
      ),
      page('relocation', () => import('./pages/Relocation'), 'src/pages/Relocation.tsx'),

      // --- The person ----------------------------------------------------
      // Owns the PERSON axis, distinct from the four service pages above.
      // #kevin is referenced as author on every post and as the agent's
      // employee; this is the page that describes him.
      page('about', () => import('./pages/About'), 'src/pages/About.tsx'),

      // --- Guides and evergreen content ---------------------------------
      page('buyer', () => import('./pages/Buyer'), 'src/pages/Buyer.tsx'),
      page('seller', () => import('./pages/Seller'), 'src/pages/Seller.tsx'),
      page(
        'first-time-buyers',
        () => import('./pages/FirstTimeBuyers'),
        'src/pages/FirstTimeBuyers.tsx'
      ),
      page('faq', () => import('./pages/FAQPage'), 'src/pages/FAQPage.tsx'),
      page('calculator', () => import('./pages/Calculator'), 'src/pages/Calculator.tsx'),
      page('testimonials', () => import('./pages/Testimonials'), 'src/pages/Testimonials.tsx'),
      page('properties', () => import('./pages/PropertiesList'), 'src/pages/PropertiesList.tsx'),
      {
        // One page per closing, expanded from the committed snapshot. These
        // were `#listing-<slug>` fragments on /properties until now, which
        // nothing could rank, cite or link to as a subject of its own — and
        // they are the only first-party evidence on the site.
        path: 'properties/:slug',
        lazy: async () => ({ Component: (await import('./pages/PropertyDetail')).default }),
        entry: 'src/pages/PropertyDetail.tsx',
        getStaticPaths: async () => {
          const { soldListings } = await import('./data/soldListings');
          return soldListings.map((l) => `/properties/${l.slug}`);
        },
      },
      page('contact', () => import('./pages/Contact'), 'src/pages/Contact.tsx'),

      // --- Town guides ---------------------------------------------------
      page('neighborhoods', () => import('./pages/Neighborhoods'), 'src/pages/Neighborhoods.tsx'),
      {
        path: 'neighborhoods/:slug',
        lazy: async () => ({ Component: (await import('./pages/NeighborhoodDetail')).default }),
        entry: 'src/pages/NeighborhoodDetail.tsx',
        // Expands the dynamic segment into one prerendered page per town.
        getStaticPaths: async () => {
          const { neighborhoods } = await import('./data/neighborhoodData');
          return neighborhoods.map((n) => `/neighborhoods/${n.slug}`);
        },
      },

      // --- Blog ----------------------------------------------------------
      page('blog', () => import('./pages/Blog'), 'src/pages/Blog.tsx'),
      {
        path: 'blog/:slug',
        lazy: async () => ({ Component: (await import('./pages/BlogPost')).default }),
        entry: 'src/pages/BlogPost.tsx',
        getStaticPaths: async () => {
          const { blogPosts } = await import('./data/blogData');
          return blogPosts.map((p) => `/blog/${p.slug}`);
        },
      },

      // --- Vietnamese ------------------------------------------------------
      // Real prerendered routes, NOT the language toggle. The toggle swaps copy
      // after hydration, so no Vietnamese text existed in any prerendered
      // document and no crawler had ever seen a word of it. These are paired
      // with their English counterparts by src/lib/viRoutes.ts, which feeds the
      // reciprocal hreflang on both sides.
      page('vi', () => import('./pages/vi/ViHome'), 'src/pages/vi/ViHome.tsx'),
      page('vi/mua-nha', () => import('./pages/vi/ViBuy'), 'src/pages/vi/ViBuy.tsx'),
      page('vi/ban-nha', () => import('./pages/vi/ViSell'), 'src/pages/vi/ViSell.tsx'),
      page(
        'vi/dinh-gia-nha',
        () => import('./pages/vi/ViValuation'),
        'src/pages/vi/ViValuation.tsx'
      ),
      page(
        'vi/cau-hoi-thuong-gap',
        () => import('./pages/vi/ViFaq'),
        'src/pages/vi/ViFaq.tsx'
      ),
      page('vi/khu-vuc', () => import('./pages/vi/ViAreas'), 'src/pages/vi/ViAreas.tsx'),
      page('vi/gioi-thieu', () => import('./pages/vi/ViAbout'), 'src/pages/vi/ViAbout.tsx'),
      page(
        'vi/chuyen-den-massachusetts',
        () => import('./pages/vi/ViRelocation'),
        'src/pages/vi/ViRelocation.tsx'
      ),
      page(
        'vi/danh-gia',
        () => import('./pages/vi/ViTestimonials'),
        'src/pages/vi/ViTestimonials.tsx'
      ),
      page(
        'vi/cong-cu-tinh-toan',
        () => import('./pages/vi/ViCalculator'),
        'src/pages/vi/ViCalculator.tsx'
      ),
      page('vi/lien-he', () => import('./pages/vi/ViContact'), 'src/pages/vi/ViContact.tsx'),

      // --- Legal ----------------------------------------------------------
      page('privacy-policy', () => import('./pages/PrivacyPolicy'), 'src/pages/PrivacyPolicy.tsx'),
      page(
        'terms-of-service',
        () => import('./pages/TermsOfService'),
        'src/pages/TermsOfService.tsx'
      ),
      page('disclaimer', () => import('./pages/Disclaimer'), 'src/pages/Disclaimer.tsx'),

      // --- Private / gated -------------------------------------------------
      // Prerendered but noindex. See the header comment in PrivatePage.tsx for
      // why these are not simply excluded from the prerender set.
      privatePage('auth', 'Sign In', () => import('./pages/Auth'), 'src/pages/Auth.tsx'),
      privatePage(
        'auth/callback',
        'Signing In',
        () => import('./pages/AuthCallback'),
        'src/pages/AuthCallback.tsx'
      ),
      privatePage('profile', 'Your Profile', () => import('./pages/Profile'), 'src/pages/Profile.tsx'),
      privatePage(
        'complete-profile',
        'Complete Your Profile',
        () => import('./components/ProfileCompletion'),
        'src/components/ProfileCompletion.tsx'
      ),
      privatePage('open-house', 'Open House Sign In', () => import('./pages/OpenHouse'), 'src/pages/OpenHouse.tsx'),
      privatePage('events', 'Event Sign In', () => import('./pages/Events'), 'src/pages/Events.tsx'),
      privatePage('admin', 'Admin', () => import('./pages/AdminHome'), 'src/pages/AdminHome.tsx'),
      privatePage('admin/follow-up', 'Follow Up', () => import('./pages/FollowUp'), 'src/pages/FollowUp.tsx'),
      privatePage(
        'admin/follow-up/open-house',
        'Follow Up — Open House',
        () => import('./pages/FollowUp'),
        'src/pages/FollowUp.tsx'
      ),
      privatePage(
        'admin/follow-up/events',
        'Follow Up — Events',
        () => import('./pages/FollowUp'),
        'src/pages/FollowUp.tsx'
      ),
      privatePage(
        'admin/follow-up/messages',
        'Follow Up — Messages',
        () => import('./pages/FollowUp'),
        'src/pages/FollowUp.tsx'
      ),
      privatePage(
        'admin/properties',
        'Manage Properties',
        () => import('./pages/Properties'),
        'src/pages/Properties.tsx'
      ),
      privatePage(
        'admin/lockboxes',
        'Lockboxes',
        () => import('./pages/Lockboxes'),
        'src/pages/Lockboxes.tsx'
      ),
      privatePage('crm', 'CRM', () => import('./pages/CRMDashboard'), 'src/pages/CRMDashboard.tsx'),
      privatePage('crm/contacts', 'CRM Contacts', () => import('./pages/CRMContacts'), 'src/pages/CRMContacts.tsx'),
      privatePage('crm/deals', 'CRM Deals', () => import('./pages/CRMDeals'), 'src/pages/CRMDeals.tsx'),

      // Handles in-app navigation to a bad link. True unknown URLs never reach
      // React at all — Vercel serves public/404.html with a real HTTP 404.
      {
        path: '*',
        lazy: async () => ({ Component: (await import('./pages/NotFound')).default }),
        entry: 'src/pages/NotFound.tsx',
      },
    ],
  },
];
