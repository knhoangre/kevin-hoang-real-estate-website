import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

const TermsOfService = () => {
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
                TERMS OF SERVICE
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="text-xl text-gray-600 mb-12 max-w-3xl"
              >
                Please read these terms carefully before using our website and services. By using our services, you agree to be bound by these terms.
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
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">1. Acceptance of Terms</h2>
                  <p className="text-gray-700 mb-4">
                    By accessing or using our website, services, or any content provided by Kevin Hoang Real Estate ("we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access our services.
                  </p>
                  <p className="text-gray-700 mb-6">
                    These Terms apply to all visitors, users, and others who access or use our services, including our website, mobile applications, and any other platforms we operate.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">2. Description of Services</h2>
                  <p className="text-gray-700 mb-4">
                    We provide real estate brokerage services, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Residential real estate buying and selling services</li>
                    <li>Market analysis and property valuations</li>
                    <li>Property listings and marketing</li>
                    <li>Buyer and seller representation</li>
                    <li>Real estate consultation and advice</li>
                    <li>Property search assistance</li>
                    <li>Transaction coordination and support</li>
                    <li>Educational resources and market information</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    All real estate services are provided in accordance with applicable state and federal laws and regulations governing real estate practice.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">3. User Accounts and Registration</h2>
                  <p className="text-gray-700 mb-4">
                    To access certain features of our services, you may be required to create an account. When creating an account, you agree to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Provide accurate, current, and complete information</li>
                    <li>Maintain and update your information as necessary</li>
                    <li>Keep your login credentials secure and confidential</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized access</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive, or illegal activities.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">4. Acceptable Use</h2>
                  <p className="text-gray-700 mb-4">
                    You agree to use our services only for lawful purposes. You may not:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Violate any local, state, federal, or international laws</li>
                    <li>Infringe on intellectual property rights of others</li>
                    <li>Submit false, misleading, or fraudulent information</li>
                    <li>Engage in harassment, abuse, or harmful conduct</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Use automated tools to access or scrape our website</li>
                    <li>Distribute malware, viruses, or other harmful code</li>
                    <li>Interfere with the proper functioning of our services</li>
                    <li>Impersonate any person or entity</li>
                    <li>Collect personal information about other users</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    We reserve the right to investigate and take appropriate legal action against anyone who violates these provisions.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">5. Real Estate Representation and Agency</h2>
                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Agency Relationships</h3>
                  <p className="text-gray-700 mb-4">
                    Real estate agency relationships are governed by state law. We will disclose our agency status in all transactions as required by law. Types of representation include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Seller's Agent:</strong> Representing the seller's interests exclusively</li>
                    <li><strong>Buyer's Agent:</strong> Representing the buyer's interests exclusively</li>
                    <li><strong>Dual Agent:</strong> Representing both parties with written consent</li>
                    <li><strong>Transaction Broker:</strong> Facilitating transactions without advocacy</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Fiduciary Duties</h3>
                  <p className="text-gray-700 mb-4">
                    When acting as your agent, we owe you fiduciary duties including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-6">
                    <li>Loyalty and undivided attention to your interests</li>
                    <li>Confidentiality of personal and financial information</li>
                    <li>Full disclosure of material facts</li>
                    <li>Obedience to lawful instructions</li>
                    <li>Reasonable care and skill in performance</li>
                    <li>Accounting for all funds and documents</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">6. Fees and Commission</h2>
                  <p className="text-gray-700 mb-4">
                    Real estate commission and fees are negotiable and will be agreed upon in writing before services are provided. Standard practices include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Commission rates are typically a percentage of the sale price</li>
                    <li>Commission is usually paid at closing from sale proceeds</li>
                    <li>Buyer's agent commission is typically paid by the seller</li>
                    <li>Additional fees may apply for specialized services</li>
                    <li>All fees and commission structures will be disclosed in advance</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    Commission is earned when a ready, willing, and able buyer is procured, or when a property is successfully marketed and sold, as defined in the applicable listing or buyer representation agreement.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">7. Property Information and Disclaimers</h2>
                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Information Accuracy</h3>
                  <p className="text-gray-700 mb-4">
                    While we strive to provide accurate property information, we make no warranties or representations regarding:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Accuracy of property descriptions, square footage, or amenities</li>
                    <li>Condition of properties or systems within properties</li>
                    <li>Zoning, permits, or regulatory compliance</li>
                    <li>Future market conditions or property values</li>
                    <li>Suitability of properties for specific purposes</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Professional Inspections</h3>
                  <p className="text-gray-700 mb-4">
                    We strongly recommend that all buyers:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-6">
                    <li>Conduct professional property inspections</li>
                    <li>Verify all property information independently</li>
                    <li>Consult with appropriate professionals (attorneys, inspectors, contractors)</li>
                    <li>Review all relevant documents and disclosures</li>
                    <li>Conduct due diligence appropriate to the transaction</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">8. Intellectual Property Rights</h2>
                  <p className="text-gray-700 mb-4">
                    Our website and services contain intellectual property owned by us or our licensors, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Website content, text, graphics, and design</li>
                    <li>Logos, trademarks, and brand elements</li>
                    <li>Software, applications, and functionality</li>
                    <li>Market reports, analyses, and proprietary data</li>
                    <li>Educational materials and resources</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    You may not reproduce, distribute, modify, or create derivative works from our content without explicit written permission. Property listings may be subject to separate copyright restrictions.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">9. Privacy and Data Protection</h2>
                  <p className="text-gray-700 mb-4">
                    Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                  </p>
                  <p className="text-gray-700 mb-6">
                    By using our services, you consent to the collection and use of your information as described in our Privacy Policy. We implement appropriate security measures to protect your personal and financial information.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">10. Disclaimers and Limitations of Liability</h2>
                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Service Disclaimers</h3>
                  <p className="text-gray-700 mb-4">
                    Our services are provided "as is" and "as available" without warranties of any kind. We disclaim all warranties, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Merchantability and fitness for a particular purpose</li>
                    <li>Non-infringement of third-party rights</li>
                    <li>Accuracy, completeness, or reliability of information</li>
                    <li>Uninterrupted or error-free service</li>
                    <li>Security of data transmission</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Limitation of Liability</h3>
                  <p className="text-gray-700 mb-4">
                    To the maximum extent permitted by law, we shall not be liable for:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Indirect, incidental, special, or consequential damages</li>
                    <li>Loss of profits, data, or business opportunities</li>
                    <li>Damages arising from use or inability to use our services</li>
                    <li>Third-party actions or content</li>
                    <li>Force majeure events beyond our control</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    Our total liability for any claim shall not exceed the fees paid to us for the specific service giving rise to the claim.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">11. Indemnification</h2>
                  <p className="text-gray-700 mb-6">
                    You agree to indemnify, defend, and hold harmless Kevin Hoang Real Estate, its officers, employees, and agents from any claims, damages, losses, or expenses (including attorney's fees) arising from your use of our services, violation of these Terms, or infringement of any third-party rights.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">12. Fair Housing and Anti-Discrimination</h2>
                  <p className="text-gray-700 mb-4">
                    We are committed to fair housing practices and comply with all applicable fair housing laws, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Federal Fair Housing Act</li>
                    <li>Americans with Disabilities Act</li>
                    <li>State and local fair housing laws</li>
                    <li>Equal Credit Opportunity Act</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    We do not discriminate based on race, color, religion, sex, national origin, familial status, disability, or other protected characteristics. All properties are available to qualified individuals regardless of protected class status.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">13. Dispute Resolution</h2>
                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Informal Resolution</h3>
                  <p className="text-gray-700 mb-4">
                    Before pursuing formal dispute resolution, we encourage you to contact us directly to resolve any issues informally.
                  </p>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Binding Arbitration</h3>
                  <p className="text-gray-700 mb-4">
                    Any disputes arising from these Terms or our services shall be resolved through binding arbitration rather than in court, except for:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Claims for injunctive or equitable relief</li>
                    <li>Claims involving intellectual property rights</li>
                    <li>Small claims court matters within jurisdictional limits</li>
                  </ul>
                  <p className="text-gray-700 mb-4">
                    Arbitration will be conducted by a neutral arbitrator in accordance with the rules of the American Arbitration Association. The arbitrator's decision will be final and binding.
                  </p>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Class Action Waiver</h3>
                  <p className="text-gray-700 mb-6">
                    You agree that any arbitration or legal proceeding will be conducted on an individual basis and not as part of a class, collective, or representative action.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">14. Governing Law and Jurisdiction</h2>
                  <p className="text-gray-700 mb-6">
                    These Terms are governed by the laws of the Commonwealth of Massachusetts, without regard to conflict of law principles. Any legal actions not subject to arbitration must be brought in the state or federal courts located in Massachusetts.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">15. Termination</h2>
                  <p className="text-gray-700 mb-4">
                    We may terminate or suspend your access to our services immediately, without prior notice, for:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Violation of these Terms</li>
                    <li>Fraudulent, abusive, or illegal conduct</li>
                    <li>Request by law enforcement or judicial order</li>
                    <li>Extended periods of inactivity</li>
                    <li>Technical or security concerns</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    Upon termination, your right to use our services ceases immediately. Provisions of these Terms that should survive termination will remain in effect.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">16. Changes to Terms</h2>
                  <p className="text-gray-700 mb-6">
                    We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services after changes are posted constitutes acceptance of the modified Terms. We encourage you to review these Terms periodically.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">17. Severability</h2>
                  <p className="text-gray-700 mb-6">
                    If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions will continue in full force and effect. The invalid provision will be replaced with a valid provision that most closely reflects the original intent.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">18. Entire Agreement</h2>
                  <p className="text-gray-700 mb-6">
                    These Terms, together with our Privacy Policy and any other legal notices published on our website, constitute the complete agreement between you and us regarding your use of our services. These Terms supersede all prior agreements, understandings, and communications.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">19. Contact Information</h2>
                  <p className="text-gray-700 mb-4">
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700 mb-2"><strong>Kevin Hoang</strong></p>
                    <p className="text-gray-700 mb-2">Email: KNHOANGRE@GMAIL.COM</p>
                    <p className="text-gray-700 mb-2">Phone: (860) 682-2251</p>
                    <p className="text-gray-700">Address: 150 WEST ST, NEEDHAM, MA 02494</p>
                  </div>
                </section>

                <section className="mb-8 border-t pt-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">20. Additional Provisions</h2>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Real Estate Licensing</h3>
                  <p className="text-gray-700 mb-4">
                    Kevin Hoang is a licensed real estate professional. All real estate activities are conducted in accordance with state licensing requirements and professional standards.
                  </p>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Multiple Listing Service (MLS)</h3>
                  <p className="text-gray-700 mb-4">
                    Property information may be obtained from MLS databases and is subject to MLS rules and regulations. MLS information is deemed reliable but not guaranteed.
                  </p>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Professional Standards</h3>
                  <p className="text-gray-700 mb-6">
                    We adhere to the Code of Ethics of the National Association of Realtors® and all applicable professional standards and regulations governing real estate practice.
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

export default TermsOfService;