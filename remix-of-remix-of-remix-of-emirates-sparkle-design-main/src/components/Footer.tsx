import { useState } from "react";
import { Facebook, Instagram, Linkedin, Youtube, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import emiratesLogo from "@/assets/emirates-logo.jpg";
import { newsletterSchema, getSafeErrorMessage } from "@/lib/validation";
import { COMPANY } from "@/lib/constants";

// Custom X (Twitter) icon
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState("");

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate email with zod schema (client-side for UX)
    const validation = newsletterSchema.safeParse({ email });
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid email";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsSubscribing(true);
    try {
      const sanitizedEmail = validation.data.email;
      
      // Use edge function with rate limiting instead of direct database insert
      const response = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email: sanitizedEmail },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to subscribe");
      }

      const data = response.data;
      
      if (data.alreadySubscribed) {
        toast.info(data.message);
      } else if (data.success) {
        toast.success(data.message);
        setEmail("");
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      const message = getSafeErrorMessage(err);
      toast.error(message);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleContactClick = () => {
    if (location.pathname === "/") {
      // On home page, scroll to contact section
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // On other pages, navigate to contact page
      navigate("/contact");
    }
  };

  return (
    <footer className="bg-foreground text-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src={emiratesLogo} alt={COMPANY.name} className="h-12 w-12 rounded-full" />
              <div>
                <h3 className="font-bold text-lg text-background">{COMPANY.name}</h3>
                <p className="text-sm opacity-80">{COMPANY.tagline}</p>
              </div>
            </div>
            <p className="text-sm opacity-80 mb-6">
              Empowering businesses with comprehensive technology solutions since {COMPANY.founded}. 
              Your trusted partner for innovation and growth in {COMPANY.address.city}, {COMPANY.address.state}.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Facebook, href: COMPANY.social.facebook },
                { Icon: XIcon, href: COMPANY.social.twitter },
                { Icon: Instagram, href: COMPANY.social.instagram },
                { Icon: Linkedin, href: COMPANY.social.linkedin },
                { Icon: Youtube, href: COMPANY.social.youtube },
              ].map(({ Icon, href }, idx) => (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-background">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: 'Home', path: '/' },
                { name: 'About', path: '/about' },
                { name: 'Services', path: '/services' },
                { name: 'Internships', path: '/internships' },
                { name: 'Contact', path: '/contact', scrollTo: true },
              ].map((link) => (
                <li key={link.name}>
                  {link.scrollTo ? (
                    <button 
                      onClick={handleContactClick}
                      className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link to={link.path} className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-background">Services</h4>
            <ul className="space-y-3">
              {[
                { name: 'IT & Hardware Sales', path: '/services/it-hardware-sales' },
                { name: 'Software Licensing', path: '/services/software-licensing' },
                { name: 'Software Solutions', path: '/services/software-solutions' },
                { name: 'Annual Maintenance', path: '/services/amc' },
              ].map((service) => (
                <li key={service.name}>
                  <Link to={service.path} className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-background">Stay Updated</h4>
            <p className="text-sm opacity-80 mb-4">
              Subscribe to our newsletter for latest updates and offers.
            </p>
            <form onSubmit={handleNewsletterSubscribe} className="space-y-2 mb-6">
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className={`bg-background/10 border-background/20 text-background placeholder:text-background/50 ${error ? 'border-red-400' : ''}`}
                  disabled={isSubscribing}
                  maxLength={255}
                  aria-invalid={!!error}
                  aria-describedby={error ? "newsletter-error" : undefined}
                />
                <Button variant="secondary" size="icon" type="submit" disabled={isSubscribing}>
                  {isSubscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                </Button>
              </div>
              {error && (
                <p id="newsletter-error" className="text-xs text-red-400">{error}</p>
              )}
            </form>
            <div className="space-y-2 text-sm opacity-80">
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="block hover:opacity-100 transition-opacity">📞 {COMPANY.phone}</a>
              <a href={`mailto:${COMPANY.email}`} className="block hover:opacity-100 transition-opacity">✉️ {COMPANY.email}</a>
              <p>📍 {COMPANY.address.city}, {COMPANY.address.state}, {COMPANY.address.country}</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-80">
            <p>© {new Date().getFullYear()} {COMPANY.name}. All rights reserved. | Owner: {COMPANY.owner}</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:opacity-100 transition-opacity">Privacy Policy</Link>
              <Link to="/terms" className="hover:opacity-100 transition-opacity">Terms of Service</Link>
              <Link to="/cookies" className="hover:opacity-100 transition-opacity">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
