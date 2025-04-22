import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { blogPosts } from "@/data/blogData";
import { ArrowRight } from "lucide-react";

const additionalPosts = [
  {
    id: 9991,
    slug: "pre-approval-checklist",
    title: "Pre-Approval Checklist for Boston Home Buyers",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    excerpt: "Essential documents and tips to ace your mortgage pre-approval process.",
    date: "2025-04-20",
  },
  {
    id: 9992,
    slug: "home-inspection-guide",
    title: "Home Inspection Guide for First-Time Buyers",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    excerpt: "What to look for and ask during your home inspection.",
    date: "2025-04-21",
  },
  {
    id: 9993,
    slug: "market-reports",
    title: "Boston Real Estate Market Reports 2025",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=400&q=80",
    excerpt: "Latest trends and stats every Boston buyer and seller must know.",
    date: "2025-04-22",
  },
];

const Blog = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-12">
            REAL ESTATE INSIGHTS
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...blogPosts, ...additionalPosts].map((post) => (
              <div 
                key={post.id}
                className="group bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100"
              >
                <Link to={`/blog/${post.slug}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-500 mb-2">{post.date}</p>
                    <h2 className="text-xl font-semibold mb-3 text-[#1a1a1a] group-hover:text-[#1a1a1a]/80 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <div className="flex items-center text-[#1a1a1a] font-medium group-hover:text-[#1a1a1a]/80 transition-colors">
                      <span>SHOW MORE</span>
                      <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
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
