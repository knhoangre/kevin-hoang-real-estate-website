import ViPage from '@/components/ViPage';
import {
  VI_SERVICES_FAQ,
  VI_SERVICES_LEDE,
  VI_SERVICES_LINKS_VI,
  viServicesBody,
} from '@/data/viServices';

/**
 * /vi/dich-vu-tieng-viet — the counterpart of
 * /vietnamese-speaking-real-estate-agent. Added 2026-09-27: it was the one row
 * of the paired menu with nothing on the Vietnamese side, and its content had
 * existed all along — as the language-toggle copy of the English page, which is
 * swapped in after mount and so had never been seen by a crawler.
 *
 * The copy is shared with that toggle through src/data/viServices.tsx; only the
 * links differ, pointing here at the /vi pages rather than the English ones.
 *
 * ITS OWN h1 AND TITLE, NOT THE TOGGLE'S. The toggle copy's h1 is "Môi giới bất
 * động sản nói tiếng Việt tại Greater Boston" — the /vi homepage's h1, word for
 * word — and under the topical-distinctness rule two prerendered pages may not
 * share a heading, or they compete for the same query and neither ranks. /vi
 * answers "who is the Vietnamese-speaking agent"; this page answers "what does
 * working in Vietnamese actually cover". The FAQ likewise leaves out the two
 * questions /vi and /vi/cau-hoi-thuong-gap already answer.
 */
const ViServices = () => (
  <ViPage
    path="/vi/dich-vu-tieng-viet"
    seo={{
      title: 'Mua Bán Nhà Bằng Tiếng Việt: Những Gì Được Hỗ Trợ',
      description:
        'Làm việc bằng tiếng Việt khi mua hoặc bán nhà ở Massachusetts: giấy tờ nào được giải thích, lúc nào ngôn ngữ quan trọng nhất, và cách đi cùng gia đình mua căn nhà đầu tiên ở Mỹ.',
    }}
    eyebrow="Dịch vụ tiếng Việt"
    h1="Làm việc bằng tiếng Việt, từ lần xem nhà đầu tiên đến ngày ký giấy"
    lede={VI_SERVICES_LEDE}
    crumbs={[
      { name: 'Trang chủ', path: '/' },
      { name: 'Tiếng Việt', path: '/vi' },
      { name: 'Dịch vụ tiếng Việt', path: '/vi/dich-vu-tieng-viet' },
    ]}
    hero={{
      image:
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=70',
      alt: 'Một căn nhà kiểu New England lúc chạng vạng ở vùng Greater Boston',
    }}
    faqHeading="Câu hỏi về dịch vụ tiếng Việt"
    faqs={[
      VI_SERVICES_FAQ.wholePurchase,
      VI_SERVICES_FAQ.documents,
      VI_SERVICES_FAQ.firstHome,
      VI_SERVICES_FAQ.multiGeneration,
    ]}
    cta={{
      heading: 'Nói chuyện với Kevin bằng tiếng Việt',
      body: 'Gọi điện, nhắn tin, hoặc gửi email — bằng tiếng Việt hoặc tiếng Anh, tùy bạn. Không có gì bắt buộc, và cuộc trao đổi đầu tiên luôn miễn phí.',
      button: 'Liên hệ Kevin',
    }}
    enLabel="Vietnamese-speaking real estate agent"
  >
    {viServicesBody(VI_SERVICES_LINKS_VI)}
  </ViPage>
);

export default ViServices;
