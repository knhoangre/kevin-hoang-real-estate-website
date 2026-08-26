import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import { ALL_TESTIMONIALS } from "@/data/testimonials";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Seo from "@/components/Seo";

const BATCH = 24;

const Testimonials = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(BATCH);

  const shown = useMemo(
    () => ALL_TESTIMONIALS.slice(0, visible),
    [visible],
  );

  return (
    <>
      <Seo
        title="Client Reviews & Testimonials"
        description="Read client reviews for Kevin Hoang — buying, selling, relocation, condos, and single-family homes across Needham, MetroWest, and Greater Boston."
        keywords="Kevin Hoang reviews, real estate agent reviews Needham MA, Greater Boston realtor testimonials"
      />
      <div className="min-h-screen bg-white">
        <div className="pt-16">
          <div className="container mx-auto px-4 py-24">
            <div className="enter-down">
              <h1 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4 enter-down" style={{ '--enter-delay': '0.2s' } as React.CSSProperties}>
                {t("testimonials.title")}
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl enter-down" style={{ '--enter-delay': '0.4s' } as React.CSSProperties}>
                {t("testimonials.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shown.map((item, index) => (
                <Card
                  key={`${item.firstName}-${index}`}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3" aria-hidden>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                          strokeWidth={0}
                        />
                      ))}
                    </div>
                    <p className="text-[#1a1a1a] leading-relaxed text-sm md:text-base mb-4">
                      {item.text}
                    </p>
                    <p className="text-sm font-semibold text-[#1a1a1a] uppercase tracking-wide">
                      — {item.firstName}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {visible < ALL_TESTIMONIALS.length && (
              <div className="flex justify-center mt-12">
                <Button
                  type="button"
                  variant="outline"
                  className="uppercase tracking-wider border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
                  onClick={() =>
                    setVisible((v) =>
                      Math.min(v + BATCH, ALL_TESTIMONIALS.length),
                    )
                  }
                >
                  {t("testimonials.load_more")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Testimonials;
