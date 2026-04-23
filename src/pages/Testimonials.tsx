import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import { ALL_TESTIMONIALS } from "@/data/testimonials";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const BATCH = 24;

const Testimonials = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(BATCH);

  useEffect(() => {
    const prevTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? null;
    document.title = `${t("testimonials.title")} | Kevin Hoang`;
    if (meta) meta.setAttribute("content", t("testimonials.meta_description"));
    return () => {
      document.title = prevTitle;
      if (meta && prevDesc !== null) meta.setAttribute("content", prevDesc);
    };
  }, [t]);

  const shown = useMemo(
    () => ALL_TESTIMONIALS.slice(0, visible),
    [visible],
  );

  return (
    <>
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-16">
          <div className="container mx-auto px-4 py-24">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.h1
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4"
              >
                {t("testimonials.title")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="text-xl text-gray-600 mb-12 max-w-2xl"
              >
                {t("testimonials.subtitle")}
              </motion.p>
            </motion.div>

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
