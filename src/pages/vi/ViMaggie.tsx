import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';
import { partnerAgent, partnerPerson, profilePage } from '@/lib/schema';
import { CHINESE_PARTNER, SITE, partnerTelHref } from '@/lib/siteConfig';

/**
 * /vi/maggie-li — who Maggie Li is, in Vietnamese. Pairs with /maggie-li and
 * /zh/maggie-li, and says what they say: only what her own site states plainly
 * (Mandarin and English, the brokerage, her office, the AREAA board seat), no
 * Chinese name and no rankings. /vi/dich-vu-tieng-trung is what working with her
 * in Chinese covers; this is the person.
 */
const ViMaggie = () => (
  <ViPage
    path="/vi/maggie-li"
    seo={{
      title: 'Maggie Li, Môi Giới Nói Tiếng Trung Ở Newton, MA',
      description: `${CHINESE_PARTNER.name} là môi giới bất động sản của ${CHINESE_PARTNER.brokerage}, văn phòng ở Newton, làm việc bằng tiếng Quan Thoại và tiếng Anh với người mua và người bán nhà ở Greater Boston.`,
    }}
    eyebrow="Gặp Maggie Li"
    h1="Maggie Li, môi giới bất động sản ở Newton"
    lede={`${CHINESE_PARTNER.name} là môi giới bất động sản của ${CHINESE_PARTNER.brokerage}, văn phòng ở Newton, làm việc với người mua và người bán nhà ở Greater Boston bằng tiếng Quan Thoại và tiếng Anh.`}
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Gặp Maggie Li', path: '/vi/maggie-li' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1920&q=70',
      alt: '',
    }}
    faqHeading="Câu hỏi về Maggie"
    faqs={[
      {
        question: 'Liên hệ Maggie Li bằng cách nào?',
        answer: `Điện thoại ${CHINESE_PARTNER.phone}, email ${CHINESE_PARTNER.email}, văn phòng ở ${CHINESE_PARTNER.addressLine}, trang web maggieli.co. Mã WeChat của Maggie có trên trang liên hệ tiếng Trung của trang này.`,
      },
      {
        question: 'Maggie làm việc bằng những ngôn ngữ nào?',
        answer: 'Tiếng Quan Thoại và tiếng Anh.',
      },
      {
        question: 'Maggie phục vụ những thị trấn nào?',
        answer: `Cả ${SITE.areaServed.length} thị trấn ở Greater Boston mà trang này giới thiệu. Trang web của Maggie còn giới thiệu Arlington và các khu Back Bay, Beacon Hill, Fenway của Boston.`,
      },
    ]}
    cta={{
      heading: 'Cần hỏi bằng tiếng Việt trước?',
      body: `Gọi hoặc nhắn tin cho Kevin bằng tiếng Việt. Để nói chuyện thẳng với Maggie bằng tiếng Trung hoặc tiếng Anh: ${CHINESE_PARTNER.phone}.`,
      button: 'Hỏi Kevin',
    }}
    enLabel="Meet Maggie Li"
    jsonLd={[
      profilePage({
        path: '/vi/maggie-li',
        name: `${CHINESE_PARTNER.name}, môi giới bất động sản ở Newton`,
        personId: CHINESE_PARTNER.personId,
        inLanguage: 'vi',
      }),
      partnerPerson(),
      partnerAgent(),
    ]}
  >
    <h2>Thông tin về Maggie</h2>
    <ul>
      <li>
        <strong>Nhóm:</strong> {CHINESE_PARTNER.teamName}
      </li>
      <li>
        <strong>Công ty môi giới:</strong> {CHINESE_PARTNER.brokerage}
      </li>
      <li>
        <strong>Văn phòng:</strong> {CHINESE_PARTNER.addressLine}
      </li>
      <li>
        <strong>Ngôn ngữ làm việc:</strong> tiếng Quan Thoại, tiếng Anh
      </li>
      <li>
        <strong>Hiệp hội nghề nghiệp:</strong> thành viên hội đồng quản trị của Hiệp hội Bất động sản Người Mỹ gốc Á
        (Asian Real Estate Association of America, AREAA)
      </li>
      <li>
        <strong>Điện thoại:</strong> <a href={partnerTelHref}>{CHINESE_PARTNER.phone}</a>
      </li>
      <li>
        <strong>Email:</strong> <a href={`mailto:${CHINESE_PARTNER.email}`}>{CHINESE_PARTNER.email}</a>
      </li>
      <li>
        <strong>Trang web:</strong>{' '}
        <a href={CHINESE_PARTNER.website} target="_blank" rel="noopener noreferrer">
          maggieli.co
        </a>{' '}
        (tiếng Anh, có các giao dịch và đánh giá của khách hàng)
      </li>
    </ul>

    <h2>Mua nhà từ nước ngoài hoặc từ tiểu bang khác</h2>
    <p>
      Nhà rao bán thì dễ tìm trên mạng. Khó là biết thị trấn nào hợp với bạn, đi làm thật sự mất bao lâu, và cả quá
      trình diễn ra thế nào khi bạn không có mặt. Maggie có thể dẫn xem nhà qua video, đi xem nhà và dự buổi kiểm định
      thay bạn, và nói trước những bước nào làm từ nước ngoài sẽ lâu hơn: khoản vay, chuyển tiền, giấy tờ tùy thân và
      thời gian.
    </p>
    <p>
      Những gì làm được bằng tiếng Trung, và những gì phải bằng tiếng Anh, có ở trang{' '}
      <Link to="/vi/dich-vu-tieng-trung">mua bán nhà bằng tiếng Trung</Link>.
    </p>

    <h2>Maggie trên các trang khác</h2>
    <ul>
      {CHINESE_PARTNER.profiles.map((profile) => (
        <li key={profile.url}>
          <a href={profile.url} target="_blank" rel="noopener noreferrer">
            {profile.name}
          </a>
        </li>
      ))}
    </ul>
  </ViPage>
);

export default ViMaggie;
