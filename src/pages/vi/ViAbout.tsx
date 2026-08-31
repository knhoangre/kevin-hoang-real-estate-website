import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';
import { SITE } from '@/lib/siteConfig';

/**
 * /vi/gioi-thieu — the counterpart of /about.
 *
 * /about declares the #kevin Person node and carries the visible profile
 * links; this page references the same person in Vietnamese. ViPage already
 * emits person() and agentIdentity() on every /vi page, so the identity node
 * resolves here too.
 *
 * The profile links are rendered from SITE.profiles, the same array /about
 * reads. A sameAs URL that appears nowhere visible is an unbacked assertion,
 * and the list must not fork between the two languages.
 */
const ViAbout = () => (
  <ViPage
    path="/vi/gioi-thieu"
    seo={{
      title: 'Kevin Hoang — Chuyên Viên Địa Ốc Nói Tiếng Việt Tại Massachusetts',
      description:
        'Kevin Hoang là chuyên viên địa ốc tại Needham, Massachusetts, phục vụ khách hàng bằng tiếng Việt và tiếng Anh trên khắp vùng Greater Boston.',
    }}
    eyebrow="Về Kevin"
    h1="Kevin Hoang là ai"
    lede="Kevin Hoang là chuyên viên địa ốc có giấy phép tại Massachusetts, sống và làm việc ở Needham. Anh phục vụ khách hàng bằng cả tiếng Việt và tiếng Anh, và làm việc với người mua lẫn người bán trên khắp vùng Greater Boston."
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Về Kevin', path: '/vi/gioi-thieu' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1600&q=65',
      alt: 'Khu dân cư ở Needham, Massachusetts',
    }}
    faqHeading="Câu hỏi thường gặp về Kevin"
    faqs={[
      {
        question: 'Kevin có nói tiếng Việt không?',
        answer:
          'Có. Kevin làm việc bằng cả tiếng Việt và tiếng Anh — trong buổi xem nhà, khi thương lượng, và khi giải thích hợp đồng. Điều này không có nghĩa là anh chỉ phục vụ khách hàng người Việt: Kevin làm việc với khách hàng thuộc mọi cộng đồng, và tiếng Việt là một dịch vụ thêm chứ không phải một giới hạn.',
      },
      {
        question: 'Kevin phục vụ những khu vực nào?',
        answer: `Needham và các thị trấn lân cận trong vùng Greater Boston — hiện là ${SITE.areaServed.length} thị trấn. Nếu bạn đang tìm ở một nơi không nằm trong danh sách, hãy hỏi; nếu đó không phải thị trường Kevin nắm rõ, anh sẽ nói thẳng và giới thiệu người phù hợp hơn.`,
      },
      {
        question: 'Kevin làm việc với người mua hay người bán?',
        answer:
          'Cả hai. Với người mua, Kevin đại diện quyền lợi của bạn trong thương lượng. Với người bán, anh lo phần định giá, tiếp thị và đưa giao dịch đến ngày đóng.',
      },
      {
        question: 'Chi phí làm việc với Kevin là bao nhiêu?',
        answer:
          'Hoa hồng ở Massachusetts là con số thương lượng được, và cách chi trả đã thay đổi sau các quy định mới của ngành từ năm 2024. Hãy hỏi Kevin trực tiếp về trường hợp của bạn — anh sẽ nói rõ con số và ai trả trước khi bạn ký bất cứ giấy tờ nào.',
      },
    ]}
    cta={{
      heading: 'Muốn nói chuyện trực tiếp?',
      body: 'Một cuộc gọi mười lăm phút thường đủ để biết bước tiếp theo của bạn là gì. Không cần chuẩn bị gì trước.',
      button: 'Liên hệ Kevin',
    }}
    enLabel="About Kevin Hoang"
  >
    <h2>Làm việc ở Needham và vùng Greater Boston</h2>
    <p>
      Kevin sống ở Needham và làm việc chủ yếu ở Needham cùng các thị trấn quanh đó. Đây
      là một thị trường có đặc thù riêng: phần lớn nhà xây trước năm 1940, giá thay đổi
      đáng kể chỉ trong vài dãy phố, và khu học chánh ảnh hưởng trực tiếp đến giá.
    </p>
    <p>
      Xem <Link to="/vi/khu-vuc">danh sách các khu vực phục vụ</Link> để biết Kevin làm
      việc ở những thị trấn nào.
    </p>

    <h2>Tiếng Việt là dịch vụ thêm, không phải giới hạn</h2>
    <p>
      Mua hoặc bán một căn nhà bằng ngôn ngữ thứ hai là chuyện khó — không phải vì vốn từ,
      mà vì các thuật ngữ pháp lý ở Massachusetts không có bản dịch gọn gàng. "Offer to
      Purchase" là hợp đồng ràng buộc; "contingency" là điều khoản cho phép bạn rút lui;
      "escrow" là khoản tiền do bên thứ ba giữ. Hiểu sai một trong ba từ đó có thể tốn
      tiền thật.
    </p>
    <p>
      Kevin giải thích những điều này bằng tiếng Việt khi bạn cần. Nhưng anh phục vụ khách
      hàng thuộc mọi cộng đồng — tiếng Việt là một khả năng thêm vào, không phải điều kiện.
    </p>

    <h2>Giấy phép và công ty</h2>
    <p>
      Kevin hành nghề tại {SITE.brokerage}. Địa chỉ văn phòng và số điện thoại ở cuối
      trang này giống hệt ở mọi trang khác trên website và trên mọi hồ sơ nghề nghiệp —
      đó là cách bạn kiểm tra một chuyên viên địa ốc có thật hay không.
    </p>

    <h2>Hồ sơ nghề nghiệp</h2>
    <p>Bạn có thể xác minh Kevin qua các trang sau:</p>
    <ul>
      {SITE.profiles.map((profile) => (
        <li key={profile.url}>
          <a href={profile.url} target="_blank" rel="noopener noreferrer">
            {profile.name}
          </a>
        </li>
      ))}
    </ul>

    <h2>Liên hệ</h2>
    <p>
      Điện thoại: <a href={`tel:${SITE.phoneE164}`}>{SITE.phone}</a>
      <br />
      Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
    </p>
  </ViPage>
);

export default ViAbout;
