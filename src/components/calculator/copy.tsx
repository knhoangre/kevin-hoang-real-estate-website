/**
 * Every word the calculator shows, in English and in Vietnamese.
 *
 * LITERAL STRINGS, NEVER t(). i18n is pinned to `lng: 'en'` during static
 * generation, so a calculator assembled through useTranslation() prerenders in
 * English on /vi/cong-cu-tinh-toan — which is exactly why that page used to
 * link out to the English tool instead of embedding one. The caller chooses the
 * language: the /vi page fixes it at 'vi', /calculator follows the toggle after
 * mount, and a listing page stays English like the rest of that page.
 *
 * One interface, two objects: a string added to the English and forgotten in
 * the Vietnamese is a type error, not a blank label in front of a reader.
 *
 * Numbers are formatted by the caller with formatPrice (US dollars, US
 * separators) in both languages. These are US prices in a US market, and that
 * is the form they appear in on every listing and every document the reader
 * will be handed.
 */
import type { ReactNode } from 'react';

export type CalcLang = 'en' | 'vi';
export type CalcView = 'live' | 'invest' | 'sell';
export type CalcContext = 'listing' | 'general';

export interface CalculatorCopy {
  tablist: string;
  tabs: Record<CalcContext, Record<CalcView, string>>;

  intro: {
    listing: (has: { taxes: boolean; hoa: boolean }) => string;
    general: string;
  };

  // ---- Inputs ----------------------------------------------------------------
  purchasePrice: string;
  salePrice: string;
  priceHint: {
    asking: string;
    changed: (listed: string) => string;
    example: string;
    sellListing: string;
    sellExample: string;
  };
  downPayment: string;
  downAs: string;
  downOf: (amount: string, price: string) => string;
  percentOf: (percent: number, price: string) => string;
  rate: string;
  rateHint: (asOf: string) => ReactNode;
  term: string;
  years: (n: number) => string;
  pmi: string;
  pmiHint: (thresholdPercent: number) => string;
  taxes: string;
  taxesHint: {
    listingYear: (year: number) => string;
    listing: string;
    missing: string;
    example: string;
  };
  insuranceCondo: string;
  insuranceHome: string;
  insuranceCondoHint: (average: string) => string;
  insuranceHomeHint: (ratePercent: string) => string;
  hoa: string;
  hoaHint: { listing: string; listingNoAmount: string; example: string };
  rent: string;
  rentHint: {
    median: (count: number, town: string) => string;
    none: string;
    example: string;
  };
  vacancy: string;
  vacancyHint: string;
  maintenance: string;
  maintenanceHint: string;
  management: string;
  managementHint: string;
  payoff: string;
  payoffHint: string;
  commission: string;
  commissionHint: string;
  otherCosts: string;
  otherCostsHint: string;
  credits: string;
  creditsHint: string;

  // ---- Results: living there ---------------------------------------------------
  monthlyCost: string;
  perMonth: string;
  perMo: string;
  segments: {
    principalAndInterest: string;
    taxes: string;
    insurance: string;
    hoa: string;
    pmi: string;
  };
  taxesRow: (year: number | null) => string;
  pmiRow: string;
  overTerm: (years: number) => string;
  loanAmount: string;
  interestPaid: string;
  totalRepaid: string;
  overTermNote: (years: number) => string;
  ifYouPutDown: string;
  scenarioNote: (pmiRate: number) => string;

  // ---- Results: renting it out -------------------------------------------------
  cashFlow: string;
  perYear: (amount: string, outOfPocket: boolean) => string;
  capRate: string;
  capRateNote: string;
  cashOnCash: string;
  cashOnCashNote: (down: string) => string;
  effectiveRent: string;
  operatingExpenses: string;
  noi: string;
  mortgagePi: string;
  rentNote: { listing: (town: string) => string; general: string };

  // ---- Results: selling --------------------------------------------------------
  netProceeds: string;
  underwater: string;
  sellSegments: {
    net: string;
    mortgagePayoff: string;
    commission: string;
    deedExcise: string;
    otherAndCredits: string;
  };
  saleRow: string;
  commissionRow: (rate: number) => string;
  deedRow: string;
  otherRow: string;
  creditsRow: string;
  beforePayoffRow: string;
  payoffRow: string;
  netRow: string;
  deedNote: string;
  sellNotModelled: string;

