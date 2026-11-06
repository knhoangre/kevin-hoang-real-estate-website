import { Link } from 'react-router-dom';
import ViPage from '@/components/ViPage';
import MarketGlance, { type GlanceWords } from '@/components/market/MarketGlance';
import { LINK } from '@/components/market/MarketParts';
import { EDGE_RULE, type Headline } from '@/lib/market';
import { pct, ratioPct } from '@/lib/marketText';
import { SITE } from '@/lib/siteConfig';
import summaryJson from '@/data/market/summary.json';

const summary = summaryJson as Headline[];

/**
 * /vi/thi-truong — the counterpart of /market, added 2026-11-06 so the "Market
 * Reports" row of the menu has a Vietnamese partner.
 *
 * THE REPORTS ARE NOT TRANSLATED: /vi/bai-viet's arrangement. This page carries
 * the same table as /market, from the same summary.json through the same
 * component, with Vietnamese headings, and links each town to its English report.
 * The sentences in a report are generated in English (marketText.ts); a second
 * generator in Vietnamese is a separate piece of work, and nobody has asked for it.
 */
const WORDS: GlanceWords = {
  head: [
    'Thị trấn',
    'Giá trung vị, 12 tháng',
    'Giá bán so với giá rao',
    'Bán cao hơn giá rao',
    'Đang rao bán',
    'Số tháng tồn kho',
    'Ai có lợi thế',
  ],
  // The homepage's Vietnamese words for the same verdicts (vi.json homeMarket.edge).
  edge: {
    sellers: 'Người bán có lợi thế',
    buyers: 'Người mua có thể thương lượng',
    balanced: 'Gần cân bằng',
  },
  caption: 'Thị trường theo từng thị trấn',
};

const monthVi = (m: string) => `tháng ${Number(m.slice(5, 7))} năm ${m.slice(0, 4)}`;
const dateVi = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `ngày ${d} tháng ${m} năm ${y}`;
};

const RULE = `Thị trường được xếp là của người bán khi từ ${pct(EDGE_RULE.sellersOver)} số nhà trở lên bán cao hơn giá rao cuối cùng, hoặc giá bán trung vị cao hơn ${ratioPct(EDGE_RULE.sellersRatio)} giá rao; là của người mua khi giá bán trung vị bằng hoặc thấp hơn ${ratioPct(EDGE_RULE.buyersRatio)} giá rao và dưới ${pct(EDGE_RULE.buyersOver)} số nhà bán cao hơn giá rao. Ở giữa hai mức đó là gần cân bằng.`;

