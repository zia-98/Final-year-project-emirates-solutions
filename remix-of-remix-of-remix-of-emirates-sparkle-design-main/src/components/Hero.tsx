import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { COMPANY } from "@/lib/constants";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-morph"></div>
      </div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center space-y-8 animate-fade-in-up">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full shadow-lg">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-sm font-semibold">Rated 4.8/5 • Trusted since {COMPANY.founded}</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight">
              <span className="block mb-2">Innovating Technology</span>
              <span className="gradient-text-primary">
                for Tomorrow
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Your trusted partner for IT products, internships, and innovative solutions in <span className="text-primary font-semibold">{COMPANY.address.city}, {COMPANY.address.state}</span>
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" className="gradient-primary shadow-glow text-white group h-14 px-8 text-lg" asChild>
              <a href="#services">
                Explore Our Services
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="group h-14 px-8 text-lg border-2" asChild>
              <a href="#contact">
                Get in Touch
              </a>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
            <div className="glass p-6 rounded-2xl hover:scale-105 transition-transform">
              <div className="text-4xl md:text-5xl font-bold gradient-text-primary">500+</div>
              <div className="text-sm md:text-base text-muted-foreground mt-2">Projects Completed</div>
            </div>
            <div className="glass p-6 rounded-2xl hover:scale-105 transition-transform">
              <div className="text-4xl md:text-5xl font-bold gradient-text-secondary">1000+</div>
              <div className="text-sm md:text-base text-muted-foreground mt-2">Happy Clients</div>
            </div>
            <div className="glass p-6 rounded-2xl hover:scale-105 transition-transform">
              <div className="text-4xl md:text-5xl font-bold gradient-text-accent">50+</div>
              <div className="text-sm md:text-base text-muted-foreground mt-2">Internships Provided</div>
            </div>
            <div className="glass p-6 rounded-2xl hover:scale-105 transition-transform">
              <div className="text-4xl md:text-5xl font-bold gradient-text-primary">10+</div>
              <div className="text-sm md:text-base text-muted-foreground mt-2">Years Experience</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
