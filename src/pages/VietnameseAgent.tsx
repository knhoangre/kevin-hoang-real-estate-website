import { Link } from 'react-router-dom';
import LandingPage, { type LandingCopy } from '@/components/LandingPage';
import type { QA } from '@/lib/schema';
import { SITE } from '@/lib/siteConfig';

/**
 * Landing page for the LANGUAGE axis — "Vietnamese-speaking real estate agent",
 * "môi giới nhà đất", and their variants.
 *
 * Framing rule, and it is load-bearing: Vietnamese is an ADDITIONAL service,
 * not a specialization. Every section that raises it also states that clients
 * of every background are served. Do not edit that framing away — a page that
 * reads as "only for Vietnamese clients" narrows the practice rather than
 * widening it.
 *
 * This page exists because the site's language toggle is client-side only: no
 * crawler has ever seen the Vietnamese content behind it. A prerendered page is
 * how that content becomes findable without duplicating every URL.
 */
const FAQS: QA[] = [
  {
    question: 'Can I do the whole home purchase in Vietnamese?',
    answer:
      'The conversations, yes — showings, strategy, negotiation, and the explanation of every document you are asked to sign. The contracts themselves are executed in English, because that is what is legally operative in Massachusetts. The point of working in Vietnamese is that you understand exactly what you are signing before you sign it, not that the paperwork changes.',
  },
  {
    question: 'Tôi có thể trao đổi bằng tiếng Việt không?',
    answer:
      'Có. Bạn có thể gọi, nhắn tin hoặc gặp trực tiếp bằng tiếng Việt, và mọi giấy tờ sẽ được giải thích bằng tiếng Việt trước khi bạn ký. Hợp đồng vẫn được lập bằng tiếng Anh theo quy định của tiểu bang Massachusetts.',
  },
  {
    question: 'I am buying my first home in the US. What is different here?',
    answer:
      'Three things surprise most first-time buyers who did not grow up in the US system: how central the pre-approval is — you generally cannot make a credible offer without one; how much weight the inspection carries as a negotiating point rather than a formality; and how much of the transaction runs through attorneys, which is standard practice in Massachusetts. None of it is difficult once someone walks you through it in a language you think in.',
  },
  {
    question: 'Do you only work with Vietnamese-speaking clients?',
    answer:
      'No. Kevin works with buyers and sellers of every background across Needham, MetroWest, and Greater Boston. Vietnamese is offered in addition to English because it removes a real barrier for the families it applies to — it is not a restriction on who the practice serves.',
  },
  {
    question: 'Can you help family members who are buying together?',
    answer:
      'Yes, and it is common. Multi-generational purchases raise real questions — how the property is titled, who is on the loan, whether a two-family or a home with an in-law setup fits better than a single-family. Those are worth working through before you start touring, not after you have found something.',
  },
];

/**
 * The Vietnamese rendering of this page.
 *
 * It is shown only after the language toggle is set to `vi`, which happens
 * after mount — the prerendered HTML and the first client render both stay in
 * English so hydration matches, and so the canonical stays the English document
 * that this URL is built to rank for. See LandingPage's LandingCopy comment.
 *
 * The framing rule above applies here too: every section that raises Vietnamese
 * also says clients of every background are served.
 */
