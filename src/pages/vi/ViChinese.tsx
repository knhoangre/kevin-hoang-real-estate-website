import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';
import { partnerAgent, partnerPerson } from '@/lib/schema';
import { CHINESE_PARTNER, partnerTelHref } from '@/lib/siteConfig';

/**
 * /vi/dich-vu-tieng-trung — Maggie Li's Chinese service, in Vietnamese. Pairs with
 * /chinese-speaking-real-estate-agent and /zh/zhongwen-fuwu. Added 2026-11-06,
 * when Kevin asked for every row of the menu to have all three languages.
 *
 * For a family in which some people would rather work in Vietnamese and some in
 * Chinese. The same rules as its English and Chinese partners: only what her own
 * site states (Mandarin and English, not Cantonese), her brokerage beside her name
 * (254 CMR 3.09), nothing about referral fees, and no explaining of how she and
 * Kevin are connected, which Maggie found strange on the Chinese pages.
 *
 * The shell's buttons are Kevin's, as on every /vi page: a reader here reads
 * Vietnamese. Maggie's own number and email are in the body.
 */
const ViChinese = () => (
  <ViPage
    path="/vi/dich-vu-tieng-trung"
    seo={{
      title: 'Mua Bán Nhà Bằng Tiếng Trung Ở Greater Boston: Maggie Li',
      description: `${CHINESE_PARTNER.name} của ${CHINESE_PARTNER.brokerage} làm việc với người mua và người bán nhà bằng tiếng Quan Thoại và tiếng Anh ở Newton và Greater Boston.`,
    }}
    eyebrow="Tiếng Trung"
    h1="Mua bán nhà bằng tiếng Trung, với Maggie Li"
    lede={`Kevin làm việc bằng tiếng Việt và tiếng Anh. Với những ai muốn làm việc bằng tiếng Trung, Kevin giới thiệu ${CHINESE_PARTNER.name} của ${CHINESE_PARTNER.brokerage}, người làm việc bằng tiếng Quan Thoại và tiếng Anh ở Newton và khu vực Greater Boston.`}
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Tiếng Trung', path: '/vi/dich-vu-tieng-trung' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=70',
      alt: 'Một căn nhà kiểu New England lúc chạng vạng ở vùng Greater Boston',
    }}
    faqHeading="Câu hỏi về dịch vụ tiếng Trung"
    faqs={[
      {
        question: 'Kevin có nói tiếng Trung không?',
        answer: `Không. Kevin làm việc bằng tiếng Việt và tiếng Anh. Ai muốn làm việc bằng tiếng Trung thì làm việc với ${CHINESE_PARTNER.name}; hai người ở hai công ty môi giới khác nhau, và nếu bạn làm việc với Maggie thì Maggie và công ty của cô ấy đại diện cho bạn.`,
      },
      {
        question: 'Gia đình có người nói tiếng Việt, có người nói tiếng Trung thì sao?',
        answer:
          'Một giao dịch có một người môi giới đại diện cho bạn. Nếu tiếng Việt quan trọng hơn với gia đình, hãy nói chuyện với Kevin; nếu tiếng Trung quan trọng hơn, hãy nói chuyện với Maggie.',
      },
      {
        question: 'Người mua ở nước ngoài có làm việc với Maggie được không?',
        answer:
          'Được. Mua nhà từ nước ngoài có thêm những bước về khoản vay, chuyển tiền, giấy tờ tùy thân và thời gian, và thường cần có người đi xem nhà và dự buổi kiểm định thay bạn. Maggie có thể dẫn xem nhà qua video và đại diện cho bạn suốt quá trình khi bạn không sang được.',
      },
    ]}
    cta={{
      heading: 'Muốn hỏi trước bằng tiếng Việt?',
      body: `Gọi hoặc nhắn tin cho Kevin bằng tiếng Việt. Muốn liên hệ thẳng với Maggie bằng tiếng Trung hoặc tiếng Anh: ${CHINESE_PARTNER.phone}, ${CHINESE_PARTNER.email}.`,
      button: 'Hỏi Kevin',
    }}
    enLabel="Chinese-speaking real estate agent"
    jsonLd={[partnerPerson(), partnerAgent()]}
  >
    <h2>Những phần nào làm được bằng tiếng Trung</h2>
    <ul>
      <li>
        <strong>Bằng tiếng Quan Thoại hoặc tiếng Anh, tùy bạn:</strong> tư vấn, đi xem nhà, chiến lược ra giá,
        thương lượng, và giải thích từng giấy tờ trước khi bạn ký.
      </li>
      <li>
        <strong>Bằng tiếng Anh:</strong> bản thân các văn bản pháp lý. Hợp đồng mua bán, các bản công bố và giấy tờ
        đóng giao dịch ở Massachusetts được ký bằng tiếng Anh, và người môi giới không thay đổi được điều đó.
      </li>
      <li>
        <strong>Khi cần chuyên gia khác:</strong> Maggie có thể giới thiệu bên cho vay, luật sư và cố vấn thuế, kể cả
        những người cũng làm việc bằng tiếng Quan Thoại.
      </li>
    </ul>

    <h2>Liên hệ Maggie</h2>
    <p>
      Điện thoại <a href={partnerTelHref}>{CHINESE_PARTNER.phone}</a>, email{' '}
      <a href={`mailto:${CHINESE_PARTNER.email}`}>{CHINESE_PARTNER.email}</a>, văn phòng ở{' '}
      {CHINESE_PARTNER.addressLine}. Mã WeChat của Maggie có trên{' '}
      <Link to="/zh/lianxi" lang="zh-Hans">
        trang liên hệ tiếng Trung
      </Link>
      . Thông tin về Maggie có ở trang <Link to="/vi/maggie-li">Gặp Maggie Li</Link>, và toàn bộ{' '}
      <Link to="/zh" lang="zh-Hans">
        trang web bằng tiếng Trung
      </Link>{' '}
      có Maggie là người liên hệ.
    </p>
  </ViPage>
);

export default ViChinese;
