/**
 * Every word the calculator shows, in English, Vietnamese and Chinese.
 *
 * LITERAL STRINGS, NEVER t(). i18n is pinned to `lng: 'en'` during static
 * generation, so a calculator assembled through useTranslation() prerenders in
 * English on /vi/cong-cu-tinh-toan — which is exactly why that page used to
 * link out to the English tool instead of embedding one. The caller chooses the
 * language: the /vi page fixes it at 'vi', /calculator follows the toggle after
 * mount, and a listing page stays English like the rest of that page.
 *
 * One interface, three objects: a string added to the English and forgotten in
 * another language is a type error, not a blank label in front of a reader.
 *
 * Numbers are formatted by the caller with formatPrice (US dollars, US
 * separators) in both languages. These are US prices in a US market, and that
 * is the form they appear in on every listing and every document the reader
 * will be handed.
 */
import type { ReactNode } from 'react';

export type CalcLang = 'en' | 'vi' | 'zh';
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
    `The 5% and 10% options include mortgage insurance at ${pmiRate}% a year, which is why they cost more each month than the loan size alone would suggest.`,

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
    `Hai lựa chọn 5% và 10% đã gồm bảo hiểm khoản vay ${pmiRate}% mỗi năm, nên khoản trả hàng tháng cao hơn so với những gì số tiền vay gợi ý.`,

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

