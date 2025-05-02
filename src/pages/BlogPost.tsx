import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { blogPosts } from "@/data/blogData";
import { ArrowLeft } from "lucide-react";

const additionalPosts = [
  {
    id: 9991,
    slug: "pre-approval-checklist",
    title: "Pre-Approval Checklist for Boston Home Buyers",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    excerpt: "Essential documents and tips to ace your mortgage pre-approval process.",
    date: "2025-04-20",
    author: "Kevin Hoang",
    content: "Securing a mortgage pre-approval is a crucial first step in the home buying process. This guide will help you prepare the necessary documents and understand what lenders look for.\n\nEssential documents include recent pay stubs, W-2 forms, tax returns, bank statements, and proof of assets. Having these ready can speed up the pre-approval process significantly.\n\nYour credit score plays a vital role in determining your interest rate and loan terms. Before applying, review your credit report and address any issues that might affect your score.\n\nLenders will evaluate your debt-to-income ratio, which compares your monthly debt payments to your gross monthly income. Keeping this ratio low can improve your chances of approval.\n\nUnderstanding the different types of mortgage programs available in Massachusetts can help you choose the best option for your situation. From conventional loans to government-backed programs, each has its own requirements and benefits."
  },
  {
    id: 9992,
    slug: "home-inspection-guide",
    title: "Home Inspection Guide for First-Time Buyers",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    excerpt: "What to look for and ask during your home inspection.",
    date: "2025-04-21",
    author: "Kevin Hoang",
    content: "A thorough home inspection is essential for making an informed purchase decision. This guide will help you understand what to expect and what to look for during the process.\n\nKey areas to focus on include the foundation, roof, electrical system, plumbing, and HVAC. Each of these systems can be costly to repair or replace if issues are discovered after purchase.\n\nYour inspector should check for signs of water damage, structural issues, and potential safety hazards. Don't hesitate to ask questions about any concerns that arise during the inspection.\n\nUnderstanding the difference between major and minor issues can help you negotiate repairs or price adjustments. Some issues may be deal-breakers, while others can be addressed after closing.\n\nAfter the inspection, review the report carefully with your real estate agent. They can help you determine the best course of action based on the findings."
  },
  {
    id: 9993,
    slug: "market-reports",
    title: "Boston Real Estate Market Reports 2025",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=400&q=80",
    excerpt: "Latest trends and stats every Boston buyer and seller must know.",
    date: "2025-04-22",
    author: "Kevin Hoang",
    content: "The Boston real estate market continues to show strong performance in 2025. This comprehensive report covers the latest trends and statistics that buyers and sellers need to know.\n\nMedian home prices have shown steady growth across most neighborhoods, with particularly strong performance in areas with new transit options and development projects.\n\nInventory levels remain tight, creating a competitive market for buyers. Properties in desirable locations often receive multiple offers and sell quickly.\n\nInterest rates have stabilized after recent fluctuations, providing more predictability for both buyers and sellers. This stability has helped maintain strong market activity.\n\nUnderstanding these market dynamics can help you make informed decisions about timing your purchase or sale. Working with a knowledgeable real estate agent is crucial for navigating this complex market."
  }
];

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = [...blogPosts, ...additionalPosts].find((post) => post.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);

    // If post not found, redirect to blog listing
    if (!post) {
      navigate("/blog");
    }
  }, [post, navigate]);

  if (!post) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <Link
            to={`/blog#post-${post.id}`}
            className="inline-flex items-center text-[#1a1a1a] mb-8 group hover:text-[#1a1a1a]/80 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO ALL ARTICLES</span>
          </Link>

          <article className="max-w-4xl mx-auto">
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1a1a] mb-6 leading-tight">
                {post.title}
              </h1>

              <div className="flex items-center text-gray-500 mb-8">
                <span className="text-sm">{post.date}</span>
                <span className="mx-2">•</span>
                <span className="text-sm">By {post.author}</span>
              </div>

              <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden mb-12">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </header>

            <div className="prose prose-lg max-w-none">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p
                  key={index}
                  className="text-gray-700 leading-relaxed mb-6 text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Share this article</h2>
              <div className="flex space-x-4">
                <button className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors">
                  Share on Twitter
                </button>
                <button className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors">
                  Share on Facebook
                </button>
                <button className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors">
                  Share on LinkedIn
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
