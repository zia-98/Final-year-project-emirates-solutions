import Header from "@/components/Header";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-8">
        <About />
      </div>
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
};

export default AboutPage;