const zh: CalculatorCopy = {
  tablist: '选择计算内容',
  tabs: {
    listing: { live: '如果自住', invest: '如果出租', sell: '如果按此价出售' },
    general: { live: '买来自住', invest: '买来出租', sell: '出售房屋' },
  },

  intro: {
    listing: ({ taxes, hoa }) =>
      `已按这套房源的${[
        '价格',
        taxes && '房产税',
        hoa && '物业费',
      ]
        .filter(Boolean)
        .join('、')}填入。下面的数字都可以修改，请换成您自己的数字。`,
    general: '开始显示的数字只是示例。每一项都可以修改，请换成您正在考虑的房子和真实数字。',
  },

  purchasePrice: '购买价格',
  salePrice: '出售价格',
  priceHint: {
    asking: '这是挂牌价。修改它可以试算您的出价。',
    changed: (listed) => `挂牌价为 ${listed}。`,
    example: '这是示例价格，请输入您正在考虑的价格。',
    sellListing: '这是挂牌价。修改它可以试算实际成交价。',
    sellExample: '您预计房子能卖到的价格。这个数字最好来自一份书面估价。',
  },
  downPayment: '首付',
  downAs: '首付输入方式',
  downOf: (amount, price) => `${price} 中的 ${amount}`,
  percentOf: (percent, price) => `${price} 的 ${percent}%`,
  rate: '贷款利率',
  rateHint: (asOf) => (
    <>
      这是假设值，不是报价，请换成贷款机构给您的利率。默认值于 {asOf} 与 Freddie Mac 的利率调查核对过。
    </>
  ),
  term: '贷款年限',
  years: (n) => `${n} 年`,
  pmi: '贷款保险（PMI），每年',
  pmiHint: (threshold) =>
    `贷款额超过房价 ${threshold}% 时需要支付。常规贷款的 PMI 每年约为 0.46%–1.5%，取决于信用分数（Urban Institute Housing Finance Policy Center）；0.5% 是信用很好时的水平。`,
  taxes: '房产税，每年',
  taxesHint: {
    listingYear: (year) => `来自房源信息，${year} 年。`,
    listing: '来自房源信息。',
    missing: '这套房源的数据中没有房产税金额。',
    example:
      '这是示例数字。麻州每个城镇各自制定税率，请使用您所看房子的真实税单，可以在房源信息或城镇估税办公室（assessor）的网站上查到。',
  },
  insuranceCondo: 'Condo 保险，每年',
  insuranceHome: '房屋保险，每年',
  insuranceCondoHint: (average) =>
    `麻州 HO-6 保险的平均水平（${average}）。大楼结构由业主协会的总保单承保，这一项只保您单元内部。`,
  insuranceHomeHint: (rate) =>
    `按每年房价的 ${rate}% 估算，依据是麻州 $300,000 房屋保额的平均保费 $1,471（Insure.com / Quadrant，2026 年）。保额按重建成本计算，不含土地，所以在地价高的地方这个估算会偏高，请以实际报价为准。`,
  hoa: '物业费（HOA），每月',
  hoaHint: {
    listing: '来自房源信息。如果您的费用按年收取，请自行更正。',
    listingNoAmount: '这套房源有业主协会，但没有列出费用金额。',
    example: 'Condo 或业主协会的费用（如有）。没有就保持为 0。',
  },
  rent: '预期租金，每月',
  rentHint: {
    median: (count, town) =>
      `这是 ${town} 目前 ${count} 套同类出租房的挂牌租金中位数。这是要价，不是实际成交租金，也不是对这套房的预测。`,
    none: '数据中没有这个城镇的同类出租房，请输入您自己的数字。',
    example: '这是示例数字，请输入您预计这套房能租到的租金。',
  },
  vacancy: '空置率',
  vacancyHint: '一年中房子在两任租客之间空着的比例。',
  maintenance: '维修储备金，每年',
  maintenanceHint: '默认为房价的 1%。这是常用的规划数字，不是实际账单。',
  management: '物业管理费',
  managementHint: '按收到的租金计算。如果您自己管理，请设为 0。',
  payoff: '尚欠贷款余额',
  payoffHint:
    '这套房子上所有还欠的款项，包括每一笔房贷和房屋净值贷款。贷款机构的还清通知（payoff letter）上有准确数字，最近一期账单上的数字也很接近。',
  commission: '佣金总额',
  commissionHint:
    '这是假设值，请替换。佣金可以协商，写在您的挂牌合同中，包括其中是否有一部分付给买方经纪。',
  otherCosts: '其他过户费用',
  otherCostsHint:
    '这是起始数字，请替换。包括律师费、烟雾和一氧化碳报警器证明、注销贷款的登记费，以及 condo 证明（如需要）。您的律师可以提供实际数字。',
  credits: '修缮费用或给买方的补贴',
  creditsHint: '验房后您同意修缮或补贴的金额。在收到出价之前通常为 0。',

  monthlyCost: '估算每月费用',
  perMonth: ' /月',
  perMo: '/月',
  segments: {
    principalAndInterest: '本金和利息',
    taxes: '房产税',
    insurance: '保险',
    hoa: '物业费',
    pmi: '贷款保险',
  },
  taxesRow: (year) => (year ? `房产税（${year}）` : '房产税'),
  pmiRow: '贷款保险（PMI）',
  overTerm: (years) => `完整 ${years} 年合计`,
  loanAmount: '贷款金额',
  interestPaid: '利息总额',
  totalRepaid: '还款总额',
  overTermNote: (years) =>
    `这里只算贷款。房产税、保险和物业费没有按 ${years} 年推算，因为它们会变化，把今天的数字推到那么远只是猜测。`,
  ifYouPutDown: '如果首付',
  scenarioNote: (pmiRate) =>
    `5% 和 10% 两个选项包含每年 ${pmiRate}% 的贷款保险，所以月供比单看贷款额要高一些。`,

  cashFlow: '估算每月现金流',
  perYear: (amount, outOfPocket) => `每年 ${amount}${outOfPocket ? '，需要自己贴钱' : ''}。`,
  capRate: '资本化率（cap rate）',
  capRateNote: '净运营收入除以房价。这里有意不计贷款：它衡量的是房产本身，不是您的融资方式，所以可以在不同房产之间比较。',
  cashOnCash: '现金回报率（cash-on-cash）',
  cashOnCashNote: (down) =>
    `每年现金流除以 ${down} 首付。过户费用没有计入投入的现金，所以实际回报会略低一些。`,
  effectiveRent: '实际租金收入（扣除空置后）',
  operatingExpenses: '运营费用',
  noi: '净运营收入（NOI）',
  mortgagePi: '贷款月供（本金和利息）',
  rentNote: {
    listing: (town) =>
      `租金是 ${town} 同类房屋的挂牌租金中位数，不是对这套房的预测，也不是它实际租到的价格。这里没有计入房价增值、折旧、税务处理、大修支出和更换租客的成本，真正的投资分析要把这些都算进去。`,
    general: '这里没有计入房价增值、折旧、税务处理、大修支出和更换租客的成本，真正的投资分析要把这些都算进去。',
  },

  netProceeds: '估算您实际拿到的金额',
  underwater: '售价不足以还清欠款。挂牌之前请先和贷款机构及律师谈一谈，短售（short sale）需要贷款机构批准。',
  sellSegments: {
    net: '您拿到',
    mortgagePayoff: '还清贷款',
    commission: '佣金',
    deedExcise: '地契税',
    otherAndCredits: '过户费用和补贴',
  },
  saleRow: '出售价格',
  commissionRow: (rate) => `佣金（${rate}%）`,
  deedRow: '麻州地契税',
  otherRow: '其他过户费用',
  creditsRow: '修缮和补贴',
  beforePayoffRow: '还清贷款之前',
  payoffRow: '还清贷款',
  netRow: '您实际拿到',
  deedNote:
    '地契税（deed excise）为每 $500 售价 $2.28（M.G.L. c.64D §1 加 14% 附加税；麻州税务局 Directive 95-4，2026 年核对），由卖方支付。Cape Cod 所在的 Barnstable 郡有自己的税率，这个数字请向您的律师确认。',
  sellNotModelled:
    '未包含：按过户日分摊的房产税和水费、资本利得税，以及提前还款罚金（如有）。律师的结算单上会列出所有这些项目。',

  disclaimerBuy:
    '这是估算，不是贷款报价、预批或投资建议。其中不含 escrow 和过户费用，实际利率取决于贷款机构对您财务状况的审核。',
  disclaimerSell:
    '这是估算，不是结算单。真正的结算单由过户律师准备，只有那个数字才能作为下一次购房的依据。',
};

export const CALCULATOR_COPY: Record<CalcLang, CalculatorCopy> = { en, vi, zh };