  // ---- Disclaimers -------------------------------------------------------------
  disclaimerBuy: string;
  disclaimerSell: string;
}

/** "a", "a and b", "a, b and c" — skipping the parts a listing does not have. */
const joinList = (parts: (string | false)[], and: string) => {
  const items = parts.filter((p): p is string => Boolean(p));
  return items.length <= 1
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
};

const en: CalculatorCopy = {
  tablist: 'What to calculate',
  tabs: {
    listing: { live: 'If you live here', invest: 'If you rent it out', sell: 'If you sell at this price' },
    general: { live: 'Buying to live in', invest: 'Buying to rent out', sell: 'Selling' },
  },

  intro: {
    listing: ({ taxes, hoa }) =>
      `Started from this listing's ${joinList(['price', taxes && 'tax bill', hoa && 'association fee'], 'and')}. Everything below is editable — change it to your own numbers.`,
    general:
      'The figures it opens with are examples. Everything is editable — change them to the home and the numbers you are actually weighing.',
  },

  purchasePrice: 'Purchase price',
  salePrice: 'Sale price',
  priceHint: {
    asking: 'The asking price. Change it to model an offer.',
    changed: (listed) => `Listed at ${listed}.`,
    example: 'An example price — enter the one you are considering.',
    sellListing: 'The asking price here. Change it to model what a sale would actually bring.',
    sellExample: 'What you expect the house to sell for. A written valuation is where that number should come from.',
  },
  downPayment: 'Down payment',
  downAs: 'Enter down payment as',
  downOf: (amount, price) => `${amount} of ${price}`,
  percentOf: (percent, price) => `${percent}% of ${price}`,
  rate: 'Interest rate',
  rateHint: (asOf) => (
    <>
      An assumption, not a quote — change it to the rate you have been offered. Default checked
      against Freddie Mac's survey on {asOf}.
    </>
  ),
  term: 'Term',
  years: (n) => `${n} years`,
  pmi: 'Mortgage insurance, yearly',
  pmiHint: (threshold) =>
    `Charged while the loan is over ${threshold}% of the price. Conventional PMI runs about 0.46%–1.5% a year depending on credit (Urban Institute Housing Finance Policy Center); 0.5% is the strong-credit end.`,
  taxes: 'Property taxes, yearly',
  taxesHint: {
    listingYear: (year) => `From the listing, ${year}.`,
    listing: 'From the listing.',
    missing: 'The feed carries no tax figure for this listing.',
    example:
      'An example figure. Every Massachusetts town sets its own rate, so use the real bill for the home you are considering — it is on the listing or the town assessor’s site.',
  },
  insuranceCondo: 'Condo insurance, yearly',
  insuranceHome: 'Home insurance, yearly',
  insuranceCondoHint: (average) =>
    `The Massachusetts HO-6 average (${average}). The association's master policy covers the structure, so this covers your interior only.`,
  insuranceHomeHint: (rate) =>
    `Estimated at ${rate}% of price a year, from the Massachusetts average of $1,471 for $300,000 of dwelling coverage (Insure.com / Quadrant, 2026). Coverage is rebuild cost and excludes land, so this runs high where land is expensive — get a real quote.`,
  hoa: 'HOA fee, monthly',
  hoaHint: {
    listing: 'From the listing. Correct it if your fee is billed yearly.',
    listingNoAmount: 'This listing reports an association but no fee amount.',
    example: 'A condominium or association fee, if the home has one. Leave it at 0 if not.',
  },
  rent: 'Expected rent, monthly',
  rentHint: {
    median: (count, town) =>
      `Median asking rent for ${count} comparable rentals in ${town} right now. Asking, not achieved — and not a projection for this unit.`,
    none: 'No comparable rentals in the feed for this town — enter your own figure.',
    example: 'An example — enter the rent you expect this home to achieve.',
  },
  vacancy: 'Vacancy',
  vacancyHint: 'Share of the year the unit sits empty between tenants.',
  maintenance: 'Maintenance reserve, yearly',
  maintenanceHint: 'Seeded at 1% of price — the conventional planning figure, not a bill.',
  management: 'Property management',
  managementHint: 'Of rent collected. Set it to 0 if you manage it yourself.',
  payoff: 'Mortgage payoff',
  payoffHint:
    'Everything still owed on the house — every mortgage and home-equity line. Your lender’s payoff letter has the exact figure; your latest statement is close.',
  commission: 'Total commission',
  commissionHint:
    'An assumption to replace. Commission is negotiated and set in your listing agreement, including whether any of it goes to the buyer’s agent.',
  otherCosts: 'Other closing costs',
  otherCostsHint:
    'A starting figure to replace. It covers your attorney’s fee, the smoke and carbon-monoxide certificate, recording the mortgage discharge, and any condo certificate — your attorney can give you the real numbers.',
  credits: 'Repairs or credits to the buyer',
  creditsHint: 'What you agree to fix or credit after the inspection. Usually 0 until there is an offer.',

  monthlyCost: 'Estimated monthly cost',
  perMonth: ' /month',
  perMo: '/mo',
  segments: {
    principalAndInterest: 'Principal & interest',
    taxes: 'Taxes',
    insurance: 'Insurance',
    hoa: 'HOA',
    pmi: 'Mortgage insurance',
  },
  taxesRow: (year) => (year ? `Taxes (${year})` : 'Taxes'),
  pmiRow: 'Mortgage insurance (PMI)',
  overTerm: (years) => `Over the full ${years} years`,
  loanAmount: 'Loan amount',
  interestPaid: 'Interest paid',
  totalRepaid: 'Total repaid',
  overTermNote: (years) =>
    `The mortgage only. Taxes, insurance and any association fee are not projected across ${years} years — they change, and forecasting today's figures that far out would be a guess dressed as arithmetic.`,
  ifYouPutDown: 'If you put down',
  scenarioNote: (pmiRate) =>
    `The 5% and 10% options include mortgage insurance at ${pmiRate}% a year, which is what makes them closer to the 20% figure than the loan size alone would suggest.`,

  cashFlow: 'Estimated monthly cash flow',
  perYear: (amount, outOfPocket) => `${amount} a year${outOfPocket ? ' out of pocket' : ''}.`,
  capRate: 'Cap rate',
  capRateNote:
    'Net operating income over price. Excludes the mortgage on purpose — it describes the building, not your financing, so it compares across deals.',
  cashOnCash: 'Cash-on-cash',
  cashOnCashNote: (down) =>
    `Annual cash flow over the ${down} down. Closing costs are not counted as cash in, so a real deal returns slightly less.`,
  effectiveRent: 'Effective rent (after vacancy)',
  operatingExpenses: 'Operating expenses',
  noi: 'Net operating income',
  mortgagePi: 'Mortgage (P&I)',
  rentNote: {
    listing: (town) =>
      `Rent is the median asking rent for comparable units in ${town}, not a projection for this one, and not what it has achieved. Nothing here models appreciation, depreciation, tax treatment, capital expenditure or the cost of turning a unit over — a real underwrite includes all of them.`,
    general:
      'Nothing here models appreciation, depreciation, tax treatment, capital expenditure or the cost of turning a unit over — a real underwrite includes all of them.',
  },

  netProceeds: 'Estimated amount you walk away with',
  underwater:
    'The sale does not cover what is owed. Talk to your lender and an attorney before listing — a short sale needs the lender’s approval.',
  sellSegments: {
    net: 'You keep',
    mortgagePayoff: 'Mortgage payoff',
    commission: 'Commission',
    deedExcise: 'Deed tax',
    otherAndCredits: 'Closing costs & credits',
  },
  saleRow: 'Sale price',
  commissionRow: (rate) => `Commission (${rate}%)`,
  deedRow: 'Massachusetts deed tax',
  otherRow: 'Other closing costs',
  creditsRow: 'Repairs & credits',
  beforePayoffRow: 'Before the mortgage payoff',
  payoffRow: 'Mortgage payoff',
  netRow: 'You walk away with',
  deedNote:
    'The deed tax is $2.28 per $500 of the price (M.G.L. c.64D §1 with its 14% surtax; Department of Revenue Directive 95-4, checked 2026), paid by the seller. Barnstable County on Cape Cod has its own rate — take that figure from your attorney.',
  sellNotModelled:
    'Not included: the property tax and water bill adjusted to the closing date, capital gains tax, and any prepayment penalty. Your attorney’s settlement statement has all of them.',

  disclaimerBuy:
    'An estimate, not a loan offer, a pre-approval or investment advice. It excludes escrow and closing costs, and your actual rate depends on a lender’s review of your finances.',
  disclaimerSell:
    'An estimate, not a settlement statement. The closing attorney prepares the real one, and it is the only figure anyone should plan a next purchase on.',
};

