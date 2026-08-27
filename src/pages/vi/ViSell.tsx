import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';

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
  >
    <h2>Giá bán được quyết định trong hai tuần đầu</h2>
    <p>
      Một căn nhà vừa lên thị trường nhận được đợt chú ý lớn nhất mà nó sẽ không bao giờ có
      lại: mọi người mua có tìm kiếm đã lưu, mọi môi giới theo dõi thị trấn đó, và mọi thông
      báo tự động đều kích hoạt cùng lúc.
    </p>
    <p>
      Định giá đúng thì sự chú ý ấy chuyển thành các buổi xem nhà, rồi thành offer — đôi khi
      là nhiều offer cùng lúc. Định giá quá cao thì cũng nhóm người ấy nhìn thấy, đánh giá là
      đắt, và đi tiếp. Đó là toàn bộ lập luận, và{' '}
      <Link to="/vi/dinh-gia-nha">một bản định giá dựa trên dữ liệu thật</Link> là cách tránh nó.
    </p>

    <h2>Lo các giấy tờ bắt buộc trước</h2>
    <p>Mỗi món dưới đây đều có thể làm chậm ngày đóng nếu để đến phút cuối.</p>
    <ul>
      <li>
        <strong>Giấy chứng nhận báo khói và báo khí CO</strong> — nghĩa vụ của người bán, xin
        từ sở cứu hỏa địa phương. Đặt lịch ngay khi có ngày đóng.
      </li>
      <li>
        <strong>Title 5</strong>, nếu nhà dùng hầm tự hoại. Làm trước khi đăng bán. Một hệ
        thống không đạt vừa tốn kém vừa mất thời gian thay thế.
      </li>
      <li>
        <strong>Sơn chì</strong>, nếu nhà xây trước năm 1978. Luật liên bang buộc phải công
        bố những gì bạn biết và cung cấp tài liệu của EPA; luật Massachusetts còn chặt hơn.
      </li>
      <li>
        <strong>Giấy 6(d)</strong>, nếu là chung cư. Ban quản trị xác nhận bạn không còn nợ
        phí. Đây là thứ ngăn người mua thừa hưởng khoản nợ của chủ cũ.
      </li>
      <li>
        <strong>Lịch sử giấy phép xây dựng</strong> — lấy từ phòng xây dựng và đối chiếu với
        thực tế. Công trình không phép sẽ lộ ra trong quá trình người mua thẩm tra.
      </li>
    </ul>

    <h2>Chuẩn bị nhà: làm gì và không làm gì</h2>
    <p>
      <strong>Nên làm:</strong> dọn bớt đồ đạc — bỏ khoảng một phần ba số nội thất và hầu hết
      đồ cá nhân; dọn vệ sinh thật kỹ, kể cả cửa kính; sơn lại những chỗ trầy xước hoặc màu
      quá đậm; thay bóng đèn và làm sáng những phòng tối; và chăm chút mặt tiền, vì đó là tấm
      ảnh đầu tiên người mua nhìn thấy.
    </p>
    <p>
      <strong>Không nên làm:</strong> tân trang toàn bộ bếp hoặc phòng tắm chỉ để bán. Chi phí
      hiếm khi thu hồi đủ, và người mua thường sẽ làm lại theo gu của họ.
    </p>
    <p>
      Cân nhắc <strong>tự thuê kiểm tra nhà trước khi đăng bán</strong>. Nó biến những bất ngờ
      thành những quyết định: sửa cái rẻ, tính giá cho cái đắt, và công bố đầy đủ. Người mua
      phát hiện năm vấn đề sẽ thương lượng; người mua thấy năm vấn đề bạn đã công bố và đã
      tính vào giá thì đang mua nhà.
    </p>

    <h2>Nếu bạn vừa bán vừa mua</h2>
    <p>
      Hai giao dịch phải khớp nhau về thời gian, và lãi suất ảnh hưởng đến cả hai theo hướng
      không bù trừ cho nhau. Nếu bạn đang giữ một khoản vay lãi suất thấp, đổi sang căn lớn
      hơn với lãi suất hiện tại có thể làm khoản trả hàng tháng tăng nhiều hơn phần chênh lệch
      giá. Hãy tính cả hai bên trước khi đăng bán.
    </p>
  </ViPage>
);

export default ViSell;
