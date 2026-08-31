import { useState } from 'react';
import ViPage from '@/components/ViPage';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { submitContactMessage } from '@/lib/submitContact';
import { EVENTS, track } from '@/lib/analytics';
import { errorMessage } from '@/lib/utils';
import { SITE, smsHref, telHref } from '@/lib/siteConfig';

/**
 * /vi/lien-he — the counterpart of /contact.
 *
 * The form is written out here rather than reusing components/Contact.tsx,
 * which assembles every label through useTranslation(). i18n is pinned to
 * `lng: 'en'` during static generation, so that component prerenders in English
 * regardless of the reader's language — the exact failure the /vi tree exists
 * to fix. Only the labels are duplicated: the transport is
 * submitContactMessage, the same one both English forms use, so a fix to the
 * endpoint or the payload still reaches all three.
 *
 * NAP is not translated. Phone, email and address come from SITE exactly as
 * everywhere else — inconsistent NAP actively suppresses local ranking.
 */
const ViContact = () => {
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      await submitContactMessage(values);
      // Only after a genuine success — the conversion event must not fire on a
      // submission that never reached the server.
      track(EVENTS.lead, { form_location: 'vi_contact_page' });
      setStatus('sent');
      setValues({ firstName: '', lastName: '', email: '', phone: '', message: '' });
    } catch (err) {
      setStatus('idle');
      setError(errorMessage(err) || 'Không gửi được tin nhắn. Vui lòng thử lại hoặc gọi trực tiếp.');
    }
  };

  const label = 'mb-1.5 block text-sm font-medium text-ink';

  return (
    <ViPage
      path="/vi/lien-he"
      seo={{
        title: 'Liên Hệ Kevin Hoang — Chuyên Viên Địa Ốc Nói Tiếng Việt',
        description:
          'Liên hệ Kevin Hoang, chuyên viên địa ốc tại Needham, Massachusetts. Gọi điện, nhắn tin, gửi email hoặc đặt lịch hẹn — bằng tiếng Việt hoặc tiếng Anh.',
      }}
      eyebrow="Liên hệ"
      h1="Liên hệ Kevin"
      lede="Gọi, nhắn tin, hay gửi tin nhắn qua mẫu bên dưới — bằng tiếng Việt hoặc tiếng Anh, tùy bạn. Kevin thường trả lời trong vòng một ngày làm việc."
      crumbs={[
        { name: 'Trang chủ', path: '/' },
        { name: 'Tiếng Việt', path: '/vi' },
        { name: 'Liên hệ', path: '/vi/lien-he' },
      ]}
      hero={{
        image:
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1600&q=70',
        alt: 'Hiên trước một căn nhà ở Massachusetts',
      }}
      faqHeading="Câu hỏi thường gặp"
      faqs={[
        {
          question: 'Tôi nhắn tin bằng tiếng Việt được không?',
          answer:
            'Được. Gọi điện, nhắn tin hay email bằng tiếng Việt đều được, và Kevin sẽ trả lời bằng tiếng Việt.',
        },
        {
          question: 'Bao lâu thì Kevin trả lời?',
          answer:
            'Thường trong vòng một ngày làm việc. Nếu việc gấp — chẳng hạn có thời hạn trong hợp đồng sắp hết — hãy gọi hoặc nhắn tin thay vì gửi email.',
        },
        {
          question: 'Nói chuyện lần đầu có mất phí không?',
          answer:
            'Không. Cuộc trao đổi đầu tiên không mất phí và không ràng buộc gì. Nếu điều bạn cần không thuộc chuyên môn hoặc khu vực của Kevin, anh sẽ nói thẳng.',
        },
      ]}
      cta={{
        heading: 'Muốn gọi ngay?',
        body: `Số của Kevin là ${SITE.phone}. Gọi hoặc nhắn tin đều được.`,
        button: 'Gọi Kevin',
      }}
      enLabel="Contact Kevin"
      sections={
        <div className="py-12">
          <h2 className="mb-6 text-3xl font-bold text-ink">Gửi tin nhắn</h2>

          {status === 'sent' ? (
            <div
              role="status"
              className="rounded-xl border border-gray-200 border-l-4 border-l-champagne bg-white p-6"
            >
              <p className="font-medium text-ink">Đã gửi. Cảm ơn bạn.</p>
              <p className="mt-2 text-sm text-gray-600">
                Kevin sẽ liên lạc lại, thường trong vòng một ngày làm việc. Nếu gấp, hãy
                gọi <a href={telHref}>{SITE.phone}</a>.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="max-w-xl space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="vi-first">
                    Tên <span aria-hidden>*</span>
                  </label>
                  <Input
                    id="vi-first"
                    required
                    value={values.firstName}
                    onChange={set('firstName')}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className={label} htmlFor="vi-last">
                    Họ <span aria-hidden>*</span>
                  </label>
                  <Input
                    id="vi-last"
                    required
                    value={values.lastName}
                    onChange={set('lastName')}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label className={label} htmlFor="vi-email">
                  Email <span aria-hidden>*</span>
                </label>
                <Input
                  id="vi-email"
                  type="email"
                  required
                  value={values.email}
                  onChange={set('email')}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className={label} htmlFor="vi-phone">
                  Số điện thoại <span className="text-gray-500">(không bắt buộc)</span>
                </label>
                <Input
                  id="vi-phone"
                  type="tel"
                  value={values.phone}
                  onChange={set('phone')}
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className={label} htmlFor="vi-message">
                  Nội dung <span aria-hidden>*</span>
                </label>
                <Textarea
                  id="vi-message"
                  required
                  rows={5}
                  value={values.message}
                  onChange={set('message')}
                  placeholder="Bạn đang muốn mua, bán, hay chỉ muốn hỏi trước?"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="rounded-full bg-ink-deep px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-champagne hover:text-ink-deep disabled:opacity-60"
              >
                {status === 'sending' ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </button>
            </form>
          )}
        </div>
      }
    >
      <h2>Cách liên lạc nhanh nhất</h2>
      <p>
        Điện thoại: <a href={telHref}>{SITE.phone}</a>
        <br />
        Nhắn tin: <a href={smsHref}>{SITE.phone}</a>
        <br />
        Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </p>
      <p>
        Đặt lịch hẹn:{' '}
        <a href={SITE.appointmentUrl} target="_blank" rel="noopener noreferrer">
          chọn giờ trên lịch của Kevin
        </a>
        .
      </p>

      <h2>Văn phòng</h2>
      <p>
        {SITE.brokerage}
        <br />
        {SITE.address.streetAddress}
        <br />
        {SITE.address.addressLocality}, {SITE.address.addressRegion}{' '}
        {SITE.address.postalCode}
      </p>
    </ViPage>
  );
};

export default ViContact;
