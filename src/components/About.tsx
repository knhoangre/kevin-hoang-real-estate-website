
const About = () => {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-realDark">Meet Kevin Hoang</h2>
            <p className="text-lg text-gray-600">
              With over a decade of experience in Boston's dynamic real estate market, I specialize in helping discerning clients find their perfect luxury properties. My approach combines deep market knowledge with personalized service to ensure every transaction exceeds expectations.
            </p>
            <p className="text-lg text-gray-600">
              Whether you're a first-time buyer or seasoned investor, I'm committed to providing unparalleled expertise and guidance throughout your real estate journey.
            </p>
          </div>
          
          <div className="relative">
            <div className="aspect-square bg-realPurple/10 rounded-2xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
                alt="Kevin Hoang"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
