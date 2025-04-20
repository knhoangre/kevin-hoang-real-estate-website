
import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { blogPosts } from "@/data/blogData";
import { ArrowLeft } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = blogPosts.find((post) => post.slug === slug);

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
            to="/blog" 
            className="inline-flex items-center text-[#1a1a1a] mb-8 group hover:text-[#1a1a1a]/80 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO ALL ARTICLES</span>
          </Link>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a1a] mb-6">
            {post.title}
          </h1>
          
          <div className="flex items-center mb-12">
            <p className="text-gray-500">By {post.author} | {post.date}</p>
          </div>
          
          <div className="rounded-lg overflow-hidden mb-12">
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-[400px] object-cover"
            />
          </div>
          
          <div className="max-w-3xl mx-auto prose prose-lg">
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-6">{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
