import Header from "@/components/Header";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const ContactPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-8">
        <Contact />
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;
