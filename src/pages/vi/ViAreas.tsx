import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';
import { SITE } from '@/lib/siteConfig';

/**
 * /vi/khu-vuc — the towns served, in Vietnamese. Counterpart of /neighborhoods.
 *
 * Links out to the English town guides rather than duplicating seventeen of
 * them in Vietnamese. Translating them would be a large amount of near-identical
 * content — exactly the scaled-content shape this corpus was cleaned of once.
 * The guides are named and their contents described so a Vietnamese reader
 * knows what they will find there.
 */
const ViAreas = () => (
  <ViPage
    path="/vi/khu-vuc"
    seo={{
      title: 'Các Khu Vực Phục Vụ Quanh Boston | Tiếng Việt',
      description:
        'Kevin Hoang phục vụ 17 thị trấn ở MetroWest, Greater Boston và South Shore. Cách chọn thị trấn theo quãng đường đi làm, trường học và loại nhà.',
    }}
    eyebrow="Khu vực phục vụ"
    h1="Chọn thị trấn nào quanh Boston?"
    lede="Ở vùng Boston, giá trị được quyết định theo từng con phố chứ không theo ranh giới thị trấn. Việc bạn có đi bộ được ra ga tàu không, và địa chỉ đó thuộc trường tiểu học nào, ảnh hưởng đến giá nhiều hơn tên thị trấn."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Khu vực phục vụ', path: '/vi/khu-vuc' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=70',
      alt: 'Khu dân cư ngoại ô vùng Greater Boston',
    }}
    faqHeading="Câu hỏi về khu vực"
    faqs={[
      {
        question: 'Thị trấn nào có cộng đồng người Việt lớn?',
        answer:
          'Quincy, Malden và Medford là những nơi có cộng đồng người Việt đáng kể ở vùng Boston, cùng với khu Dorchester của thành phố Boston. Nhưng đừng để đó là tiêu chí duy nhất — quãng đường đi làm, trường học và loại nhà bạn cần thường quan trọng hơn về lâu dài, và các thị trấn quanh đó đều nằm trong khoảng cách lái xe hợp lý.',
      },
      {
        question: 'Nhà hai căn hộ (two-family) phổ biến ở đâu?',
        answer:
          'Medford, Malden, Somerville, Quincy và Waltham có nhiều nhà hai và ba căn hộ — đây là phần lớn nguồn cung ở các thị trấn đó chứ không phải loại hiếm. Nhiều gia đình mua và ở một căn, cho thuê căn còn lại, hoặc để cha mẹ ở.',
      },
      {
        question: 'Đi bộ ra ga tàu có thật sự quan trọng không?',
        answer:
          'Rất quan trọng, và nó là một trong những khác biệt bền vững nhất giữa hai căn nhà tương tự nhau. Needham có tới bốn ga tàu trong cùng một thị trấn. Hãy đi bộ thử và bấm giờ — bản đồ luôn cho cảm giác gần hơn thực tế.',
      },
      {
        question: 'Nhà dùng hầm tự hoại có ở những thị trấn nào?',
        answer:
          'Phổ biến ở các thị trấn ngoại vi như Dover, Sherborn và Weston, nơi nhiều khu vực không có cống thành phố. Điều này quan trọng vì luật Title 5 buộc kiểm tra khi bán, và một hệ thống không đạt có thể tốn hàng chục nghìn đô la.',
      },
    ]}
    cta={{
      heading: 'Chưa chắc nên bắt đầu ở đâu?',
      body: 'Hãy nói cho Kevin biết bạn làm việc ở đâu, ngân sách bao nhiêu và gia đình cần gì. Từ đó thu hẹp lại danh sách thị trấn dễ hơn nhiều so với việc tự đọc từng cái một.',
      button: 'Hỏi Kevin',
    }}
    enLabel="Town-by-town area guides"
  >
    <h2>Bắt đầu từ quãng đường đi làm</h2>
    <p>
      Sai lầm phổ biến nhất của người mới đến là chọn thị trấn từ một danh sách rồi mới phát
      hiện thực tế hằng ngày ra sao. Địa lý vùng Boston không hoạt động như bản đồ gợi ý:
      khoảng cách ít quan trọng hơn nhiều so với việc bạn nằm trên hành lang giao thông nào và
      có ra được ga tàu hay không.
    </p>
    <p>Trước khi quyết định, hãy làm ba việc này:</p>
    <ul>
      <li>
        <strong>Lái thử quãng đường đi làm vào đúng giờ bạn sẽ đi</strong>, cả chiều đi lẫn
        chiều về. Mười lăm dặm trên Route 9 lúc 8 giờ sáng khác hẳn cùng quãng đường lúc 10 giờ.
      </li>
      <li>
        <strong>Đi bộ từ nhà ra ga và bấm giờ.</strong> Và kiểm tra tần suất tàu chạy trên
        tuyến đó, chứ không chỉ kiểm tra là có ga.
      </li>
      <li>
        <strong>Xác nhận trường học cho địa chỉ cụ thể</strong>, không phải cho thị trấn. Nhiều
        thị trấn có nhiều khu học chính, và Newton có hai trường trung học.
      </li>
    </ul>

    <h2>{SITE.areaServed.length} thị trấn, mỗi nơi một trang hướng dẫn</h2>
    <p>
      Mỗi trang dưới đây liệt kê tên ga tàu thật, tên trường học thật, các tuyến đường cao tốc,
      không gian xanh, và điều cụ thể mà người mua nên kiểm tra ở nơi đó. Các trang này viết
      bằng tiếng Anh — nếu có phần nào bạn muốn hỏi lại bằng tiếng Việt, cứ gọi cho Kevin.
    </p>
    <p>
      {SITE.areaServed.map((town, i) => (
        <span key={town.slug}>
          {i > 0 && ' · '}
          <Link to={`/neighborhoods/${town.slug}`}>{town.name}</Link>
        </span>
      ))}
    </p>

    <h2>Vài điểm khác biệt đáng chú ý</h2>
    <p>
      <strong>Needham</strong> có bốn ga tàu trong cùng một thị trấn — điều bất thường, và
      khoảng cách đi bộ tới ga tạo ra chênh lệch giá rõ rệt giữa những căn nhà tương tự nhau.
    </p>
    <p>
      <strong>Quincy, Malden và Medford</strong> có nhiều nhà hai và ba căn hộ, và là nơi có
      cộng đồng người Việt lớn nhất trong vùng.
    </p>
    <p>
      <strong>Dover và Weston</strong> có lô đất lớn và nhiều nhà dùng hầm tự hoại thay vì cống
      thành phố — nghĩa là phải xác minh Title 5 trước khi mua.
    </p>
    <p>
      <strong>Brookline</strong> nằm gần như trọn trong lòng thành phố Boston nhưng có chính
      quyền và học khu riêng, với tỷ lệ chung cư cao bất thường.
    </p>

    <h2>Bước tiếp theo</h2>
    <p>
      Nếu bạn đang mua, xem <Link to="/vi/mua-nha">hướng dẫn mua nhà</Link>. Nếu bạn đang bán,
      xem <Link to="/vi/ban-nha">hướng dẫn bán nhà</Link> hoặc yêu cầu{' '}
      <Link to="/vi/dinh-gia-nha">định giá miễn phí</Link>.
    </p>
  </ViPage>
);

export default ViAreas;
