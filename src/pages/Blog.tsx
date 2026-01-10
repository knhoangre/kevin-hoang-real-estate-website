import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { blogPosts } from "@/data/blogData";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const additionalPosts = [
  {
    id: 9991,
    slug: "pre-approval-checklist",
    title: "Pre-Approval Checklist for Boston Home Buyers",
    titleVi: "Danh Sách Kiểm Tra Chấp Thuận Trước Cho Người Mua Nhà Boston",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    excerpt: "Essential documents and tips to ace your mortgage pre-approval process.",
    excerptVi: "Tài liệu cần thiết và mẹo để hoàn thành quy trình chấp thuận thế chấp trước.",
    date: "2025-04-20",
  },
  {
    id: 9992,
    slug: "home-inspection-guide",
    title: "Home Inspection Guide for First-Time Buyers",
    titleVi: "Hướng Dẫn Kiểm Tra Nhà Cho Người Mua Lần Đầu",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    excerpt: "What to look for and ask during your home inspection.",
    excerptVi: "Những gì cần tìm kiếm và hỏi trong quá trình kiểm tra nhà.",
    date: "2025-04-21",
  },
  {
    id: 9993,
    slug: "market-reports",
    title: "Boston Real Estate Market Reports 2025",
    titleVi: "Báo Cáo Thị Trường Bất Động Sản Boston 2025",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=400&q=80",
    excerpt: "Latest trends and stats every Boston buyer and seller must know.",
    excerptVi: "Xu hướng và thống kê mới nhất mà mọi người mua và bán Boston phải biết.",
    date: "2025-04-22",
  },
];

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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16"
          >
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4"
            >
              {t('blog.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="text-xl text-gray-600 mb-12 max-w-3xl"
            >
              {t('blog.subtitle')}
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <motion.div
                key={post.id}
                id={`post-${post.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <Link to={`/blog/${post.slug}`} className="block">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={getTranslatedTitle(post)}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
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
              </motion.div>
            ))}
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">{t('blog.additional_resources')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {additionalPosts.map((post) => (
                <motion.div
                  key={post.id}
                  id={`post-${post.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <Link to={`/blog/${post.slug}`} className="block">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.image}
                        alt={getTranslatedTitle(post)}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
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
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
