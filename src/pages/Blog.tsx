
import { Link } from "react-router-dom";

const blogPosts = [
  {
    id: 1,
    title: "Why Boston's Real Estate Market Remains Strong in 2025",
    excerpt: "Analysis of current market trends and future predictions for Boston's real estate landscape.",
    slug: "boston-real-estate-market-2025"
  },
  {
    id: 2,
    title: "Top 5 Up-and-Coming Neighborhoods in Greater Boston",
    excerpt: "Discover the next hot spots in Boston's real estate market.",
    slug: "up-and-coming-boston-neighborhoods"
  },
  {
    id: 3,
    title: "Investment Opportunities in Massachusetts Real Estate",
    excerpt: "Guide to finding and evaluating investment properties in Massachusetts.",
    slug: "mass-real-estate-investment-guide"
  },
  {
    id: 4,
    title: "The Tech Professional's Guide to Boston Real Estate",
    excerpt: "Smart property buying strategies for tech industry professionals.",
    slug: "tech-professionals-boston-real-estate"
  },
  {
    id: 5,
    title: "Historic Homes in Massachusetts: What Buyers Should Know",
    excerpt: "Essential information for buying and maintaining historic properties.",
    slug: "historic-homes-massachusetts-guide"
  },
  {
    id: 6,
    title: "Smart Home Features That Increase Property Value",
    excerpt: "How technology integration can boost your home's market value.",
    slug: "smart-home-property-value"
  },
  {
    id: 7,
    title: "Massachusetts Property Tax Guide for Homeowners",
    excerpt: "Understanding property taxes and assessments in Massachusetts.",
    slug: "mass-property-tax-guide"
  },
  {
    id: 8,
    title: "Navigating Multiple Offers in Boston's Competitive Market",
    excerpt: "Strategies for buyers and sellers in multiple offer situations.",
    slug: "multiple-offers-boston-market"
  },
  {
    id: 9,
    title: "Energy Efficient Homes in Massachusetts",
    excerpt: "Benefits and considerations for energy-efficient properties.",
    slug: "energy-efficient-homes-mass"
  },
  {
    id: 10,
    title: "First-Time Home Buying in Greater Boston",
    excerpt: "Complete guide for first-time buyers in the Boston area.",
    slug: "first-time-buying-boston"
  },
  {
    id: 11,
    title: "Luxury Real Estate Trends in Massachusetts",
    excerpt: "Current trends and forecasts in the luxury market segment.",
    slug: "luxury-real-estate-trends-mass"
  },
  {
    id: 12,
    title: "Home Renovation ROI in Massachusetts",
    excerpt: "Which renovations offer the best return on investment in the local market.",
    slug: "home-renovation-roi-mass"
  }
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container px-4 py-24">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-12">
          REAL ESTATE INSIGHTS
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <div 
              key={post.id}
              className="group bg-gray-50 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <Link to={`/blog/${post.slug}`}>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-3 text-[#1a1a1a] group-hover:text-[#1a1a1a]/80 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600">{post.excerpt}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
