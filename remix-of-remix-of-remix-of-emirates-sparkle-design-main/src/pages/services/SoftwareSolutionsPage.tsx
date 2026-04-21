import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CTA from "@/components/CTA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Globe, Smartphone, Database, Cloud, ShoppingCart, FileCode, Settings, ArrowLeft, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import ServiceBookingModal from "@/components/ServiceBookingModal";

const SoftwareSolutionsPage = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");

  const handleBookNow = (serviceName: string) => {
    setSelectedService(serviceName);
    setBookingOpen(true);
  };

  const services = [
    { icon: Globe, name: "Web Development", description: "Custom websites and web applications built with modern technologies" },
    { icon: Smartphone, name: "Mobile Apps", description: "iOS and Android applications for your business" },
    { icon: Database, name: "Database Solutions", description: "Design and optimization of database systems" },
    { icon: Cloud, name: "Cloud Integration", description: "AWS, Azure, and Google Cloud deployments" },
    { icon: ShoppingCart, name: "E-Commerce", description: "Online stores and payment integration" },
    { icon: FileCode, name: "API Development", description: "RESTful and GraphQL API solutions" },
    { icon: Settings, name: "DevOps", description: "CI/CD pipelines and infrastructure automation" },
    { icon: Code, name: "Custom Software", description: "Tailored software solutions for unique business needs" },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-accent/10 to-background">
        <div className="container mx-auto px-4">
          <Link to="/services" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>
          <div className="max-w-3xl">
            <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center mb-6 shadow-lg">
              <Code className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Software <span className="gradient-text-primary">Solutions</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Custom software development and technology consulting services for businesses of all sizes. 
              From concept to deployment, we bring your ideas to life.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gradient-primary shadow-glow h-12 px-8" onClick={() => handleBookNow("General Software Inquiry")}>
                Start Your Project
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4 text-center">Our Development Services</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Explore our specialized development services designed to help your business scale and succeed in the digital era.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="glass group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 border-primary/5">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="min-h-[48px]">{service.description}</CardDescription>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-primary hover:bg-primary/5 font-semibold group/btn"
                    onClick={() => handleBookNow(service.name)}
                  >
                    <span>Book Service</span>
                    <Calendar className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Development Process</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Discovery", desc: "Understanding your requirements" },
              { step: "02", title: "Design", desc: "Creating the blueprint" },
              { step: "03", title: "Development", desc: "Building your solution" },
              { step: "04", title: "Deployment", desc: "Launching & support" },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="text-5xl font-bold text-primary/10 mb-4 group-hover:text-primary/30 transition-colors duration-300">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA />
      <Footer />

      <ServiceBookingModal 
        open={bookingOpen} 
        onOpenChange={setBookingOpen}
        serviceType={selectedService}
      />
    </div>
  );
};

export default SoftwareSolutionsPage;