const VI: LandingCopy = {
  eyebrow: 'Môi giới nói tiếng Việt',
  h1: 'Môi giới bất động sản nói tiếng Việt tại Greater Boston',
  lede:
    'Kevin Hoang làm việc với người mua và người bán nhà bằng tiếng Việt và tiếng Anh tại Needham, MetroWest và khu vực Greater Boston. Mọi giấy tờ đều được giải thích bằng ngôn ngữ bạn thoải mái nhất trước khi bạn ký.',
  // Phone comes from SITE like every other rendering of it — NAP has to be
  // identical character-for-character everywhere, including here.
  ctaPrimary: `Gọi ${SITE.phone}`,
  ctaSecondary: 'Đặt lịch tư vấn',
  textLabel: 'Nhắn tin',
  stripLabels: ['Công ty', 'Giấy phép', 'Thị trấn phục vụ', 'Ngôn ngữ'],
  ctaButton: 'Gửi tin nhắn',
  faqHeading: 'Câu hỏi thường gặp',
  cta: {
    heading: 'Nói chuyện với Kevin bằng tiếng Việt',
    body:
      'Gọi điện, nhắn tin, hoặc gửi email — bằng tiếng Việt hoặc tiếng Anh, tùy bạn. Không có gì bắt buộc, và cuộc trao đổi đầu tiên luôn miễn phí.',
  },
  faqs: [
    {
      question: 'Tôi có thể mua nhà hoàn toàn bằng tiếng Việt không?',
      answer:
        'Phần trao đổi thì có — đi xem nhà, bàn chiến lược, thương lượng, và giải thích từng giấy tờ bạn được yêu cầu ký. Bản thân hợp đồng vẫn được lập bằng tiếng Anh, vì đó là ngôn ngữ có giá trị pháp lý tại Massachusetts. Mục đích của việc làm việc bằng tiếng Việt là để bạn hiểu chính xác mình đang ký gì trước khi ký, chứ không phải để thay đổi giấy tờ.',
    },
    {
      question: 'Ngôn ngữ thật sự tạo ra khác biệt ở đâu?',
      answer:
        'Không phải lúc đi xem nhà. Nó quan trọng ở ba hoặc bốn thời điểm mà một sự hiểu lầm sẽ rất tốn kém và không thể quay lại: khi đặt giá mua (các điều kiện, thời hạn và tiền đặt cọc), khi đọc báo cáo kiểm định nhà, khi chọn khoản vay, và khi đọc các bản công bố thông tin bắt buộc.',
    },
    {
      question: 'Tôi mua căn nhà đầu tiên ở Mỹ. Có gì khác biệt?',
      answer:
        'Ba điều thường làm người mua lần đầu bất ngờ nếu không lớn lên trong hệ thống của Mỹ: thư chấp thuận vay trước (pre-approval) quan trọng đến mức gần như không thể ra giá nếu chưa có; báo cáo kiểm định nhà có sức nặng như một công cụ thương lượng chứ không chỉ là thủ tục; và phần lớn giao dịch đi qua luật sư, vốn là chuyện bình thường ở Massachusetts. Không điều nào khó, chỉ cần có người đi cùng bạn từ đầu.',
    },
    {
      question: 'Kevin có chỉ làm việc với khách nói tiếng Việt không?',
      answer:
        'Không. Kevin làm việc với người mua và người bán thuộc mọi cộng đồng tại Needham, MetroWest và Greater Boston. Tiếng Việt được cung cấp thêm bên cạnh tiếng Anh vì nó gỡ bỏ một rào cản có thật cho những gia đình cần đến — chứ không phải là giới hạn về đối tượng khách hàng.',
    },
    {
      question: 'Gia đình nhiều thế hệ mua chung nhà thì sao?',
      answer:
        'Được, và chuyện này khá phổ biến. Mua chung nhiều thế hệ đặt ra những câu hỏi thật sự: đứng tên nhà như thế nào, ai đứng tên khoản vay, và liệu nhà hai căn hộ hay nhà có phần in-law có phù hợp hơn nhà đơn lập không. Nên bàn những điều đó trước khi bắt đầu đi xem nhà, chứ không phải sau khi đã tìm được căn ưng ý.',
    },
  ],
  body: (
    <>
      <h2>Ngôn ngữ tạo ra khác biệt ở đâu?</h2>
      <p>
        Không phải lúc đi xem nhà. Nó quan trọng ở ba hoặc bốn thời điểm mà một sự hiểu lầm sẽ rất
        tốn kém và không thể sửa lại:
      </p>
      <ul>
        <li>
          <strong>Lúc ra giá.</strong> Các điều kiện kèm theo, thời hạn và tiền đặt cọc mới là thứ
          bạn thật sự đang cam kết. Bỏ đi một điều kiện để thắng cuộc đấu giá là quyết định bạn nên
          đưa ra khi đã hiểu rõ.
        </li>
        <li>
          <strong>Báo cáo kiểm định nhà.</strong> Bốn mươi trang liệt kê mọi khiếm khuyết của căn
          nhà, phần lớn là bình thường. Biết ba mục nào đáng để mở lại thương lượng mới là kỹ năng
          thật sự.
        </li>
        <li>
          <strong>Khoản vay.</strong> Lãi suất, điểm chiết khấu, tiền ký quỹ và bảo hiểm khoản vay
          tác động qua lại với nhau — tiền trả hàng tháng không phải là con số duy nhất cần nhìn.
        </li>
        <li>
          <strong>Bản công bố thông tin.</strong> Tại Massachusetts, công bố về sơn chì là bắt buộc
          với nhà xây trước năm 1978 — tức là một phần rất lớn nhà ở tại các thị trấn này.
        </li>
      </ul>
      <p>
        Trao đổi những điều đó bằng tiếng Việt không phải để cho tiện. Đó là để bạn hỏi được đúng
        câu hỏi tiếp theo mà bạn thật sự muốn hỏi.
      </p>

      <h2>Đồng hành cùng gia đình mua căn nhà đầu tiên ở Mỹ</h2>
      <p>
        Quy trình tại Massachusetts có vài điểm khác với điều nhiều người hình dung, nhất là ở vai
        trò của luật sư và sức nặng của khâu kiểm định nhà. Không có gì khó, nhưng mọi thứ trôi chảy
        hơn nhiều khi có người trình bày toàn bộ trình tự ngay từ đầu, thay vì chạy theo từng thời
        hạn một.
      </p>
      <p>
        <Link to="/first-time-buyers">Hướng dẫn cho người mua lần đầu</Link> trình bày trọn con
        đường, và <Link to="/calculator">các công cụ tính toán</Link> sẽ cho bạn thấy chi phí hàng
        tháng thực tế ứng với một mức giá. Khách hàng thuộc mọi cộng đồng đều được chào đón ở tất cả
        những nội dung này — trang này tồn tại để nói rằng lựa chọn tiếng Việt luôn sẵn có, chứ
        không phải để thu hẹp đối tượng phục vụ.
      </p>

      <h2>Những thị trấn nào được phục vụ?</h2>
      <p>
        Cùng các thị trấn như phần còn lại của công việc: Needham và các cộng đồng lân cận thuộc
        MetroWest và Greater Boston, mỗi nơi đều có{' '}
        <Link to="/neighborhoods">bài giới thiệu khu vực riêng</Link>. Nếu bạn chuyển đến từ tiểu
        bang khác, <Link to="/relocation">trang chuyển nhà</Link> nói về cách sắp xếp thời gian khi
        di chuyển giữa hai thị trường.
      </p>
      <p>
        Với người bán, <Link to="/home-valuation">bản định giá nhà bằng văn bản</Link> là nơi nên
        bắt đầu, và nội dung đó cũng có thể được trình bày bằng tiếng Việt.
      </p>
    </>
  ),
};