const vi: CalculatorCopy = {
  tablist: 'Chọn phép tính',
  tabs: {
    listing: { live: 'Nếu bạn ở nhà này', invest: 'Nếu cho thuê', sell: 'Nếu bán với giá này' },
    general: { live: 'Mua để ở', invest: 'Mua để cho thuê', sell: 'Bán nhà' },
  },

  intro: {
    listing: ({ taxes, hoa }) =>
      `Bắt đầu từ ${joinList(['giá niêm yết', taxes && 'tiền thuế', hoa && 'phí hội quản lý'], 'và')} của căn nhà này. Mọi con số bên dưới đều sửa được — hãy thay bằng con số của bạn.`,
    general:
      'Các con số ban đầu chỉ là ví dụ. Mọi ô đều sửa được — hãy thay bằng căn nhà và con số bạn đang thật sự cân nhắc.',
  },

  purchasePrice: 'Giá mua',
  salePrice: 'Giá bán',
  priceHint: {
    asking: 'Giá niêm yết. Đổi con số này để thử một mức giá ra offer.',
    changed: (listed) => `Giá niêm yết là ${listed}.`,
    example: 'Một mức giá ví dụ — hãy nhập giá căn nhà bạn đang xem.',
    sellListing: 'Giá niêm yết của căn này. Đổi con số để thử mức giá bán thực tế.',
    sellExample: 'Mức giá bạn nghĩ căn nhà sẽ bán được. Con số này nên đến từ một bản định giá bằng văn bản.',
  },
  downPayment: 'Tiền trả trước',
  downAs: 'Nhập tiền trả trước theo',
  downOf: (amount, price) => `${amount} trên ${price}`,
  percentOf: (percent, price) => `${percent}% của ${price}`,
  rate: 'Lãi suất',
  rateHint: (asOf) => (
    <>
      Đây là giả định, không phải lãi suất được chào — hãy đổi sang lãi suất ngân hàng báo cho bạn.
      Mức mặc định được đối chiếu với khảo sát của Freddie Mac ngày {asOf}.
    </>
  ),
  term: 'Thời hạn vay',
  years: (n) => `${n} năm`,
  pmi: 'Bảo hiểm khoản vay (PMI), mỗi năm',
  pmiHint: (threshold) =>
    `Phải trả khi khoản vay lớn hơn ${threshold}% giá nhà. PMI thông thường vào khoảng 0,46%–1,5% mỗi năm tùy điểm tín dụng (Urban Institute Housing Finance Policy Center); 0,5% là mức dành cho tín dụng tốt.`,
  taxes: 'Thuế bất động sản, mỗi năm',
  taxesHint: {
    listingYear: (year) => `Lấy từ tin niêm yết, năm ${year}.`,
    listing: 'Lấy từ tin niêm yết.',
    missing: 'Tin niêm yết này không có số thuế.',
    example:
      'Con số ví dụ. Mỗi thị trấn ở Massachusetts tự đặt thuế suất, nên hãy dùng hóa đơn thuế thật của căn nhà — có trong tin niêm yết hoặc trên trang của văn phòng định giá thị trấn (assessor).',
  },
  insuranceCondo: 'Bảo hiểm căn hộ condo, mỗi năm',
  insuranceHome: 'Bảo hiểm nhà, mỗi năm',
  insuranceCondoHint: (average) =>
    `Mức trung bình HO-6 ở Massachusetts (${average}). Bảo hiểm chung của hội quản lý đã bảo vệ phần kết cấu tòa nhà, nên khoản này chỉ cho phần bên trong căn hộ của bạn.`,
  insuranceHomeHint: (rate) =>
    `Ước tính bằng ${rate}% giá nhà mỗi năm, từ mức trung bình ở Massachusetts là $1,471 cho $300,000 bảo hiểm nhà (Insure.com / Quadrant, 2026). Bảo hiểm tính theo chi phí xây lại, không tính đất, nên con số này thường cao ở nơi đất đắt — hãy xin báo giá thật.`,
  hoa: 'Phí HOA, mỗi tháng',
  hoaHint: {
    listing: 'Lấy từ tin niêm yết. Hãy sửa lại nếu phí của bạn tính theo năm.',
    listingNoAmount: 'Tin niêm yết có hội quản lý nhưng không ghi số tiền phí.',
    example: 'Phí condo hoặc phí hội quản lý, nếu có. Để 0 nếu không có.',
  },
  rent: 'Tiền thuê dự kiến, mỗi tháng',
  rentHint: {
    median: (count, town) =>
      `Giá thuê chào trung vị của ${count} căn tương tự đang cho thuê ở ${town}. Đây là giá chào, không phải giá thuê thực tế — và không phải dự báo cho căn này.`,
    none: 'Không có căn cho thuê tương tự trong dữ liệu của thị trấn này — hãy nhập con số của bạn.',
    example: 'Con số ví dụ — hãy nhập tiền thuê bạn nghĩ căn nhà sẽ cho thuê được.',
  },
  vacancy: 'Thời gian nhà trống',
  vacancyHint: 'Phần trong năm căn nhà bỏ trống giữa hai người thuê.',
  maintenance: 'Quỹ bảo trì, mỗi năm',
  maintenanceHint: 'Mặc định 1% giá nhà — con số dự trù thông dụng, không phải hóa đơn.',
  management: 'Phí quản lý nhà',
  managementHint: 'Tính trên tiền thuê thu được. Để 0 nếu bạn tự quản lý.',
  payoff: 'Số nợ vay còn lại',
  payoffHint:
    'Toàn bộ số tiền còn nợ trên căn nhà — mọi khoản vay mua nhà và vay thế chấp (home equity). Thư báo số nợ (payoff letter) của ngân hàng có con số chính xác; bảng sao kê gần nhất cho con số gần đúng.',
  commission: 'Tổng hoa hồng môi giới',
  commissionHint:
    'Đây là giả định, hãy thay bằng con số của bạn. Hoa hồng được thương lượng và ghi trong hợp đồng niêm yết, kể cả việc có chia cho môi giới bên mua hay không.',
  otherCosts: 'Chi phí đóng giao dịch khác',
  otherCostsHint:
    'Con số khởi đầu, hãy thay bằng con số thật. Gồm phí luật sư của bạn, giấy chứng nhận báo khói và khí CO, phí đăng bộ giải chấp khoản vay, và giấy chứng nhận condo nếu có — luật sư có thể cho bạn con số chính xác.',
  credits: 'Sửa chữa hoặc tiền giảm cho người mua',
  creditsHint: 'Những gì bạn đồng ý sửa hoặc giảm tiền sau khi kiểm định nhà. Thường là 0 cho đến khi có offer.',

  monthlyCost: 'Chi phí ước tính mỗi tháng',
  perMonth: ' /tháng',
  perMo: '/tháng',
  segments: {
    principalAndInterest: 'Gốc và lãi',
    taxes: 'Thuế',
    insurance: 'Bảo hiểm',
    hoa: 'Phí HOA',
    pmi: 'Bảo hiểm khoản vay',
  },
  taxesRow: (year) => (year ? `Thuế (${year})` : 'Thuế'),
  pmiRow: 'Bảo hiểm khoản vay (PMI)',
  overTerm: (years) => `Trong suốt ${years} năm`,
  loanAmount: 'Số tiền vay',
  interestPaid: 'Tổng tiền lãi',
  totalRepaid: 'Tổng số tiền trả',
  overTermNote: (years) =>
    `Chỉ tính khoản vay. Thuế, bảo hiểm và phí hội quản lý không được tính cho ${years} năm — các khoản này thay đổi theo thời gian, và kéo con số hôm nay ra xa như vậy chỉ là đoán.`,
  ifYouPutDown: 'Nếu bạn trả trước',
  scenarioNote: (pmiRate) =>
    `Hai lựa chọn 5% và 10% đã gồm bảo hiểm khoản vay ${pmiRate}% mỗi năm, nên khoản trả hàng tháng gần với mức 20% hơn so với những gì số tiền vay gợi ý.`,

  cashFlow: 'Dòng tiền ước tính mỗi tháng',
  perYear: (amount, outOfPocket) => `${amount} mỗi năm${outOfPocket ? ' phải bỏ thêm tiền túi' : ''}.`,
  capRate: 'Cap rate (tỷ suất vốn hóa)',
  capRateNote:
    'Thu nhập hoạt động ròng chia cho giá nhà. Cố ý không tính khoản vay — chỉ số này mô tả căn nhà chứ không phải cách bạn vay, nên so sánh được giữa các căn.',
  cashOnCash: 'Lợi nhuận trên tiền mặt (cash-on-cash)',
  cashOnCashNote: (down) =>
    `Dòng tiền mỗi năm chia cho ${down} tiền trả trước. Chưa tính chi phí đóng giao dịch vào tiền bỏ ra, nên lợi nhuận thực tế sẽ thấp hơn một chút.`,
  effectiveRent: 'Tiền thuê thực thu (sau thời gian trống)',
  operatingExpenses: 'Chi phí vận hành',
  noi: 'Thu nhập hoạt động ròng (NOI)',
  mortgagePi: 'Khoản vay (gốc và lãi)',
  rentNote: {
    listing: (town) =>
      `Tiền thuê là giá chào trung vị của các căn tương tự ở ${town}, không phải dự báo cho căn này và không phải giá đã cho thuê được. Ở đây không tính tăng giá nhà, khấu hao, thuế thu nhập, chi phí sửa chữa lớn hay chi phí đổi người thuê — một phân tích đầu tư thật sự phải tính tất cả.`,
    general:
      'Ở đây không tính tăng giá nhà, khấu hao, thuế thu nhập, chi phí sửa chữa lớn hay chi phí đổi người thuê — một phân tích đầu tư thật sự phải tính tất cả.',
  },

  netProceeds: 'Số tiền ước tính bạn nhận về',
  underwater:
    'Giá bán không đủ trả số nợ. Hãy nói chuyện với ngân hàng và luật sư trước khi niêm yết — bán nhà thiếu nợ (short sale) cần ngân hàng chấp thuận.',
  sellSegments: {
    net: 'Bạn nhận về',
    mortgagePayoff: 'Trả nợ vay',
    commission: 'Hoa hồng',
    deedExcise: 'Thuế chuyển nhượng',
    otherAndCredits: 'Chi phí đóng và tiền giảm',
  },
  saleRow: 'Giá bán',
  commissionRow: (rate) => `Hoa hồng (${rate}%)`,
  deedRow: 'Thuế chuyển nhượng Massachusetts',
  otherRow: 'Chi phí đóng giao dịch khác',
  creditsRow: 'Sửa chữa và tiền giảm',
  beforePayoffRow: 'Trước khi trả nợ vay',
  payoffRow: 'Trả nợ vay',
  netRow: 'Bạn nhận về',
  deedNote:
    'Thuế chuyển nhượng (deed excise) là $2.28 cho mỗi $500 giá bán (M.G.L. c.64D §1 cộng phụ thu 14%; Chỉ thị 95-4 của Sở Thuế, kiểm tra năm 2026), do người bán trả. Quận Barnstable ở Cape Cod có mức riêng — hãy hỏi luật sư con số đó.',
  sellNotModelled:
    'Chưa tính: thuế nhà và tiền nước được chia theo ngày đóng giao dịch, thuế lãi vốn (capital gains), và phí trả nợ trước hạn nếu có. Bảng quyết toán của luật sư có đủ các khoản này.',

  disclaimerBuy:
    'Đây là con số ước tính, không phải thư chào vay, thư chấp thuận vay trước hay lời khuyên đầu tư. Chưa gồm tiền escrow và chi phí đóng giao dịch, và lãi suất thật phụ thuộc vào việc ngân hàng xét hồ sơ tài chính của bạn.',
  disclaimerSell:
    'Đây là con số ước tính, không phải bảng quyết toán. Luật sư đóng giao dịch sẽ lập bảng thật, và đó là con số duy nhất nên dùng để tính cho lần mua kế tiếp.',
};

export const CALCULATOR_COPY: Record<CalcLang, CalculatorCopy> = { en, vi };
