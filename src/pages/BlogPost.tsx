import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { blogPosts, getRelatedPosts, toIsoDate } from "@/data/blogData";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import BreadcrumbBar from "@/components/BreadcrumbBar";
import { agentIdentity, blogPosting, breadcrumbs, person } from "@/lib/schema";


const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const post = blogPosts.find((post) => post.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);

    // If post not found, redirect to blog listing
    if (!post) {
      navigate("/blog");
    }
  }, [post, navigate]);

  if (!post) return null;

  const getTranslatedTitle = (post: any) => {
    return currentLanguage === 'vi' && post.titleVi ? post.titleVi : post.title;
  };

  const getTranslatedContent = (post: any) => {
    return currentLanguage === 'vi' && post.contentVi ? post.contentVi : post.content;
  };

  // Function to parse markdown and convert to JSX
  const parseMarkdown = (text: string) => {
    // Split by double newlines to get paragraphs
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, pIndex) => {
      // Check if it's a heading (starts with ** and ends with ** on same line)
      const headingMatch = paragraph.match(/^\*\*(.+?)\*\*$/);
      if (headingMatch) {
        return (
          <h2
            key={pIndex}
            className="text-2xl font-bold text-[#1a1a1a] mt-8 mb-4"
          >
            {headingMatch[1]}
          </h2>
        );
      }
      
      // Process bold text and regular text
      const parts: (string | JSX.Element)[] = [];
      const boldRegex = /\*\*(.+?)\*\*/g;
      let match;
      let lastIndex = 0;
      let hasBold = false;
      
      while ((match = boldRegex.exec(paragraph)) !== null) {
        hasBold = true;
        // Add text before the bold
        if (match.index > lastIndex) {
          parts.push(paragraph.substring(lastIndex, match.index));
        }
        // Add the bold text
        parts.push(
          <strong key={`bold-${match.index}`} className="font-semibold text-[#1a1a1a]">
            {match[1]}
          </strong>
        );
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < paragraph.length) {
        parts.push(paragraph.substring(lastIndex));
      }
      
      // If no bold text was found, just return the paragraph as is
      if (!hasBold) {
        parts.push(paragraph);
      }
      
      return (
        <p
          key={pIndex}
          className="text-gray-700 leading-relaxed mb-6 text-lg"
        >
          {parts}
        </p>
      );
    });
  };

  const published = toIsoDate(post.date);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/*
        The head values are written in English regardless of the reader's
        language toggle, because that is what every page was prerendered in —
        and person() is emitted alongside the article so blogPosting()'s author
        reference, which points at the Person @id, actually resolves.
      */}
      <Seo
        title={post.title}
        description={post.excerpt}
        ogImage={post.image}
        ogType="article"
        article={{
        publishedTime: published ?? undefined,
        author: post.author,
        }}
        jsonLd={[
          breadcrumbs(crumbs),
          // Both of these are DECLARATIONS that the article's own references
          // depend on: blogPosting().author points at #kevin and its
          // publisher points at #agent, and an @id only resolves against a
          // node present in the same document.
          person(),
          agentIdentity(),
          blogPosting({
            title: post.title,
            slug: post.slug,
            description: post.excerpt,
            image: post.image,
            author: post.author,
            // Falls back to the display string only if it will not parse; a
            // fabricated date would be worse than an imperfect one.
            datePublished: published ?? post.date,
          }),
        ]}
      />
      <div className="pt-16">
        <div className="container px-4 py-24">
          <BreadcrumbBar items={crumbs} />
          <Link
            to={`/blog#post-${post.id}`}
            className="inline-flex items-center text-[#1a1a1a] mb-8 group hover:text-[#1a1a1a]/80 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>{t('blog.back_to_articles')}</span>
          </Link>

          <article className="max-w-4xl mx-auto">
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1a1a] mb-6 leading-tight">
                {getTranslatedTitle(post)}
              </h1>

              <div className="flex items-center text-gray-500 mb-8">
                <span className="text-sm">{post.date}</span>
                <span className="mx-2">•</span>
                <span className="text-sm">By {post.author}</span>
              </div>

              <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden mb-12">
                <img
                  src={post.image}
                  alt={getTranslatedTitle(post)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </header>

            <div className="prose prose-lg max-w-none">
              {parseMarkdown(getTranslatedContent(post))}
            </div>

            {/* Every post links out to three topically related ones, so the
                corpus is a connected graph rather than a set of dead ends. */}
            <aside className="mt-16 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Related reading</h2>
              <ul className="grid gap-4 md:grid-cols-3 list-none p-0">
                {getRelatedPosts(post).map((related) => (
                  <li key={related.slug} className="m-0">
                    <Link
                      to={`/blog/${related.slug}`}
                      className="block h-full rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                    >
                      <span className="block font-medium text-[#1a1a1a]">
                        {getTranslatedTitle(related)}
                      </span>
                      <span className="mt-2 block text-sm text-gray-600 line-clamp-3">
                        {currentLanguage === 'vi' && related.excerptVi
                          ? related.excerptVi
                          : related.excerpt}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="mt-16 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">{t('blog.share_article')}</h2>
              <div className="flex space-x-4">
                <button className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors">
                  {t('blog.share_twitter')}
                </button>
                <button className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors">
                  {t('blog.share_facebook')}
                </button>
                <button className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors">
                  {t('blog.share_linkedin')}
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
