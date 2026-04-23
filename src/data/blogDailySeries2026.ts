import type { BlogPost } from "./blogData";

const IMAGES = [
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&h=500",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&h=500",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function formatBlogDateUTC(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toISODateUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function addDaysUTC(base: Date, days: number): Date {
  const x = new Date(base.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

type Topic = {
  enTitle: string;
  viTitle: string;
  enLead: string;
  viLead: string;
};

/** Rotating angles — combined with note index for unique titles across 100 days */
const TOPICS: Topic[] = [
  {
    enTitle: "Reading the Offer Timeline in a Competitive Offer Situation",
    viTitle: "Đọc Thời Gian Trong Tình Huống Đề Nghị Cạnh Tranh",
    enLead:
      "When multiple buyers want the same property, timelines and clarity around deadlines matter as much as price.",
    viLead:
      "Khi nhiều người mua cùng muốn một căn nhà, thời hạn và rõ ràng về mốc thời gian quan trọng không kém giá.",
  },
  {
    enTitle: "Why Pre-Approval Still Moves Offers to the Front of the Line",
    viTitle: "Vì Sao Chấp Thuận Trước Vẫn Đưa Đề Nghị Lên Hàng Đầu",
    enLead:
      "Sellers and listing agents in Greater Boston still prioritize buyers who have already verified financing.",
    viLead: "Người bán và đại lý niêm yết ở Greater Boston vẫn ưu tiên người mua đã xác minh tài chính.",
  },
  {
    enTitle: "Condo Docs: What to Review Before You Waive Contingencies",
    viTitle: "Tài Liệu Chung Cư: Xem Gì Trước Khi Bỏ Điều Kiện",
    enLead:
      "Master deeds, budgets, and special assessments can change the true cost of ownership overnight.",
    viLead:
      "Khế ước chủ, ngân sách và các khoản đánh giá đặc biệt có thể thay đổi chi phí sở hữu thực.",
  },
  {
    enTitle: "Single-Family vs. Multi-Family: Financing Differences in Massachusetts",
    viTitle: "Nhà Đơn Gia Đình vs. Đa Gia Đình: Khác Biệt Tài Chính ở Massachusetts",
    enLead: "Owner-occupant rules, rent rolls, and reserve requirements can shift which loan programs fit.",
    viLead: "Quy tắc chủ ở, bảng thuê và quỹ dự phòng có thể thay đổi chương trình vay phù hợp.",
  },
  {
    enTitle: "Energy Audits: Using Data to Prioritize Seasonal Upgrades",
    viTitle: "Kiểm Tra Năng Lượng: Dùng Dữ Liệu Ưu Tiên Nâng Cấp Theo Mùa",
    enLead:
      "A clear audit helps you sequence insulation, air sealing, and HVAC work for the best payback.",
    viLead: "Báo cáo rõ ràng giúp bạn sắp thứ tự cách nhiệt, kín khí và HVAC để hoàn vốn tốt nhất.",
  },
  {
    enTitle: "Open House Traffic: Separating Serious Buyers from the Curious",
    viTitle: "Lưu Lượng Mở Cửa: Phân Biệt Người Mua Nghiêm Túc Và Tò Mò",
    enLead:
      "Strong foot traffic feels encouraging, but follow-up questions reveal who is actually mortgage-ready.",
    viLead:
      "Đông người đến xem tạo cảm giác tốt, nhưng câu hỏi tiếp theo mới cho biết ai thực sự sẵn sàng vay.",
  },
  {
    enTitle: "Pricing for the Spring Push Without Chasing the Market Down",
    viTitle: "Định Giá Cho Đợt Xuân Mà Không Chạy Theo Thị Trường",
    enLead:
      "List price should reflect fresh comps while leaving room for negotiation that still feels credible.",
    viLead: "Giá niêm yết cần phản ánh giao dịch tương đương mới và vẫn chừa không gian đàm phán hợp lý.",
  },
  {
    enTitle: "Septic and Well Basics for Massachusetts Suburban Listings",
    viTitle: "Bể Tự Hoại Và Giếng: Cơ Bản Cho Niêm Yết Ngoại Ô Massachusetts",
    enLead: "Rural and suburban buyers need clear maintenance history before they commit to an offer.",
    viLead: "Người mua ngoại ô cần lịch sử bảo trì rõ ràng trước khi cam kết đề nghị.",
  },
  {
    enTitle: "When a Post-Inspection Credit Makes More Sense Than Repairs",
    viTitle: "Khi Nào Tiền Bù Sau Kiểm Tra Hợp Lý Hơn Sửa Chữa",
    enLead: "Credits can keep the closing on schedule when contractor timelines do not match the contract.",
    viLead: "Tiền bù có thể giữ đúng lịch đóng khi thợ không kịp theo hợp đồng.",
  },
  {
    enTitle: "Understanding Attorney Review in Massachusetts Purchase Contracts",
    viTitle: "Hiểu Giai Đoạn Luật Sư Trong Hợp Đồng Mua Massachusetts",
    enLead: "This window is your opportunity to align language with lender requirements and local practice.",
    viLead: "Đây là cơ hội để thống nhất điều khoản với yêu cầu cho vay và thông lệ địa phương.",
  },
  {
    enTitle: "HOA Reserves: Red Flags Buyers Should Not Ignore",
    viTitle: "Quỹ Dự Phòng HOA: Dấu Hiệu Người Mua Không Nên Bỏ Qua",
    enLead: "Underfunded reserves can mean special assessments soon after you move in.",
    viLead: "Quỹ mỏng có thể dẫn đến khoản thu đặc biệt ngay sau khi bạn vào ở.",
  },
  {
    enTitle: "Offer Letters: How to Stand Out Without Overpromising",
    viTitle: "Thư Đề Nghị: Nổi Bật Mà Không Hứa Quá Đà",
    enLead:
      "A concise letter that connects your timeline and financing to the seller's goals still resonates.",
    viLead: "Thư ngắn gọn nối thời gian và tài chính của bạn với mục tiêu người bán vẫn hiệu quả.",
  },
  {
    enTitle: "Rent-Back Agreements: Structuring Days and Dollars Safely",
    viTitle: "Thỏa Thuận Thuê Lại: Cấu Trúc Ngày Và Tiền An Toàn",
    enLead: "Clear holdback language and insurance expectations prevent misunderstandings at the end.",
    viLead: "Điều khoản giữ tiền và bảo hiểm rõ ràng tránh hiểu nhầm cuối giao dịch.",
  },
  {
    enTitle: "School District Research Beyond the Ratings Websites",
    viTitle: "Tìm Hiểu Học Khu Ngoài Các Trang Xếp Hạng",
    enLead: "Walk zones, program offerings, and commute patterns often matter more than a single score.",
    viLead: "Khu đi bộ, chương trình và đi làm thường quan trọng hơn một con số.",
  },
  {
    enTitle: "Title Issues That Surface Late—and How to Resolve Them Early",
    viTitle: "Vấn Đề Quyền Sở Hữu Xuất Hiện Muộn—Và Cách Xử Sớm",
    enLead: "Old easements and unreleased liens are easier to fix when discovered before the final week.",
    viLead: "Quyền đi qua cũ và nợ chưa xóa dễ xử lý hơn khi phát hiện trước tuần cuối.",
  },
  {
    enTitle: "Accessory Dwelling Units: Zoning Realities in Metro Boston Towns",
    viTitle: "Phụ Gia ADU: Thực Tế Quy Hoạch Ở Các Thị Trấn Metro Boston",
    enLead: "Parking, owner occupancy, and square-foot caps vary street by street.",
    viLead: "Chỗ đỗ, chủ ở và giới hạn diện tích thay đổi theo từng khu.",
  },
  {
    enTitle: "Why Your Agent's Pricing Range Should Match the Appraiser's Comps",
    viTitle: "Vì Sao Khung Giá Của Đại Lý Cần Khớp Giao Dịch Của Thẩm Định",
    enLead: "Alignment between list strategy and defensible comps reduces appraisal-gap surprises.",
    viLead: "Thống nhất giữa chiến lược niêm yết và giao dịch bảo vệ được giúp giảm bất ngờ thẩm định.",
  },
  {
    enTitle: "Moving from a Hot Rental Market to Ownership: Budgeting the Shift",
    viTitle: "Từ Thuê Nóng Sang Sở Hữu: Ngân Sách Cho Bước Chuyển",
    enLead: "Plan for taxes, insurance, maintenance reserves, and still leave room for life's curveballs.",
    viLead: "Hãy dự phòng thuế, bảo hiểm, bảo trì và chỗ cho chi phí bất ngờ.",
  },
  {
    enTitle: "New Construction Warranties: What Is—and Isn't—Covered",
    viTitle: "Bảo Hành Nhà Mới: Cái Gì Được Và Không Được Bảo Hiểm",
    enLead: "Cosmetic issues and soil movement may fall outside builder coverage—read the fine print.",
    viLead: "Lỗi thẩm mỹ và lún đất có thể nằm ngoài bảo hành—đọc kỹ điều khoản.",
  },
  {
    enTitle: "Short-Term Rate Moves: What They Mean for Monthly Payment Planning",
    viTitle: "Biến Động Lãi Ngắn Hạn: Ý Nghĩa Với Kế Hoạch Thanh Toán Hàng Tháng",
    enLead: "Focus on the payment you can sustain through a full market cycle, not just the headline number.",
    viLead: "Tập trung mức thanh toán bạn giữ được cả chu kỳ thị trường, không chỉ con số tin tức.",
  },
  {
    enTitle: "Walkability vs. Commute: Finding Balance in Greater Boston",
    viTitle: "Đi Bộ vs. Đi Làm: Cân Bằng Ở Greater Boston",
    enLead: "Transit access, parking, and school drop-off routes all belong in the same spreadsheet.",
    viLead: "Giao thông, chỗ đỗ xe và đưa đón học nên nằm trong cùng một bảng tính.",
  },
  {
    enTitle: "Selling While Buying: Bridge Strategies That Actually Work Locally",
    viTitle: "Bán Trong Khi Mua: Chiến Lược Nối Thực Tế Ở Địa Phương",
    enLead: "Contingent offers, rent-backs, and extended closings each solve different timing problems.",
    viLead: "Đề nghị có điều kiện, thuê lại và kéo dài đóng cửa giải quyết từng loại lịch khác nhau.",
  },
  {
    enTitle: "Basement Moisture: When to Investigate Before You List",
    viTitle: "Ẩm Tầng Hầm: Khi Nào Nên Kiểm Tra Trước Khi Niêm Yết",
    enLead: "Grading, gutters, and drainage plans are often cheaper than buyer fear at the negotiating table.",
    viLead: "Độ dốc, máng xối và thoát nước thường rẻ hơn nỗi lo của người mua khi đàm phán.",
  },
  {
    enTitle: "Fireplaces and Chimneys: Disclosure and Inspection Talking Points",
    viTitle: "Lò Sưởi Và Ống Khói: Điểm Tiết Lộ Và Kiểm Tra",
    enLead: "Level II inspections can clarify safety and insurance questions up front.",
    viLead: "Kiểm tra cấp II làm rõ an toàn và bảo hiểm ngay từ đầu.",
  },
  {
    enTitle: "Pets, Allergies, and Showings: A Practical Seller Checklist",
    viTitle: "Thú Cưng, Dị Ứng Và Xem Nhà: Checklist Người Bán Thực Tế",
    enLead: "Air quality, bedding, and litter placement affect first impressions more than you think.",
    viLead: "Chất lượng không khí, ga trải giường và vị trí khay ảnh hưởng ấn tượng đầu nhiều hơn bạn nghĩ.",
  },
];

function buildEnglishBody(topic: Topic, d: Date, seasonPhrase: string): string {
  const m = d.getUTCMonth();
  const localSeason =
    m <= 1
      ? "Winter weather and holiday debt paydown plans still shape how buyers tour and how sellers stage in Massachusetts."
      : m === 2
        ? "Early spring listings begin to test buyer appetite before inventory peaks."
        : m === 3
          ? "Spring markets often bring more listings—pricing discipline matters for both sides."
          : "Late spring activity rewards buyers who stay pre-approved and sellers who present clean disclosures.";

  return `${topic.enLead}\n\n${localSeason}\n\n${seasonPhrase}\n\nIn the Greater Boston area, small differences in commute, school access, and property condition still swing value block by block. Work with professionals who know your specific town's norms for offers, inspections, and attorney review.\n\nThis update is for general information and not legal or tax advice—consult qualified professionals for your situation.`;
}

function buildVietnameseBody(topic: Topic, d: Date, seasonPhraseVi: string): string {
  const m = d.getUTCMonth();
  const localSeasonVi =
    m <= 1
      ? "Thời tiết mùa đông và kế hoạch trả nợ sau lễ vẫn ảnh hưởng cách người mua xem nhà và cách người bán trưng bày ở Massachusetts."
      : m === 2
        ? "Niêm yết đầu xuân bắt đầu thử sức người mua trước khi hàng tồn lên cao."
        : m === 3
          ? "Thị trường xuân thường có thêm niêm yết—kỷ luật định giá quan trọng với cả hai bên."
          : "Hoạt động cuối xuân thưởng cho người mua còn chấp thuận trước và người bán có tiết lộ rõ ràng.";

  return `${topic.viLead}\n\n${localSeasonVi}\n\n${seasonPhraseVi}\n\nỞ khu vực Greater Boston, khác biệt nhỏ về đi làm, học hành và tình trạng nhà vẫn làm thay đổi giá trị từng khu. Hãy làm việc với người am hiểu thông lệ đề nghị, kiểm tra và luật sư tại thị trấn của bạn.\n\nBài viết chỉ mang tính thông tin chung, không phải tư vấn pháp lý hay thuế—hãy hỏi chuyên gia phù hợp với trường hợp của bạn.`;
}

function seasonPhrases(d: Date): { en: string; vi: string } {
  const day = d.getUTCDate();
  const month = d.getUTCMonth();
  if (month === 0 && day <= 20) {
    return {
      en: "Snow and ice reminders: keep access paths clear for showings and document any ice-dam prevention you have completed.",
      vi: "Nhắc tuyết và băng: giữ lối đi thông thoáng khi xem nhà và ghi nhận biện pháp chống băng mái nếu đã làm.",
    };
  }
  if (month <= 1) {
    return {
      en: "Heating costs and daylight hours still influence how buyers judge light and insulation.",
      vi: "Chi phí sưởi và giờ sáng vẫn ảnh hưởng cách người mua đánh giá ánh sáng và cách nhiệt.",
    };
  }
  if (month === 2) {
    return {
      en: "March transitions reward sellers who complete exterior touch-ups early.",
      vi: "Tháng 3 thưởng cho người bán hoàn tất sơn sửa mặt tiền sớm.",
    };
  }
  if (month === 3 && day <= 15) {
    return {
      en: "April buyers often compare more listings side by side—differentiation matters.",
      vi: "Người mua tháng 4 thường so sánh nhiều niêm yết—điểm khác biệt quan trọng.",
    };
  }
  return {
    en: "Late April is a good time to revisit your must-haves after a few weekends of open houses.",
    vi: "Cuối tháng 4 là lúc xem lại tiêu chí sau vài cuối tuần đi xem nhà mở cửa.",
  };
}

const START_UTC = Date.UTC(2026, 0, 11);
const END_UTC = Date.UTC(2026, 3, 20);

/**
 * One post per calendar day from Jan 11, 2026 through Apr 20, 2026 (inclusive).
 * Newest first (April 20 → January 11) so the blog grid shows recent days at the top.
 */
export function buildDailyMetroBostonPosts2026(): BlogPost[] {
  const out: BlogPost[] = [];
  let id = 74;
  for (let t = START_UTC; t <= END_UTC; t += 86400000) {
    const d = new Date(t);
    const iso = toISODateUTC(d);
    const topic = TOPICS[(id - 74) % TOPICS.length];
    const noteIndex = id - 73;
    const sp = seasonPhrases(d);

    out.push({
      id,
      title: `${topic.enTitle} · Note ${noteIndex}`,
      titleVi: `${topic.viTitle} · Ghi chú ${noteIndex}`,
      excerpt: `${topic.enLead} (${formatBlogDateUTC(d)})`,
      excerptVi: `${topic.viLead} (${formatBlogDateUTC(d)})`,
      slug: `metro-boston-real-estate-${iso}`,
      image: IMAGES[id % IMAGES.length],
      content: buildEnglishBody(topic, d, sp.en),
      contentVi: buildVietnameseBody(topic, d, sp.vi),
      date: formatBlogDateUTC(d),
      author: "Kevin Hoang",
    });
    id += 1;
  }
  return out.reverse();
}
