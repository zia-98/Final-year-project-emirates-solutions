import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import FeedbackQuest from "@/components/FeedbackQuest";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Upload, CheckCircle, Smile } from "lucide-react";
import { InternshipType } from "@/components/Internships";
import { useInternships } from "@/hooks/useInternships";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { internshipApplicationSchema, validateForm, getSafeErrorMessage } from "@/lib/validation";
import { generateRoadmap, Roadmap } from "@/lib/RoadmapGenerator";
import RoadmapView from "@/components/RoadmapView";
import { BookOpen } from "lucide-react";
import { sendInternshipEmail, sendAdminNewApplication, sendAdminInternshipStockAlert } from "@/lib/resend";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  program: string;
  education: string;
  experience: string;
  preferredType: InternshipType | "";
  stipendAmount?: string;
  resume: File | null;
  motivation: string;
  availability: string;
  linkedIn: string;
}

const InternshipApply = () => {
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("program");
  const { user, profile } = useAuth();
  const { internships, loading: loadingInternships } = useInternships();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    fullName: profile?.full_name || "",
    email: profile?.email || user?.email || "",
    phone: profile?.phone || "",
    program: programId || "",
    education: "",
    experience: "",
    preferredType: "",
    stipendAmount: "",
    resume: null,
    motivation: "",
    availability: "",
    linkedIn: "",
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      fullName: prev.fullName || profile?.full_name || "",
      email: prev.email || profile?.email || user?.email || "",
      phone: prev.phone || profile?.phone || "",
      program: prev.program || programId || ""
    }));
  }, [user, profile, programId]);

  const [showRoadmap, setShowRoadmap] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<Roadmap | null>(null);

  const handleOpenSavedResume = async () => {
    if (!profile?.resume_url) return;

    if (profile.resume_url.startsWith("http")) {
      window.open(profile.resume_url, "_blank", "noopener,noreferrer");
      return;
    }

    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(profile.resume_url, 60);

    if (error || !data?.signedUrl) {
      toast.error("Failed to open saved resume");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleGenerateRoadmap = async () => {
    if (selectedProgram) {
      const studentProfile = `Education: ${formData.education}, Experience: ${formData.experience}, Motivation: ${formData.motivation}`;
      const availability = formData.availability;
      
      const roadmap = await generateRoadmap(
        selectedProgram.title, 
        selectedProgram.duration || "8 weeks",
        studentProfile,
        availability
      );
      setGeneratedRoadmap(roadmap);
      setShowRoadmap(true);
    }
  };


  const selectedProgram = internships.find(i => i.id === formData.program);

  const handleChange = (field: keyof FormData, value: string | File | null) => {
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

    // Must be logged in to submit
    if (!user) {
      toast.error("Please sign in to submit your application");
      return;
    }

    // Validate form data (excluding resume which is handled separately)
    const validationData = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      program: formData.program,
      education: formData.education,
      preferredType: formData.preferredType,
      stipendAmount: formData.stipendAmount,
      experience: formData.experience,
      motivation: formData.motivation,
      availability: formData.availability,
      linkedIn: formData.linkedIn,
    };

    const validation = validateForm(internshipApplicationSchema, validationData);
    const formErrors = { ...(validation.errors || {}) };
    let hasErrors = !validation.success;

    if (formData.preferredType === "stipend" && (!formData.stipendAmount || formData.stipendAmount.trim() === "")) {
      formErrors.stipendAmount = "Please enter expected stipend amount per month";
      hasErrors = true;
    }

    if (selectedProgram && selectedProgram.available_slots !== undefined && selectedProgram.available_slots <= 0) {
      toast.error("This program is currently full and not accepting new applications");
      return;
    }

    if (hasErrors) {
      setErrors(formErrors);
      toast.error("Please fix the errors in the form");
      return;
    }

    setSubmitting(true);

    try {
      const { data: existingApps, error: appsError } = await supabase
        .from("internship_applications")
        .select("program_id, status")
        .eq("user_id", user.id);

      if (appsError) {
        throw appsError;
      }

      if (existingApps && existingApps.length > 0) {
        // Rule 1: Prevent duplicate applications to the exact same program
        if (existingApps.some(app => app.program_id === validationData.program)) {
          toast.error("You have already applied to this internship program.");
          setSubmitting(false);
          return;
        }

        // Rule 2: Prevent second application if one is still being processed
        // "wait until first one complete"
        if (existingApps.some(app => app.status === 'pending' || app.status === 'reviewing')) {
          toast.error("You have an active application being processed. Please wait until it is complete before applying again.");
          setSubmitting(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error validating previous applications:", error);
      // We log but don't strictly block application if there's a network glitch here, 
      // though typically if this fails, the next insert will probably also fail.
    }

    let resumeUrl: string | null = profile?.resume_url || null;

    // Upload resume if provided
    if (formData.resume) {
      // Validate file size (5MB limit)
      if (formData.resume.size > 5 * 1024 * 1024) {
        toast.error("Resume file must be less than 5MB");
        setSubmitting(false);
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(formData.resume.type)) {
        toast.error("Resume must be a PDF, DOC, or DOCX file");
        setSubmitting(false);
        return;
      }

      const fileExt = formData.resume.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, formData.resume);

      if (uploadError) {
        toast.error("Failed to upload resume. Please try again.");
        setSubmitting(false);
        return;
      }

      resumeUrl = uploadData.path;

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || validation.data!.fullName,
          phone: profile?.phone || validation.data!.phone,
          username: profile?.username || null,
          resume_url: resumeUrl,
        });

      if (profileUpdateError) {
        console.error("Failed to update saved resume in profile:", profileUpdateError);
      }
    }

    try {
      const finalMotivation = formData.preferredType === "stipend" && formData.stipendAmount
        ? `${validation.data!.motivation}\n\nExpected Stipend: ${formData.stipendAmount}/month`
        : validation.data!.motivation;

      const { error } = await supabase
        .from("internship_applications")
        .insert({
          user_id: user.id,
          full_name: validation.data!.fullName,
          email: validation.data!.email,
          phone: validation.data!.phone,
          program_id: validation.data!.program,
          education: validation.data!.education as any,
          preferred_type: validation.data!.preferredType as any,
          experience: validation.data!.experience || null,
          motivation: finalMotivation,
          availability: validation.data!.availability,
          linkedin_url: validation.data!.linkedIn || null,
          resume_url: resumeUrl,
        });

      if (error) {
        throw error;
      }

      // Send confirmation email 
      await sendInternshipEmail(
        validation.data!.email,
        validation.data!.fullName,
        selectedProgram?.title || "Internship Program",
        'submitted'
      );

      // Check for Low Stock Alert (if available_slots is now <= 5)
      // Since the trigger will decrement the count, we check the current state
      if (selectedProgram && selectedProgram.available_slots !== undefined) {
        const currentSlots = selectedProgram.available_slots - 1; // Anticipate the result of the trigger
        if (currentSlots <= 5) {
          await sendAdminInternshipStockAlert({
            ...selectedProgram,
            available_slots: currentSlots
          });
        }
      }

      setSubmitted(true);
      setShowFeedback(true);
      toast.success("Application submitted successfully!");

    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleChange("resume", e.target.files[0]);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Header />

        <section className="py-16 bg-gradient-to-br from-background via-primary/5 to-secondary/5 min-h-[60vh] flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
              <p className="text-muted-foreground mb-4">
                Thank you for applying to our internship program. We've received your application
                and will review it carefully.
              </p>
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-8 animate-pulse text-primary flex items-center justify-center gap-2">
                <Smile className="w-5 h-5" />
                <span className="text-sm font-bold">Please share your feedback while we process your request</span>
              </div>


              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link to="/internships">View More Programs</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </div>
          <FeedbackQuest open={showFeedback} onOpenChange={(open) => {
            setShowFeedback(open);
            if (!open) navigate("/applications");
          }} />
        </section>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <section className="py-16 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <Link
            to="/internships"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Internships
          </Link>

          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Apply for <span className="gradient-text-primary">Internship</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Fill out the form below to apply for our internship programs
              </p>
            </div>

            {/* Form */}
            <div className="glass p-8 md:p-12 rounded-3xl animate-scale-in">
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        maxLength={100}
                        className={errors.fullName ? "border-destructive" : ""}
                        aria-invalid={!!errors.fullName}
                        disabled={submitting}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
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
                        disabled={submitting}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
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
                        disabled={submitting}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedIn">LinkedIn Profile (Optional)</Label>
                      <Input
                        id="linkedIn"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={formData.linkedIn}
                        onChange={(e) => handleChange("linkedIn", e.target.value)}
                        maxLength={500}
                        className={errors.linkedIn ? "border-destructive" : ""}
                        aria-invalid={!!errors.linkedIn}
                        disabled={submitting}
                      />
                      {errors.linkedIn && (
                        <p className="text-sm text-destructive">{errors.linkedIn}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Program Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Program Selection</h3>

                  <div className="space-y-2">
                    <Label htmlFor="program">Select Program *</Label>
                    <Select
                      value={formData.program}
                      onValueChange={(value) => handleChange("program", value)}
                      disabled={submitting}
                    >
                      <SelectTrigger className={errors.program ? "border-destructive" : ""}>
                        <SelectValue placeholder="Choose an internship program" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingInternships ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">Loading programs...</div>
                        ) : internships.length > 0 ? (
                          internships.map((internship) => (
                            <SelectItem key={internship.id} value={internship.id}>
                              {internship.title} - {internship.duration} ({internship.type})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">No programs found</div>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.program && (
                      <p className="text-sm text-destructive">{errors.program}</p>
                    )}
                  </div>

                  {selectedProgram && (
                    <div className="p-4 bg-muted rounded-lg text-sm">
                      <p><strong>Duration:</strong> {selectedProgram.duration}</p>
                      <p><strong>Level:</strong> {selectedProgram.level}</p>
                      <p><strong>Type:</strong> {selectedProgram.type}</p>
                      <p><strong>Topics:</strong> {selectedProgram.topics?.join(", ") || "N/A"}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferredType">Preferred Internship Type *</Label>
                      <Select
                        value={formData.preferredType}
                        onValueChange={(value) => handleChange("preferredType", value as InternshipType)}
                        disabled={submitting}
                      >
                        <SelectTrigger className={errors.preferredType ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select internship type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="stipend">Stipend</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.preferredType && (
                        <p className="text-sm text-destructive">{errors.preferredType}</p>
                      )}
                    </div>

                    {formData.preferredType === "stipend" && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                        <Label htmlFor="stipendAmount">Expected Stipend per Month *</Label>
                        <Input
                          id="stipendAmount"
                          placeholder="e.g. ₹10,000"
                          value={formData.stipendAmount || ""}
                          onChange={(e) => handleChange("stipendAmount", e.target.value)}
                          disabled={submitting}
                          className={errors.stipendAmount ? "border-destructive" : ""}
                        />
                        {errors.stipendAmount && (
                          <p className="text-sm text-destructive">{errors.stipendAmount}</p>
                        )}
                      </div>
                    )}

                    {formData.preferredType === "paid" && selectedProgram && selectedProgram.training_fee && (
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-1">
                        <p className="text-sm font-medium text-primary">
                          Training Fee to be paid: {selectedProgram.training_fee}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This fee is required for the paid internship program and will be shown to the admin.
                        </p>
                      </div>
                    )}

                    {formData.preferredType === "paid" && selectedProgram && !selectedProgram.training_fee && (
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-1">
                        <p className="text-sm font-medium text-primary">
                          Training Fee to be paid: Applicable fees will be communicated later.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Education & Experience */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Education & Experience</h3>

                  <div className="space-y-2">
                    <Label htmlFor="education">Highest Education *</Label>
                    <Select
                      value={formData.education}
                      onValueChange={(value) => handleChange("education", value)}
                      disabled={submitting}
                    >
                      <SelectTrigger className={errors.education ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select your education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="diploma">Diploma</SelectItem>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.education && (
                      <p className="text-sm text-destructive">{errors.education}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Relevant Experience</Label>
                    <Textarea
                      id="experience"
                      placeholder="Describe any relevant experience, projects, or skills..."
                      className={`min-h-[100px] ${errors.experience ? "border-destructive" : ""}`}
                      value={formData.experience}
                      onChange={(e) => handleChange("experience", e.target.value)}
                      maxLength={2000}
                      disabled={submitting}
                    />
                    {errors.experience && (
                      <p className="text-sm text-destructive">{errors.experience}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resume">Upload Resume/CV</Label>
                    {profile?.resume_url && !formData.resume && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary flex flex-wrap items-center gap-3">
                        <span>Saved resume found. It will be used for this application.</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleOpenSavedResume}
                          disabled={submitting}
                        >
                          View Saved Resume
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={submitting}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('resume')?.click()}
                        className="gap-2"
                        disabled={submitting}
                      >
                        <Upload className="w-4 h-4" />
                        {formData.resume ? formData.resume.name : profile?.resume_url ? "Replace Saved Resume" : "Choose File"}
                      </Button>
                      <span className="text-sm text-muted-foreground">PDF, DOC, DOCX (Max 5MB)</span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="motivation">Why do you want to join this program? *</Label>
                    <Textarea
                      id="motivation"
                      placeholder="Tell us about your goals and what you hope to achieve..."
                      className={`min-h-[120px] ${errors.motivation ? "border-destructive" : ""}`}
                      value={formData.motivation}
                      onChange={(e) => handleChange("motivation", e.target.value)}
                      maxLength={2000}
                      disabled={submitting}
                    />
                    {errors.motivation && (
                      <p className="text-sm text-destructive">{errors.motivation}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability *</Label>
                    <Select
                      value={formData.availability}
                      onValueChange={(value) => handleChange("availability", value)}
                      disabled={submitting}
                    >
                      <SelectTrigger className={errors.availability ? "border-destructive" : ""}>
                        <SelectValue placeholder="When can you start?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediately">Immediately</SelectItem>
                        <SelectItem value="2-weeks">Within 2 weeks</SelectItem>
                        <SelectItem value="1-month">Within 1 month</SelectItem>
                        <SelectItem value="2-months">Within 2 months</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.availability && (
                      <p className="text-sm text-destructive">{errors.availability}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full gradient-primary shadow-glow" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InternshipApply;
