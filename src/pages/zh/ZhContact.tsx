import { useState } from 'react';
import ZhPage from '@/components/ZhPage';
import WeChatCard from '@/components/zh/WeChatCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { contactPage } from '@/lib/schema';
import { submitContactMessage } from '@/lib/submitContact';
import { EVENTS, track } from '@/lib/analytics';
import { errorMessage } from '@/lib/utils';
import { CHINESE_PARTNER, partnerSmsHref, partnerTelHref } from '@/lib/siteConfig';
import { formatPhoneInput } from '@/lib/phone';
import { pill } from '@/lib/pill';

/**
 * /zh/lianxi — pairs with /contact.
 *
 * The form is ViContact's, with the surname first, as a Chinese reader expects.
 * The transport is the same submitContactMessage; `lang: 'zh'` asks the function
 * to send the message to Maggie as well as Kevin and to file the person in his CRM
 * under their own source. Kevin's decision (2026-10-31): he cannot read these, but
 * he wants a record of who came through the site.
 *
 * Calls and WeChat go straight to her and leave no such record, and that is known.
 */
const EMPTY = { firstName: '', lastName: '', email: '', phone: '', message: '' };

const ZhContact = () => {
  const [values, setValues] = useState(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const set =
    (field: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      await submitContactMessage({ ...values, lang: 'zh' });
      // Only after a genuine success — the conversion event must not fire on a
      // submission that never reached the server.
      track(EVENTS.lead, { form_location: 'zh_contact_page' });
      setStatus('sent');
      setValues(EMPTY);
    } catch (err) {
      setStatus('idle');
      setError(errorMessage(err) || '消息发送失败。请重试，或直接打电话。');
    }
  };

  const label = 'mb-1.5 block text-sm font-medium text-ink';

  return (
    <ZhPage
      path="/zh/lianxi"
      seo={{
        title: '联系 Maggie Li：电话、微信和邮箱',
        description: `联系 ${CHINESE_PARTNER.name}（${CHINESE_PARTNER.brokerage}），用中文或英文咨询大波士顿买房和卖房。电话 ${CHINESE_PARTNER.phone}，也可以通过微信、短信或邮箱联系。`,
        keywords: 'Maggie Li 联系方式, Maggie Li 微信, 波士顿 地产经纪 电话, 牛顿 地产经纪 联系',
      }}
      jsonLd={[
        contactPage({
          path: '/zh/lianxi',
          name: `联系 ${CHINESE_PARTNER.name}`,
          entity: CHINESE_PARTNER.agentId,
        }),
      ]}
      eyebrow="联系方式"
      h1="联系 Maggie"
      lede="打电话、发短信、发微信，或者填写下面的表格，用中文或英文都可以。"
      hero={{
        image:
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1600&q=70',
        alt: '麻州一栋房子的前廊',
      }}
      heroSize="standard"
      faqHeading="联系之前的问题"
      faqs={[
        {
          question: '第一次沟通要收费吗？',
          answer:
            '不收费，也没有任何义务。如果您需要的不在 Maggie 的专业或服务范围内，她会直接告诉您。',
        },
        {
          question: '事情很急怎么办？',
          answer:
            '如果合同中有期限快到了，请打电话或发短信，不要只发邮件。',
        },
        {
          question: '表格提交后谁会看到？',
          answer: `您的消息会同时发给 ${CHINESE_PARTNER.name} 和本网站的所有者 Kevin Hoang，并保存在 Kevin 的客户记录中。由 Maggie 用中文回复您。`,
        },
      ]}
      cta={{
        heading: '想现在就打电话？',
        body: `Maggie 的电话是 ${CHINESE_PARTNER.phone}。打电话或发短信都可以。`,
        button: '查看 Maggie 的资料',
        to: '/zh/maggie-li',
      }}
      enLabel="Contact Kevin"
      sections={
        <div className="py-12">
          <h2 className="mb-6 text-3xl font-bold text-ink">发送消息</h2>

          {status === 'sent' ? (
            <div
              role="status"
              className="rounded-xl border border-gray-200 border-l-4 border-l-champagne bg-white p-6"
            >
              <p className="font-medium text-ink">已发送，谢谢。</p>
              <p className="mt-2 text-sm text-gray-600">
                Maggie 会尽快和您联系。如果事情紧急，请打电话 <a href={partnerTelHref}>{CHINESE_PARTNER.phone}</a>。
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="max-w-xl space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="zh-last">
                    姓 <span aria-hidden>*</span>
                  </label>
                  <Input
                    id="zh-last"
                    required
                    value={values.lastName}
                    onChange={set('lastName')}
                    autoComplete="family-name"
                  />
                </div>
                <div>
                  <label className={label} htmlFor="zh-first">
                    名 <span aria-hidden>*</span>
                  </label>
                  <Input
                    id="zh-first"
                    required
                    value={values.firstName}
                    onChange={set('firstName')}
                    autoComplete="given-name"
                  />
                </div>
              </div>

              <div>
                <label className={label} htmlFor="zh-email">
                  邮箱 <span aria-hidden>*</span>
                </label>
                <Input
                  id="zh-email"
                  type="email"
                  required
                  value={values.email}
                  onChange={set('email')}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className={label} htmlFor="zh-phone">
                  电话 <span className="text-gray-500">（选填）</span>
                </label>
                <Input
                  id="zh-phone"
                  type="tel"
                  value={values.phone}
                  onChange={(e) => setValues((v) => ({ ...v, phone: formatPhoneInput(e.target.value) }))}
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className={label} htmlFor="zh-message">
                  内容 <span aria-hidden>*</span>
                </label>
                <Textarea
                  id="zh-message"
                  required
                  rows={5}
                  value={values.message}
                  onChange={set('message')}
                  placeholder="您想买房、卖房，还是先了解情况？"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              )}

              <button type="submit" disabled={status === 'sending'} className={pill('ink', 'lg')}>
                {status === 'sending' ? '发送中...' : '发送消息'}
              </button>
            </form>
          )}
        </div>
      }
    >
      <h2>最快的联系方式</h2>
      <p>
        电话：<a href={partnerTelHref}>{CHINESE_PARTNER.phone}</a>
        <br />
        短信：<a href={partnerSmsHref}>{CHINESE_PARTNER.phone}</a>
        <br />
        邮箱：<a href={`mailto:${CHINESE_PARTNER.email}`}>{CHINESE_PARTNER.email}</a>
        <br />
        网站：
        <a href={CHINESE_PARTNER.website} target="_blank" rel="noopener noreferrer">
          maggieli.co
        </a>
      </p>

      <WeChatCard />

      <h2>经纪公司和服务地区</h2>
      <p>
        {CHINESE_PARTNER.teamName}，{CHINESE_PARTNER.brokerage}
        <br />
        {CHINESE_PARTNER.addressLine}
        <br />
        服务大波士顿地区
      </p>
    </ZhPage>
  );
};

export default ZhContact;
