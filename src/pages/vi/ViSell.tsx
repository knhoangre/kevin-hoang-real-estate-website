import { ClipboardCheck, FileText, TrendingUp } from 'lucide-react';
import ViPage from '@/components/ViPage';
import ViSellerRoadmap from '@/components/vi/ViSellerRoadmap';
import ViResources from '@/components/vi/ViResources';

/**
 * /vi/ban-nha — the seller's guide in Vietnamese. Counterpart of /seller.
 *
 * Weighted toward the statutory obligations (smoke certificate, Title 5, lead
 * paint, 6(d)), because those are the items that stop a closing and the ones a
 * seller working in a second language is least likely to have been told about.
 */
const ViSell = () => (
  <ViPage
    path="/vi/ban-nha"
    seo={{
      title: 'Hướng Dẫn Bán Nhà Ở Massachusetts Bằng Tiếng Việt',
      description:
        'Bán nhà ở Massachusetts: chuẩn bị nhà, định giá đúng, và những giấy tờ bắt buộc theo luật — giấy báo khói, Title 5, sơn chì và giấy 6(d) cho chung cư.',
    }}
    eyebrow="Bán nhà"
    h1="Bán nhà ở Massachusetts: chuẩn bị, định giá, giấy tờ"
    lede="Ba việc quyết định kết quả bán nhà: định giá đúng ngay từ đầu, chuẩn bị nhà trước khi đăng bán, và lo xong các giấy tờ bắt buộc trước khi chúng làm chậm ngày đóng giao dịch."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Bán nhà', path: '/vi/ban-nha' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=70',
      alt: 'Nội thất một căn nhà đã được chuẩn bị để bán',
    }}
    faqHeading="Câu hỏi thường gặp khi bán nhà"
    faqs={[
      {
        question: 'Định giá cao hơn một chút để có chỗ thương lượng có được không?',
        answer:
          'Đây là sai lầm phổ biến nhất. Nhà mới đăng bán nhận được đợt chú ý lớn nhất và không bao giờ lặp lại — mọi người mua đang tìm ở thị trấn đó đều nhìn thấy cùng lúc. Nếu giá quá cao, họ nhìn rồi bỏ qua. Khi bạn giảm giá sau đó, bạn không còn tiếp cận được nhóm người mua ấy nữa, và mức giảm cuối cùng thường lớn hơn mức bạn đã từ chối lúc đầu.',
      },
      {
        question: 'Tôi có cần sửa nhà trước khi bán không?',
        answer:
          'Sửa những gì rẻ và những gì gây lo ngại: chỗ rò rỉ, vấn đề an toàn điện, tay vịn cầu thang, và thoát nước quanh móng nhà. KHÔNG nên tân trang toàn bộ bếp hay phòng tắm — chi phí đó hiếm khi thu hồi được, và người mua thường sẽ sửa lại theo ý họ.',
      },
      {
        question: 'Giấy chứng nhận báo khói là gì và ai lo?',
        answer:
          'Ở Massachusetts, người BÁN có nghĩa vụ xin giấy chứng nhận thiết bị báo khói và báo khí CO từ sở cứu hỏa địa phương, cấp gần ngày đóng giao dịch. Sở cứu hỏa thường kín lịch, và việc đặt hẹn muộn là một trong những nguyên nhân làm chậm ngày đóng phổ biến nhất ở tiểu bang này.',
      },
      {
        question: 'Nhà tôi dùng hầm tự hoại thì sao?',
        answer:
          'Phần lớn các giao dịch bắt buộc người bán phải kiểm tra hệ thống theo Title 5, thường trong vòng hai năm trước khi bán, và báo cáo được gửi cho người mua và Sở Y tế địa phương. Hãy làm việc này TRƯỚC khi đăng bán — biết sớm thì bạn còn lựa chọn, biết khi đã có hợp đồng thì không.',
      },
      {
        question: 'Tôi phải trả những gì khi đóng giao dịch?',
        answer:
          'Thuế trước bạ của tiểu bang, tất toán khoản vay đang có, giấy 6(d) nếu là chung cư, giấy chứng nhận báo khói, và phí môi giới theo thỏa thuận bạn đã ký. Thuế nhà đất, nước và cống được chia theo tỷ lệ đến ngày đóng.',
      },
    ]}
    cta={{
      heading: 'Nhà của bạn đáng giá bao nhiêu?',
      body: 'Bắt đầu bằng một bản định giá viết tay dựa trên các căn tương đương đã bán gần đó — không phải con số ước lượng tự động. Miễn phí và không ràng buộc.',
      button: 'Yêu cầu định giá',
    }}
    enLabel="The seller's guide and roadmap"
    // Wide, like /seller: the roadmap's sticky index sits beside the steps.
    width="wide"
    sections={
      <>
        <ViSellerRoadmap />

        <div className="py-8">
          {/* Blue is deliberate and stays: a warning panel, not the brand. */}
          <div className="rounded-r-lg border-l-4 border-blue-400 bg-blue-50 p-6">
            <p className="text-sm leading-relaxed text-gray-700">
              <strong>Lưu ý quan trọng:</strong> Mỗi giao dịch bán nhà một khác, và lộ
              trình này chỉ là hướng dẫn chung. Đây là thông tin mang tính tham khảo,
              không phải tư vấn pháp lý, thuế hay tài chính. Hãy làm việc với agent, luật
              sư và người khai thuế để có hướng dẫn phù hợp với hoàn cảnh của bạn.
            </p>
          </div>
        </div>

        <ViResources
          heading="TÀI LIỆU CHO NGƯỜI BÁN"
          subtitle="Những tài liệu giúp bạn chuẩn bị, định giá và hoàn tất việc bán nhà."
          resources={[
            {
              icon: ClipboardCheck,
              title: 'Chuẩn bị nhà trước khi rao',
              description:
                'Những việc nên làm — và không nên làm — để căn nhà đạt giá tốt nhất.',
              link: '/blog/home-preparation-guide',
              english: true,
            },
            {
              icon: TrendingUp,
              title: 'Chiến lược định giá',
              description:
                'Cách định giá trong một thị trường cạnh tranh như vùng Greater Boston.',
              link: '/blog/pricing-strategy-guide',
              english: true,
            },
            {
              icon: FileText,
              title: 'Giấy tờ người bán cần trước ngày đóng',
              description:
                'Các giấy tờ, công bố và chứng nhận mà người bán ở Massachusetts phải có.',
              link: '/blog/massachusetts-seller-closing-requirements',
              english: true,
            },
          ]}
        />
      </>
    }
  />
);

export default ViSell;
