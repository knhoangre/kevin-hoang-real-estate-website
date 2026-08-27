import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { blogPosts } from "@/data/blogData";
import { ArrowRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import { breadcrumbs, itemList } from "@/lib/schema";
import BreadcrumbBar from "@/components/BreadcrumbBar";


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

  const getTranslatedTitle = (post: any) => {
    return currentLanguage === 'vi' && post.titleVi ? post.titleVi : post.title;
  };

  const getTranslatedExcerpt = (post: any) => {
    return currentLanguage === 'vi' && post.excerptVi ? post.excerptVi : post.excerpt;
  };

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Greater Boston Real Estate Blog"
        description="Guides and market insight for buying and selling in Greater Boston — pricing, inspections, financing, taxes, and what actually moves a deal."
        keywords="Boston real estate blog, Massachusetts home buying tips, Greater Boston market insight, MA real estate advice"
        jsonLd={[breadcrumbs(crumbs), itemList(
        blogPosts.map((post) => ({ name: post.title, url: `/blog/${post.slug}` }))
        )]}
      />
      <div className="pt-16">
        <div className="container px-4 py-24">
            <BreadcrumbBar items={crumbs} />
          <div className="mb-16 enter-down">
            <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4 enter-down" style={{ '--enter-delay': '0.2s' } as React.CSSProperties}>
              {t('blog.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl enter-down" style={{ '--enter-delay': '0.4s' } as React.CSSProperties}>
              {t('blog.subtitle')}
            </p>
          </div>

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
                    <h2 className="text-xl font-bold text-[#1a1a1a] mb-3 line-clamp-2">
                      {getTranslatedTitle(post)}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {getTranslatedExcerpt(post)}
                    </p>
                    <div className="flex items-center text-[#1a1a1a] font-medium group">
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

        </div>
      </div>
    </div>
  );
};

export default Blog;
