import { Home, Users, Calendar, Award } from "lucide-react";

const Stats = () => {
  return (
    <section className="py-24 bg-realDark text-white">
      <div className="container px-4">
        <h2 className="text-4xl font-bold text-center mb-16">WHY WORK WITH ME</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Home className="h-8 w-8 text-realPurple" />
            </div>
            <div className="text-3xl font-bold mb-2">100%</div>
            <div className="text-gray-400">PERSONALIZED SERVICE</div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Calendar className="h-8 w-8 text-realPurple" />
            </div>
            <div className="text-3xl font-bold mb-2">14 DAYS</div>
            <div className="text-gray-400">AVG. TIME ON MARKET</div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-8 w-8 text-realPurple" />
            </div>
            <div className="text-3xl font-bold mb-2">99.9%</div>
            <div className="text-gray-400">CLIENT SATISFACTION</div>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Award className="h-8 w-8 text-realPurple" />
            </div>
            <div className="text-3xl font-bold mb-2">5+ YEARS</div>
            <div className="text-gray-400">MARKET EXPERIENCE</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
