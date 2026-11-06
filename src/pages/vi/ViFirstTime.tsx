import { AlertTriangle, CheckCircle, DollarSign, FileText, HelpCircle, Home, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';

/**
 * /vi/mua-nha-lan-dau — the counterpart of /first-time-buyers, added 2026-11-06:
 * it was the one guide with an English and a Chinese version and no Vietnamese.
 *
 * Laid out like /zh/shouci-goufang, the same six steps, six mistakes and three
 * money questions, with the Massachusetts specifics the English page leaves out:
 * the offer comes before the Purchase and Sale Agreement, closings have an
 * attorney, and since 2025-10-15 a seller may not ask a buyer to waive the
 * inspection (760 CMR 74.00). "Skipping the home inspection" stays a mistake.
 */
const STEPS = [
  {
    icon: DollarSign,
    title: 'Xem lại tài chính',
    description:
      'Xem điểm tín dụng, tính tỷ lệ nợ trên thu nhập, và xác định mức giá bạn thật sự kham nổi: gồm cả thuế nhà, bảo hiểm và phí condo, không chỉ tiền góp hàng tháng.',
  },
  {
    icon: FileText,
    title: 'Xin chấp thuận vay trước (pre-approval)',
    description:
      'Thư pre-approval cho bạn một ngân sách rõ ràng và cho người bán thấy bạn là người mua nghiêm túc. Ở Greater Boston, gần như không thể ra giá nếu chưa có thư này.',
  },
  {
    icon: Home,
    title: 'Tìm nhà',
    description: 'Đi xem những căn hợp với tiêu chí và ngân sách của bạn, cùng một người môi giới đại diện cho bạn.',
  },
  {
    icon: KeyRound,
    title: 'Ra giá (offer)',
    description:
      'Khi tìm được căn ưng ý, đưa ra offer dựa trên giá những căn tương tự vừa bán gần đó. Ở Massachusetts, offer được chấp nhận trước, rồi mới ký hợp đồng mua bán (Purchase and Sale Agreement).',
  },
  {
    icon: HelpCircle,
    title: 'Kiểm định nhà',
    description:
      'Thuê một thợ kiểm định có giấy phép để tìm ra những vấn đề và những chỗ cần sửa. Báo cáo kiểm định cũng là cơ sở để thương lượng.',
  },
  {
    icon: CheckCircle,
    title: 'Đóng giao dịch (closing)',
    description:
      'Ký giấy tờ cuối cùng, trả chi phí đóng giao dịch và nhận chìa khóa. Ở Massachusetts, buổi đóng giao dịch có luật sư tham gia.',
  },
];

const MISTAKES = [
  'Bỏ qua bước xin pre-approval',
  'Không tính chi phí đóng giao dịch và chi phí chuyển nhà vào ngân sách',
  'Mua sắm lớn hoặc mở thẻ tín dụng mới trước ngày closing',
  'Bỏ qua kiểm định nhà',
  'Không tìm hiểu kỹ đường đi làm, thuế nhà và quy định của thị trấn',
  'Chỉ hỏi một nơi cho vay, không so sánh',
];

const FINANCES = [
  {
    title: 'Tiền trả trước',
    description:
      'Không nhất thiết phải là 20%. Khoản vay FHA bắt đầu từ 3,5%, một số khoản vay thông thường từ 3%, và có những chương trình dành riêng cho người mua lần đầu.',
    color: 'bg-blue-50',
    text: 'text-blue-800',
  },
  {
    title: 'Các loại khoản vay',
    description:
      'Lãi suất cố định, lãi suất điều chỉnh, FHA, VA và USDA khác nhau ở tiền trả trước, bảo hiểm khoản vay và điều kiện; mỗi loại hợp với một hoàn cảnh.',
    color: 'bg-green-50',
    text: 'text-green-800',
  },
  {
    title: 'Chương trình cho người mua lần đầu',
    description:
      'Các chương trình, trợ cấp và ưu đãi dành cho người mua lần đầu ở Massachusetts, như MassHousing. Hỏi ngay từ đầu, vì không phải nơi cho vay nào cũng làm các chương trình này.',
    color: 'bg-purple-50',
    text: 'text-purple-800',
  },
];

const ViFirstTime = () => (
  <ViPage
    path="/vi/mua-nha-lan-dau"
    seo={{
      title: 'Hướng Dẫn Mua Nhà Lần Đầu Ở Massachusetts',
      description:
        'Mua căn nhà đầu tiên ở Massachusetts từ đầu đến cuối: cần để dành bao nhiêu, xin pre-approval thế nào, kiểm định nhà để làm gì, ngày closing ra sao, và những lỗi hay gặp nhất.',
    }}
    eyebrow="Mua nhà lần đầu"
    h1="Mua căn nhà đầu tiên ở Massachusetts, từng bước một"
    lede="Mua căn nhà đầu tiên là một cột mốc lớn, và là một quá trình có thứ tự. Trang này đi qua từng bước theo đúng thứ tự bạn sẽ gặp, cùng những điều riêng của Massachusetts mà người mua lần đầu nên biết trước."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Mua nhà lần đầu', path: '/vi/mua-nha-lan-dau' },
    ]}
    hero={{
      // The English page's hero.
      image:
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=65',
      alt: 'Bên trong căn nhà đầu tiên, chưa có nhiều đồ đạc',
    }}
    width="wide"
    faqHeading="Câu hỏi của người mua nhà lần đầu"
    faqs={[
      {
        question: 'Mua nhà lần đầu cần để dành bao nhiêu tiền?',
        answer:
          'Ngoài tiền trả trước, cần thêm tiền đặt cọc khi offer được chấp nhận và khi ký hợp đồng mua bán, chi phí đóng giao dịch, và một khoản dự phòng cho những tháng đầu ở nhà mới. Con số chính xác của chi phí vay nằm trong bản Loan Estimate, mà bên cho vay phải gửi trong vòng ba ngày làm việc sau khi bạn nộp đơn.',
      },
      {
        question: 'Có cần luật sư khi mua nhà ở Massachusetts không?',
        answer:
          'Buổi đóng giao dịch ở Massachusetts có luật sư tham gia, thường là luật sư của bên cho vay. Nhiều người mua thuê thêm luật sư riêng để xem hợp đồng mua bán trước khi ký, nhất là với căn nhà đầu tiên.',
      },
      {
        question: 'Có nên bỏ kiểm định nhà để offer mạnh hơn không?',
        answer:
          'Không. Từ ngày 15 tháng 10 năm 2025, luật Massachusetts (760 CMR 74.00) cấm người bán và môi giới bên bán đặt điều kiện chấp nhận offer vào việc người mua bỏ kiểm định. Kiểm định là để bạn biết mình đang mua gì, và với căn nhà đầu tiên đó cũng là lúc học cách căn nhà vận hành.',
      },
    ]}
    cta={{
      heading: 'Sắp mua căn nhà đầu tiên?',
      body: 'Cuộc trao đổi đầu tiên không tốn gì và không ràng buộc gì. Phần lớn là Kevin trả lời câu hỏi của bạn bằng tiếng Việt, và nói bạn nên làm gì trước khi đi xem nhà.',
      button: 'Hỏi Kevin',
    }}
    enLabel="First-time home buyer guide"
    sections={
      <>
        <h2 className="mb-10 text-3xl font-bold text-ink">Sáu bước, theo đúng thứ tự</h2>
        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-2">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="enter rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-300 hover:shadow-lg"
              style={{ '--enter-delay': `${index * 0.08}s` } as React.CSSProperties}
            >
              <div className="flex items-start">
                <div className="mr-4 rounded-full bg-green-50 p-3">
                  <step.icon className="h-6 w-6 text-green-600" aria-hidden />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold text-ink">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mb-10 text-3xl font-bold text-ink">Những lỗi người mua lần đầu hay mắc</h2>
        <div className="mb-20 rounded-xl bg-red-50 p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {MISTAKES.map((mistake) => (
              <div key={mistake} className="flex items-start">
                <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden />
                <p className="text-gray-800">{mistake}</p>
              </div>
            ))}
          </div>
        </div>

        <h2 className="mb-10 text-3xl font-bold text-ink">Về tiền bạc, nên biết trước</h2>
        <div className="mb-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {FINANCES.map((item) => (
            <div key={item.title} className={`${item.color} rounded-xl p-6 shadow-sm`}>
              <h3 className={`mb-3 text-xl font-semibold ${item.text}`}>{item.title}</h3>
              <p className="text-gray-700">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="leading-relaxed text-gray-700">
          Toàn bộ quy trình có trong{' '}
          <Link to="/vi/mua-nha" className="underline decoration-champagne decoration-2 underline-offset-4">
            hướng dẫn mua nhà
          </Link>
          , và chi phí hàng tháng thật sự có thể tính bằng{' '}
          <Link to="/vi/cong-cu-tinh-toan" className="underline decoration-champagne decoration-2 underline-offset-4">
            máy tính mua nhà
          </Link>
          .
        </p>
      </>
    }
  />
);

export default ViFirstTime;
