import { Package, GraduationCap, Code, Wrench, ShoppingCart, Shield, BookOpen, Award, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ServicesProps {
  showAll?: boolean;
}

const Services = ({ showAll = false }: ServicesProps) => {
  const services = [
    {
      icon: Package,
      title: "IT Products & Hardware Sales",
      description: "One-stop destination for premium computer components, enterprise hardware, and security solutions.",
      gradient: "gradient-primary",
      link: "/services/it-hardware-sales"
    },
    {
      icon: GraduationCap,
      title: "Internships & Training",
      description: "Hands-on training programs and internship opportunities for aspiring IT professionals.",
      gradient: "gradient-secondary",
      link: "/internships"
    },
    {
      icon: Code,
      title: "Software Solutions",
      description: "Custom software development and technology consulting services for businesses.",
      gradient: "gradient-accent",
      link: "/services/software-solutions"
    },
    {
      icon: Shield,
      title: "Software Licensing",
      description: "Genuine software licenses, antivirus solutions, and enterprise software packages.",
      gradient: "gradient-accent",
      link: "/services/software-licensing"
    },
    {
      icon: Wrench,
      title: "AMC Services",
      description: "Annual maintenance contracts ensuring your systems run smoothly year-round.",
      gradient: "gradient-primary",
      link: "/services/amc"
    }
  ];

  const displayedServices = showAll ? services : services.slice(0, 5);

  return (
    <section id="services" className="py-20 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-secondary/30 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Services</span>
          <h2 className="text-4xl md:text-5xl font-bold">
            Comprehensive <span className="gradient-text-primary">IT Solutions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tailored to meet your technology and educational needs with excellence and innovation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {displayedServices.map((service, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-glow transition-all duration-300 hover:-translate-y-2 glass border-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className={`w-16 h-16 rounded-xl ${service.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {service.description}
                </CardDescription>
                <Button variant="link" className="mt-4 p-0 h-auto text-primary font-semibold group-hover:translate-x-2 transition-transform" asChild>
                  <Link to={service.link}>
                    Learn More →
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!showAll && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/services">View All Services</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
