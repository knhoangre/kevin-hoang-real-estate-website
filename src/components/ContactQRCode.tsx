import { QRCodeSVG } from 'qrcode.react';

const ContactQRCode = () => {
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
        Scan to save contact information
      </p>
    </div>
  );
};

export default ContactQRCode;