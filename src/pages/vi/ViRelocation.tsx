import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';

/**
 * /vi/chuyen-den-massachusetts — the counterpart of /relocation.
 *
 * The English page owns the CT -> MA origin-market axis. This one keeps that
 * axis but widens it slightly: a Vietnamese reader relocating here is at least
 * as likely to be arriving from California, Texas or Virginia as from
 * Connecticut, and the tax and licensing mechanics are the same either way.
 *
 * Every statutory figure carries its year and points at the agency that
 * publishes it, rather than restating a percentage nobody can check.
 */
const ViRelocation = () => (
  <ViPage
    path="/vi/chuyen-den-massachusetts"
    seo={{
      title: 'Chuyển Đến Massachusetts: Hướng Dẫn Bằng Tiếng Việt',
      description:
        'Những điều cần biết khi chuyển đến Massachusetts: thuế thu nhập và thuế bất động sản, bằng lái và đăng ký xe, bảo hiểm y tế bắt buộc, và cách chọn thị trấn.',
    }}
    eyebrow="Chuyển đến"
    h1="Chuyển đến Massachusetts"
    lede="Chuyển tiểu bang không chỉ là chuyện tìm nhà. Massachusetts có vài quy định riêng — bảo hiểm y tế bắt buộc, thời hạn đổi bằng lái, và cách tính thuế bất động sản theo từng thị trấn — mà biết trước sẽ đỡ tốn kém hơn nhiều so với biết sau."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Chuyển đến Massachusetts', path: '/vi/chuyen-den-massachusetts' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=65',
      alt: 'Nhà ở vùng ngoại ô Massachusetts',
    }}
    faqHeading="Câu hỏi thường gặp khi chuyển đến"
    faqs={[
      {
        question: 'Tôi có bao lâu để đổi bằng lái xe?',
        answer:
          'Massachusetts yêu cầu người mới chuyển đến đổi sang bằng lái của tiểu bang trong một thời hạn nhất định sau khi lập cư trú. Thời hạn và giấy tờ cần thiết do RMV (Registry of Motor Vehicles) quy định và có thay đổi theo thời gian — hãy xem trực tiếp tại mass.gov/rmv thay vì tin vào con số nghe được.',
      },
      {
        question: 'Bảo hiểm y tế có bắt buộc không?',
        answer:
          'Có. Massachusetts yêu cầu cư dân trưởng thành phải có bảo hiểm y tế đạt chuẩn, và việc này được khai trên tờ khai thuế tiểu bang. Đây là điểm khác biệt so với phần lớn các tiểu bang khác. Thông tin chính thức ở Massachusetts Health Connector.',
      },
      {
        question: 'Thuế bất động sản ở đây tính thế nào?',
        answer:
          'Mỗi thị trấn tự ấn định thuế suất riêng cho mỗi 1.000 đô la giá trị định giá, và con số này chênh lệch đáng kể giữa các thị trấn cạnh nhau. Hai căn nhà cùng giá ở hai thị trấn khác nhau có thể chênh nhau vài nghìn đô la thuế mỗi năm. Sở Doanh thu Massachusetts (DOR) công bố bảng thuế suất từng thị trấn hằng năm.',
      },
      {
        question: 'Tôi nên thuê trước hay mua ngay?',
        answer:
          'Nếu bạn chưa từng sống trong vùng, thuê từ sáu tháng đến một năm thường là quyết định tốt. Khoảng cách đi làm ở vùng Boston khác xa những gì bản đồ gợi ý, và cảm nhận về một thị trấn vào tháng Hai rất khác tháng Sáu.',
      },
      {
        question: 'Tôi có phải khai thuế ở hai tiểu bang trong năm chuyển không?',
        answer:
          'Thường là có — một tờ khai cho phần năm cư trú ở tiểu bang cũ và một tờ cho phần năm ở Massachusetts. Quy tắc phân bổ thu nhập phức tạp và tùy trường hợp. Hãy hỏi người khai thuế trước khi bán nhà hoặc nhận thu nhập lớn trong năm chuyển.',
      },
    ]}
    cta={{
      heading: 'Chưa biết nên bắt đầu ở thị trấn nào?',
      body: 'Hãy cho Kevin biết bạn làm việc ở đâu và ngân sách khoảng bao nhiêu. Anh sẽ nói cho bạn biết những thị trấn nào thực tế nằm trong tầm với, và mỗi nơi đánh đổi điều gì.',
      button: 'Liên hệ Kevin',
    }}
    enLabel="Relocating to Massachusetts"
  >
    <h2>Việc cần làm trước khi dọn đến</h2>
    <p>
      Ba việc nên xử lý sớm, vì chúng đều có thời hạn: đổi bằng lái và đăng ký xe tại RMV,
      sắp xếp bảo hiểm y tế đạt chuẩn của tiểu bang, và đăng ký cư trú tại tòa thị chính
      thị trấn bạn dọn đến. Việc thứ ba nghe nhỏ nhưng ảnh hưởng đến quyền bầu cử, giấy
      phép đậu xe, và một số khoản giảm thuế bất động sản.
    </p>

    <h2>Thuế: hai con số cần so sánh</h2>
    <p>
      <strong>Thuế thu nhập tiểu bang.</strong> Massachusetts áp dụng thuế suất cố định
      cho phần lớn thu nhập, cộng thêm một mức phụ thu cho thu nhập rất cao. Con số hiện
      hành do Sở Doanh thu Massachusetts (DOR) công bố; hãy tra ở mass.gov thay vì dựa vào
      bài viết cũ.
    </p>
    <p>
      <strong>Thuế bất động sản.</strong> Đây là con số dễ bị bỏ sót nhất khi so sánh hai
      căn nhà. Thuế suất do từng thị trấn ấn định trên mỗi 1.000 đô la giá trị định giá,
      và chênh lệch giữa hai thị trấn liền kề có thể lên tới vài nghìn đô la mỗi năm cho
      cùng một mức giá nhà. Trước khi nộp offer, hãy hỏi con số thuế thật của căn nhà đó
      trong năm hiện tại.
    </p>

    <h2>Chọn thị trấn</h2>
    <p>
      Ở vùng Boston, khoảng cách trên bản đồ nói rất ít về thời gian đi làm. Tuyến commuter
      rail bạn ở gần quan trọng hơn số dặm. Hãy lái thử hoặc đi tàu thử đúng vào giờ bạn sẽ
      đi thật, ít nhất một lần, trước khi quyết định.
    </p>
    <p>
      Khu học chánh cũng vậy: ranh giới trường không trùng ranh giới thị trấn ở nhiều nơi.
      Xác nhận địa chỉ cụ thể thuộc trường nào, đừng suy ra từ tên thị trấn. Xem{' '}
      <Link to="/vi/khu-vuc">các khu vực Kevin phục vụ</Link>.
    </p>

    <h2>Nhà ở đây khác gì</h2>
    <p>
      Phần lớn nhà trong vùng xây trước năm 1940. Điều đó có nghĩa là: hệ thống điện có thể
      cũ, có thể còn bồn dầu ngầm, sơn chì là chuyện bình thường với nhà trước 1978, và
      tầng hầm thấm nước là vấn đề phổ biến. Không có điều nào trong số đó là lý do để
      tránh — nhưng tất cả đều là lý do để kiểm tra nhà cẩn thận. Quy trình cụ thể nằm
      trong <Link to="/vi/mua-nha">hướng dẫn mua nhà</Link>.
    </p>
  </ViPage>
);

export default ViRelocation;
