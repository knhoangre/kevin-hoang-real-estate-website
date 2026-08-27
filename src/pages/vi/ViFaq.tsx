import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';
import { SITE } from '@/lib/siteConfig';

/**
 * /vi/cau-hoi-thuong-gap — the FAQ in Vietnamese. Counterpart of /faq.
 *
 * The answers go into FaqAccordion, which keeps collapsed content in the DOM —
 * required both for the FAQPage markup and so a non-JS crawler reads them.
 */
const ViFaq = () => (
  <ViPage
    path="/vi/cau-hoi-thuong-gap"
    seo={{
      title: 'Câu Hỏi Thường Gặp Về Bất Động Sản Massachusetts',
      description:
        'Giải đáp bằng tiếng Việt về mua bán nhà ở Massachusetts: hai hợp đồng, tiền đặt cọc, thuế nhà đất, hầm tự hoại, sơn chì và quyền của người thuê nhà.',
    }}
    eyebrow="Câu hỏi thường gặp"
    h1="Những câu hỏi người Việt hay hỏi nhất về nhà đất ở Massachusetts"
    lede="Những câu dưới đây là các câu hỏi lặp lại nhiều nhất, và phần lớn có câu trả lời cụ thể theo luật Massachusetts chứ không phải lời khuyên chung chung."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Câu hỏi thường gặp', path: '/vi/cau-hoi-thuong-gap' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=70',
      alt: 'Bàn làm việc với giấy tờ mua bán nhà',
    }}
    faqHeading="Câu hỏi và trả lời"
    faqs={[
      {
        question: 'Người không phải công dân Mỹ có mua nhà ở Massachusetts được không?',
        answer:
          'Được. Không có hạn chế nào về quốc tịch đối với việc sở hữu bất động sản ở Massachusetts. Phần khó hơn thường là vay tiền: mỗi ngân hàng có yêu cầu riêng về tình trạng cư trú, lịch sử tín dụng tại Mỹ và số tiền trả trước. Hãy hỏi rõ ngân hàng trước khi đi xem nhà.',
      },
      {
        question: 'Tiền đặt cọc có bị mất không nếu tôi đổi ý?',
        answer:
          'Có thể. Điều đó phụ thuộc hoàn toàn vào các điều khoản bảo vệ trong hợp đồng và việc bạn có còn trong thời hạn của chúng hay không. Nếu bạn rút lui trong thời hạn kiểm tra nhà, thường bạn lấy lại được. Nếu bạn để trôi qua hạn cam kết cho vay mà không có gia hạn bằng văn bản, số tiền đó — thường là 5% giá mua — bị đe dọa.',
      },
      {
        question: 'Vì sao thuế nhà đất ở hai thị trấn cạnh nhau lại chênh lệch nhiều vậy?',
        answer:
          'Vì thuế suất không đến từ thị trường mà từ ngân sách. Thị trấn quyết định cần thu bao nhiêu, rồi chia cho tổng giá trị định giá của toàn thị trấn để ra thuế suất. Một thị trấn có nhà giá trị cao có thể thu cùng số tiền với thuế suất thấp hơn. Đừng bao giờ so sánh thuế suất — hãy so sánh hóa đơn thật của địa chỉ cụ thể.',
      },
      {
        question: 'Hầm tự hoại (septic) là gì và tại sao quan trọng?',
        answer:
          'Nhiều nhà ở các thị trấn ngoại ô không nối cống thành phố mà xử lý nước thải tại chỗ. Luật Title 5 của Massachusetts buộc người bán phải kiểm tra hệ thống trước khi bán trong phần lớn trường hợp. Một hệ thống không đạt có thể tốn hàng chục nghìn đô la để thay, nên đây là điều phải xác minh trước khi ký, không phải sau.',
      },
      {
        question: 'Nhà xây trước năm 1978 có sơn chì thì sao?',
        answer:
          'Luật liên bang buộc người bán công bố những gì họ biết và cung cấp tài liệu của EPA. Luật Massachusetts còn chặt hơn với nhà cho thuê: nếu có trẻ dưới sáu tuổi ở, chủ nhà có trách nhiệm xử lý nguy cơ chì — và đây là trách nhiệm tuyệt đối, áp dụng kể cả khi chủ nhà không biết có chì.',
      },
      {
        question: 'Thuê nhà ở Boston cần bao nhiêu tiền ban đầu?',
        answer:
          'Theo luật Massachusetts, chủ nhà chỉ được thu bốn khoản khi bắt đầu thuê: tiền tháng đầu, tiền tháng cuối, tiền đặt cọc không quá một tháng, và chi phí thay ổ khóa. Nhưng phí môi giới nằm NGOÀI giới hạn đó và thường bằng một tháng tiền thuê. Vì vậy số tiền phải chuẩn bị có thể lên tới bốn tháng.',
      },
      {
        question: 'Tôi có bắt buộc phải thuê luật sư không?',
        answer:
          'Massachusetts là tiểu bang bắt buộc có luật sư trong giao dịch bất động sản, và các công ty title không thay thế được vai trò đó. Ngân hàng sẽ có luật sư của họ — nhưng luật sư đó bảo vệ ngân hàng, không bảo vệ bạn. Hãy thuê luật sư riêng, và thuê TRƯỚC khi nộp offer đầu tiên.',
      },
      {
        question: 'Tôi nên chọn thị trấn nào?',
        answer:
          'Hãy bắt đầu từ quãng đường đi làm, không phải từ danh sách tên thị trấn. Lái thử đúng giờ bạn sẽ đi. Đi bộ từ nhà ra ga tàu và bấm giờ. Và xác nhận địa chỉ CỤ THỂ đó thuộc trường nào — nhiều thị trấn có nhiều khu học chính, và Newton có hai trường trung học.',
      },
      {
        question: 'Từ tháng 8 năm 2024 có gì thay đổi với người mua?',
        answer:
          'Người mua phải ký thỏa thuận đại diện bằng văn bản trước khi môi giới dẫn đi xem nhà, và mức thù lao phải được ghi rõ trong thỏa thuận đó thay vì mặc định lấy từ hệ thống MLS. Nói cách khác, phí môi giới bên mua giờ là điều có thể thương lượng — hãy đọc kỹ thời hạn và phạm vi trước khi ký.',
      },
      {
        question: 'Tôi có thể làm toàn bộ giao dịch bằng tiếng Việt không?',
        answer:
          `Với Kevin thì có — các buổi xem nhà, thương lượng, và giải thích từng điều khoản. Giấy tờ pháp lý vẫn bằng tiếng Anh và vẫn có hiệu lực ràng buộc, nên phần việc thật sự là bảo đảm bạn hiểu rõ mình đang ký gì trước khi ký. Gọi ${SITE.phone} nếu muốn hỏi thêm.`,
      },
    ]}
    cta={{
      heading: 'Câu hỏi của bạn chưa có ở đây?',
      body: 'Gọi, nhắn tin, hoặc gửi tin nhắn. Không có câu hỏi nào là quá cơ bản — và hỏi trước bao giờ cũng rẻ hơn tìm hiểu sau.',
      button: 'Đặt câu hỏi',
    }}
    enLabel="Massachusetts real estate FAQ"
  >
    <h2>Ba điều nên biết trước tất cả</h2>
    <p>
      <strong>Một, Massachusetts dùng hai hợp đồng.</strong> Offer to Purchase trước, rồi
      Purchase and Sale agreement khoảng mười đến mười bốn ngày sau. Cả hai đều ràng buộc.
      Phần lớn rắc rối của người mua nằm ở khoảng giữa hai văn bản đó.
    </p>
    <p>
      <strong>Hai, mọi thời hạn đều bắt đầu chạy từ lúc ký Offer.</strong> Thời hạn kiểm tra
      nhà, thời hạn cam kết cho vay. Bỏ lỡ một trong hai mà không có gia hạn bằng văn bản có
      thể khiến bạn mất tiền đặt cọc.
    </p>
    <p>
      <strong>Ba, đây là tiểu bang bắt buộc có luật sư.</strong> Hãy thuê luật sư riêng trước
      khi nộp offer đầu tiên, chứ không phải khi P&S đã được gửi tới.
    </p>

    <h2>Đọc thêm</h2>
    <ul>
      <li>
        <Link to="/vi/mua-nha">Hướng dẫn mua nhà từng bước</Link>
      </li>
      <li>
        <Link to="/vi/ban-nha">Hướng dẫn bán nhà và giấy tờ bắt buộc</Link>
      </li>
      <li>
        <Link to="/vi/dinh-gia-nha">Định giá nhà miễn phí</Link>
      </li>
      <li>
        <Link to="/vi/khu-vuc">Các khu vực Kevin phục vụ</Link>
      </li>
    </ul>
  </ViPage>
);

export default ViFaq;
