import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternships } from "@/hooks/useInternships";
import { toast } from "sonner";
import {
  Sparkles,
  Target,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Briefcase,
  GraduationCap,
  BrainCircuit,
  CheckCircle2,
  Calendar,
  Clock,
  History,
  FileText,
  Upload,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { ProctoredTest } from "./proctor/ProctoredTest";
import { AnimatePresence } from "framer-motion";

// Set worker source for PDF.js
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Recommendation {
  id: string;
  title: string; // Changed from name to title to match DB
  matchScore: number;
  matchedSkills: string[];
  reasoning: string;
  domain: string;
}

interface StudentProfile {
  skills: string;
  interests: string;
  projects: string;
  education: string;
  preferredDomain: string;
  pythonLevel: string;
  sqlLevel: string;
  javaLevel: string;
  availability: string;
  resumeText: string;
  locationPreference: string;
}

const InternshipRecommendations = () => {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(false);
  const { internships } = useInternships();
  
  const [profile, setProfile] = useState<StudentProfile>({
    skills: "", 
    interests: "",
    projects: "",
    education: "",
    preferredDomain: "",
    pythonLevel: "Beginner",
    sqlLevel: "Beginner",
    javaLevel: "Beginner",
    availability: "20",
    resumeText: "",
    locationPreference: "Remote",
  });

  const [history, setHistory] = useState<any[]>([]);
  const [showProctor, setShowProctor] = useState(false);
  const [proctorCategory, setProctorCategory] = useState("");
  const [hasTakenTest, setHasTakenTest] = useState(false);

  const invokeAiRecommendations = async (body: Record<string, unknown>) => {
    return supabase.functions.invoke("ai-recommendations", {
      body,
    });
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await invokeAiRecommendations({
        action: "get_history",
        user_id: user.id,
      });
      if (error) throw error;
      if (data?.history) setHistory(data.history);
    } catch (e) {
      console.error("History fetch error", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const processResumeFile = async (file: File, persistAsSaved: boolean) => {
    setUploading(true);
    let text = "";

    try {
      if (file.type === "application/pdf") {
        text = await extractTextFromPDF(file);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        text = await extractTextFromDocx(file);
      } else if (file.type === "text/plain") {
        text = await file.text();
      } else {
        toast.error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
        setUploading(false);
        return;
      }

      if (!text.trim()) {
        toast.error("Could not extract text from file.");
        setUploading(false);
        return;
      }

      setProfile(prev => ({ ...prev, resumeText: text }));

      if (user && persistAsSaved) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file);

        if (uploadError) {
          console.error("Error uploading resume:", uploadError);
        } else {
          console.log("Resume uploaded successfully:", filePath);

          const { error: profileUpdateError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              email: user.email,
              full_name: authProfile?.full_name || null,
              phone: authProfile?.phone || null,
              username: authProfile?.username || null,
              resume_url: uploadData.path,
            });

          if (profileUpdateError) {
            console.error("Failed to save resume in profile:", profileUpdateError);
          } else {
            await refreshProfile();
          }
        }
      }

      toast.info("Resume parsed! analyzing details...");

      // Auto-fill using AI
      const { data, error } = await invokeAiRecommendations({
        action: "parse_resume",
        resumeText: text,
      });

      if (error) throw error;

      if (data?.profile) {
        console.log("Extracted Profile Data:", data.profile);
        const extracted = data.profile;
        setProfile(prev => ({
          ...prev,
          skills: extracted.skills || prev.skills,
          interests: extracted.interests || prev.interests,
          projects: extracted.projects || prev.projects,
          education: extracted.education || prev.education,
          preferredDomain: extracted.preferredDomain || prev.preferredDomain,
          pythonLevel: extracted.pythonLevel || prev.pythonLevel,
          sqlLevel: extracted.sqlLevel || prev.sqlLevel,
          javaLevel: extracted.javaLevel || prev.javaLevel,
          locationPreference: extracted.locationPreference || prev.locationPreference,
          resumeText: text, 
        }));
        toast.success("Profile auto-filled from resume!");
      } else {
        console.warn("AI returned no profile data:", data);
      }

    } catch (error: any) {
      console.error("Error parsing resume:", error);
      const msg = error.message || "Unknown error";
      const details = error.context?.details || "";
      toast.error(`Failed to parse resume: ${msg} ${details}. You can still fill details manually.`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processResumeFile(file, true);
    // Allow selecting the same file again and still trigger onChange.
    e.target.value = "";
  };

  const handleUseSavedResume = async () => {
    if (!authProfile?.resume_url) {
      toast.error("No saved resume found in your profile");
      return;
    }

    if (authProfile.resume_url.startsWith("http")) {
      toast.error("Saved resume cannot be auto-read from an external URL. Please upload it manually.");
      return;
    }

    setUploading(true);
    try {
      const { data, error } = await supabase.storage
        .from("resumes")
        .download(authProfile.resume_url);

      if (error || !data) {
        toast.error("Failed to load saved resume");
        return;
      }

      const fileName = authProfile.resume_url.split("/").pop() || "resume";
      const extension = fileName.split(".").pop()?.toLowerCase();

      if (!["pdf", "docx", "txt"].includes(extension || "")) {
        toast.error("Saved resume format must be PDF, DOCX, or TXT for AI parsing.");
        return;
      }

      const mimeType =
        extension === "pdf"
          ? "application/pdf"
          : extension === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "text/plain";

      const file = new File([data], fileName, { type: mimeType });
      await processResumeFile(file, false);
    } finally {
      setUploading(false);
    }
  };

  const getRecommendations = async (skipAssessment: boolean = false) => {
    // Basic validation
    if (!profile.interests || !profile.education) {
      toast.error("Please fill in the required fields");
      return;
    }

    setLoading(true);
    try {
      // call Python Flask API
      const response = await fetch("http://localhost:5001/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentProfile: profile, user_id: user?.id, top_n: 5 }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data?.recommendations) {
        // Map python IDs to real UUIDs to prevent database trigger errors
        const validRecommendations = data.recommendations.map((rec: any) => {
          const realInternship = internships.find((i: any) => 
            i.title.toLowerCase().trim() === rec.title.toLowerCase().trim() || 
            i.domain.toLowerCase().trim() === rec.domain.toLowerCase().trim()
          );
          if (realInternship) {
            return { ...rec, id: realInternship.id };
          }
          return rec;
        });
        
        // Filter out recommendations that do not exist in the database (they keep their integer ID)
        const filteredRecommendations = validRecommendations.filter((rec: any) => 
          typeof rec.id === 'string' && rec.id.length > 10 // UUIDs are much longer than python's '1', '2'
        );
        
        setRecommendations(filteredRecommendations);
        setShowForm(false);
        toast.success("AI Analysis Complete (Python Service)!");

        // Trigger Proctored Test for the top recommendation domain
        // GUARD: Only trigger if they haven't just taken a test and don't already have results
        if (filteredRecommendations.length > 0 && !hasTakenTest && !skipAssessment) {
          const topDomain = filteredRecommendations[0].domain.replace(" Intern", "");
          setProctorCategory(topDomain);
          
          // Persistence Check (Phase 3)
          const checkAssessmentHistory = async () => {
            if (!user) return;
            
            const { data: attempts, error } = await supabase
              .from("assessment_attempts")
              .select("id")
              .eq("user_id", user.id)
              .eq("category", topDomain)
              .eq("status", "completed")
              .limit(1);

            if (!error && (!attempts || attempts.length === 0)) {
              // Small delay to let the user see the recommendations first
              setTimeout(() => setShowProctor(true), 1500);
            } else if (!error) {
              console.log(`Assessment already verified for ${topDomain}. Skipping proctor.`);
            }
          };
          
          checkAssessmentHistory();
        }

        // Save to History (Explicitly)
        if (user) {
          try {
            const { data: hData, error: historyError } = await invokeAiRecommendations({
              action: "save_history",
              user_id: user.id,
              studentProfile: profile,
              recommendations: filteredRecommendations,
            });
            
            if (historyError) {
              console.error("Error saving history:", historyError);
              toast.error(`Recommendations generated, but failed to save to history: ${historyError.message || "Unknown error"}`);
            } else {
              console.log("History saved successfully!");
              fetchHistory(); // Refresh history list
            }
          } catch (err) {
            console.error("History operation failed:", err);
            toast.error("Could not update recommendation history.");
          }
        }
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast.error("Failed to get recommendations. Ensure Python Service is running!");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(true);
    setRecommendations([]);
    setHasTakenTest(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-orange-500";
  };

  if (!user) {
    return (
      <Card className="glass border-2 border-primary/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
            <BrainCircuit className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            AI Career Matcher
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Unlock your potential with personalized internship recommendations powered by advanced AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-6">
          <Button asChild size="lg" className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <Link to="/auth">Sign In to Start Matching</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="glass border-2 border-primary/20 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-spin-slow" />
          </div>
          <CardTitle className="text-2xl font-bold animate-pulse">
            Analyzing Your Profile...
          </CardTitle>
          <CardDescription>
            Our AI is evaluating your skills, resume, and preferences against our database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 max-w-2xl mx-auto">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Matching Skills & Resume...</span>
              <span>65%</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-8">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showProctor && (
          <ProctoredTest 
            category={proctorCategory} 
            onClose={() => setShowProctor(false)}
            onComplete={(finalScore, level) => {
              console.log("Assessment completed with score:", finalScore, "Level:", level);
              setHasTakenTest(true);
              
              // Update local state and re-trigger recommendation
              setProfile(prev => {
                const updated = { ...prev };
                const cat = proctorCategory.toLowerCase();
                if (cat.includes("python")) updated.pythonLevel = level;
                else if (cat.includes("java")) updated.javaLevel = level;
                else if (cat.includes("sql")) updated.sqlLevel = level;
                
                // Immediately request fresh recommendations with updated level
                // We'll use a small timeout to let the result screen be visible for a moment if onClose is called
                return updated;
              });

              // Close test and refresh
              setShowProctor(false);
              toast.info("Refining your recommendations based on assessment...");
              setTimeout(() => {
                getRecommendations(true);
              }, 1000);
            }}
          />
        )}
      </AnimatePresence>

      <Card className="glass border-2 border-primary/10 shadow-xl overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <BrainCircuit className="w-64 h-64" />
      </div>

      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                AI Internship Recommendations
              </span>
            </CardTitle>
            <CardDescription className="mt-1 text-base">
              {showForm
                ? "Complete your profile to let our AI find your perfect career match."
                : "We found these opportunities specifically tailored to your profile."}
            </CardDescription>
          </div>
          {!showForm && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm} className="shadow-sm hover:bg-primary/5">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refine Profile
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-primary/5 p-1 rounded-xl">
            <TabsTrigger value="new" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">New Recommendation</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              History ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-0">
            {showForm ? (
              <div className="space-y-8 max-w-4xl mx-auto py-4">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-6">
                    <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" /> Core Technical Levels
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="python" className="text-xs">Python Level</Label>
                          <Select value={profile.pythonLevel} onValueChange={(v) => setProfile({ ...profile, pythonLevel: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="sql" className="text-xs">SQL Level</Label>
                          <Select value={profile.sqlLevel} onValueChange={(v) => setProfile({ ...profile, sqlLevel: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="java" className="text-xs">Java Level</Label>
                          <Select value={profile.javaLevel} onValueChange={(v) => setProfile({ ...profile, javaLevel: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interests" className="text-base font-semibold flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-primary" /> Professional Interests
                      </Label>
                      <Textarea
                        id="interests"
                        placeholder="e.g., Web Development, Artificial Intelligence, Mobile Apps..."
                        value={profile.interests}
                        onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                        rows={3}
                        className="resize-none focus-visible:ring-primary/50"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="advancedMode"
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={advancedMode}
                        onChange={(e) => setAdvancedMode(e.target.checked)}
                      />
                      <Label htmlFor="advancedMode" className="text-sm font-medium cursor-pointer">
                        Enable Resume Analysis (For Higher Education Students)
                      </Label>
                    </div>

                    {advancedMode && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <Label className="text-base font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" /> Auto-Fill from Resume
                        </Label>
                        {authProfile?.resume_url && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleUseSavedResume}
                            disabled={uploading}
                            className="w-full sm:w-auto"
                          >
                            Use Saved Resume from Profile
                          </Button>
                        )}
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="cursor-pointer file:text-primary file:font-semibold hover:file:bg-primary/10"
                          />
                          {uploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Upload PDF, DOCX, or TXT. AI will extract skills and auto-fill the form.
                        </p>

                        <div className="border-t border-primary/10 my-2"></div>

                        <Label htmlFor="resume" className="text-sm font-medium flex items-center gap-2">
                          Resume Text Content
                        </Label>
                        <Textarea
                          id="resume"
                          placeholder="Paste text manually or upload file above..."
                          value={profile.resumeText}
                          onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })}
                          rows={6}
                          className="resize-none focus-visible:ring-primary/50 font-mono text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="education" className="text-base font-semibold flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" /> Current Education Level
                      </Label>
                      <Select
                        value={profile.education}
                        onValueChange={(value) => setProfile({ ...profile, education: value })}
                      >
                        <SelectTrigger className="h-11">
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="domain" className="text-base font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" /> Preferred Domain (Optional)
                      </Label>
                      <Select
                        value={profile.preferredDomain || "no-preference"}
                        onValueChange={(value) =>
                          setProfile({
                            ...profile,
                            preferredDomain: value === "no-preference" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select preferred domain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-preference">No preference</SelectItem>
                          <SelectItem value="Software Testing Intern">Software Testing</SelectItem>
                          <SelectItem value="Cybersecurity Intern">Cybersecurity</SelectItem>
                          <SelectItem value="Web Development Intern">Web Development</SelectItem>
                          <SelectItem value="Digital Marketing Intern">Digital Marketing</SelectItem>
                          <SelectItem value="Data Analytics Intern">Data Analytics</SelectItem>
                          <SelectItem value="Cloud Computing Intern">Cloud Computing</SelectItem>
                          <SelectItem value="AI/ML Intern">AI/ML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projects" className="text-base font-semibold flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" /> Key Projects
                      </Label>
                      <Textarea
                        id="projects"
                        placeholder="Describe your major projects or internships..."
                        value={profile.projects}
                        onChange={(e) => setProfile({ ...profile, projects: e.target.value })}
                        rows={3}
                        className="resize-none focus-visible:ring-primary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="availability" className="text-base font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" /> Availability (Hrs/Wk)
                        </Label>
                        <Input
                          type="number"
                          id="availability"
                          value={profile.availability}
                          onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                          min="5" max="60"
                          className="h-11 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-base font-semibold flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary" /> Location
                        </Label>
                        <Select
                          value={profile.locationPreference}
                          onValueChange={(v) => setProfile({ ...profile, locationPreference: v })}
                        >
                          <SelectTrigger className="h-11 shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Remote">Remote</SelectItem>
                            <SelectItem value="In-office">In-office</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={() => getRecommendations()}
                        className="w-full h-12 text-lg gradient-primary shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                        disabled={!profile.education}
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {advancedMode ? "Analyze Profile & Resume" : "Generate Recommendations"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {recommendations.map((rec, idx) => (
                  <div
                    key={rec.id}
                    className={`relative p-6 rounded-xl border transition-all duration-300 group ${idx === 0
                        ? "bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-primary/30 shadow-md scale-[1.01]"
                        : "bg-card/50 hover:bg-card hover:shadow-md border-border/50"
                      }`}
                  >
                    {idx === 0 && (
                      <div className="absolute -top-3 left-6">
                        <Badge className="bg-gradient-to-r from-primary to-purple-600 border-0 shadow-lg px-3 py-1 text-xs uppercase tracking-wider font-bold">
                          <Sparkles className="w-3 h-3 mr-1" /> Best Match
                        </Badge>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold tracking-tight text-foreground/90">{rec.title}</h3>
                            <Badge variant="outline" className="text-xs font-normal">
                              {rec.domain}
                            </Badge>
                          </div>

                          <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-background/80 border border-primary/10 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                            <BrainCircuit className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-primary mb-1">AI Career Insight:</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{rec.reasoning}</p>
                            </div>
                          </div>
                        </div>

                        {rec.matchedSkills.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-black uppercase tracking-wide">Matched Skills:</span>
                            {rec.matchedSkills.map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs text-black border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col items-center justify-between gap-4 md:border-l md:pl-6 md:min-w-[140px]">
                        <div className="text-center">
                          <div className={`text-3xl font-bold mb-1 ${getScoreColor(rec.matchScore)}`}>
                            {rec.matchScore}%
                          </div>
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Match Score</span>
                        </div>

                        <Button className="w-full md:w-auto" asChild>
                          <Link to={`/internships/apply?program=${rec.id}`}>
                            Apply Now <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {recommendations.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Target className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No matches found</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                      We couldn't find any internships matching your exact profile. Try broadening your interests or adding more skills.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={resetForm}>
                      Adjust Profile
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {history.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center text-muted-foreground">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <History className="w-8 h-8 opacity-50" />
                </div>
                <p className="font-medium">No history yet</p>
                <p className="text-sm mt-1">Generate your first recommendation to see it here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((h) => (
                  <div key={h.id} className="border rounded-xl p-5 bg-card hover:shadow-md transition-all border-primary/10">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                        <Calendar className="w-4 h-4" />
                        {new Date(h.created_at).toLocaleDateString()}
                        <span className="w-1 h-1 bg-primary/30 rounded-full mx-1"></span>
                        <Clock className="w-4 h-4" />
                        {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-primary/20 text-primary">
                          {h.recommendations?.length || 0} Matches Found
                        </Badge>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {(h.recommendations || []).slice(0, 3).map((rec: any) => (
                        <div key={rec.id} className="p-4 bg-background rounded-lg border flex flex-col justify-between h-full group hover:border-primary/30 transition-colors">
                          <div>
                            <div className="font-semibold line-clamp-1 mb-1 group-hover:text-primary transition-colors">{rec.title}</div>
                            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Target className="w-3 h-3" /> {rec.domain}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className={`font-bold ${getScoreColor(rec.matchScore)}`}>{rec.matchScore}% Match</span>
                            <Link to={`/internships/apply?program=${rec.id}`} className="text-primary hover:underline">View</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      </Card>
    </>
  );
};

export default InternshipRecommendations;
