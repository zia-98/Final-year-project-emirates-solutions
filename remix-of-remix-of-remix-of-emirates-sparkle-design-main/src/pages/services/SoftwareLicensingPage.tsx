import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CTA from "@/components/CTA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileKey, Cloud, Database, Mail, FileSpreadsheet, Palette, Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SoftwareLicensingPage = () => {
  const licenses = [
    { icon: FileKey, name: "Microsoft 365", description: "Office suite and cloud services" },
    { icon: Shield, name: "Antivirus Solutions", description: "Norton, Kaspersky, BitDefender" },
    { icon: Cloud, name: "Cloud Platforms", description: "AWS, Azure, Google Cloud credits" },
    { icon: Database, name: "Database Software", description: "Oracle, SQL Server, MySQL Enterprise" },
    { icon: Palette, name: "Adobe Creative Suite", description: "Complete creative cloud packages" },
    { icon: Mail, name: "Email Security", description: "Spam filters and email protection" },
    { icon: FileSpreadsheet, name: "ERP Systems", description: "SAP, Oracle, Microsoft Dynamics" },
    { icon: Lock, name: "Security Software", description: "Endpoint protection and firewalls" },
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
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Software <span className="gradient-text-primary">Licensing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Genuine software licenses, antivirus solutions, and enterprise software packages. 
              Official partner for all major software vendors.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gradient-primary shadow-glow px-8" asChild>
                <Link to="/contact?service=software-licensing">Apply for License</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Get Expert Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Licenses Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Software Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {licenses.map((license, index) => (
              <Card key={index} className="glass hover:shadow-glow transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <license.icon className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">{license.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{license.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <h3 className="text-4xl font-bold text-primary mb-2">100%</h3>
              <p className="text-muted-foreground">Genuine Licenses</p>
            </div>
            <div className="p-6">
              <h3 className="text-4xl font-bold text-primary mb-2">Best</h3>
              <p className="text-muted-foreground">Market Prices</p>
            </div>
            <div className="p-6">
              <h3 className="text-4xl font-bold text-primary mb-2">Expert</h3>
              <p className="text-muted-foreground">License Management</p>
            </div>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </div>
  );
};

export default SoftwareLicensingPage;