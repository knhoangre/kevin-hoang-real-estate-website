import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { blogPosts } from "@/data/blogData";
import { ArrowLeft } from "lucide-react";
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
    author: "Kevin Hoang",
    content: "Securing a mortgage pre-approval is a crucial first step in the home buying process. This guide will help you prepare the necessary documents and understand what lenders look for.\n\nEssential documents include recent pay stubs, W-2 forms, tax returns, bank statements, and proof of assets. Having these ready can speed up the pre-approval process significantly.\n\nYour credit score plays a vital role in determining your interest rate and loan terms. Before applying, review your credit report and address any issues that might affect your score.\n\nLenders will evaluate your debt-to-income ratio, which compares your monthly debt payments to your gross monthly income. Keeping this ratio low can improve your chances of approval.\n\nUnderstanding the different types of mortgage programs available in Massachusetts can help you choose the best option for your situation. From conventional loans to government-backed programs, each has its own requirements and benefits.",
    contentVi: "Đảm bảo chấp thuận thế chấp trước là bước đầu tiên quan trọng trong quá trình mua nhà. Hướng dẫn này sẽ giúp bạn chuẩn bị các tài liệu cần thiết và hiểu những gì người cho vay tìm kiếm.\n\nCác tài liệu cần thiết bao gồm phiếu lương gần đây, biểu mẫu W-2, khai thuế, sao kê ngân hàng và bằng chứng tài sản. Có sẵn những thứ này có thể đẩy nhanh quy trình chấp thuận trước đáng kể.\n\nĐiểm tín dụng của bạn đóng vai trò quan trọng trong việc xác định lãi suất và điều khoản cho vay. Trước khi nộp đơn, hãy xem xét báo cáo tín dụng và giải quyết bất kỳ vấn đề nào có thể ảnh hưởng đến điểm số của bạn.\n\nNgười cho vay sẽ đánh giá tỷ lệ nợ trên thu nhập của bạn, so sánh khoản thanh toán nợ hàng tháng với tổng thu nhập hàng tháng. Giữ tỷ lệ này thấp có thể cải thiện cơ hội được chấp thuận.\n\nHiểu biết về các loại chương trình thế chấp khác nhau có sẵn tại Massachusetts có thể giúp bạn chọn tùy chọn tốt nhất cho tình huống của mình. Từ các khoản vay thông thường đến các chương trình được chính phủ hỗ trợ, mỗi loại có yêu cầu và lợi ích riêng."
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
    author: "Kevin Hoang",
    content: "A thorough home inspection is essential for making an informed purchase decision. This guide will help you understand what to expect and what to look for during the process.\n\nKey areas to focus on include the foundation, roof, electrical system, plumbing, and HVAC. Each of these systems can be costly to repair or replace if issues are discovered after purchase.\n\nYour inspector should check for signs of water damage, structural issues, and potential safety hazards. Don't hesitate to ask questions about any concerns that arise during the inspection.\n\nUnderstanding the difference between major and minor issues can help you negotiate repairs or price adjustments. Some issues may be deal-breakers, while others can be addressed after closing.\n\nAfter the inspection, review the report carefully with your real estate agent. They can help you determine the best course of action based on the findings.",
    contentVi: "Kiểm tra nhà kỹ lưỡng là điều cần thiết để đưa ra quyết định mua sắm có thông tin. Hướng dẫn này sẽ giúp bạn hiểu những gì cần mong đợi và tìm kiếm trong quá trình.\n\nCác khu vực chính cần tập trung bao gồm nền móng, mái nhà, hệ thống điện, hệ thống ống nước và HVAC. Mỗi hệ thống này có thể tốn kém để sửa chữa hoặc thay thế nếu phát hiện vấn đề sau khi mua.\n\nNgười kiểm tra của bạn nên kiểm tra các dấu hiệu hư hỏng do nước, vấn đề cấu trúc và các mối nguy hiểm tiềm ẩn. Đừng ngần ngại đặt câu hỏi về bất kỳ mối quan ngại nào phát sinh trong quá trình kiểm tra.\n\nHiểu biết sự khác biệt giữa các vấn đề lớn và nhỏ có thể giúp bạn thương lượng sửa chữa hoặc điều chỉnh giá. Một số vấn đề có thể là deal-breakers, trong khi những vấn đề khác có thể được giải quyết sau khi đóng cửa.\n\nSau khi kiểm tra, hãy xem xét báo cáo cẩn thận với đại lý bất động sản của bạn. Họ có thể giúp bạn xác định hành động tốt nhất dựa trên kết quả."
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
    author: "Kevin Hoang",
    content: "The Boston real estate market continues to show strong performance in 2025. This comprehensive report covers the latest trends and statistics that buyers and sellers need to know.\n\nMedian home prices have shown steady growth across most neighborhoods, with particularly strong performance in areas with new transit options and development projects.\n\nInventory levels remain tight, creating a competitive market for buyers. Properties in desirable locations often receive multiple offers and sell quickly.\n\nInterest rates have stabilized after recent fluctuations, providing more predictability for both buyers and sellers. This stability has helped maintain strong market activity.\n\nUnderstanding these market dynamics can help you make informed decisions about timing your purchase or sale. Working with a knowledgeable real estate agent is crucial for navigating this complex market.",
    contentVi: "Thị trường bất động sản Boston tiếp tục thể hiện hiệu suất mạnh mẽ trong năm 2025. Báo cáo toàn diện này bao gồm các xu hướng và thống kê mới nhất mà người mua và bán cần biết.\n\nGiá nhà trung bình đã thể hiện tăng trưởng ổn định trên hầu hết các khu vực, với hiệu suất đặc biệt mạnh mẽ ở các khu vực có tùy chọn giao thông mới và dự án phát triển.\n\nMức tồn kho vẫn chặt chẽ, tạo ra thị trường cạnh tranh cho người mua. Các tài sản ở vị trí mong muốn thường nhận được nhiều đề nghị và bán nhanh chóng.\n\nLãi suất đã ổn định sau những biến động gần đây, cung cấp khả năng dự đoán nhiều hơn cho cả người mua và bán. Sự ổn định này đã giúp duy trì hoạt động thị trường mạnh mẽ.\n\nHiểu biết về động thái thị trường này có thể giúp bạn đưa ra quyết định có thông tin về thời gian mua hoặc bán. Làm việc với đại lý bất động sản có kiến thức là điều cần thiết để điều hướng thị trường phức tạp này."
  }
];

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const post = [...blogPosts, ...additionalPosts].find((post) => post.slug === slug);

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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </header>

            <div className="prose prose-lg max-w-none">
              {parseMarkdown(getTranslatedContent(post))}
            </div>

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