const VietnameseAgent = () => (
  <LandingPage
    path="/vietnamese-speaking-real-estate-agent"
    crumbs={[
      { name: 'Home', path: '/' },
      {
        name: 'Vietnamese-Speaking Agent',
        path: '/vietnamese-speaking-real-estate-agent',
      },
    ]}
    seo={{
      title: 'Vietnamese-Speaking Real Estate Agent in Greater Boston',
      description:
        'Buy or sell a home in Needham and Greater Boston with an agent who works in Vietnamese and English. Môi giới nhà đất nói tiếng Việt tại Boston. Call (860) 682-2251.',
      keywords:
        'Vietnamese speaking real estate agent Boston, Vietnamese realtor Massachusetts, môi giới nhà đất Boston, mua nhà Massachusetts, bilingual real estate agent Greater Boston',
    }}
    serviceMeta={{
      name: 'Real estate representation in Vietnamese and English',
      serviceType: 'Bilingual real estate agency services',
    }}
    h1="Vietnamese-Speaking Real Estate Agent in Greater Boston"
    lede="Kevin Hoang works with buyers and sellers in Vietnamese and in English across Needham, MetroWest, and Greater Boston. Every document is explained in the language you are most comfortable in before you sign anything."
    eyebrow="Tiếng Việt / Vietnamese"
    hero={{
      image:
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=70',
      alt: 'A classic New England home at dusk in Greater Boston',
    }}
    faqHeading="Câu hỏi thường gặp — common questions"
    faqs={FAQS}
    vi={VI}
    cta={{
      heading: 'Nói chuyện với Kevin bằng tiếng Việt',
      body: 'Gọi điện, nhắn tin, hoặc gửi tin nhắn — bằng tiếng Việt hoặc tiếng Anh, tùy bạn. Call or write in whichever language you prefer.',
    }}
  >
    <h2>Where does language actually make a difference?</h2>
    <p>
      Not in the house tours. It matters in the three or four moments where a misunderstanding is
      expensive and irreversible:
    </p>
    <ul>
      <li>
        <strong>The offer.</strong> Contingencies, deadlines, and deposit terms are what you are
        actually agreeing to. Waiving the wrong one to win a bid is a decision you should make
        knowingly.
      </li>
      <li>
        <strong>The inspection report.</strong> Forty pages describing everything imperfect about a
        house, most of it routine. Knowing which three items are worth reopening the negotiation
        over is the whole skill.
      </li>
      <li>
        <strong>The loan.</strong> Rate, points, escrow, and mortgage insurance all interact, and
        the monthly payment is not the only number that matters.
      </li>
      <li>
        <strong>Disclosures.</strong> In Massachusetts, lead paint disclosure is required for homes
        built before 1978 — which is a large share of the housing stock in these towns.
      </li>
    </ul>
    <p>
      Working through those in Vietnamese is not about convenience. It is about you being able to
      ask the follow-up question you would actually ask.
    </p>

    <h2>Working with families buying their first home in the US</h2>
    <p>
      The Massachusetts process has some genuine differences from what people expect, especially
      around the role of attorneys and the weight the inspection carries. There is nothing
      difficult about any of it, but it goes much better when someone walks you through the whole
      sequence at the start rather than one deadline at a time.
    </p>
    <p>
      The <Link to="/first-time-buyers">first-time buyer guide</Link> lays out the full path, and
      the <Link to="/calculator">calculators</Link> will show you the real monthly cost of a given
      price. Clients of every background are welcome on all of it — this page exists to say the
      Vietnamese option is there, not to narrow who the practice is for.
    </p>

    <h2>Which towns does this cover?</h2>
    <p>
      The same towns as the rest of the practice: Needham and the surrounding MetroWest and Greater
      Boston communities, each with its own{' '}
      <Link to="/neighborhoods">written area guide</Link>. If you are arriving from out of state,
      the <Link to="/relocation">relocation page</Link> covers timing a move between two markets.
    </p>
    <p>
      For sellers, a <Link to="/home-valuation">written home valuation</Link> is the place to
      start, and it can be walked through in Vietnamese as well.
    </p>
  </LandingPage>
);

export default VietnameseAgent;
