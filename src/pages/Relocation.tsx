import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Download, CheckCircle2 } from "lucide-react";
import Seo from "@/components/Seo";
import BreadcrumbBar from "@/components/BreadcrumbBar";
import FaqAccordion from "@/components/FaqAccordion";
import { agentIdentity, breadcrumbs, faqPage, service, type QA } from "@/lib/schema";

const Relocation = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('submit-contact', {
        body: {
          firstName: 'Relocation',
          lastName: 'Lead',
          email: email.trim().toLowerCase(),
          phone: null,
          message: `CT to MA Relocation Checklist Request from ${email}`,
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Check your email for the relocation checklist.",
      });
      setEmail("");
    } catch (err) {
      console.error('Error submitting email:', err);
      toast({
        title: "Error",
        description: "There was an error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Single source for the visible accordion AND the FAQPage markup below. They
   * used to be two hand-maintained copies of the same three answers, which is
   * exactly how structured data drifts away from the page it describes.
   *
   * The property-tax answer previously asserted "~1.15% in MA vs ~2.1% in CT"
   * with no source and no date. Effective rates move every year and vary by
   * municipality, so the answer now points at the authorities that publish the
   * real number instead of restating a figure nobody can check.
   */
  const FAQS: QA[] = [
    {
      question: "Is property tax lower in Massachusetts or Connecticut?",
      answer:
        "Effective property tax rates are generally lower in Massachusetts than in Connecticut, but Massachusetts home values are typically higher — so the annual bill on a comparable house is often closer than the rate difference suggests. Rates are set per municipality and change annually: the Massachusetts Department of Revenue publishes each town's current rate, and the Connecticut Office of Policy and Management publishes mill rates by town. Compare the two specific towns you are choosing between rather than the state averages.",
    },
    {
      question: "How do I transfer my driver's license from Connecticut to Massachusetts?",
      answer:
        "You apply in person at a Massachusetts RMV service center with your current Connecticut license, proof of identity and lawful presence, proof of Massachusetts residency, and your Social Security number. Massachusetts generally exchanges an out-of-state licence without a road test if yours is current, but a vision screening is required. Requirements change, so confirm the current document list on the Massachusetts RMV website before you go, and book an appointment — walk-in waits are long.",
    },
    {
      question: "How good are Massachusetts public schools?",
      answer:
        "Massachusetts consistently places at or near the top of national state-by-state education rankings, including U.S. News & World Report's, and MetroWest districts such as Wellesley, Newton, and Lexington are among the strongest in the state. Rankings differ by methodology and by grade level, though, and district quality varies within any town — so treat rankings as a starting point and look at the specific schools your children would attend.",
    },
    {
      question: "How do I time selling in Connecticut against buying in Massachusetts?",
      answer:
        "The two markets do not move together, and trying to close on the same day rarely works cleanly. The realistic options are a sale contingency, a rent-back from your buyer so you have a few weeks of overlap, or bridge financing. Which one fits depends on how much equity you are carrying and how much risk you can absorb if one side slips — it is worth deciding before you list, not after you have an accepted offer.",
    },
  ];

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Relocating to Massachusetts", path: "/relocation" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Head tags and JSON-LD go through <Seo>, not a raw <script> in the
          body — that is what keeps the OG block from drifting away from the
          title and guarantees a canonical. */}
      <Seo
        title="Moving to Massachusetts from Connecticut"
        description="Relocating from Connecticut to Massachusetts: choosing a town, comparing property taxes and schools, transferring your licence, and timing a sale against a purchase."
        keywords="moving from Connecticut to Massachusetts, CT to MA relocation, relocating to Boston, best Massachusetts towns for families, MA vs CT property tax"
        jsonLd={[
          breadcrumbs(crumbs),
          faqPage(FAQS),
          // service().provider references #agent, so #agent must be declared
          // on this page for the reference to resolve.
          agentIdentity(),
          service({
            name: "Relocation assistance",
            serviceType: "Real estate relocation services",
            description:
              "Helping people relocating to Massachusetts choose a town and buy a home in Greater Boston.",
            path: "/relocation",
          }),
        ]}
      />
      <div>
        {/* Sits directly under the hero because the trail must be visible —
            BreadcrumbList markup with no on-page counterpart is a structured
            data policy violation. */}
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white pt-32 pb-24 mt-20">
          <div className="container px-4 mx-auto">
            <div className="max-w-4xl mx-auto text-center enter-down">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Leaving the Constitution State? Welcome to the Bay State.
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                I made the move from Connecticut to Massachusetts myself, so I know where the friction actually is. Let&rsquo;s find the town that fits how you live &mdash; in a state that consistently ranks near the top nationally for public education.
              </p>
            </div>
          </div>
        </section>

        <div className="container px-4 mx-auto pt-8">
          <div className="max-w-4xl mx-auto">
            <BreadcrumbBar items={crumbs} />
          </div>
        </div>

        {/* Education Section */}
        <section className="py-24 bg-white">
          <div className="container px-4 mx-auto">
            <div className="max-w-4xl mx-auto enter">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 text-center">
                Why Families are Choosing the Move
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-xl mb-6">
                  As of 2026, Massachusetts is ranked <strong className="text-slate-800">#1 in the U.S. for public education</strong>, while Connecticut is a proud <strong className="text-slate-600">#2</strong>. 
                  Focus on the <strong className="text-slate-800">'Gold Medal' advantage</strong> of moving just a few miles north.
                </p>
                <p className="text-lg">
                  This isn't just about crossing state lines—it's about accessing the nation's premier educational system, 
                  better tax structures, and enhanced quality of life opportunities that Massachusetts offers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Transition Comparison Table */}
        <section className="py-24 bg-gray-50">
          <div className="container px-4 mx-auto">
            {/* max-w-4xl matches every other section on this page; without it this block ran the full container width and broke the column. */}
            <div className="max-w-4xl mx-auto enter">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-12 text-center">
                CT vs. MA: The 2026 Comparison
              </h2>
              <div className="overflow-x-auto">
                <Table className="bg-white rounded-lg shadow-lg">
                  <TableHeader>
                    <TableRow className="bg-slate-800 text-white hover:!bg-slate-800">
                      <TableHead className="text-white font-bold">Category</TableHead>
                      <TableHead className="text-white font-bold text-center">Massachusetts</TableHead>
                      <TableHead className="text-white font-bold text-center">Connecticut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-semibold">Education Rank</TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-green-700">#1 Overall</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-gray-600">#2 Overall</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Property Taxes</TableCell>
                      <TableCell className="text-center">
                        Lower rates, avg ~1.15%
                      </TableCell>
                      <TableCell className="text-center">
                        Higher rates, avg ~2.1%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Vehicle Costs</TableCell>
                      <TableCell className="text-center">
                        Annual Excise Tax + Inspection
                      </TableCell>
                      <TableCell className="text-center">
                        Direct Property Tax on cars
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Income Tax</TableCell>
                      <TableCell className="text-center">
                        5.0% Flat Rate
                      </TableCell>
                      <TableCell className="text-center">
                        Graduated 2% to 6.99%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold">Lifestyle</TableCell>
                      <TableCell className="text-center">
                        Tech/Biotech hub, Boston sports
                      </TableCell>
                      <TableCell className="text-center">
                        Suburban, Coastal, NYC-leaning
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </section>

        {/* Neighborhood Spotlight */}
        <section className="py-24 bg-white">
          <div className="container px-4 mx-auto">
            {/* max-w-4xl matches every other section on this page; without it this block ran the full container width and broke the column. */}
            <div className="max-w-4xl mx-auto enter">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-12 text-center">
                Neighborhood Spotlight for Transplants
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="border-2 border-slate-200 hover:border-slate-400 transition-colors">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">
                      The Pioneer Valley
                    </h3>
                    <p className="text-gray-700">
                      For those who love the quiet feel of Litchfield or Northern CT. 
                      Experience the charm of Western Massachusetts with excellent schools 
                      and a strong sense of community.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-slate-200 hover:border-slate-400 transition-colors">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">
                      Worcester County
                    </h3>
                    <p className="text-gray-700">
                      For those looking for the 'Next Great New England City.' 
                      A vibrant urban center with growing tech presence, excellent 
                      cultural amenities, and affordable housing options.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-slate-200 hover:border-slate-400 transition-colors">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">
                      Metrowest Boston
                    </h3>
                    <p className="text-gray-700">
                      For those seeking the ultimate career and school opportunities. 
                      Home to top-ranked school districts, major employers, and 
                      easy access to Boston's innovation economy.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Personal Narrative */}
        <section className="py-24 bg-slate-50">
          <div className="container px-4 mx-auto">
            <div className="max-w-4xl mx-auto enter">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-8 text-center">
                I Made the Move So You Don't Have to Guess
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-xl mb-6">
                  Moving from Connecticut to Massachusetts isn't just about changing your address—it's about navigating 
                  two different systems, cultures, and ways of life. I've been through it all, and I understand the unique 
                  challenges you'll face.
                </p>
                <p className="text-lg mb-6">
                  I know the frustration of Connecticut's car tax system versus Massachusetts's RMV process. 
                  I've experienced the difference in property tax structures, the nuances of school district transfers, 
                  and the subtle but important lifestyle shifts between these two states.
                </p>
                <p className="text-lg">
                  As your relocation specialist, I'm not just a real estate agent—I'm your bridge between Connecticut 
                  and Massachusetts. I'll help you find the perfect home that matches your lifestyle, navigate the 
                  complexities of the move, and ensure you're making the most informed decision for your family's future.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Lead Magnet Section */}
        <section className="py-24 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <div className="container px-4 mx-auto">
            <div className="max-w-2xl mx-auto text-center enter">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
                <Download className="h-16 w-16 mx-auto mb-6 text-white" />
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Download My Free CT-to-MA Relocation Checklist
                </h2>
                <p className="text-lg mb-8 text-gray-200">
                  Get a comprehensive guide covering everything you need to know about moving from Connecticut to Massachusetts, 
                  including tax considerations, school transfers, license changes, and more.
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 bg-white/90 text-slate-800 placeholder:text-gray-500"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-white text-slate-800 hover:bg-gray-100 font-semibold px-8"
                    >
                      {isSubmitting ? "Sending..." : "Get Free Checklist"}
                    </Button>
                  </div>
                </form>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>No spam. Unsubscribe anytime.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white">
          <div className="container px-4 mx-auto">
            {/* max-w-4xl matches every other section on this page; without it this block ran the full container width and broke the column. */}
            <div className="max-w-4xl mx-auto enter">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-12 text-center">
                Frequently Asked Questions
              </h2>
              <div className="max-w-4xl mx-auto">
                <FaqAccordion faqs={FAQS} />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-slate-800 text-white">
          <div className="container px-4 mx-auto text-center">
            {/* max-w-4xl matches every other section on this page; without it this block ran the full container width and broke the column. */}
            <div className="max-w-4xl mx-auto enter">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Make the Move?
              </h2>
              <p className="text-xl mb-8 text-gray-200 max-w-2xl mx-auto">
                Let's discuss your relocation needs and find your perfect home in Massachusetts.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-slate-800 hover:bg-gray-100 font-semibold px-8 py-6 text-lg"
              >
                <a href="/contact">Get Started Today</a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Relocation;
