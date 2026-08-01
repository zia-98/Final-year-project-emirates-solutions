import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-brand-pink to-secondary relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Ready to Get Started?
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Explore our products or get in touch to discuss your IT needs and project sponsorship opportunities
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 shadow-xl group h-14 px-8 text-lg font-semibold"
              asChild
            >
              <a href="#contact">
                <Mail className="mr-2 w-5 h-5" />
                Contact Us
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 text-white border-2 border-white hover:bg-white hover:text-primary backdrop-blur-sm h-14 px-8 text-lg font-semibold"
              asChild
            >
              <a href="#services">
                Browse Services
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;