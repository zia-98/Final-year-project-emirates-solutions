import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, Truck, Shield, Headphones, Award, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import ProductGrid from "@/components/shop/ProductGrid";

const ITHardwareSalesPage = () => {
  const categories = [
    { value: "all", label: "All Categories" },
    // IT Components
    { value: "Monitors & Displays", label: "Monitors & Displays" },
    { value: "Processors & CPUs", label: "Processors & CPUs" },
    { value: "Storage Solutions", label: "Storage & SSDs" },
    // Hardware Sales
    { value: "Printers & Plotters", label: "Printers & Plotters" },
    { value: "CCTV Systems", label: "CCTV & Security" },
    { value: "Networking", label: "Networking Equipment" },
    { value: "Keyboards", label: "Peripherals" },
  ];

  const brands = ["HP", "Dell", "Cisco", "Canon", "Epson", "Hikvision", "Dahua", "Intel", "AMD", "ASUS"];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <Link 
            to="/services" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </Link>

          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg">
              Authorized Partner & Premium Components
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                IT Products & Hardware Sales
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Your one-stop destination for premium computer components, enterprise hardware, networking equipment, and security solutions. 
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Award className="w-5 h-5 text-primary" />
                <span>100% Genuine</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-5 h-5 text-primary" />
                <span>Official Warranty</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Truck className="w-5 h-5 text-primary" />
                <span>Pan India Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Headphones className="w-5 h-5 text-primary" />
                <span>24/7 Expert Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Combined Products Section */}
      <section className="relative">
        <ProductGrid 
          shopTypes={["it-products", "hardware"]} 
          categories={categories}
          title="Browse IT & Hardware Catalog"
        />
      </section>

      {/* Brands Section */}
      <section className="py-16 bg-muted/30 border-y border-muted-foreground/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-10 text-muted-foreground/80">Authorized Dealer For</h2>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
            {brands.map((brand) => (
              <span 
                key={brand} 
                className="text-2xl md:text-3xl font-black text-muted-foreground/20 hover:text-primary/40 transition-all cursor-default select-none uppercase tracking-tighter"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-6 glass rounded-2xl">
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <p className="text-sm font-medium text-muted-foreground">Certified Products</p>
            </div>
            <div className="p-6 glass rounded-2xl">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <p className="text-sm font-medium text-muted-foreground">Genuine Quality</p>
            </div>
            <div className="p-6 glass rounded-2xl">
              <div className="text-4xl font-bold text-primary mb-2">Fast</div>
              <p className="text-sm font-medium text-muted-foreground">Reliable Delivery</p>
            </div>
            <div className="p-6 glass rounded-2xl">
              <div className="text-4xl font-bold text-primary mb-2">Expert</div>
              <p className="text-sm font-medium text-muted-foreground">Technical Guidance</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Need a Custom Infrastructure Solution?</h2>
          <p className="text-white/80 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
            From bulk hardware procurement to custom high-performance workstations, our experts are here to help you scale your business.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" className="shadow-xl" asChild>
              <Link to="/contact">Request Bulk Quote</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
              <Link to="/contact">Technical Consultation</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ITHardwareSalesPage;
