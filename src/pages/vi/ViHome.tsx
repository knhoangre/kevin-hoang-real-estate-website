import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';
import { SITE } from '@/lib/siteConfig';

/**
 * /vi — the Vietnamese entry point.
 *
 * Owns identity and hiring intent for a Vietnamese-speaking reader. It is the
 * counterpart of the English homepage, not a translation of it: the questions a
 * Vietnamese-speaking buyer arrives with are different, and this answers those.
 *
 * Note the framing, which matches /vietnamese-speaking-real-estate-agent and
 * must not be edited away: Vietnamese is an ADDITIONAL service, not a
 * specialisation, and clients of every background are served.
 */
const ViHome = () => (
  <ViPage
    path="/vi"
    seo={{
      title: 'Môi Giới Bất Động Sản Nói Tiếng Việt | Kevin Hoang',
      description:
        'Kevin Hoang là môi giới bất động sản có giấy phép broker tại Massachusetts, làm việc bằng tiếng Việt và tiếng Anh trên 17 thị trấn quanh Boston. Mua nhà, bán nhà, định giá miễn phí.',
    }}
    eyebrow="Tiếng Việt"
    h1="Môi giới bất động sản nói tiếng Việt tại Greater Boston"
    lede="Kevin Hoang là môi giới có giấy phép broker của Massachusetts, làm việc tại Needham cùng Keller Williams Realty. Anh đại diện cho người mua và người bán trên 17 thị trấn quanh Boston, và làm việc bằng cả tiếng Việt lẫn tiếng Anh — từ lần gặp đầu tiên cho đến khi ký giấy tờ cuối cùng."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=70',
      alt: 'Ngôi nhà tại vùng ngoại ô Greater Boston',
    }}
    faqHeading="Câu hỏi thường gặp"
    faqs={[
      {
        question: 'Kevin có thực sự nói tiếng Việt không, hay chỉ là quảng cáo?',
        answer:
          'Có. Toàn bộ giao dịch có thể diễn ra bằng tiếng Việt — các buổi xem nhà, thương lượng, giải thích hợp đồng và cuộc gọi với luật sư nếu cần. Bạn không phải nhờ con cái hay người thân dịch lại những điều khoản quan trọng.',
      },
      {
        question: 'Tôi có cần nói tiếng Anh giỏi để mua nhà ở Massachusetts không?',
        answer:
          'Không. Nhưng giấy tờ pháp lý ở Massachusetts đều bằng tiếng Anh và có hiệu lực ràng buộc. Điều quan trọng không phải là bạn nói tiếng Anh giỏi đến đâu, mà là bạn hiểu rõ mình đang ký gì. Đó chính là phần Kevin làm bằng tiếng Việt.',
      },
      {
        question: 'Kevin chỉ làm việc với khách hàng người Việt à?',
        answer:
          'Không. Kevin phục vụ khách hàng thuộc mọi nguồn gốc. Tiếng Việt là một dịch vụ được cung cấp thêm, không phải là giới hạn — cũng như việc một môi giới hiểu rõ một thị trấn cụ thể không có nghĩa là chỉ làm việc ở đó.',
      },
      {
        question: 'Chi phí dịch vụ như thế nào?',
        answer:
          'Từ tháng 8 năm 2024, người mua phải ký một thỏa thuận đại diện bằng văn bản trước khi đi xem nhà, và mức thù lao được ghi rõ trong thỏa thuận đó — nó có thể thương lượng. Kevin sẽ giải thích cụ thể trước khi bạn ký bất cứ điều gì.',
      },
      {
        question: 'Làm sao tôi kiểm chứng được giấy phép của Kevin?',
        answer:
          'Mọi giấy phép bất động sản ở Massachusetts đều tra cứu công khai được theo tên tại elicensing.mass.gov, bao gồm cấp bậc giấy phép, tình trạng và lịch sử kỷ luật. Nên tra cứu, với bất kỳ môi giới nào.',
      },
    ]}
    cta={{
      heading: 'Bắt đầu bằng một cuộc trò chuyện',
      body: 'Không cần chuẩn bị gì, không ràng buộc. Hãy nói cho Kevin biết bạn đang muốn làm gì, và anh sẽ nói cho bạn biết bước tiếp theo thực sự là gì — kể cả khi câu trả lời trung thực là bạn nên chờ thêm.',
      button: 'Gửi tin nhắn',
    }}
    enLabel="Vietnamese-speaking real estate agent in Greater Boston"
  >
    <h2>Kevin làm gì cho bạn?</h2>
    <p>
      Mua hoặc bán nhà ở Massachusetts đi qua <strong>hai hợp đồng</strong>, không phải
      một: trước hết là Offer to Purchase, sau đó khoảng mười đến mười bốn ngày là
      Purchase and Sale agreement. Phần lớn những rắc rối mà người mua gặp phải đều
      nằm trong khoảng giữa hai hợp đồng đó — và cả hai đều bằng tiếng Anh, đều có
      hiệu lực ràng buộc ngay khi ký.
    </p>
    <p>
      Đây cũng là tiểu bang bắt buộc phải có luật sư trong giao dịch. Công việc của
      Kevin là bảo đảm rằng ở mỗi bước, bạn hiểu rõ mình đang đồng ý điều gì, thời hạn
      nào đang chạy, và điều gì sẽ xảy ra nếu mọi việc không như dự tính.
    </p>

    <h2>Ba việc thường gặp nhất</h2>
    <ul>
      <li>
        <Link to="/vi/mua-nha">Mua nhà</Link> — từ thư chấp thuận vay đến ngày nhận
        chìa khóa, và những điều khoản bảo vệ mà bạn không nên bỏ.
      </li>
      <li>
        <Link to="/vi/ban-nha">Bán nhà</Link> — chuẩn bị, định giá, và những giấy tờ
        bắt buộc theo luật Massachusetts.
      </li>
      <li>
        <Link to="/vi/dinh-gia-nha">Định giá nhà miễn phí</Link> — một bản định giá
        viết tay dựa trên các căn đã bán tương đương, không phải con số máy tự động.
      </li>
    </ul>

    <h2>Kevin làm việc ở đâu?</h2>
    <p>
      {SITE.areaServed.length} thị trấn ở MetroWest, Greater Boston và South Shore,
      với văn phòng tại Needham. Mỗi thị trấn có một trang hướng dẫn riêng — tên ga
      tàu, tên trường học, đường cao tốc, và điều cụ thể mà người mua nên kiểm tra ở
      nơi đó. Xem <Link to="/vi/khu-vuc">các khu vực phục vụ</Link>.
    </p>
    <p>
      Một điều nên biết trước khi chọn thị trấn: ở vùng Boston, giá trị được quyết
      định theo từng con phố chứ không theo ranh giới hành chính. Hai căn nhà cách
      nhau một dặm trong cùng một thị trấn có thể là hai giao dịch hoàn toàn khác nhau
      — tùy vào việc bạn có đi bộ được ra ga tàu không, và địa chỉ đó thuộc trường
      tiểu học nào.
    </p>

    <h2>Nếu bạn mới đến Massachusetts</h2>
    <p>
      Có vài việc bắt buộc và có thời hạn: đổi bằng lái và đăng ký xe tại RMV, mua bảo
      hiểm y tế theo quy định bắt buộc của tiểu bang, và đăng ký học cho con. Thuê nhà
      một năm trước khi mua thường là quyết định đúng, vì nó cho bạn thời gian hiểu
      địa lý vùng này trước khi bỏ ra một số tiền lớn.
    </p>
    <p>
      Còn nhiều câu hỏi khác? Xem{' '}
      <Link to="/vi/cau-hoi-thuong-gap">những câu hỏi thường gặp</Link>, hoặc gọi thẳng
      cho Kevin.
    </p>
  </ViPage>
);

export default ViHome;
