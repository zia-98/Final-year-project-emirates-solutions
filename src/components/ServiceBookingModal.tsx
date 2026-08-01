import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { serviceBookingSchema, validateForm, getSafeErrorMessage } from "@/lib/validation";
import { sendAdminNewServiceBooking } from "@/lib/resend";

interface ServiceBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceType?: string;
}

const ServiceBookingModal = ({ open, onOpenChange, serviceType = "" }: ServiceBookingModalProps) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    serviceType: serviceType || "",
    brief: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || "",
        email: user.email || "",
        phone: profile.phone || "",
      }));
    }
  }, [user, profile]);

  useEffect(() => {
    if (serviceType) {
      setFormData(prev => ({ ...prev, serviceType }));
    }
  }, [serviceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validation = validateForm(serviceBookingSchema, formData);
    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    setLoading(true);

    try {
      const { error: dbError } = await supabase
        .from("service_bookings")
        .insert({
          user_id: user?.id || null,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          service_type: formData.serviceType,
          brief: formData.brief,
        });

      if (dbError) throw dbError;

      // Notify Admin
      const emailResponse = await sendAdminNewServiceBooking({
        ...formData,
        service_type: formData.serviceType
      });

      if (emailResponse && !emailResponse.success) {
        console.warn("Admin notification email failed:", emailResponse.error);
        toast.warning("Inquiry saved, but admin alert failed. We will still see your request in the dashboard.");
      }

      setSuccess(true);
      toast.success("Project inquiry submitted successfully!");
      
      // Auto close after 3 seconds or on manual close
      setTimeout(() => {
        if (success) onOpenChange(false);
      }, 5000);

    } catch (error) {
      console.error("Booking error:", error);
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setSuccess(false);
        // Reset non-user fields if needed
        setFormData(prev => ({ ...prev, brief: "" }));
      }
    }}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        {success ? (
          <div className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl mb-2">Inquiry Submitted!</DialogTitle>
            <DialogDescription className="text-lg">
              Thank you for reaching out. Our team will review your requirements and get back to you within 24 hours.
            </DialogDescription>
            <Button className="mt-8 w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Book Software Service</DialogTitle>
              <DialogDescription>
                Tell us about your project requirements and we'll provide a custom proposal.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={errors.fullName ? "border-destructive ring-destructive/20" : ""}
                  />
                  {errors.fullName && <p className="text-[10px] text-destructive font-medium">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? "border-destructive ring-destructive/20" : ""}
                  />
                  {errors.email && <p className="text-[10px] text-destructive font-medium">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceType" className="text-sm font-semibold text-primary">Service Type</Label>
                  <Input
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    readOnly
                    className="bg-muted font-bold text-primary border-primary/20 cursor-default"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brief" className="text-sm font-semibold">Project Brief / Requirements</Label>
                <Textarea
                  id="brief"
                  name="brief"
                  placeholder="Please describe your project goals, features, and any specific technologies you have in mind..."
                  className={`min-h-[120px] resize-none ${errors.brief ? "border-destructive ring-destructive/20" : ""}`}
                  value={formData.brief}
                  onChange={handleInputChange}
                />
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-muted-foreground">Detailed briefs help us provide better estimates.</p>
                  {errors.brief && <p className="text-[10px] text-destructive font-medium">{errors.brief}</p>}
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full gradient-primary shadow-glow h-11 text-lg font-bold group" 
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Submit Inquiry
                      <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingModal;
