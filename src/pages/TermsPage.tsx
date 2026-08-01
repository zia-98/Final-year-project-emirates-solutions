import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">Terms of Service</h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: January 2024</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using our services, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Use of Services</h2>
              <p className="text-muted-foreground mb-4">
                You agree to use our services only for lawful purposes and in accordance with these Terms. 
                You are responsible for maintaining the confidentiality of your account information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Products and Services</h2>
              <p className="text-muted-foreground mb-4">
                All products and services are subject to availability. We reserve the right to discontinue 
                any product or service at any time. Prices are subject to change without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                All content on this website, including text, graphics, logos, and software, is the property 
                of Emirates Solutions and is protected by intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                Emirates Solutions shall not be liable for any indirect, incidental, special, or consequential 
                damages arising out of or in connection with your use of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us at legal@emiratessolutions.com.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;