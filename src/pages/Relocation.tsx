import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

const Relocation = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
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

  // FAQ data for JSON-LD schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is property tax lower in MA or CT?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Rates are generally lower in MA (average ~1.15%) compared to CT (average ~2.1%), though home values are typically higher in Massachusetts."
        }
      },
      {
        "@type": "Question",
        "name": "How do I transfer my license from CT to MA?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "To transfer your driver's license from Connecticut to Massachusetts, you'll need to visit a Massachusetts RMV office with your current CT license, proof of identity, proof of Massachusetts residency, and your Social Security card. You'll need to pass a vision test and may need to retake the written and road tests depending on your situation."
        }
      },
      {
        "@type": "Question",
        "name": "What are the best schools in Massachusetts for 2026?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Massachusetts is ranked #1 in the U.S. for public education. Top school districts include those in Metrowest Boston (Wellesley, Newton, Lexington), as well as districts in Worcester County and the Pioneer Valley. Specific rankings vary by grade level and criteria, but Massachusetts consistently leads the nation in educational outcomes."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div>
        {/* JSON-LD Schema for FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white pt-32 pb-24 mt-20">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Leaving the Constitution State? Welcome to the Bay State.
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                I personally moved from CT to MA, and I know exactly how to handle the transition. Let's find your new home in the nation's #1 state for education and quality of life.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Education Section */}
        <section className="py-24 bg-white">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
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
            </motion.div>
          </div>
        </section>

        {/* Transition Comparison Table */}
        <section className="py-24 bg-gray-50">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
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
            </motion.div>
          </div>
        </section>

        {/* Neighborhood Spotlight */}
        <section className="py-24 bg-white">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
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
            </motion.div>
          </div>
        </section>

        {/* Personal Narrative */}
        <section className="py-24 bg-slate-50">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
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
            </motion.div>
          </div>
        </section>

        {/* Lead Magnet Section */}
        <section className="py-24 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center"
            >
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
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white">
          <div className="container px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-12 text-center">
                Frequently Asked Questions
              </h2>
              <div className="max-w-4xl mx-auto">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="property-tax">
                    <AccordionTrigger className="text-xl font-semibold text-left">
                      Is property tax lower in MA or CT?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 text-lg">
                      Rates are generally lower in MA (average ~1.15%) compared to CT (average ~2.1%), 
                      though home values are typically higher in Massachusetts. The overall tax burden 
                      depends on the specific property value and location within each state.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="license-transfer">
                    <AccordionTrigger className="text-xl font-semibold text-left">
                      How do I transfer my license from CT to MA?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 text-lg">
                      To transfer your driver's license from Connecticut to Massachusetts, you'll need to 
                      visit a Massachusetts RMV office with your current CT license, proof of identity, 
                      proof of Massachusetts residency, and your Social Security card. You'll need to pass 
                      a vision test and may need to retake the written and road tests depending on your situation. 
                      The process typically takes about 2-3 hours at the RMV.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="best-schools">
                    <AccordionTrigger className="text-xl font-semibold text-left">
                      What are the best schools in Massachusetts for 2026?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 text-lg">
                      Massachusetts is ranked #1 in the U.S. for public education. Top school districts include 
                      those in Metrowest Boston (Wellesley, Newton, Lexington), as well as districts in Worcester 
                      County and the Pioneer Valley. Specific rankings vary by grade level and criteria, but 
                      Massachusetts consistently leads the nation in educational outcomes, with strong performance 
                      in STEM subjects, college readiness, and overall student achievement.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-slate-800 text-white">
          <div className="container px-4 mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
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
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Relocation;
