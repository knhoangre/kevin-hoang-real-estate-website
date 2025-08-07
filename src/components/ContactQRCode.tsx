import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

const ContactQRCode = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center space-y-4">
      <img
        src="/images/contact-qr-code.png"
        alt="Contact QR Code"
        width={200}
        height={200}
        className="bg-white p-4 rounded-lg shadow-lg"
      />
      <p className="text-sm text-gray-600 text-center">
        {t('contact.scan_qr_code')}
      </p>
    </div>
  );
};

export default ContactQRCode;