import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { contactFormSchema, validateForm, getSafeErrorMessage } from "@/lib/validation";
import { COMPANY } from "@/lib/constants";
import InteractiveMap from "@/components/InteractiveMap";
import { sendEmail, sendAdminNewContact } from "@/lib/resend";

interface FormData {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const service = searchParams.get("service");
    if (service === "software-licensing") {
      setFormData(prev => ({
        ...prev,
        subject: "Software Licensing Inquiry",
        message: "I am interested in applying for a software license. Please provide more details on available options and pricing."
      }));
    } else if (service) {
      setFormData(prev => ({
        ...prev,
        subject: `${service.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Inquiry`
      }));
    }
  }, [searchParams]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const validation = validateForm(contactFormSchema, formData);
    if (!validation.success) {
      setErrors(validation.errors || {});
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Send admin alert for new contact
      await sendAdminNewContact(formData);

      toast.success("Message sent! We'll get back to you soon.");
      setFormData({
        name: "",
        phone: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get in <span className="gradient-text-primary">Touch</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Ready to start your project or have questions? We're here to help!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="glass p-8 rounded-2xl animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    maxLength={100}
                    className={errors.name ? "border-destructive" : ""}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    maxLength={20}
                    className={errors.phone ? "border-destructive" : ""}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p id="phone-error" className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  maxLength={255}
                  className={errors.email ? "border-destructive" : ""}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="How can we help you?"
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  maxLength={200}
                  className={errors.subject ? "border-destructive" : ""}
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? "subject-error" : undefined}
                  disabled={isSubmitting}
                />
                {errors.subject && (
                  <p id="subject-error" className="text-sm text-destructive">{errors.subject}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your project or inquiry..."
                  className={`min-h-[120px] ${errors.message ? "border-destructive" : ""}`}
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  maxLength={2000}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "message-error" : undefined}
                  disabled={isSubmitting}
                />
                {errors.message && (
                  <p id="message-error" className="text-sm text-destructive">{errors.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary shadow-glow"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Cards */}
            <div className="glass p-6 rounded-2xl animate-scale-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="text-muted-foreground hover:text-primary transition-colors block">
                    {COMPANY.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <a href={`mailto:${COMPANY.email}`} className="text-muted-foreground hover:text-primary transition-colors block">
                    {COMPANY.email}
                  </a>
                  <a href={`mailto:${COMPANY.emailSupport}`} className="text-muted-foreground hover:text-primary transition-colors block">
                    {COMPANY.emailSupport}
                  </a>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-muted-foreground">
                    {COMPANY.name}<br />
                    {COMPANY.address.line1}<br />
                    {COMPANY.address.city}, {COMPANY.address.state}<br />
                    {COMPANY.address.country} - {COMPANY.address.pincode}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Office Hours</h3>
                  <p className="text-muted-foreground">{COMPANY.hours.weekdays}</p>
                  <p className="text-muted-foreground">{COMPANY.hours.saturday}</p>
                  <p className="text-muted-foreground">{COMPANY.hours.sunday}</p>
                </div>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <InteractiveMap height="h-64" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
