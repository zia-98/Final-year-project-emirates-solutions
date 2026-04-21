import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CTA from "@/components/CTA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, PhoneCall, CheckCircle, Settings, Shield, Zap, HeartPulse, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AMCServicesPage = () => {
  const services = [
    { icon: Clock, name: "Preventive Maintenance", description: "Regular scheduled maintenance visits" },
    { icon: PhoneCall, name: "24/7 Support", description: "Round-the-clock technical assistance" },
    { icon: Zap, name: "Emergency Response", description: "Quick response for critical issues" },
    { icon: Settings, name: "Hardware Servicing", description: "Repair and replacement of components" },
    { icon: Shield, name: "Security Updates", description: "Regular security patches and updates" },
    { icon: HeartPulse, name: "System Health Checks", description: "Comprehensive system diagnostics" },
    { icon: CheckCircle, name: "Performance Tuning", description: "Optimization for peak performance" },
    { icon: Wrench, name: "Complete IT Support", description: "End-to-end maintenance coverage" },
  ];

  const plans = [
    { name: "Basic", price: "999", features: ["Quarterly visits", "Email support", "Basic hardware coverage", "8-hour response time"] },
    { name: "Professional", price: "2,499", features: ["Monthly visits", "Phone & email support", "Full hardware coverage", "4-hour response time", "Software updates"] },
    { name: "Enterprise", price: "Custom", features: ["Weekly visits", "24/7 priority support", "Complete coverage", "2-hour response time", "Dedicated technician", "Custom SLA"] },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <Link to="/services" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>
          <div className="max-w-3xl">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg">
              <Wrench className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AMC <span className="gradient-text-primary">Services</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Annual maintenance contracts ensuring your systems run smoothly year-round. 
              Proactive maintenance to prevent downtime.
            </p>
            <Button size="lg" className="gradient-primary shadow-glow" asChild>
              <Link to="/contact">Get AMC Quote</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">What's Covered</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="glass hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">AMC Plans</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`glass ${index === 1 ? "ring-2 ring-primary scale-105" : ""}`}>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary mt-4">
                    {plan.price === "Custom" ? "Custom" : `₹${plan.price}`}
                    {plan.price !== "Custom" && <span className="text-base font-normal text-muted-foreground">/year</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant={index === 1 ? "default" : "outline"} asChild>
                    <Link to="/contact">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </div>
  );
};

export default AMCServicesPage;