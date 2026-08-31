import Roadmap from '@/components/Roadmap';

/**
 * The seller roadmap in Vietnamese — the counterpart of SellerRoadmap, feeding
 * the same Roadmap component. See ViBuyerRoadmap for why this is written copy
 * rather than t(): i18n is pinned to 'en' during static generation.
 *
 * `accent="purple"` matches the English seller guide; the blue/purple pair is
 * what distinguishes the two guides at a glance.
 */
const ViSellerRoadmap = () => {
  const steps = [
    {
      title: 'Chuẩn bị và lên kế hoạch',
      description:
        'Quyết định đầu tiên không phải là giá, mà là bạn ưu tiên điều gì: giá cao nhất, bán nhanh nhất, hay ngày dọn đi thuận tiện nhất.',
      details: [
        'Xem giá bán thật của những căn tương tự trong khu vực trong 3–6 tháng gần nhất.',
        'Tính chi phí bán: hoa hồng, phí luật sư, thuế chuyển nhượng của tiểu bang, sửa chữa, và chi phí dọn nhà.',
        'Xác định thời điểm. Ở Massachusetts, thị trường mạnh nhất thường từ tháng 3 đến tháng 6.',
      ],
    },
    {
      title: 'Chọn agent và luật sư',
      description:
        'Cũng như bên mua, người bán ở Massachusetts cần luật sư — người soạn chứng thư và xử lý phần chủ quyền.',
      details: [
        'Chọn agent niêm yết: hỏi về kế hoạch tiếp thị cụ thể, không chỉ mức hoa hồng.',
        'Thống nhất chiến lược giá: định giá dưới thị trường một chút để tạo cạnh tranh là chiến thuật phổ biến ở vùng này.',
        'Thuê luật sư bất động sản ngay từ đầu, không đợi đến khi có offer.',
      ],
    },
    {
      title: 'Chuẩn bị căn nhà',
      description:
        'Người mua ở đây xem nhà lần đầu qua ảnh trên điện thoại. Những gì ống kính thấy quyết định có ai đến xem hay không.',
      details: [
        'Dọn bớt đồ đạc và làm sạch kỹ — phòng trống trông rộng hơn.',
        'Sửa những lỗi dễ thấy: vòi nước rỉ, công tắc hỏng, tường bong sơn.',
        'Chăm phần nhìn từ ngoài đường: cắt cỏ, sơn cửa, thay đèn.',
        'Cân nhắc kiểm tra nhà trước khi rao (pre-listing inspection) để không bị bất ngờ khi người mua kiểm tra.',
      ],
    },
    {
      title: 'Rao bán và tiếp thị',
      description:
        'MLS PIN là nơi mọi thứ bắt đầu; Zillow và các trang khác lấy dữ liệu từ đó.',
      details: [
        'Đăng lên MLS với ảnh chụp chuyên nghiệp và mô tả đầy đủ.',
        'Tổ chức open house — cuối tuần đầu tiên thường quyết định phần lớn kết quả.',
        'Giữ nhà gọn gàng và linh hoạt giờ cho người mua đến xem.',
      ],
    },
    {
      title: 'Nhận và thương lượng offer',
      description:
        'Giá cao nhất không phải lúc nào cũng là offer tốt nhất. Điều kiện kèm theo mới quyết định khả năng giao dịch đi đến cùng.',
      details: [
        'Xem kỹ các điều kiện: vay vốn, thẩm định giá, kiểm tra nhà, và ngày đóng.',
        'Lưu ý: luật Massachusetts từ 15/10/2025 cấm người bán và agent niêm yết đòi người mua bỏ điều kiện kiểm tra nhà, hoặc nhận offer có điều khoản đó.',
        'Ra offer đối ứng nếu cần — điều chỉnh giá, thời hạn, hoặc khoản hỗ trợ chi phí đóng.',
        'Chấp thuận offer và ký. Ở tiểu bang này, Offer to Purchase đã là hợp đồng ràng buộc.',
      ],
    },
    {
      title: 'Giai đoạn kiểm tra',
      description:
        'Người mua thường có 7–10 ngày để kiểm tra nhà kể từ khi offer được chấp thuận.',
      details: [
        'Người mua thuê thanh tra viên; bạn nên ra khỏi nhà trong lúc đó.',
        'Thương lượng sửa chữa hoặc giảm giá dựa trên kết quả.',
        'Ngân hàng của người mua đặt thẩm định giá. Nếu thấp hơn giá hợp đồng, hai bên phải thương lượng lại.',
        'Ký Purchase & Sale — hợp đồng chi tiết hơn, thường khoảng hai tuần sau offer.',
      ],
    },
    {
      title: 'Chuẩn bị đóng giao dịch',
      description:
        'Phần lớn công việc ở giai đoạn này là giấy tờ và phối hợp ngày tháng.',
      details: [
        'Hoàn tất các sửa chữa đã đồng ý và giữ lại hóa đơn.',
        'Sắp xếp ngày dọn đi theo ngày đóng và ngày bàn giao đã thỏa thuận.',
        'Chốt số điện, gas, nước vào ngày đóng.',
        'Luật sư của bạn chuẩn bị chứng thư và xử lý phần chủ quyền.',
      ],
    },
    {
      title: 'Ngày đóng',
      description:
        'Giao dịch hoàn tất khi chứng thư được đăng bộ tại Registry of Deeds, không phải khi ký xong giấy tờ.',
      details: [
        'Người mua đi xem nhà lần cuối trước giờ đóng.',
        'Ký chứng thư sang tên và các giấy tờ liên quan.',
        'Nhận tiền bán — bằng chuyển khoản hoặc séc ngân hàng sau khi đăng bộ xong.',
        'Bàn giao toàn bộ chìa khóa, điều khiển cửa garage và mã khóa.',
      ],
    },
    {
      title: 'Sau khi bán',
      description:
        'Vài việc cần làm để khép lại, và một khoản thuế cần biết trước.',
      details: [
        'Hủy bảo hiểm nhà sau khi chứng thư đã đăng bộ.',
        'Đổi địa chỉ với bưu điện, ngân hàng và các dịch vụ.',
        'Giữ toàn bộ hồ sơ đóng giao dịch để khai thuế.',
        'Tìm hiểu khoản miễn thuế lợi nhuận khi bán nhà ở chính — mức miễn của liên bang là 250.000 USD cho người độc thân và 500.000 USD cho vợ chồng khai chung (IRS, 2026). Hãy hỏi người khai thuế về trường hợp của bạn.',
      ],
    },
  ];

  return (
    <Roadmap
      title="LỘ TRÌNH BÁN NHÀ CỦA BẠN"
      steps={steps}
      accent="purple"
      stepLabel="Bước"
      ofLabel="trên"
    />
  );
};

export default ViSellerRoadmap;
