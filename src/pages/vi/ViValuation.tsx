import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';
import { SITE } from '@/lib/siteConfig';

/**
 * /vi/dinh-gia-nha — the home valuation page in Vietnamese.
 * Counterpart of /home-valuation.
 */
const ViValuation = () => (
  <ViPage
    path="/vi/dinh-gia-nha"
    seo={{
      title: 'Định Giá Nhà Miễn Phí Ở Massachusetts | Tiếng Việt',
      description:
        'Bản định giá viết tay dựa trên các căn đã bán tương đương ở khu vực của bạn — không phải ước lượng tự động. Miễn phí, không ràng buộc, giải thích bằng tiếng Việt.',
    }}
    eyebrow="Định giá nhà"
    h1="Nhà của bạn thực sự đáng giá bao nhiêu?"
    lede="Một bản định giá đúng nghĩa là một lập luận dựa trên bằng chứng: các căn nhà tương đương đã bán gần đó, điều chỉnh theo những điểm khác biệt thật sự. Đó là điều mà con số ước lượng tự động trên mạng không làm được."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Định giá nhà', path: '/vi/dinh-gia-nha' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=70',
      alt: 'Phòng khách của một ngôi nhà vùng Greater Boston',
    }}
    faqHeading="Câu hỏi về định giá"
    faqs={[
      {
        question: 'Có tốn phí không? Tôi có phải bán nhà không?',
        answer:
          'Miễn phí và không ràng buộc. Nhiều người yêu cầu định giá khi chưa có ý định bán — để lập kế hoạch, để tính chuyện vay thế chấp, hoặc chỉ để biết. Đó là lý do hợp lệ.',
      },
      {
        question: 'Sao con số này lại khác với Zillow?',
        answer:
          'Các trang web dùng thuật toán tự động chạy trên dữ liệu công khai. Chúng không biết bạn đã sửa bếp, không biết nhà quay mặt ra đường lớn, và không biết căn bên cạnh vừa bán cao hơn vì đi bộ được ra ga tàu. Ở vùng Boston, nơi giá trị thay đổi theo từng con phố, khoảng cách đó có thể rất lớn.',
      },
      {
        question: 'Kevin dựa vào cái gì để định giá?',
        answer:
          'Các giao dịch ĐÃ ĐÓNG của những căn thật sự tương đương, gần đây và ở gần — điều chỉnh theo diện tích, kích thước lô đất, số phòng, tình trạng, ga-ra và vị trí. Cộng thêm những căn đang rao bán, những căn đang chờ đóng, và những căn rao mãi không bán được, vì nhóm cuối cho biết người mua đã từ chối trả bao nhiêu.',
      },
      {
        question: 'Định giá và thẩm định giá (appraisal) có khác nhau không?',
        answer:
          'Có. Thẩm định giá do ngân hàng đặt và nhằm bảo vệ ngân hàng. Định giá này nhằm giúp bạn quyết định. Cả hai đều dùng phương pháp so sánh giao dịch, nhưng chỉ thẩm định giá mới có hiệu lực với khoản vay.',
      },
      {
        question: 'Mất bao lâu?',
        answer:
          'Thường trong vòng vài ngày làm việc. Kevin cần xem qua căn nhà — trực tiếp hoặc qua ảnh và thông tin chi tiết — vì tình trạng thực tế là yếu tố mà không dữ liệu công khai nào phản ánh được.',
      },
    ]}
    cta={{
      heading: 'Yêu cầu bản định giá của bạn',
      body: `Gọi hoặc nhắn tin ${SITE.phone}, hoặc gửi tin nhắn qua trang liên hệ. Bằng tiếng Việt hoặc tiếng Anh, tùy bạn.`,
      button: 'Gửi yêu cầu',
    }}
    enLabel="Request a free written home valuation"
  >
    <h2>Giá trị nhà được xác định như thế nào?</h2>
    <p>
      Giá trị thị trường là số tiền một người mua sẵn sàng trả hôm nay. Nó không phải là số
      tiền bạn đã mua, không phải số bạn còn nợ ngân hàng, và không phải số bạn đã bỏ ra sửa
      bếp. Đó là nguyên tắc khó chấp nhận nhất nhưng cũng quan trọng nhất.
    </p>
    <p>Một bản phân tích nghiêm túc xem xét bốn nhóm dữ liệu:</p>
    <ul>
      <li>
        <strong>Các căn đã bán</strong> — nền tảng của toàn bộ lập luận. Tương đương thật sự,
        bán gần đây, ở gần. Ở vùng Boston, “gần” có thể chỉ là vài con phố.
      </li>
      <li>
        <strong>Các căn đang rao bán</strong> — đối thủ trực tiếp của bạn. Người mua sẽ so
        sánh nhà bạn với chính những căn này.
      </li>
      <li>
        <strong>Các căn đang chờ đóng</strong> — cho thấy thị trường đang đi về đâu, sớm hơn
        dữ liệu đã đóng.
      </li>
      <li>
        <strong>Các căn rao không bán được</strong> — nhóm hữu ích nhất và ít ai xem. Chúng
        cho biết người mua đã TỪ CHỐI trả bao nhiêu.
      </li>
    </ul>

    <h2>Vì sao con số tự động trên mạng thường sai</h2>
    <p>
      Thuật toán chạy trên hồ sơ công khai: diện tích, số phòng, năm xây, ngày bán. Nó không
      biết bên trong nhà bạn thế nào, không biết lô đất giáp đường cao tốc, và không biết mái
      nhà đã hai mươi lăm năm tuổi.
    </p>
    <p>
      Ở một thị trường mà việc đi bộ được ra ga tàu, hay địa chỉ thuộc trường tiểu học nào,
      tạo ra chênh lệch thật về giá, những yếu tố ấy chính là phần mà thuật toán bỏ sót. Xem
      thêm <Link to="/vi/khu-vuc">các khu vực và điều cần kiểm tra ở từng nơi</Link>.
    </p>

    <h2>Bạn nhận được gì</h2>
    <p>
      Một khoảng giá có cơ sở, kèm theo những giao dịch cụ thể dùng để lập luận, và giải thích
      vì sao mỗi căn được điều chỉnh lên hay xuống. Nếu bạn đang cân nhắc bán, bản định giá
      cũng nêu những việc nên làm trước — và, quan trọng không kém, những việc không đáng làm.
    </p>
    <p>
      Nếu bạn định bán, bước tiếp theo là{' '}
      <Link to="/vi/ban-nha">hướng dẫn chuẩn bị và giấy tờ bắt buộc</Link>.
    </p>

    <h2>Còn thuế nhà đất thì sao?</h2>
    <p>
      Giá trị định giá của thị trấn (assessed value) và giá trị thị trường không giống nhau,
      và không nên dùng cái này để suy ra cái kia. Thị trấn định giá hàng loạt theo hồ sơ, và
      luôn có độ trễ so với thị trường. Nếu bạn cho rằng hồ sơ của thị trấn ghi sai về nhà
      mình, hạn nộp đơn xin điều chỉnh ở phần lớn các thị trấn là ngày 1 tháng 2 — và nộp trễ
      thì phải chờ trọn một năm.
    </p>
  </ViPage>
);

export default ViValuation;
