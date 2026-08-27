import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';

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
  >
    <h2>Bước 1 — Thư chấp thuận vay, không phải ước lượng</h2>
    <p>
      Có hai loại giấy tờ nghe giống nhau nhưng khác hẳn. <strong>Pre-qualification</strong>{' '}
      chỉ là phép tính dựa trên con số bạn tự khai. <strong>Pre-approval</strong> nghĩa là
      một nhân viên thẩm định đã xem giấy tờ thật của bạn. Người bán và môi giới bên bán
      biết rõ sự khác biệt, và trong một thị trường có nhiều người cùng tranh mua, điều đó
      quyết định offer của bạn có được xem xét nghiêm túc hay không.
    </p>

    <h2>Bước 2 — Chọn thị trấn trước khi chọn nhà</h2>
    <p>
      Đây là bước người ta hay làm ngược. Hãy lái thử quãng đường đi làm vào đúng giờ bạn
      sẽ đi. Đi bộ từ nhà ra ga tàu và bấm giờ. Xác nhận địa chỉ cụ thể đó thuộc trường
      tiểu học nào — không phải thị trấn nào. Xem{' '}
      <Link to="/vi/khu-vuc">các khu vực Kevin phục vụ</Link>.
    </p>

    <h2>Bước 3 — Offer to Purchase</h2>
    <p>
      Đây là hợp đồng ràng buộc. Nó ghi giá, tiền đặt cọc (thường 1.000 đô la ở bước này),
      và toàn bộ thời hạn cho các điều khoản bảo vệ. Kể từ lúc ký, đồng hồ bắt đầu chạy.
      Hãy đọc kỹ các ngày tháng — đó mới là phần thương lượng thật sự.
    </p>

    <h2>Bước 4 — Kiểm tra nhà, thường trong 5 đến 10 ngày</h2>
    <p>
      Bạn thuê người kiểm tra. Ngoài kiểm tra tổng quát, nên cân nhắc kiểm tra{' '}
      <strong>radon</strong>, và với nhà xây trước năm 1978 thì cả <strong>sơn chì</strong>.
      Nếu nhà dùng hầm tự hoại, chủ nhà có nghĩa vụ kiểm tra theo Title 5 — hãy xác nhận
      thời điểm ngay lúc này.
    </p>
    <p>
      Sau khi hết thời hạn này, quyền thương lượng dựa trên kết quả kiểm tra của bạn không
      còn nữa.
    </p>

    <h2>Bước 5 — Purchase and Sale agreement</h2>
    <p>
      Khoảng mười đến mười bốn ngày sau Offer. Đây là hợp đồng chính thức, thay thế Offer,
      và mọi điều khoản quan trọng đều được viết lại chi tiết hơn: tiêu chuẩn chủ quyền,
      chuyện gì xảy ra nếu nhà bị hư hại trước ngày đóng, cách gia hạn, và{' '}
      <strong>tiền đặt cọc sẽ ra sao nếu giao dịch đổ vỡ</strong> — điều khoản quan trọng
      nhất và ít người đọc nhất.
    </p>
    <p>
      Tiền đặt cọc thường tăng lên khoảng 5% giá mua ở bước này. Đây là lúc việc có luật
      sư riêng không còn là tùy chọn.
    </p>

    <h2>Bước 6 — Cam kết cho vay và thời hạn của nó</h2>
    <p>
      P&S ấn định một ngày mà ngân hàng phải cấp cam kết cho vay bằng văn bản. Nếu ngày đó
      trôi qua mà bạn không có cam kết và cũng không có gia hạn bằng văn bản, bạn có thể bị
      coi là vi phạm hợp đồng — và tiền đặt cọc, lúc này đã là 5%, bị đe dọa.
    </p>
    <p>Hãy tự theo dõi ngày này. Đừng cho rằng có người khác đang theo dõi giúp bạn.</p>

    <h2>Bước 7 — Chủ quyền, giấy chứng nhận báo khói, và ngày đóng</h2>
    <p>
      Luật sư của bạn tra cứu lịch sử chủ quyền, thường là 50 năm. Bên bán có nghĩa vụ xin
      giấy chứng nhận thiết bị báo khói và báo khí CO từ sở cứu hỏa địa phương. Ngày đóng
      diễn ra tại sở đăng bộ hoặc văn phòng luật sư, và giao dịch chỉ hoàn tất khi giấy tờ
      được <strong>đăng bộ</strong>, không phải khi ký xong.
    </p>
    <p>
      Một cảnh báo quan trọng: <strong>luôn gọi điện xác nhận thông tin chuyển tiền</strong>{' '}
      bằng số điện thoại bạn đã có sẵn, ngay trước khi chuyển. Lừa đảo chuyển khoản nhắm vào
      các giao dịch nhà đất rất phổ biến và tiền thường không lấy lại được.
    </p>
  </ViPage>
);

export default ViBuy;
