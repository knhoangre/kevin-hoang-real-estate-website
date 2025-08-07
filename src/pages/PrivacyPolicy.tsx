import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <section className="py-24 bg-gray-50">
          <div className="container px-4">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-16"
            >
              <motion.h1
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4"
              >
                PRIVACY POLICY
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="text-xl text-gray-600 mb-12 max-w-3xl"
              >
                Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8"
            >
              <div className="prose prose-lg max-w-none">
                <p className="text-sm text-gray-600 mb-8">
                  <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">1. Information We Collect</h2>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Personal Information</h3>
                  <p className="text-gray-700 mb-4">
                    We may collect personal information that you voluntarily provide to us when you:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Contact us through our website forms</li>
                    <li>Request information about our services</li>
                    <li>Schedule consultations or appointments</li>
                    <li>Subscribe to our newsletter or blog updates</li>
                    <li>Create an account on our website</li>
                    <li>Participate in surveys or feedback forms</li>
                  </ul>

                  <p className="text-gray-700 mb-4">
                    This information may include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-6">
                    <li>Name and contact information (email, phone number, mailing address)</li>
                    <li>Property preferences and search criteria</li>
                    <li>Financial information (income, pre-approval status, budget)</li>
                    <li>Property ownership information</li>
                    <li>Communication preferences</li>
                    <li>Any other information you choose to provide</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Automatically Collected Information</h3>
                  <p className="text-gray-700 mb-4">
                    When you visit our website, we automatically collect certain information about your device and usage:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-6">
                    <li>IP address and location data</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Pages visited and time spent on our site</li>
                    <li>Referring website</li>
                    <li>Device information (mobile device ID, screen resolution)</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">2. How We Use Your Information</h2>
                  <p className="text-gray-700 mb-4">
                    We use the information we collect for various purposes, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-6">
                    <li>Providing and improving our real estate services</li>
                    <li>Responding to your inquiries and requests</li>
                    <li>Scheduling and managing appointments</li>
                    <li>Sending property listings and market updates</li>
                    <li>Personalizing your experience on our website</li>
                    <li>Processing transactions and managing client relationships</li>
                    <li>Sending newsletters and marketing communications (with your consent)</li>
                    <li>Analyzing website usage and improving our services</li>
                    <li>Complying with legal obligations</li>
                    <li>Protecting against fraud and unauthorized access</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">3. Information Sharing and Disclosure</h2>
                  <p className="text-gray-700 mb-4">
                    We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
                  </p>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Service Providers</h3>
                  <p className="text-gray-700 mb-4">
                    We may share information with trusted third-party service providers who assist us in operating our business, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Website hosting and maintenance providers</li>
                    <li>Email marketing platforms</li>
                    <li>Customer relationship management (CRM) systems</li>
                    <li>Analytics services</li>
                    <li>Payment processors</li>
                    <li>Legal and professional service providers</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Real Estate Transactions</h3>
                  <p className="text-gray-700 mb-4">
                    In connection with real estate transactions, we may share information with:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Other real estate professionals (agents, brokers)</li>
                    <li>Mortgage lenders and financial institutions</li>
                    <li>Title companies and attorneys</li>
                    <li>Home inspectors and appraisers</li>
                    <li>Other parties involved in the transaction process</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Legal Requirements</h3>
                  <p className="text-gray-700 mb-6">
                    We may disclose your information when required by law or in response to legal process, including to comply with court orders, subpoenas, or government investigations.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">4. Cookies and Tracking Technologies</h2>
                  <p className="text-gray-700 mb-4">
                    We use cookies and similar technologies to enhance your browsing experience and analyze site usage. Types of cookies we use include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Essential Cookies:</strong> Necessary for website functionality</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                    <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                    <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    You can control cookie preferences through your browser settings. Note that disabling certain cookies may affect website functionality.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">5. Data Security</h2>
                  <p className="text-gray-700 mb-4">
                    We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>SSL encryption for data transmission</li>
                    <li>Secure servers and databases</li>
                    <li>Access controls and authentication</li>
                    <li>Regular security assessments</li>
                    <li>Employee training on data protection</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">6. Data Retention</h2>
                  <p className="text-gray-700 mb-6">
                    We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law. We consider factors such as the nature of the information, potential risk of harm, and legal requirements when determining retention periods.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">7. Your Rights and Choices</h2>
                  <p className="text-gray-700 mb-4">
                    Depending on your location, you may have certain rights regarding your personal information:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Access:</strong> Request access to your personal information</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                    <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                    <li><strong>Objection:</strong> Object to certain processing of your information</li>
                    <li><strong>Restriction:</strong> Request restriction of processing</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    To exercise these rights, please contact us using the information provided below. We will respond to your request within the timeframe required by applicable law.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">8. Third-Party Links</h2>
                  <p className="text-gray-700 mb-6">
                    Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party websites you visit.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">9. Children's Privacy</h2>
                  <p className="text-gray-700 mb-6">
                    Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">10. California Privacy Rights</h2>
                  <p className="text-gray-700 mb-4">
                    If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Right to know what personal information is collected, used, shared, or sold</li>
                    <li>Right to delete personal information</li>
                    <li>Right to opt-out of the sale of personal information</li>
                    <li>Right to non-discrimination for exercising your privacy rights</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    We do not sell personal information to third parties. To exercise your California privacy rights, please contact us using the information below.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">11. International Data Transfers</h2>
                  <p className="text-gray-700 mb-6">
                    If you are accessing our services from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States. By using our services, you consent to such transfer, storage, and processing.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">12. Changes to This Policy</h2>
                  <p className="text-gray-700 mb-6">
                    We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy on our website and updating the "Last Updated" date. Your continued use of our services after any changes constitutes acceptance of the updated policy.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">13. Contact Information</h2>
                  <p className="text-gray-700 mb-4">
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700 mb-2"><strong>Kevin Hoang</strong></p>
                    <p className="text-gray-700 mb-2">Email: KNHOANGRE@GMAIL.COM</p>
                    <p className="text-gray-700 mb-2">Phone: (860) 682-2251</p>
                    <p className="text-gray-700">Address: 150 WEST ST, NEEDHAM, MA 02494</p>
                  </div>
                </section>

                <section className="mb-8 border-t pt-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">14. Additional Disclosures</h2>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Real Estate Licensing</h3>
                  <p className="text-gray-700 mb-4">
                    This website is operated by a licensed real estate professional. All real estate activities are conducted in accordance with state and federal regulations governing real estate practice.
                  </p>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Fair Housing</h3>
                  <p className="text-gray-700 mb-4">
                    We are committed to fair housing practices and comply with all applicable fair housing laws. We do not discriminate based on race, color, religion, sex, national origin, familial status, disability, or other protected characteristics.
                  </p>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Financial Information</h3>
                  <p className="text-gray-700 mb-6">
                    Any financial information you provide is used solely for the purpose of real estate transactions and is shared only with authorized parties involved in such transactions. We do not store credit card information on our servers.
                  </p>
                </section>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;