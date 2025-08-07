import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

const Disclaimer = () => {
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
                DISCLAIMER
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="text-xl text-gray-600 mb-12 max-w-3xl"
              >
                Important legal disclaimers and limitations regarding our real estate services and website content.
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
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">General Disclaimer</h2>
                  <p className="text-gray-700 mb-4">
                    The information contained on this website is for general informational purposes only. While we strive to provide accurate and up-to-date information, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on this website.
                  </p>
                  <p className="text-gray-700 mb-6">
                    Any reliance you place on such information is strictly at your own risk. In no event will Kevin Hoang Real Estate be liable for any loss or damage arising from the use of this website or its content.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Real Estate Information Disclaimer</h2>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Property Listings and Information</h3>
                  <p className="text-gray-700 mb-4">
                    Property listings, descriptions, pricing, and other real estate information displayed on this website are subject to errors, omissions, changes, and withdrawal without notice. We do not guarantee the accuracy of:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Property descriptions, square footage, lot sizes, or room counts</li>
                    <li>Listing prices, tax assessments, or financial information</li>
                    <li>Property condition, age, or structural integrity</li>
                    <li>Zoning information, permitted uses, or regulatory compliance</li>
                    <li>Neighborhood data, school districts, or community amenities</li>
                    <li>Utility availability, costs, or service providers</li>
                    <li>Environmental conditions or hazards</li>
                    <li>HOA fees, rules, or restrictions</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Multiple Listing Service (MLS) Data</h3>
                  <p className="text-gray-700 mb-4">
                    Property information may be obtained from MLS databases and third-party sources. While this information is believed to be reliable, it is not guaranteed. MLS data is subject to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-6">
                    <li>Errors in data entry or transmission</li>
                    <li>Changes made after initial listing</li>
                    <li>Delays in updating or removing listings</li>
                    <li>Variations in data standards between sources</li>
                    <li>Copyright restrictions and usage limitations</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Market Analysis and Valuations</h2>
                  <p className="text-gray-700 mb-4">
                    Market analyses, property valuations, and price estimates provided are for informational purposes only and should not be considered as formal appraisals or guarantees of market value. These estimates are based on:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Comparative market analysis of similar properties</li>
                    <li>Historical sales data and market trends</li>
                    <li>General market conditions at the time of analysis</li>
                    <li>Automated valuation models and algorithms</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    Actual market values may vary significantly based on property condition, market changes, buyer preferences, and other factors. For official valuations, consult a licensed appraiser.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Financial and Investment Disclaimers</h2>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Not Financial Advice</h3>
                  <p className="text-gray-700 mb-4">
                    Information provided about real estate investments, market conditions, or financial strategies is for educational purposes only and does not constitute financial, investment, or tax advice. We recommend consulting with qualified professionals including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Licensed financial advisors</li>
                    <li>Certified public accountants (CPAs)</li>
                    <li>Tax professionals</li>
                    <li>Investment advisors</li>
                    <li>Estate planning attorneys</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Mortgage and Financing Information</h3>
                  <p className="text-gray-700 mb-4">
                    Mortgage calculators, interest rate information, and financing options presented are estimates only. Actual loan terms, rates, and approval depend on:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-6">
                    <li>Credit score and financial history</li>
                    <li>Income verification and debt-to-income ratios</li>
                    <li>Property appraisal and loan-to-value ratios</li>
                    <li>Market conditions and lender policies</li>
                    <li>Loan program requirements and restrictions</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Legal and Professional Disclaimers</h2>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Not Legal Advice</h3>
                  <p className="text-gray-700 mb-4">
                    Information provided about real estate law, contracts, regulations, or legal processes is for general informational purposes only and does not constitute legal advice. Real estate laws vary by jurisdiction and change frequently. Always consult with a qualified real estate attorney for legal matters including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Contract review and negotiation</li>
                    <li>Title issues and property disputes</li>
                    <li>Zoning and land use matters</li>
                    <li>Estate planning and property transfers</li>
                    <li>Regulatory compliance and licensing</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Professional Licensing</h3>
                  <p className="text-gray-700 mb-6">
                    Kevin Hoang is a licensed real estate professional. However, licensing requirements, continuing education, and professional standards may change. Always verify current licensing status and qualifications when needed.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Third-Party Information and Links</h2>
                  <p className="text-gray-700 mb-4">
                    Our website may contain links to third-party websites, services, or resources. We do not endorse, control, or assume responsibility for:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Content, accuracy, or reliability of third-party websites</li>
                    <li>Privacy practices or security of external sites</li>
                    <li>Products or services offered by third parties</li>
                    <li>Business practices or professional qualifications of linked entities</li>
                    <li>Availability or functionality of external resources</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    Links to third-party sites are provided for convenience only. Users access external sites at their own risk and should review applicable terms and privacy policies.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Technology and Website Disclaimers</h2>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Website Functionality</h3>
                  <p className="text-gray-700 mb-4">
                    While we strive to maintain website functionality and security, we cannot guarantee:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Uninterrupted access or error-free operation</li>
                    <li>Compatibility with all devices or browsers</li>
                    <li>Security of data transmission over the internet</li>
                    <li>Prevention of unauthorized access or cyber attacks</li>
                    <li>Backup or recovery of user data</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Automated Tools and Calculators</h3>
                  <p className="text-gray-700 mb-6">
                    Mortgage calculators, market analysis tools, and other automated features are provided for estimation purposes only. Results may not reflect actual costs, payments, or market conditions. Users should verify all calculations independently and consult with professionals for accurate analysis.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Geographic and Market Limitations</h2>
                  <p className="text-gray-700 mb-4">
                    Our services primarily focus on the Greater Boston area and surrounding communities. Information provided may not be applicable to other geographic regions due to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Variations in local laws and regulations</li>
                    <li>Different market conditions and practices</li>
                    <li>Regional economic factors</li>
                    <li>State-specific licensing and disclosure requirements</li>
                    <li>Local customs and transaction procedures</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    Users seeking services outside our primary market area should consult with local real estate professionals familiar with their specific region.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Fair Housing and Equal Opportunity</h2>
                  <p className="text-gray-700 mb-4">
                    We are committed to fair housing practices and equal opportunity in real estate. However, we cannot control or guarantee:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Fair housing compliance by all property owners or landlords</li>
                    <li>Accessibility features of all listed properties</li>
                    <li>Community acceptance or discrimination issues</li>
                    <li>Local ordinances affecting protected classes</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    Report any suspected fair housing violations to appropriate authorities. We support equal housing opportunity for all qualified individuals.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Environmental and Safety Disclaimers</h2>
                  <p className="text-gray-700 mb-4">
                    Property information may not include complete environmental or safety disclosures. Potential issues that require professional evaluation include:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Lead paint, asbestos, or other hazardous materials</li>
                    <li>Radon, mold, or air quality concerns</li>
                    <li>Soil contamination or groundwater issues</li>
                    <li>Flood zones, earthquake risks, or natural hazards</li>
                    <li>Environmental impact or protected areas</li>
                    <li>Structural integrity and building safety</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    Always conduct appropriate inspections and environmental testing before purchasing any property. We recommend consulting with qualified inspectors, environmental professionals, and local authorities.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Photography and Virtual Tours</h2>
                  <p className="text-gray-700 mb-4">
                    Property photos, virtual tours, and visual content are for marketing purposes and may not accurately represent:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Actual property condition or appearance</li>
                    <li>Room sizes, proportions, or spatial relationships</li>
                    <li>Color accuracy or lighting conditions</li>
                    <li>Seasonal variations or landscaping changes</li>
                    <li>Furniture, décor, or personal property included in sale</li>
                    <li>Current status of improvements or renovations</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    Photos may be enhanced, staged, or taken at optimal angles. Always view properties in person and verify all visual representations before making purchasing decisions.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Time-Sensitive Information</h2>
                  <p className="text-gray-700 mb-4">
                    Real estate information changes rapidly. The following may become outdated quickly:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Property availability and listing status</li>
                    <li>Pricing, terms, and negotiation flexibility</li>
                    <li>Market conditions and interest rates</li>
                    <li>Regulatory requirements and legal changes</li>
                    <li>Local development and zoning updates</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    Always verify current information before making decisions. We update our website regularly but cannot guarantee real-time accuracy of all content.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Limitation of Liability</h2>
                  <p className="text-gray-700 mb-4">
                    To the maximum extent permitted by law, Kevin Hoang Real Estate and its agents, employees, and affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Use of or inability to use our website or services</li>
                    <li>Reliance on information provided on this website</li>
                    <li>Errors, omissions, or inaccuracies in content</li>
                    <li>Technical failures or security breaches</li>
                    <li>Third-party actions or content</li>
                    <li>Property transactions or investment decisions</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    This limitation applies regardless of the legal theory upon which the claim is based and even if we have been advised of the possibility of such damages.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">User Responsibilities</h2>
                  <p className="text-gray-700 mb-4">
                    Users of this website and our services are responsible for:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Conducting independent due diligence and verification</li>
                    <li>Consulting with appropriate professional advisors</li>
                    <li>Making informed decisions based on personal circumstances</li>
                    <li>Complying with all applicable laws and regulations</li>
                    <li>Protecting personal and financial information</li>
                    <li>Understanding risks associated with real estate transactions</li>
                  </ul>
                  <p className="text-gray-700 mb-6">
                    We encourage all users to seek professional guidance and perform appropriate research before making any real estate or financial decisions.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Changes to Disclaimer</h2>
                  <p className="text-gray-700 mb-6">
                    We reserve the right to modify this disclaimer at any time without prior notice. Changes will be effective immediately upon posting on our website. Users are encouraged to review this disclaimer periodically for updates.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Contact Information</h2>
                  <p className="text-gray-700 mb-4">
                    If you have questions about this disclaimer or need clarification on any matters, please contact us:
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700 mb-2"><strong>Kevin Hoang</strong></p>
                    <p className="text-gray-700 mb-2">Email: KNHOANGRE@GMAIL.COM</p>
                    <p className="text-gray-700 mb-2">Phone: (860) 682-2251</p>
                    <p className="text-gray-700">Address: 150 WEST ST, NEEDHAM, MA 02494</p>
                  </div>
                </section>

                <section className="mb-8 border-t pt-8">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">Important Notice</h3>
                    <p className="text-yellow-700 text-sm">
                      This disclaimer is designed to protect both our business and our clients by clearly outlining the limitations and responsibilities associated with real estate services.
                      By using our website or services, you acknowledge that you have read, understood, and agree to be bound by all terms contained in this disclaimer.
                      If you do not agree with any part of this disclaimer, please discontinue use of our services immediately.
                    </p>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Disclaimer;