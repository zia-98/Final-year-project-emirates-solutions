import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Phone, Mail, UserCircle, Upload, FileText } from "lucide-react";

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    username: "",
    resume_url: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        username: profile.username || "",
        resume_url: profile.resume_url || ""
      });
    }
  }, [profile]);

  const handleOpenSavedResume = async () => {
    if (!formData.resume_url) return;

    if (formData.resume_url.startsWith("http")) {
      window.open(formData.resume_url, "_blank", "noopener,noreferrer");
      return;
    }

    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(formData.resume_url, 60);

    if (error || !data?.signedUrl) {
      toast.error("Failed to open saved resume");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      let resumeUrl = formData.resume_url || null;

      if (resumeFile) {
        if (resumeFile.size > 5 * 1024 * 1024) {
          toast.error("Resume file must be less than 5MB");
          setLoading(false);
          return;
        }

        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(resumeFile.type)) {
          toast.error("Resume must be a PDF, DOC, or DOCX file");
          setLoading(false);
          return;
        }

        const fileExt = resumeFile.name.split(".").pop();
        const fileName = `${user.id}/profile_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(fileName, resumeFile);

        if (uploadError) {
          toast.error("Failed to upload resume. Please try again.");
          setLoading(false);
          return;
        }

        resumeUrl = uploadData.path;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: formData.full_name,
          phone: formData.phone,
          username: formData.username.trim() === "" ? null : formData.username.trim(),
          resume_url: resumeUrl,
        });

      if (error) throw error;
      await refreshProfile();
      setResumeFile(null);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow py-16 bg-gradient-to-br from-background via-primary/5 to-secondary/5 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 max-w-3xl relative z-10 animate-fade-in">
          
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              My <span className="gradient-text-primary">Profile</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your personal information
            </p>
          </div>

          <div className="glass p-8 md:p-12 rounded-3xl animate-scale-in">
            <div className="flex flex-col md:flex-row gap-10 items-start">
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4 w-full md:w-1/3">
                <div className="h-32 w-32 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner shadow-primary/20 ring-4 ring-primary/5">
                  <User className="h-16 w-16" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{formData.full_name || "User"}</h3>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1 whitespace-nowrap">
                    <Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{user?.email}</span>
                  </p>
                </div>
              </div>

              {/* Form Section */}
              <div className="w-full md:w-2/3">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-primary" />
                      Full Name
                    </Label>
                    <Input 
                      id="full_name" 
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      className="bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Username
                    </Label>
                    <Input 
                      id="username" 
                      placeholder="Choose a cool username"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      className="bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      Phone Number
                    </Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resume_upload" className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Resume (PDF, DOC, DOCX)
                    </Label>
                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        id="resume_upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        disabled={loading}
                      />
                      {formData.resume_url && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleOpenSavedResume}
                          disabled={loading}
                        >
                          View Saved Resume
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {resumeFile
                        ? `Selected: ${resumeFile.name}`
                        : formData.resume_url
                          ? "A resume is already saved. Upload a new one to replace it."
                          : "No resume saved yet."}
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full gradient-primary shadow-glow hover:scale-[1.02] transition-transform"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {loading ? "Saving Changes..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
