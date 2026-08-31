import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';

/**
 * /vi/cong-cu-tinh-toan — the counterpart of /calculator.
 *
 * The interactive calculators are NOT embedded here, and that is a deliberate
 * call rather than an omission. RealEstateCalculators assembles ~147 strings
 * through useTranslation(), and i18n is pinned to `lng: 'en'` during static
 * generation — so embedding it would prerender a Vietnamese URL containing an
 * entirely English tool, which is the exact failure the /vi tree exists to fix.
 *
 * What a Vietnamese reader actually needs from that page is the meaning of the
 * numbers: which costs are one-off, which are monthly, and which are the ones
 * people forget. That is written here, with the tool one link away.
 */
const ViCalculator = () => (
  <ViPage
    path="/vi/cong-cu-tinh-toan"
    seo={{
      title: 'Tính Tiền Mua Nhà Ở Massachusetts — Giải Thích Bằng Tiếng Việt',
      description:
        'Hiểu các con số khi mua nhà ở Massachusetts: khoản trả hàng tháng gồm những gì, chi phí đóng giao dịch, escrow, PMI, và số tiền mặt thật sự cần có.',
    }}
    eyebrow="Công cụ tính toán"
    h1="Hiểu các con số trước khi bấm máy tính"
    lede="Một máy tính tiền vay chỉ trả lời đúng khi bạn nhập đúng. Trang này giải thích từng con số trong một giao dịch mua nhà ở Massachusetts — cái nào trả một lần, cái nào trả hằng tháng, và cái nào người mua lần đầu hay bỏ sót."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Công cụ tính toán', path: '/vi/cong-cu-tinh-toan' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=65',
      alt: 'Bàn làm việc với giấy tờ tính toán tài chính mua nhà',
    }}
    faqHeading="Câu hỏi thường gặp về chi phí"
    faqs={[
      {
        question: 'Khoản trả hàng tháng gồm những gì?',
        answer:
          'Bốn phần, thường gọi tắt là PITI: tiền gốc (Principal), lãi (Interest), thuế bất động sản (Taxes) và bảo hiểm nhà (Insurance). Nếu trả trước dưới 20% thì cộng thêm PMI. Nếu nhà thuộc khu có ban quản lý thì cộng phí HOA. Một máy tính chỉ hiện "gốc và lãi" sẽ cho con số thấp hơn thực tế khá nhiều.',
      },
      {
        question: 'Tôi cần bao nhiêu tiền mặt, ngoài tiền trả trước?',
        answer:
          'Chi phí đóng giao dịch ở Massachusetts thường rơi vào khoảng 2–5% giá mua, gồm phí ngân hàng, phí thẩm định giá, phí luật sư, tra cứu và bảo hiểm chủ quyền, phí đăng bộ, lãi trả trước, và tiền nạp vào tài khoản escrow. Quan trọng không kém: nên còn tiền dự phòng SAU ngày đóng, vì nhà cũ luôn có việc phát sinh trong năm đầu.',
      },
      {
        question: 'PMI là gì và khi nào hết?',
        answer:
          'PMI là bảo hiểm bảo vệ ngân hàng, không bảo vệ bạn, và thường bắt buộc khi trả trước dưới 20%. Với khoản vay thông thường, bạn có thể yêu cầu hủy PMI khi phần vốn sở hữu đạt mức quy định. Khoản vay FHA có quy tắc khác và trong nhiều trường hợp phí bảo hiểm theo suốt thời hạn vay — hãy hỏi rõ ngân hàng điều này trước khi chọn loại vay.',
      },
      {
        question: 'Escrow là gì?',
        answer:
          'Là tài khoản do ngân hàng giữ để trả thuế bất động sản và bảo hiểm nhà thay bạn. Mỗi tháng bạn nộp thêm một phần vào đó cùng tiền vay. Khi thuế thị trấn tăng, khoản trả hàng tháng của bạn tăng theo — dù lãi suất vay không đổi. Đây là lý do khoản trả hàng tháng năm sau có thể khác năm nay.',
      },
      {
        question: 'Thuế bất động sản ảnh hưởng bao nhiêu?',
        answer:
          'Nhiều hơn phần lớn người mua dự tính. Mỗi thị trấn ở Massachusetts tự ấn định thuế suất trên mỗi 1.000 đô la giá trị định giá, và chênh lệch giữa hai thị trấn cạnh nhau có thể là vài nghìn đô la mỗi năm cho cùng một mức giá nhà. Luôn hỏi con số thuế thật của căn nhà cụ thể trong năm hiện tại, đừng ước lượng.',
      },
    ]}
    cta={{
      heading: 'Muốn biết con số thật cho trường hợp của bạn?',
      body: 'Gửi cho Kevin mức giá bạn đang nhắm và thị trấn bạn quan tâm. Anh sẽ tính cho bạn khoản trả hàng tháng gồm cả thuế của chính thị trấn đó.',
      button: 'Liên hệ Kevin',
    }}
    enLabel="The mortgage and closing-cost calculators"
  >
    <h2>Máy tính</h2>
    <p>
      Các công cụ tính toán — tiền vay hàng tháng, chi phí đóng giao dịch, và so sánh thuê
      với mua — nằm ở <Link to="/calculator">trang công cụ tính toán</Link>. Giao diện của
      công cụ hiện bằng tiếng Anh; phần giải thích ý nghĩa từng con số ở ngay bên dưới đây.
    </p>

    <h2>Bốn phần của khoản trả hàng tháng</h2>
    <p>
      <strong>Gốc và lãi.</strong> Đây là phần duy nhất cố định nếu bạn vay lãi suất cố
      định. Mọi máy tính đều hiện phần này.
    </p>
    <p>
      <strong>Thuế bất động sản.</strong> Do thị trấn ấn định và thay đổi hằng năm. Ở vùng
      Greater Boston, đây thường là khoản lớn thứ hai sau tiền lãi.
    </p>
    <p>
      <strong>Bảo hiểm nhà.</strong> Ngân hàng bắt buộc. Nhà gần bờ biển hoặc trong vùng
      ngập lụt có thể cần thêm bảo hiểm lũ, và khoản này không nhỏ.
    </p>
    <p>
      <strong>PMI, nếu trả trước dưới 20%.</strong> Bảo hiểm này bảo vệ ngân hàng chứ không
      bảo vệ bạn.
    </p>

    <h2>Những khoản người mua lần đầu hay quên</h2>
    <ul>
      <li>Phí luật sư — ở Massachusetts đây là khoản gần như bắt buộc, không phải tùy chọn.</li>
      <li>Phí kiểm tra nhà, và các kiểm tra chuyên biệt như radon hoặc bồn dầu ngầm.</li>
      <li>Tiền nạp ban đầu vào escrow, thường vài tháng thuế và bảo hiểm trả trước.</li>
      <li>Phí đăng bộ tại Registry of Deeds.</li>
      <li>Phí HOA nếu mua condo — và khoản đóng góp đặc biệt khi tòa nhà cần sửa lớn.</li>
      <li>Tiền dự phòng sau ngày đóng. Nhà xây trước 1940 luôn có việc trong năm đầu.</li>
    </ul>

    <h2>Con số nào nên hỏi trước khi nộp offer</h2>
    <p>
      Hỏi ba con số cụ thể cho chính căn nhà đó: thuế bất động sản của năm hiện tại, phí
      HOA hằng tháng nếu có, và chi phí sưởi ước tính trong một mùa đông. Ba con số này
      không nằm trong máy tính nào cả, nhưng chúng quyết định căn nhà có nằm trong khả
      năng của bạn hay không. Quy trình đầy đủ nằm trong{' '}
      <Link to="/vi/mua-nha">hướng dẫn mua nhà</Link>.
    </p>
  </ViPage>
);

export default ViCalculator;
