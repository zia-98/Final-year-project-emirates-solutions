import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  FileText, 
  Upload, 
  Search, 
  Trash2, 
  Download, 
  Activity, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye,
  Settings2,
  Users,
  AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:5001";

const recStatusConfig: Record<string, { color: string; icon: any; label: string }> = {
  Shortlist: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Shortlisted" },
  Maybe: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Activity, label: "Maybe" },
  Reject: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle, label: "Reject" },
};

interface Candidate {
  id: number;
  candidate_name: string;
  email: string;
  phone: string;
  skills_matched: string[];
  skills_missing: string[];
  education: string;
  experience_years: number;
  match_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  summary: string;
  status: string;
  resume_filename: string;
  error_message?: string | null;
}

interface Criteria {
  job_title: string;
  required_skills: string;
  preferred_skills: string;
  min_education: string;
  experience_level: string;
  custom_notes: string;
}

const AdminResumeScreening = () => {
  const [criteria, setCriteria] = useState<Criteria>({
    job_title: "",
    required_skills: "",
    preferred_skills: "",
    min_education: "Bachelor's Degree",
    experience_level: "Entry Level",
    custom_notes: ""
  });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(() => {
      if (isProcessing) fetchResults();
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/results`);
      const data = await response.json();
      setCandidates(data);
      const isStillProcessing = data.some((c: Candidate) => c.status === "Processing");
      setIsProcessing(isStillProcessing);
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  const handleSaveCriteria = async () => {
    if (!criteria.job_title || !criteria.required_skills) {
      toast.error("Please fill in Job Title and Required Skills");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/criteria`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria)
      });
      if (response.ok) {
        toast.success("Criteria saved successfully");
      }
    } catch (error) {
      toast.error("Failed to save criteria");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    try {
      setUploadProgress(40);
      const response = await fetch(`${API_BASE}/api/upload-resumes`, {
        method: "POST",
        body: formData
      });
      setUploadProgress(90);
      if (response.ok) {
        toast.success(`${files.length} resumes uploaded`);
        fetchResults();
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleStartScreening = async () => {
    if (candidates.length === 0) {
      toast.error("Please upload resumes first");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/screen`, { method: "POST" });
      if (response.ok) {
        setIsProcessing(true);
        toast.info("AI screening process started");
      }
    } catch (error) {
      toast.error("Failed to start screening");
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to clear all data? This cannot be undone.")) return;
    try {
      await fetch(`${API_BASE}/api/reset`, { method: "DELETE" });
      setCandidates([]);
      toast.success("All data cleared");
    } catch (error) {
      toast.error("Reset failed");
    }
  };

  const handleDownloadCSV = () => {
    window.location.href = `${API_BASE}/api/results/download`;
  };

  const filteredCandidates = candidates.filter(c => 
    c.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Resume Screening Engine">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Criteria Setup */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Screening Criteria</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Job Title</label>
                <Input 
                  value={criteria.job_title} 
                  onChange={e => setCriteria({...criteria, job_title: e.target.value})}
                  placeholder="e.g. Software Engineering Intern" 
                  className="bg-slate-50 border-none h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Required Skills</label>
                <Textarea 
                  value={criteria.required_skills} 
                  onChange={e => setCriteria({...criteria, required_skills: e.target.value})}
                  placeholder="Python, React, SQL..." 
                  className="bg-slate-50 border-none resize-none h-24"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Preferred Skills</label>
                <Textarea 
                  value={criteria.preferred_skills} 
                  onChange={e => setCriteria({...criteria, preferred_skills: e.target.value})}
                  placeholder="Docker, AWS, TypeScript..." 
                  className="bg-slate-50 border-none resize-none h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Experience</label>
                  <Input 
                    value={criteria.experience_level} 
                    onChange={e => setCriteria({...criteria, experience_level: e.target.value})}
                    placeholder="Entry Level" 
                    className="bg-slate-50 border-none h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Education</label>
                  <Input 
                    value={criteria.min_education} 
                    onChange={e => setCriteria({...criteria, min_education: e.target.value})}
                    placeholder="Bachelor's" 
                    className="bg-slate-50 border-none h-11"
                  />
                </div>
              </div>
              <Button onClick={handleSaveCriteria} className="w-full gradient-primary shadow-lg shadow-primary/20 h-12 font-bold mt-4">
                Save & Update Criteria
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Upload Resumes</h3>
            <p className="text-xs text-slate-500 font-medium">Select multiple PDF or DOCX files to begin screening.</p>
            <input 
              type="file" 
              multiple 
              accept=".pdf,.docx" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            <Button 
              variant="outline" 
              className="w-full h-24 border-dashed border-2 hover:bg-slate-50 flex flex-col gap-2 rounded-xl"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 w-full px-4 text-primary">
                  <Activity className="h-6 w-6 animate-spin" />
                  <Progress value={uploadProgress} className="h-1 w-full" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Uploading...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">Drop files here or click to browse</span>
                </>
              )}
            </Button>
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleStartScreening} 
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 gap-2"
                disabled={isProcessing || isUploading || candidates.length === 0}
              >
                {isProcessing ? <Activity className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                {isProcessing ? "AI Screening..." : "Start Screening"}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleReset} 
                className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Results Dashboard */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col h-full min-h-[700px]">
            <CardHeader className="bg-slate-50 border-b py-6 px-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  Screening Queue
                  {candidates.length > 0 && (
                    <Badge className="bg-primary/10 text-primary border-none text-xs px-2 py-0.5 ml-2 font-bold">
                      {candidates.length} Profiles
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-slate-500 font-medium italic">Ranked candidates based on match score</p>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Filter profiles..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 w-48 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <Button 
                  onClick={handleDownloadCSV} 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 text-slate-600 border-slate-200"
                  disabled={candidates.length === 0}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              {candidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-center p-8">
                  <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg leading-tight">No Candidates Yet</h3>
                  <p className="text-slate-400 text-sm max-w-[250px] mt-1 font-medium italic">Upload resumes and define criteria to start the evaluation process.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50 opacity-80 sticky top-0 z-10">
                    <TableRow className="border-b hover:bg-transparent">
                      <TableHead className="font-bold py-4 px-8 text-slate-600 uppercase text-[10px] tracking-wider">Candidate Info</TableHead>
                      <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">Score</TableHead>
                      <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-wider text-center">Recommendation</TableHead>
                      <TableHead className="text-right font-bold px-8 text-slate-600 uppercase text-[10px] tracking-wider">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((c, idx) => {
                      const config = recStatusConfig[c.recommendation] || { color: "bg-slate-100 text-slate-500", icon: Clock, label: c.status };
                      return (
                        <motion.tr 
                          key={c.id} 
                          initial={{ opacity: 0, y: 5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: idx * 0.05 }}
                          className="group border-b last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="py-5 px-8">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 leading-tight tracking-tight">{c.candidate_name || c.resume_filename}</span>
                              <span className="text-xs text-slate-400 mt-1 italic font-medium">
                                {c.status === "Failed" ? (c.error_message || "Screening failed") : (c.email || "Processing info...")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {c.status === "Completed" ? (
                              <div className="flex flex-col items-center gap-1.5 px-4 w-full">
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className={cn("text-xs font-bold leading-none", 
                                    c.match_score >= 80 ? "text-emerald-600" :
                                    c.match_score >= 50 ? "text-blue-600" : "text-amber-600"
                                  )}>
                                    {c.match_score}%
                                  </span>
                                </div>
                                <Progress value={c.match_score} className={cn("h-1.5 w-24", 
                                  c.match_score >= 80 ? "[&>div]:bg-emerald-500" :
                                  c.match_score >= 50 ? "[&>div]:bg-blue-500" : "[&>div]:bg-amber-500"
                                )} />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest italic opacity-60">
                                <Activity className="h-3 w-3 animate-spin"/>
                                {c.status}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {c.status === "Completed" ? (
                                <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 shadow-none", config.color)}>
                                  <config.icon className="h-3.5 w-3.5" />
                                  {config.label}
                                </Badge>
                              ) : (
                                <div className="h-6 w-20 bg-slate-100 animate-pulse rounded-full" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-8">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedCandidate(c)} 
                              className="h-9 px-4 rounded-lg font-bold text-xs gap-2 group-hover:bg-primary group-hover:text-white transition-all"
                              disabled={c.status !== "Completed"}
                            >
                              <Eye className="h-4 w-4" />
                              Details
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Candidate Detail Modal */}
      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-4xl border-none shadow-2xl rounded-2xl p-0 overflow-hidden bg-white">
          <DialogTitle className="sr-only">
            {selectedCandidate ? `${selectedCandidate.candidate_name} candidate review` : "Candidate review"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detailed screening summary, skills analysis, and recommendation for the selected candidate.
          </DialogDescription>
          {selectedCandidate && (
            <>
              <div className={cn("p-8 text-white flex items-center justify-between", 
                recStatusConfig[selectedCandidate.recommendation]?.color.split(' ')[1].replace('text-', 'bg-') || "bg-primary"
              )}>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight">{selectedCandidate.candidate_name}</h2>
                    <Badge className="bg-white/20 text-white border-none py-1 px-3 text-sm font-bold shadow-lg">
                      Match Score: {selectedCandidate.match_score}%
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-white/80 font-medium text-sm">
                    <span>{selectedCandidate.email}</span>
                    <span>•</span>
                    <span>{selectedCandidate.phone}</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <FileText className="h-4 w-4" /> AI Evaluation Summary
                    </h3>
                    <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {selectedCandidate.summary}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Matched Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills_matched.map(s => (
                        <Badge key={s} className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 capitalize">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Missing Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills_missing.map(s => (
                        <Badge key={s} className="bg-red-50 text-red-700 border-red-100 font-bold px-3 py-1 capitalize opacity-80">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                    <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Profile Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-slate-500 italic">Education</span>
                        <span className="text-sm font-bold text-slate-900">{selectedCandidate.education}</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-100 pt-3">
                        <span className="text-sm font-bold text-slate-500 italic">Experience</span>
                        <span className="text-sm font-bold text-slate-900">{selectedCandidate.experience_years} Years</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                      </h3>
                      <ul className="space-y-1.5">
                        {selectedCandidate.strengths.map((s, i) => (
                          <li key={i} className="text-sm font-medium text-slate-600 flex items-start gap-2">
                            <div className="min-w-[4px] min-h-[4px] rounded-full bg-emerald-400 mt-2" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 mt-4">
                      <h3 className="text-[11px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5" /> Improvement Areas
                      </h3>
                      <ul className="space-y-1.5">
                        {selectedCandidate.weaknesses.map((w, i) => (
                          <li key={i} className="text-sm font-medium text-slate-600 flex items-start gap-2">
                            <div className="min-w-[4px] min-h-[4px] rounded-full bg-amber-400 mt-2" /> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end">
                <Button onClick={() => setSelectedCandidate(null)} className="h-11 px-8 rounded-xl font-bold bg-slate-900">
                  Close Review
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const User = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const PlayCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
);

export default AdminResumeScreening;
