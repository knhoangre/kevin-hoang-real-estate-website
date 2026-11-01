import { CHINESE_PARTNER } from '@/lib/siteConfig';

/**
 * Maggie's WeChat code. WeChat is often the easiest way to reach someone whose
 * family or lender is in another time zone, and her own site offers it.
 *
 * The caption covers the reader already on a phone, who cannot scan their own
 * screen: a screenshot can be opened from the album in 扫一扫.
 */
const WeChatCard = () => (
  <div className="not-prose flex flex-col items-start gap-5 rounded-2xl border border-gray-200 bg-bone p-6 sm:flex-row sm:items-center">
    <img
      src={CHINESE_PARTNER.wechatQr}
      alt="Maggie Li 的微信二维码"
      width={144}
      height={144}
      loading="lazy"
      decoding="async"
      className="h-36 w-36 shrink-0 rounded-lg bg-white p-1"
    />
    <div className="min-w-0">
      <p className="text-lg font-semibold text-ink">微信联系 Maggie</p>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        打开微信「扫一扫」扫描二维码。如果您正在用手机看这个页面，可以先截图，再在「扫一扫」中从相册选择这张图片。
      </p>
    </div>
  </div>
);

export default WeChatCard;
