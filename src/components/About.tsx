const About = () => {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-[#1a1a1a]">MEET KEVIN HOANG</h2>
            <p className="text-lg text-gray-600">
              As a Boston-based real estate professional with a unique background in Mechanical Engineering and Software Engineering, Kevin Hoang brings an analytical and tech-savvy approach to real estate transactions. His engineering expertise enables him to provide detailed property assessments, understand complex market data, and leverage cutting-edge technology to optimize the buying and selling process.
            </p>
            <p className="text-lg text-gray-600">
              Specializing in the Greater Boston real estate market, Kevin combines his technical acumen with extensive market knowledge to deliver exceptional results for his clients. His engineering background proves invaluable in evaluating property conditions, understanding structural aspects, and identifying potential investment opportunities that others might miss.
            </p>
            <p className="text-lg text-gray-600">
              Whether you're a first-time homebuyer, seasoned investor, or looking to sell your property, Kevin's innovative approach and dedication to client success make him the ideal partner for your real estate journey in Massachusetts.
            </p>
          </div>

          <div className="relative">
            <div className="aspect-square bg-[#1a1a1a]/10 rounded-2xl overflow-hidden">
              <img
                src="/public/kevin_hoang.jpg"
                alt="Kevin Hoang - Boston Real Estate Agent"
                className="w-full h-full object-cover object-top scale-125"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
