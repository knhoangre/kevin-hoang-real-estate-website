import { Home, Users, Calendar, Award } from "lucide-react";
import { useTranslation } from "react-i18next";

const Stats = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-realDark text-white">
      <div className="container px-4">
        <h2 className="text-4xl font-bold text-center mb-16">{t('stats.title')}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Home className="h-8 w-8 text-realPurple" />
            </div>
            <div className="text-3xl font-bold mb-2">100%</div>
            <div className="text-gray-400">{t('stats.personalized_service')}</div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Calendar className="h-8 w-8 text-realPurple" />
            </div>
            <div className="text-3xl font-bold mb-2">14 DAYS</div>
            <div className="text-gray-400">{t('stats.avg_time_market')}</div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-8 w-8 text-realPurple" />
            </div>
            <div className="text-3xl font-bold mb-2">99.9%</div>
            <div className="text-gray-400">{t('stats.client_satisfaction')}</div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Award className="h-8 w-8 text-realPurple" />
            </div>
            <div className="text-3xl font-bold mb-2">5+ YEARS</div>
            <div className="text-gray-400">{t('stats.market_experience')}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
