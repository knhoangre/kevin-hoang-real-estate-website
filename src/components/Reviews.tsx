import { Link } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const reviews = [
  {
    name: "Monique",
    text: "Kevin's extensive experience and knowledge were invaluable in navigating a challenging market effortlessly, thanks to his keen insight into market trends. As a seasoned expert in home staging and presentation, Kevin's advice significantly improved the home's appeal and marketability, leading to a quick sale.",
    rating: 5
  },
  {
    name: "Brian",
    text: "Kevin is incredibly organized and detail-oriented, which made the entire process run smoothly. He anticipates potential challenges and handle them efficiently, so there are no surprises along the way.",
    rating: 5
  },
  {
    name: "Rose",
    text: "I have personally known Kevin for many years. I know that he was intelligent and hard working as an engineer and you can see those characteristics shine when he's a real estate agent. I have dealt with a lot of bad agents, but Kevin really gives agents a good reputation. I highly recommend Kevin to anybody who is buying, selling, or even renting.",
    rating: 5
  }
];

const Reviews = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 enter">
          <span className="mx-auto mb-5 block h-px w-10 bg-champagne" aria-hidden />
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink mb-4">
            {t('reviews.title')}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('reviews.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {reviews.map((review, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full enter" style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}>
              {/* Star Rating */}
              <div className="flex items-center mb-4">
                {[...Array(review.rating)].map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    className="w-5 h-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>

              {/* Review Text */}
              <blockquote className="text-gray-700 mb-4 leading-relaxed flex-grow">
                "{review.text}"
              </blockquote>

              {/* Reviewer Name */}
              <div className="border-t border-gray-200 pt-4 mt-auto">
                <cite className="text-ink font-semibold not-italic">
                  — {review.name}
                </cite>
              </div>
            </div>
          ))}
        </div>

        {/* View All Reviews Link */}
        <div className="text-center enter" style={{ '--enter-delay': '0.4s' } as React.CSSProperties}>
          <Link
            to="/testimonials"
            className="inline-flex items-center text-ink font-semibold hover:text-gray-600 transition-colors group"
          >
            <span className="relative">
              {t('reviews.view_all')}
              <span className="absolute -bottom-[2px] left-0 w-0 h-0.5 bg-ink group-hover:w-full transition-all duration-300" />
            </span>
            <ChevronRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Reviews;