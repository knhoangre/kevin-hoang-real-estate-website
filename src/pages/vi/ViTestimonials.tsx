import { Star } from 'lucide-react';
import ViPage from '@/components/ViPage';
import { ALL_TESTIMONIALS } from '@/data/testimonials';
import { googleProfileUrl } from '@/lib/siteConfig';

/**
 * /vi/danh-gia — the counterpart of /testimonials.
 *
 * The reviews themselves are NOT translated, and that is deliberate. These are
 * real Google reviews written by real clients; rewriting someone's words into
 * another language and presenting the result as their review is fabrication,
 * and it also breaks the one thing that makes a testimonial checkable — that
 * the text here matches the text on the Google profile. The framing is
 * Vietnamese; the quotes are verbatim English, with a line saying so.
 *
 * Like the English page, this emits no Review or AggregateRating markup. Google
 * disregards self-serving review markup on an organisation's own page, and
 * publishing unverifiable testimonials as machine-readable review claims
 * carries manual-action risk plus FTC exposure under 16 CFR Part 465.
 */
const ViTestimonials = () => (
  <ViPage
    path="/vi/danh-gia"
    seo={{
      title: 'Khách Hàng Nói Gì Về Kevin Hoang',
      description:
        'Đánh giá thật từ khách hàng của Kevin Hoang, chuyên viên địa ốc tại Needham, Massachusetts — nguyên văn từ Google Business Profile.',
    }}
    eyebrow="Đánh giá"
    h1="Khách hàng nói gì"
    lede="Đây là những đánh giá thật, lấy nguyên văn từ trang Google Business Profile của Kevin. Bạn có thể tự kiểm chứng từng đánh giá trên Google — đó là điểm khác biệt giữa một lời chứng thực có thể kiểm tra và một câu quảng cáo."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Khách hàng nói gì', path: '/vi/danh-gia' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=70',
      alt: 'Khách hàng nhận chìa khóa căn nhà mới',
    }}
    faqHeading="Câu hỏi thường gặp về đánh giá"
    faqs={[
      {
        question: 'Vì sao các đánh giá này để nguyên tiếng Anh?',
        answer:
          'Vì đó là nguyên văn khách hàng đã viết. Dịch lại lời của một người rồi trình bày như thể họ nói câu đó bằng tiếng Việt là làm sai lệch nội dung, và bạn sẽ không còn đối chiếu được với bản gốc trên Google nữa. Phần giới thiệu và giải thích ở trang này bằng tiếng Việt; phần trích dẫn giữ nguyên.',
      },
      {
        question: 'Làm sao tôi kiểm chứng những đánh giá này?',
        answer:
          'Mở trang Google Business Profile của Kevin và đọc trực tiếp. Mọi đánh giá trên trang này đều có ở đó. Nếu một chuyên viên địa ốc chỉ đăng lời khen trên website riêng mà không có hồ sơ công khai để đối chiếu, đó là điều đáng đặt câu hỏi.',
      },
      {
        question: 'Kevin có đăng đánh giá tiêu cực không?',
        answer:
          'Trang này hiển thị các đánh giá công khai trên hồ sơ Google, và Kevin không xóa hay chọn lọc chúng — hồ sơ Google là nguồn, không phải trang này. Cách kiểm tra trung thực nhất vẫn là đọc thẳng trên Google.',
      },
    ]}
    cta={{
      heading: 'Muốn nói chuyện với Kevin?',
      body: 'Cách tốt nhất để biết có hợp làm việc với nhau hay không là một cuộc gọi ngắn. Không cần chuẩn bị gì trước.',
      button: 'Liên hệ Kevin',
    }}
    enLabel="Client reviews"
    sections={
      <div className="py-12">
        <p className="mb-8 text-sm text-gray-500">
          Các đánh giá dưới đây giữ nguyên văn tiếng Anh như khách hàng đã viết trên
          Google.
        </p>

        <ul className="grid gap-6 md:grid-cols-2">
          {ALL_TESTIMONIALS.map((review) => (
            <li
              key={review.firstName + review.text.slice(0, 24)}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              {/* Amber carries meaning here — a rating is not a brand mark. */}
              <div className="mb-3 flex gap-0.5" aria-label={`${review.stars} trên 5 sao`}>
                {Array.from({ length: review.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote lang="en" className="text-sm leading-relaxed text-gray-700">
                {review.text}
              </blockquote>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                {review.firstName}
              </p>
            </li>
          ))}
        </ul>

        <p className="mt-10">
          <a
            href={googleProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-champagne decoration-2 underline-offset-4"
          >
            Đọc trực tiếp trên Google Business Profile
          </a>
        </p>
      </div>
    }
  >
    <h2>Vì sao trang này không có "điểm trung bình"</h2>
    <p>
      Nhiều website địa ốc gắn một con số đánh giá trung bình kèm dấu sao vào mã nguồn để
      hiện ngôi sao trên kết quả tìm kiếm. Google bỏ qua loại dữ liệu đó khi nó nằm trên
      trang của chính doanh nghiệp, và việc công bố đánh giá không kiểm chứng được dưới
      dạng dữ liệu có cấu trúc có thể dẫn đến án phạt thủ công, chưa kể quy định của Ủy ban
      Thương mại Liên bang Hoa Kỳ về đánh giá giả.
    </p>
    <p>
      Vì vậy trang này chỉ làm một việc: hiển thị nguyên văn những gì khách hàng đã viết,
      và chỉ cho bạn nơi tự kiểm chứng.
    </p>
  </ViPage>
);

export default ViTestimonials;
