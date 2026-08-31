import Roadmap from '@/components/Roadmap';

/**
 * The buyer roadmap in Vietnamese — the counterpart of BuyerRoadmap.
 *
 * Data only; the timeline is Roadmap.tsx, the same component the English guide
 * renders, so the two cannot drift visually.
 *
 * The copy is written, not run through t(). i18n is pinned to `lng: 'en'`
 * during static generation, so anything assembled through useTranslation()
 * prerenders in English no matter what the reader selected — which is the whole
 * reason the /vi tree exists. It is also not a transliteration of vi.json,
 * whose machine-translated strings render "closing" as "đóng cửa" (closing a
 * door) throughout.
 *
 * `accent="blue"` matches the English buyer guide. The blue/purple pair is the
 * only thing telling the buyer and seller guides apart at a glance, so it
 * carries meaning and is exempt from the champagne accent.
 */
const ViBuyerRoadmap = () => {
  const steps = [
    {
      title: 'Chuẩn bị tài chính',
      description:
        'Trước khi xem nhà, hãy biết con số của mình. Ở thị trường này, người bán thường không xem xét offer nào không kèm thư chấp thuận vay.',
      details: [
        'Kiểm tra điểm tín dụng — từ 620 trở lên cho khoản vay thông thường; điểm càng cao lãi suất càng thấp.',
        'Tính ngân sách thật: tiền vay hàng tháng, thuế bất động sản, bảo hiểm, và phí HOA nếu có.',
        'Chuẩn bị tiền mặt cho trả trước (3–20%), chi phí đóng giao dịch (2–5%), phí kiểm tra nhà và chi phí dọn nhà.',
        'Xin thư chấp thuận vay trước (pre-approval) — khác với pre-qualification, và người bán ở đây phân biệt rất rõ.',
      ],
    },
    {
      title: 'Chọn người đồng hành',
      description:
        'Massachusetts bắt buộc có luật sư trong giao dịch nhà đất. Đây là điểm khác biệt lớn so với nhiều tiểu bang.',
      details: [
        'Chọn agent đại diện người mua — người đại diện quyền lợi của bạn chứ không phải của người bán.',
        'Chọn ngân hàng hoặc broker vay: so sánh lãi suất, phí, và các chương trình FHA, VA, MassHousing.',
        'Chọn luật sư bất động sản. Ở Massachusetts đây là yêu cầu thực tế, không phải tùy chọn.',
      ],
    },
    {
      title: 'Tìm và xem nhà',
      description:
        'Phần lớn nhà trong vùng này xây trước năm 1940. Tuổi của căn nhà quyết định phần lớn những gì bạn cần kiểm tra.',
      details: [
        'Xem nhà trên MLS và đi open house — thứ Bảy và Chủ nhật là hai ngày chính trong tuần.',
        'Thu hẹp lựa chọn theo thuế bất động sản, khu học chánh, và thời gian đi làm — không chỉ theo giá.',
        'Theo dõi giá bán thật của những căn tương tự (comps), không phải giá rao.',
      ],
    },
    {
      title: 'Nộp offer',
      description:
        'Ở Massachusetts, Offer to Purchase là hợp đồng ràng buộc. Đây là hiểu lầm tốn kém nhất của người mua lần đầu tại tiểu bang này.',
      details: [
        'Xem comps để định giá — trả cao hơn thị trường thì ngân hàng sẽ không cho vay phần chênh lệch.',
        'Ấn định điều khoản: giá, tiền đặt cọc, các điều kiện (kiểm tra nhà, vay vốn, thẩm định giá), ngày đóng.',
        'Luật sư của bạn nên đọc offer TRƯỚC khi ký, không phải sau.',
        'Thương lượng qua lại cho đến khi hai bên đồng ý.',
      ],
    },
    {
      title: 'Kiểm tra nhà',
      description:
        'Từ ngày 15/10/2025, luật Massachusetts (760 CMR 74.00) cấm người bán và agent niêm yết ép người mua bỏ điều kiện kiểm tra nhà để được nhận offer.',
      details: [
        'Đặt cọc — thường 1–3% giá mua, do bên thứ ba giữ.',
        'Thuê thanh tra viên kiểm tra nhà, cộng thêm kiểm tra chuyên biệt nếu cần: radon, mối, bồn dầu ngầm, hệ thống septic.',
        'Một lựa chọn hợp pháp: kiểm tra nhà TRƯỚC khi nộp offer. Bạn mất phí cho một căn có thể không mua được, nhưng có đủ thông tin.',
        'Thương lượng sửa chữa hoặc giảm giá dựa trên kết quả kiểm tra.',
      ],
    },
    {
      title: 'Ký P&S và hoàn tất hồ sơ vay',
      description:
        'Purchase & Sale là hợp đồng thứ hai, chi tiết hơn Offer. Đến lúc này các thời hạn trong Offer đã bắt đầu chạy.',
      details: [
        'Nộp giấy tờ cho ngân hàng: phiếu lương, khai thuế hai năm, sao kê ngân hàng.',
        'Ngân hàng đặt thẩm định giá. Nếu thẩm định thấp hơn giá hợp đồng, phần chênh lệch là tiền mặt của bạn.',
        'Luật sư kiểm tra chủ quyền (title) và mua bảo hiểm chủ quyền.',
        'Mua bảo hiểm nhà — ngân hàng yêu cầu trước ngày đóng.',
      ],
    },
    {
      title: 'Ngày đóng giao dịch',
      description:
        'Ở Massachusetts, giao dịch đóng tại phòng đăng bộ (Registry of Deeds), thường có mặt luật sư của cả hai bên.',
      details: [
        'Đi xem nhà lần cuối (final walkthrough) ngay trước giờ đóng.',
        'Ký hồ sơ vay và chứng thư sang tên.',
        'Chuyển tiền trả trước và chi phí đóng bằng chuyển khoản ngân hàng — séc cá nhân không được nhận.',
        'Nhận chìa khóa. Từ thời điểm chứng thư được đăng bộ, căn nhà là của bạn.',
      ],
    },
    {
      title: 'Sau khi nhận nhà',
      description:
        'Vài việc trong tháng đầu tiên tiết kiệm cho bạn tiền và rắc rối về sau.',
      details: [
        'Đổi khóa và kiểm tra hệ thống báo động.',
        'Sang tên điện, gas, nước, internet.',
        'Nộp đơn xin miễn giảm thuế bất động sản cho nhà ở chính (residential exemption) tại tòa thị chính — không phải thị trấn nào cũng có, nhưng nơi có thì khoản giảm đáng kể.',
        'Giữ toàn bộ hồ sơ đóng giao dịch: cần cho thuế và cho lần bán sau.',
      ],
    },
  ];

  return (
    <Roadmap
      title="LỘ TRÌNH MUA NHÀ CỦA BẠN"
      steps={steps}
      accent="blue"
      stepLabel="Bước"
      ofLabel="trên"
    />
  );
};

export default ViBuyerRoadmap;
