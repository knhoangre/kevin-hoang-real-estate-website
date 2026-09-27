import { Link } from 'react-router-dom';
import type { QA } from '@/lib/schema';

/**
 * The Vietnamese copy about working in Vietnamese — ONE source for two
 * renderings of it:
 *
 *   - the language toggle on /vietnamese-speaking-real-estate-agent, which swaps
 *     it in after mount and is never prerendered, and
 *   - /vi/dich-vu-tieng-viet, the prerendered Vietnamese page, added 2026-09-27
 *     so the "Vietnamese Services" row of the menu has a Vietnamese partner and
 *     this content exists somewhere a crawler can read it.
 *
 * They differ only in where the links point — English pages for the toggle,
 * their /vi counterparts on the Vietnamese page — so the body takes its links as
 * an argument rather than being written twice and drifting.
 *
 * FRAMING RULE, from VietnameseAgent.tsx and load-bearing: Vietnamese is an
 * ADDITIONAL service, not a specialization. Every section that raises it also
 * says clients of every background are served.
 */
export interface ViServicesLinks {
  calculator: string;
  areas: string;
  relocation: string;
  valuation: string;
}

export const VI_SERVICES_LINKS_EN: ViServicesLinks = {
  calculator: '/calculator',
  areas: '/neighborhoods',
  relocation: '/relocation',
  valuation: '/home-valuation',
};

export const VI_SERVICES_LINKS_VI: ViServicesLinks = {
  calculator: '/vi/cong-cu-tinh-toan',
  areas: '/vi/khu-vuc',
  relocation: '/vi/chuyen-den-massachusetts',
  valuation: '/vi/dinh-gia-nha',
};

export const VI_SERVICES_LEDE =
  'Kevin Hoang làm việc với người mua và người bán nhà bằng tiếng Việt và tiếng Anh tại Newton, Needham, MetroWest và khu vực Greater Boston. Mọi giấy tờ đều được giải thích bằng ngôn ngữ bạn thoải mái nhất trước khi bạn ký.';

export const VI_SERVICES_FAQ = {
  wholePurchase: {
    question: 'Tôi có thể mua nhà hoàn toàn bằng tiếng Việt không?',
    answer:
      'Phần trao đổi thì có — đi xem nhà, bàn chiến lược, thương lượng, và giải thích từng giấy tờ bạn được yêu cầu ký. Bản thân hợp đồng vẫn được lập bằng tiếng Anh, vì đó là ngôn ngữ có giá trị pháp lý tại Massachusetts. Mục đích của việc làm việc bằng tiếng Việt là để bạn hiểu chính xác mình đang ký gì trước khi ký, chứ không phải để thay đổi giấy tờ.',
  },
  whereLanguageMatters: {
    question: 'Ngôn ngữ thật sự tạo ra khác biệt ở đâu?',
    answer:
      'Không phải lúc đi xem nhà. Nó quan trọng ở ba hoặc bốn thời điểm mà một sự hiểu lầm sẽ rất tốn kém và không thể quay lại: khi đặt giá mua (các điều kiện, thời hạn và tiền đặt cọc), khi đọc báo cáo kiểm định nhà, khi chọn khoản vay, và khi đọc các bản công bố thông tin bắt buộc.',
  },
  documents: {
    question: 'Những giấy tờ nào được giải thích bằng tiếng Việt?',
    answer:
      'Mọi giấy tờ bạn được yêu cầu đọc hoặc ký trong giao dịch: offer, hợp đồng mua bán (Purchase and Sale Agreement), báo cáo kiểm định nhà, bản ước tính khoản vay (Loan Estimate) và bảng công bố chi phí đóng giao dịch (Closing Disclosure), cùng các bản công bố bắt buộc như công bố về sơn chì. Bản thân các văn bản vẫn bằng tiếng Anh; phần giải thích là bằng tiếng Việt, trước khi bạn ký.',
  },
  firstHome: {
    question: 'Tôi mua căn nhà đầu tiên ở Mỹ. Có gì khác biệt?',
    answer:
      'Ba điều thường làm người mua lần đầu bất ngờ nếu không lớn lên trong hệ thống của Mỹ: thư chấp thuận vay trước (pre-approval) quan trọng đến mức gần như không thể ra giá nếu chưa có; báo cáo kiểm định nhà có sức nặng như một công cụ thương lượng chứ không chỉ là thủ tục; và phần lớn giao dịch đi qua luật sư, vốn là chuyện bình thường ở Massachusetts. Không điều nào khó, chỉ cần có người đi cùng bạn từ đầu.',
  },
  onlyVietnamese: {
    question: 'Kevin có chỉ làm việc với khách nói tiếng Việt không?',
    answer:
      'Không. Kevin làm việc với người mua và người bán thuộc mọi cộng đồng tại Newton, Needham, MetroWest và Greater Boston. Tiếng Việt được cung cấp thêm bên cạnh tiếng Anh vì nó gỡ bỏ một rào cản có thật cho những gia đình cần đến — chứ không phải là giới hạn về đối tượng khách hàng.',
  },
  multiGeneration: {
    question: 'Gia đình nhiều thế hệ mua chung nhà thì sao?',
    answer:
      'Được, và chuyện này khá phổ biến. Mua chung nhiều thế hệ đặt ra những câu hỏi thật sự: đứng tên nhà như thế nào, ai đứng tên khoản vay, và liệu nhà hai căn hộ hay nhà có phần in-law có phù hợp hơn nhà đơn lập không. Nên bàn những điều đó trước khi bắt đầu đi xem nhà, chứ không phải sau khi đã tìm được căn ưng ý.',
  },
} satisfies Record<string, QA>;

export const viServicesBody = (to: ViServicesLinks) => (
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
      đường, và <Link to={to.calculator}>công cụ tính toán</Link> sẽ cho bạn thấy chi phí hàng
      tháng thực tế ứng với một mức giá. Khách hàng thuộc mọi cộng đồng đều được chào đón ở tất cả
      những nội dung này — tiếng Việt là một lựa chọn luôn sẵn có, chứ không phải để thu hẹp đối
      tượng phục vụ.
    </p>

    <h2>Những thị trấn nào được phục vụ?</h2>
    <p>
      Cùng các thị trấn như phần còn lại của công việc: Newton, Needham và các cộng đồng lân cận
      thuộc MetroWest và Greater Boston, mỗi nơi đều có{' '}
      <Link to={to.areas}>bài giới thiệu khu vực riêng</Link>. Nếu bạn chuyển đến từ tiểu bang
      khác, <Link to={to.relocation}>trang chuyển nhà</Link> nói về cách sắp xếp thời gian khi di
      chuyển giữa hai thị trường.
    </p>
    <p>
      Với người bán, <Link to={to.valuation}>bản định giá nhà bằng văn bản</Link> là nơi nên bắt
      đầu, và nội dung đó cũng có thể được trình bày bằng tiếng Việt.
    </p>
  </>
);
