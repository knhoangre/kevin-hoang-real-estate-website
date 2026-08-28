import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import { ALL_TESTIMONIALS } from "@/data/testimonials";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageShell, { ShellSection } from "@/components/PageShell";
import { SITE, googleProfileUrl } from "@/lib/siteConfig";

const BATCH = 24;

const Testimonials = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(BATCH);

  const shown = useMemo(
    () => ALL_TESTIMONIALS.slice(0, visible),
    [visible],
  );

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Reviews", path: "/testimonials" },
  ];

  return (
    <PageShell
      path="/testimonials"
      crumbs={crumbs}
      seo={{
        title: 'Client Reviews & Testimonials',
        description:
          'Read client reviews for Kevin Hoang — buying, selling, relocation, condos, and single-family homes across Needham, MetroWest, and Greater Boston.',
        keywords:
          'Kevin Hoang reviews, real estate agent reviews Needham MA, Greater Boston realtor testimonials',
      }}
      eyebrow="Reviews"
      h1={t("testimonials.title")}
      lede={t("testimonials.subtitle")}
      hero={{
        image:
          'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1600&q=65',
        alt: 'A warm, lived-in living room',
      }}
      heroSize="standard"
      width="wide"
      cta={{
        heading: 'Want the same on your own move?',
        body:
          'Every review here started with one conversation about what someone was trying to do. That is all the first one has to be.',
      }}
    >
      <ShellSection width="wide">
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
                    <p className="text-ink leading-relaxed text-sm md:text-base mb-4">
                      {item.text}
                    </p>
                    <p className="text-sm font-semibold text-ink uppercase tracking-wide">
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
                  className="uppercase tracking-wider border-ink text-ink hover:bg-ink hover:text-white"
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

            {/*
              Every review on this page is one a real client wrote, and this is
              where the rest of them live. Sending readers to the Google
              Business Profile is also the only legitimate way to grow the
              count — the previous approach was to generate 377 more.
            */}
            <div className="mt-16 rounded-xl bg-gray-50 p-8 text-center">
              <h2 className="text-2xl font-bold text-ink">
                Read them on Google
              </h2>
              <p className="mt-3 text-gray-700 leading-relaxed max-w-2xl mx-auto">
                These are real reviews from real clients. You can read them
                &mdash; and check that they are genuine &mdash; on the Google
                Business Profile, where they are verified and attributed.
              </p>
              <a
                href={googleProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill btn-pill-light mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-white transition-colors hover:bg-champagne hover:text-ink-deep"
              >
                View verified Google reviews
              </a>
            </div>
      </ShellSection>
    </PageShell>
  );
};

export default Testimonials;
