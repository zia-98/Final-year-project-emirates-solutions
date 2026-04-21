import Header from "@/components/Header";
import Services from "@/components/Services";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const ServicesPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-8">
        <Services showAll />
      </div>
      <CTA />
      <Footer />
    </div>
  );
};

export default ServicesPage;
