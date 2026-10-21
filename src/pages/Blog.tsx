import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { blogPosts, type BlogPost as BlogPostType } from '@/data/blogData';
import { ArrowRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageShell, { ShellSection } from "@/components/PageShell";
import { itemList } from "@/lib/schema";
import { monthName } from "@/lib/marketText";
import type { MarketIndex } from "@/lib/market";
import marketIndexJson from "@/data/market/index.json";

const marketIndex = marketIndexJson as MarketIndex;

/** The newest month any town has a market report for. */
const latestMarketMonth = marketIndex.towns
  .flatMap((t) => t.posts.map((p) => p.month))
  .sort()
  .pop();


const Blog = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  useEffect(() => {
    // Check if we have a hash in the URL (e.g., #post-1)
    if (location.hash) {
      // Extract the post ID from the hash
      const postId = location.hash.replace('#post-', '');
      // Find the element with the matching ID
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        // Scroll to the element
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  const getTranslatedTitle = (post: BlogPostType) => {
    return currentLanguage === 'vi' && post.titleVi ? post.titleVi : post.title;
  };

  const getTranslatedExcerpt = (post: BlogPostType) => {
    return currentLanguage === 'vi' && post.excerptVi ? post.excerptVi : post.excerpt;
  };

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
  ];

  return (
    <PageShell
      path="/blog"
      crumbs={crumbs}
      seo={{
        title: 'Greater Boston Real Estate Blog',
        description:
          'Guides and market insight for buying and selling in Greater Boston — pricing, inspections, financing, taxes, and what actually moves a deal.',
        keywords:
          'Boston real estate blog, Massachusetts home buying tips, Greater Boston market insight, MA real estate advice',
      }}
      jsonLd={itemList(blogPosts.map((post) => ({ name: post.title, url: `/blog/${post.slug}` })))}
      eyebrow="Writing"
      h1={t('blog.title')}
      lede={t('blog.subtitle')}
      hero={{
        image:
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=65',
        alt: 'A shelf of reference books',
      }}
      heroSize="standard"
      width="wide"
      cta={{
        heading: 'A question the blog did not cover?',
        body:
          'These posts answer what gets asked most often. Anything specific to your house, your street or your timeline is better answered directly.',
      }}
    >
      {latestMarketMonth && (
        <ShellSection width="wide" className="pt-16 md:pt-20 bg-white">
          {/* The monthly market reports are posts too, but generated from MLS
              data rather than written, so they live at /market and are listed
              here rather than mixed into the hand-written corpus below. */}
          <section aria-labelledby="market-reports" className="rounded-2xl border border-gray-200 bg-bone p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne-ink">Monthly</p>
            <h2 id="market-reports" className="mt-2 text-2xl font-semibold text-ink">
              The latest market reports: {monthName(latestMarketMonth)}
            </h2>
            <p className="mt-2 max-w-3xl text-gray-700">
              What sold in each town, what it sold for against asking, and what is on the market now.
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
              {marketIndex.towns
                .filter((t) => t.posts.some((p) => p.month === latestMarketMonth))
                .map((t) => (
                  <li key={t.slug}>
                    <Link
                      to={`/market/${t.slug}/${latestMarketMonth}`}
                      className="font-medium text-ink underline decoration-champagne decoration-2 underline-offset-4 transition-colors hover:decoration-champagne-ink"
                    >
                      {t.town}
                    </Link>
                  </li>
                ))}
            </ul>
            <Link to="/market" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink group">
              Every town and month <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </section>
        </ShellSection>
      )}
      <ShellSection width="wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <div key={post.id} id={`post-${post.id}`} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 enter">
                <Link to={`/blog/${post.slug}`} className="block">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={getTranslatedTitle(post)}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <span>{post.date}</span>
                    </div>
                    <h2 className="text-xl font-bold text-ink mb-3 line-clamp-2">
                      {getTranslatedTitle(post)}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {getTranslatedExcerpt(post)}
                    </p>
                    <div className="flex items-center text-ink font-medium group">
                      <span className="mr-2">{t('blog.read_more')}</span>
                      <svg
                        className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
          ))}
        </div>
      </ShellSection>
    </PageShell>
  );
};

export default Blog;
