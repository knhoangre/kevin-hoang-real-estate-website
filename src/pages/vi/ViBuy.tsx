import { BookOpen, Calculator, Eye, FileText, Home, BarChart3 } from 'lucide-react';
import ViPage from '@/components/ViPage';
import ViBuyerRoadmap from '@/components/vi/ViBuyerRoadmap';
import ViResources from '@/components/vi/ViResources';

/**
 * /vi/mua-nha — the buyer's guide in Vietnamese.
 *
 * Counterpart of /buyer. Written for the reader rather than translated from
 * it: the emphasis here is on the two-contract structure and the deadlines,
 * because those are where a buyer working in a second language is most exposed.
 */
const ViBuy = () => (
  <ViPage
    path="/vi/mua-nha"
    seo={{
      title: 'Hướng Dẫn Mua Nhà Ở Massachusetts Bằng Tiếng Việt',
      description:
        'Quy trình mua nhà ở Massachusetts giải thích bằng tiếng Việt: thư chấp thuận vay, hai hợp đồng Offer và P&S, kiểm tra nhà, thẩm định giá và ngày đóng giao dịch.',
    }}
    eyebrow="Mua nhà"
    h1="Mua nhà ở Massachusetts: từng bước một"
    lede="Massachusetts mua bán nhà khác phần lớn các tiểu bang khác ở hai điểm: giao dịch đi qua hai hợp đồng chứ không phải một, và bắt buộc phải có luật sư. Hiểu được hai điều đó là hiểu được phần lớn quy trình."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Mua nhà', path: '/vi/mua-nha' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=70',
      alt: 'Nhà ở khu dân cư vùng Greater Boston',
    }}
    faqHeading="Câu hỏi thường gặp khi mua nhà"
    faqs={[
      {
        question: 'Tôi cần bao nhiêu tiền mặt để mua nhà?',
        answer:
          'Nhiều hơn khoản trả trước. Ngoài tiền down payment, bạn còn phải trả phí ngân hàng, phí thẩm định giá, phí luật sư, kiểm tra chủ quyền và bảo hiểm chủ quyền, phí đăng bộ, lãi trả trước, và tài khoản escrow cho thuế và bảo hiểm. Quan trọng không kém: bạn cần còn tiền dự phòng SAU khi đóng giao dịch.',
      },
      {
        question: 'Offer to Purchase có phải là hợp đồng ràng buộc không?',
        answer:
          'Có. Đây là hiểu lầm tốn kém nhất ở tiểu bang này. Nhiều người nghe nói "hợp đồng thật là P&S ký sau" nên ký Offer một cách nhẹ nhàng. Nhưng Offer là hợp đồng ràng buộc, và nó ấn định giá, tiền đặt cọc và mọi thời hạn. Khi bạn đến P&S thì những thời hạn đó đã chạy rồi.',
      },
      {
        question: 'Tôi có nên bỏ điều khoản kiểm tra nhà để thắng không?',
        answer:
          'Có một lựa chọn ở giữa mà ít người biết: kiểm tra nhà TRƯỚC khi nộp offer. Bạn mất phí kiểm tra cho một căn có thể không mua được, nhưng bạn vừa có thông tin vừa nộp được offer không kèm điều kiện. Nhà ở vùng này phần lớn xây trước năm 1940 — dây điện cũ, bồn dầu, amiăng và nước thấm đều là chuyện có thật.',
      },
      {
        question: 'Điều gì xảy ra nếu thẩm định giá thấp hơn giá tôi trả?',
        answer:
          'Ngân hàng cho vay theo con số thẩm định, không theo giá hợp đồng, nên phần chênh lệch là của bạn. Bạn có thể thương lượng lại, bù tiền mặt, khiếu nại kết quả thẩm định, hoặc rút lui — nhưng chỉ khi hợp đồng cho phép. Hãy hỏi luật sư điều khoản đó nói gì TRƯỚC khi thẩm định diễn ra.',
      },
      {
        question: 'Mua nhà mất bao lâu?',
        answer:
          'Phần lớn giao dịch ở vùng Boston mất khoảng 30 đến 45 ngày kể từ khi offer được chấp thuận. Trả tiền mặt thì nhanh hơn. Chậm nhất thường là ở khâu thẩm định hồ sơ vay và giấy tờ chủ quyền.',
      },
    ]}
    cta={{
      heading: 'Sẵn sàng bắt đầu tìm nhà?',
      body: 'Bước đầu tiên không phải là đi xem nhà — mà là có một thư chấp thuận vay bằng văn bản và biết rõ mình đang tìm ở thị trấn nào. Kevin sẽ đi cùng bạn từ đó.',
      button: 'Liên hệ Kevin',
    }}
    enLabel="The buyer's guide and roadmap"
    // Wide, like /buyer: the roadmap's sticky index sits beside the steps.
    width="wide"
    sections={
      <>
        <ViBuyerRoadmap />

        <div className="py-8">
          {/* Blue is deliberate and stays: this panel carries a warning, not
              the brand. Recolouring a signal to the accent deletes it. */}
          <div className="rounded-r-lg border-l-4 border-blue-400 bg-blue-50 p-6">
            <p className="text-sm leading-relaxed text-gray-700">
              <strong>Lưu ý quan trọng:</strong> Mỗi giao dịch mua nhà một khác, và lộ
              trình này chỉ là hướng dẫn chung. Trường hợp cụ thể của bạn có thể cần thêm
              bước, thời hạn khác, hoặc cách làm khác với những gì mô tả ở đây. Đây là
              thông tin mang tính tham khảo, không phải tư vấn pháp lý hay tài chính. Hãy
              làm việc với agent, ngân hàng và luật sư để có hướng dẫn phù hợp với hoàn
              cảnh của bạn.
            </p>
          </div>
        </div>

        <ViResources
          heading="TÀI LIỆU CHO NGƯỜI MUA"
          subtitle="Những tài liệu giúp bạn ra quyết định trong suốt quá trình mua nhà."
          resources={[
            {
              icon: BookOpen,
              title: 'Hướng dẫn cho người mua lần đầu',
              description:
                'Toàn bộ quy trình dành cho người mua căn nhà đầu tiên, từ tiết kiệm đến ngày nhận chìa khóa.',
              link: '/first-time-buyers',
              english: true,
            },
            {
              icon: Calculator,
              title: 'Máy tính tiền vay',
              description:
                'Ước tính khoản trả hàng tháng theo giá nhà, tiền trả trước và lãi suất.',
              link: '/calculator',
              english: true,
            },
            {
              icon: FileText,
              title: 'Giấy tờ xin chấp thuận vay',
              description:
                'Danh sách giấy tờ và các bước cần chuẩn bị trước khi nộp hồ sơ vay.',
              link: '/blog/pre-approval-checklist',
              english: true,
            },
            {
              icon: Home,
              title: 'Hướng dẫn kiểm tra nhà',
              description:
                'Cần xem gì và hỏi gì trong buổi kiểm tra nhà, đặc biệt với nhà xây trước 1940.',
              link: '/blog/home-inspection-guide',
              english: true,
            },
            {
              icon: BarChart3,
              title: 'Khi có nhiều người cùng tranh mua',
              description:
                'Offer thắng ở vùng Boston thường thắng nhờ điều khoản, không chỉ nhờ giá.',
              link: '/blog/winning-a-bidding-war-greater-boston',
              english: true,
            },
            {
              icon: Eye,
              title: 'Các khu vực phục vụ',
              description:
                'Thông tin từng thị trấn Kevin phục vụ, để chọn nơi ở trước khi chọn nhà.',
              link: '/vi/khu-vuc',
            },
          ]}
        />
      </>
    }
  />
);

export default ViBuy;
