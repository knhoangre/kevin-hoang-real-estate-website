
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-[#1a1a1a]">GET IN TOUCH</h2>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4 group">
                <Phone className="h-5 w-5 text-[#1a1a1a]" />
                <a href="tel:8606822251" className="relative">
                  <span className="text-[#1a1a1a] uppercase">
                    (860) 682-2251
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </a>
              </div>
              
              <div className="flex items-center space-x-4 group">
                <Mail className="h-5 w-5 text-[#1a1a1a]" />
                <a href="mailto:KNHOANGRE@GMAIL.COM" className="relative">
                  <span className="text-[#1a1a1a] uppercase">
                    KNHOANGRE@GMAIL.COM
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </a>
              </div>
              
              <div className="flex items-center space-x-4 group">
                <MapPin className="h-5 w-5 text-[#1a1a1a]" />
                <span className="relative">
                  <span className="text-[#1a1a1a] uppercase">
                    150 WEST ST, NEEDHAM, MA 02494
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#1a1a1a] group-hover:w-full transition-all duration-300 -translate-x-1/2" />
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <form className="space-y-6">
            <Input type="text" placeholder="NAME" className="uppercase" />
            <Input type="email" placeholder="EMAIL" className="uppercase" />
            <Input type="tel" placeholder="PHONE NUMBER" className="uppercase" />
            <Textarea placeholder="MESSAGE" className="h-32 uppercase" />
            <button className="w-full bg-[#1a1a1a] text-white py-3 rounded-md hover:bg-black/80 transition-colors uppercase">
              SEND MESSAGE
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
