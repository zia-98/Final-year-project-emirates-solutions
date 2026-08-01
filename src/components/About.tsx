import { CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";

const About = () => {
  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 animate-fade-in">
              <div className="inline-block">
                <span className="text-primary font-semibold text-sm uppercase tracking-wider">About Us</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                About <span className="gradient-text-primary">{COMPANY.name}</span>
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Located in {COMPANY.address.city}, {COMPANY.address.state}, {COMPANY.address.country}, {COMPANY.name} is a leading provider of IT products, services, and educational support. We bridge the gap between technology and education, empowering students and businesses alike.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our commitment to excellence and innovation has made us the preferred partner for academic institutions and businesses seeking reliable IT solutions and mentorship.
              </p>

              <div className="space-y-3 pt-4">
                {[
                  "Quality IT Products & Components",
                  "Professional Training & Internships",
                  "Custom Software Development",
                  "Dedicated Customer Support"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <Button size="lg" className="gradient-primary shadow-glow text-white" asChild>
                  <a href="#contact">Learn More About Us</a>
                </Button>
              </div>
            </div>

            {/* Right Content - Logo Card */}
            <div className="relative animate-scale-in">
              <div className="glass p-12 rounded-3xl shadow-lg">
                <div className="aspect-square rounded-2xl bg-white p-8 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto rounded-full gradient-primary flex items-center justify-center text-white text-4xl font-bold shadow-glow">
                      ES
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{COMPANY.name}</h3>
                      <p className="text-primary font-semibold">Technology Innovation</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary/20 rounded-full blur-2xl -z-10"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl -z-10"></div>
            </div>
          </div>

          {/* CEO Section */}
          <div className="mt-20 pt-16 border-t border-border">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* CEO Photo */}
              <div className="relative order-2 lg:order-1">
                <div className="glass p-8 rounded-3xl shadow-lg max-w-sm mx-auto lg:mx-0">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <User className="w-32 h-32 text-muted-foreground/50" />
                    </div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl -z-10"></div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl -z-10"></div>
              </div>

              {/* CEO Info */}
              <div className="space-y-6 order-1 lg:order-2">
                <div className="inline-block">
                  <span className="text-primary font-semibold text-sm uppercase tracking-wider">Leadership</span>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                  Meet Our <span className="gradient-text-primary">Founder</span>
                </h3>
                
                <div className="space-y-4">
                  <h4 className="text-2xl font-semibold text-foreground">{COMPANY.owner}</h4>
                  <p className="text-primary font-medium">Founder & CEO</p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    With over a decade of experience in the IT industry, {COMPANY.owner} has been instrumental in 
                    transforming {COMPANY.name} from a small startup into a leading technology partner 
                    for businesses and educational institutions across India.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    His vision of bridging the gap between technology and education has driven the company's 
                    commitment to providing quality IT products, innovative software solutions, and 
                    comprehensive internship programs that empower the next generation of tech professionals.
                  </p>
                  <div className="pt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Education:</span> B.Tech in Computer Science
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Experience:</span> 10+ years in IT Industry
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Contact:</span> {COMPANY.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
