import { motion } from "framer-motion";
import { Star, ExternalLink } from "lucide-react";
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-[#1a1a1a] mb-4">{t('reviews.title')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('reviews.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
            >
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
                <cite className="text-[#1a1a1a] font-semibold not-italic">
                  — {review.name}
                </cite>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Reviews Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <a
            href="https://www.google.com/search?sca_esv=38b8b35f2fe0540c&sxsrf=AE3TifMdGaSGdNT4cYb8wIKMXCeCAzLJzg:1754452164042&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E5esONIlJexYJUuHXXQxvkJVKpeTO32wHdQ9uDsCSlZ98kuM-BKrh6bOUdgAzyrzB44Dt4QYWoDjLgpXSfec7-04F2soy25qPvMiYYPkbqY5CfBgtL7pFsysKuCujaTbC5dDAB8%3D&q=Kevin+Hoang+%7C+Greater+Boston+Realtor+Reviews&sa=X&ved=2ahUKEwiHm43Qo_WOAxV-FlkFHYA6Mh0Q0bkNegQIMhAE&biw=1440&bih=779&dpr=2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-[#1a1a1a] font-semibold hover:text-gray-600 transition-colors group"
          >
            <span className="relative">
              {t('reviews.view_all')}
              <span className="absolute -bottom-[2px] left-0 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300" />
            </span>
            <ExternalLink className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Reviews;