const ViMarket = () => {
  const latest = summary.reduce((m, h) => (h.month > m ? h.month : m), '');
  const asOf = summary.reduce((m, h) => (h.asOf > m ? h.asOf : m), '');
  const town = (h: Headline) => (
    <Link key={h.slug} to={`/market/${h.slug}`} lang="en" className={LINK}>
      {h.town}
    </Link>
  );

  return (
    <ViPage
      path="/vi/thi-truong"
      seo={{
        title: 'Báo Cáo Thị Trường Nhà Đất Greater Boston Theo Thị Trấn',
        description: `Giá nhà, giá bán so với giá rao và lượng nhà đang rao bán ở ${summary.length} thị trấn quanh Newton, tính từ dữ liệu MLS và cập nhật vào ngày 3 mỗi tháng.`,
      }}
      eyebrow="Báo cáo thị trường"
      h1="Thị trường nhà đất Greater Boston, từng thị trấn một"
      lede={`Nhà bán được bao nhiêu, so với giá rao ra sao, và còn bao nhiêu căn đang rao bán ở ${summary.length} thị trấn, tính từ dữ liệu MLS. Cập nhật vào ngày 3 mỗi tháng${
        latest ? `; số liệu mới nhất là của ${monthVi(latest)}` : ''
      }. Báo cáo chi tiết của từng thị trấn bằng tiếng Anh.`}
      crumbs={[
        { name: 'Trang chủ', path: '/' },
        { name: 'Tiếng Việt', path: '/vi' },
        { name: 'Báo cáo thị trường', path: '/vi/thi-truong' },
      ]}
      hero={{
        image:
          // /vi/khu-vuc's hero, so an image already known to resolve at these params.
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=70',
        alt: 'Khu dân cư ngoại ô vùng Greater Boston',
      }}
      width="wide"
      faqHeading="Câu hỏi về các báo cáo thị trường"
      faqs={[
        {
          question: 'Số liệu này lấy từ đâu?',
          answer:
            'Từ dữ liệu của MLS Property Information Network (MLS PIN): các giao dịch đã đóng, nhà đang chờ đóng giao dịch, nhà đang rao bán và hợp đồng thuê đã ký. Kevin tính lại các con số vào ngày 3 mỗi tháng, theo từng tháng trọn vẹn, và tách riêng nhà đơn lập, condo và nhà nhiều căn.',
        },
        {
          question: '"Giá bán so với giá rao" nghĩa là gì?',
          answer:
            'Giá bán chia cho giá rao cuối cùng của căn nhà. 100% là bán đúng giá rao, trên 100% là bán cao hơn. Dữ liệu chỉ có giá rao cuối cùng, tức là giá sau những lần giảm giá, nên một căn đã giảm giá rồi bán đúng giá đó vẫn được tính là 100%.',
        },
        {
          question: '"Số tháng tồn kho" nghĩa là gì?',
          answer:
            'Số nhà đang rao bán chia cho số nhà bán được mỗi tháng, tính trung bình trên mười hai tháng. Con số càng thấp thì nhà được mua càng nhanh so với lượng nhà mới rao.',
        },
        {
          question: 'Có báo cáo bằng tiếng Việt không?',
          answer:
            'Bảng trên trang này có đủ các con số chính bằng tiếng Việt. Báo cáo chi tiết của từng thị trấn, gồm giá theo từng khoảng và giá thuê nhà, hiện bằng tiếng Anh. Nếu cần hiểu kỹ một báo cáo, Kevin có thể giải thích bằng tiếng Việt.',
        },
      ]}
      cta={{
        heading: 'Muốn biết căn nhà của bạn đáng giá bao nhiêu?',
        body: 'Giá trung vị của cả thị trấn chỉ là điểm bắt đầu. Với một căn nhà cụ thể, điều quan trọng là những căn tương tự vừa bán gần đó, và đó là cơ sở của một bản định giá bằng văn bản.',
        button: 'Hỏi Kevin',
      }}
      enLabel="Greater Boston housing market reports"
      sections={
        <section aria-labelledby="bang-thi-truong" className="space-y-8">
          <h2 id="bang-thi-truong" className="text-2xl font-semibold text-ink md:text-3xl">
            {summary.length} thị trấn, đặt cạnh nhau
          </h2>
          <p className="max-w-3xl leading-relaxed text-gray-700">
            Giá bán so với giá rao và tỷ lệ nhà bán cao hơn giá rao được tính trên ba tháng gần nhất nếu có ít
            nhất mười giao dịch, nếu không thì trên sáu hoặc mười hai tháng. Số nhà đang rao bán tính đến{' '}
            {dateVi(asOf)}. Bấm vào tên thị trấn để xem báo cáo đầy đủ (bằng tiếng Anh).
          </p>
          <MarketGlance type="SF" heading="Nhà đơn lập" words={WORDS} town={town} />
          <MarketGlance type="CC" heading="Condo" words={WORDS} town={town} />
          <p className="max-w-3xl text-xs leading-relaxed text-gray-500">{RULE}</p>
          <p className="max-w-3xl leading-relaxed text-gray-700">
            Các báo cáo mô tả thị trấn, không phải từng căn nhà. Muốn biết một căn cụ thể bán được bao nhiêu, hãy
            xem trang{' '}
            <Link to="/vi/dinh-gia-nha" className={LINK}>
              định giá nhà
            </Link>
            .
          </p>
          <p className="max-w-3xl text-xs leading-relaxed text-gray-500">
            Dựa trên thông tin từ MLS Property Information Network, Inc. (MLS PIN). Các số liệu do{' '}
            {SITE.agentName}, {SITE.brokerage} tính toán, không phải MLS PIN, và được tin là chính xác nhưng
            không được bảo đảm.
          </p>
        </section>
      }
    />
  );
};

export default ViMarket;
