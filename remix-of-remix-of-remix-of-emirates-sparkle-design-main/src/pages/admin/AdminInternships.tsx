import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  Eye, 
  Download, 
  Plus, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Activity, 
  Briefcase, 
  GraduationCap, 
  CalendarDays,
  Trash2,
  FileText,
  MapPin,
  Clock3,
  IndianRupee,
  Layers,
  Globe,
  Mail,
  Phone,
  Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { sendInternshipEmail } from "@/lib/resend";
import { cn } from "@/lib/utils";

const appStatusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, label: "Pending" },
  reviewing: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Activity, label: "Reviewing" },
  accepted: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Accepted" },
  rejected: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle, label: "Rejected" },
};

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  education: string;
  preferred_type: string;
  program_id: string;
  availability: string;
  motivation: string;
  experience: string | null;
  linkedin_url: string | null;
  resume_url: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
}

interface Internship {
  id: string;
  title: string;
  company?: string;
  location: string;
  type: string;
  stipend?: string;
  training_fee?: string;
  duration: string;
  description: string;
  skills_required: string[];
  category: string;
  domain: string;
  available_slots: number;
  total_slots: number;
  created_at?: string;
}

const AdminInternships = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<"applications" | "listings">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [existingDomains, setExistingDomains] = useState<string[]>([]);
  const [isAddInternshipOpen, setIsAddInternshipOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [newInternship, setNewInternship] = useState<Partial<Internship>>({});
  const [customCategory, setCustomCategory] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomDomain, setShowCustomDomain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [internshipTypeFilter, setInternshipTypeFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("internship_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to fetch applications");
    else setApplications(data || []);
    setLoading(false);
  };

  const fetchInternships = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("internships")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to fetch internships");
    else {
      const fetchedInternships = (data as Internship[]) || [];
      setInternships(fetchedInternships);
      const categories = Array.from(new Set(fetchedInternships.map(i => i.category).filter(Boolean))) as string[];
      const domains = Array.from(new Set(fetchedInternships.map(i => i.domain).filter(Boolean))) as string[];
      setExistingCategories(categories.sort());
      setExistingDomains(domains.sort());
    }
    setLoading(false);
  };

  const handleAddInternship = async () => {
    const finalCategory = showCustomCategory ? customCategory : newInternship.category;
    const finalDomain = showCustomDomain ? customDomain : newInternship.domain;

    if (!newInternship.title || !newInternship.type || !finalCategory || !finalDomain) {
      toast.error("Required fields missing");
      return;
    }

    if (newInternship.type === "Paid" && !newInternship.training_fee) {
      toast.error("Training Fee is required"); return;
    }

    if (newInternship.type === "Stipend" && !newInternship.stipend) {
      toast.error("Stipend Amount is required"); return;
    }

    const payload: Partial<Internship> = {
      title: newInternship.title,
      location: newInternship.location,
      type: newInternship.type,
      duration: newInternship.duration,
      description: newInternship.description,
      skills_required: Array.isArray(newInternship.skills_required) ? newInternship.skills_required : [],
      category: finalCategory,
      domain: finalDomain,
      company: newInternship.company || undefined,
      available_slots: newInternship.available_slots !== undefined ? Number(newInternship.available_slots) : 10,
      total_slots: newInternship.total_slots !== undefined ? Number(newInternship.total_slots) : 10,
    };

    if (newInternship.type === "Paid") { payload.training_fee = newInternship.training_fee; payload.stipend = null; }
    else if (newInternship.type === "Stipend") { payload.stipend = newInternship.stipend; payload.training_fee = null; }
    else { payload.stipend = null; payload.training_fee = null; }

    const { error } = editingInternship 
      ? await supabase.from('internships').update(payload).eq('id', editingInternship.id)
      : await supabase.from('internships').insert([payload]);

    if (error) toast.error("Operation failed");
    else {
      toast.success(editingInternship ? "Program updated" : "Program added");
      closeDialog();
      fetchInternships();
    }
  };

  const handleDeleteInternship = async (id: string) => {
    if (!confirm("Remove this program?")) return;
    const { error } = await supabase.from('internships').delete().eq('id', id);
    if (error) toast.error("Deletion failed");
    else { toast.success("Program removed"); fetchInternships(); }
  };

  const openAddDialog = () => {
    setEditingInternship(null); setNewInternship({}); setCustomCategory("");
    setCustomDomain(""); setShowCustomCategory(false); setShowCustomDomain(false);
    setIsAddInternshipOpen(true);
  };

  const openEditDialog = (internship: Internship) => {
    setEditingInternship(internship); setNewInternship(internship);
    if (internship.category && !existingCategories.includes(internship.category)) {
      setShowCustomCategory(true); setCustomCategory(internship.category);
    } else { setShowCustomCategory(false); setCustomCategory(""); }

    if (internship.domain && !existingDomains.includes(internship.domain)) {
      setShowCustomDomain(true); setCustomDomain(internship.domain);
    } else { setShowCustomDomain(false); setCustomDomain(""); }
    setIsAddInternshipOpen(true);
  };

  const closeDialog = () => {
    setIsAddInternshipOpen(false); setEditingInternship(null); setNewInternship({});
    setCustomCategory(""); setCustomDomain(""); setShowCustomCategory(false); setShowCustomDomain(false);
  };

  useEffect(() => {
    if (!isAdmin) return;

    if (activeTab === "applications") fetchApplications();
    else fetchInternships();

    // Subscribe to applications changes
    const appChannel = supabase
      .channel('admin-applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internship_applications' }, (payload) => {
        console.log('Real-time application change:', payload);
        if (payload.eventType === 'INSERT') {
          setApplications(prev => [payload.new as Application, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setApplications(prev => prev.map(a => a.id === payload.new.id ? payload.new as Application : a));
        } else if (payload.eventType === 'DELETE') {
          setApplications(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to internships changes
    const internshipChannel = supabase
      .channel('admin-internships')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internships' }, (payload) => {
        console.log('Real-time internship change:', payload);
        if (payload.eventType === 'INSERT') {
          setInternships(prev => [payload.new as Internship, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setInternships(prev => prev.map(i => i.id === payload.new.id ? payload.new as Internship : i));
        } else if (payload.eventType === 'DELETE') {
          setInternships(prev => prev.filter(i => i.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(appChannel);
      supabase.removeChannel(internshipChannel);
    };
  }, [isAdmin, activeTab]);


  const handleStatusUpdate = async (id: string, newStatus: "pending" | "reviewing" | "accepted" | "rejected") => {
    const application = applications.find((app) => app.id === id);
    const { error } = await supabase.from("internship_applications").update({ status: newStatus }).eq("id", id);

    if (error) toast.error("Status update failed");
    else {
      toast.success("Status updated");
      if (application && (newStatus === "accepted" || newStatus === "rejected" || newStatus === "reviewing")) {
        const emailResult = await sendInternshipEmail(application.email, application.full_name, application.program_id.replace(/-/g, " "), newStatus);
        if (!emailResult.success) console.warn("Internship notification email failed:", emailResult.error);
      }
      if (application?.user_id) {
        try {
          await supabase.functions.invoke("send-application-notification", {
            body: { applicationId: id, userId: application.user_id, applicantEmail: application.email, applicantName: application.full_name, newStatus, programName: application.program_id.replace(/-/g, " ") },
          });
          toast.success("Notification sent");
        } catch (e) { console.error(e); }
      }
      fetchApplications();
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || app.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesType = internshipTypeFilter === "all" || app.preferred_type.toLowerCase() === internshipTypeFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  const appStats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
  };

  const listingStats = {
    total: internships.length,
    paid: internships.filter(i => i.type === 'Paid').length,
    stipend: internships.filter(i => i.type === 'Stipend').length,
    unpaid: internships.filter(i => i.type === 'Unpaid').length,
  };

  if (authLoading) {
    return (
      <AdminLayout title="Internship Management">
        <Skeleton className="h-96 rounded-2xl" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Internship Core">
      <div className="space-y-8">
        {/* Modern Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit border shadow-inner">
          <button
            onClick={() => setActiveTab("applications")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "applications" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <FileText className="h-4 w-4" />
            Applications
          </button>
          <button
            onClick={() => setActiveTab("listings")}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "listings" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Briefcase className="h-4 w-4" />
            Program Listings
          </button>
        </div>

        {/* Dynamic Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeTab === "applications" ? (
            <>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Apps</p>
                      <h3 className="text-2xl font-bold mt-1">{appStats.total}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
                      <h3 className="text-2xl font-bold mt-1 text-orange-600">{appStats.pending}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Clock className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Reviewing</p>
                      <h3 className="text-2xl font-bold mt-1 text-blue-600">{appStats.reviewing}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Activity className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Accepted</p>
                      <h3 className="text-2xl font-bold mt-1 text-emerald-600">{appStats.accepted}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Programs</p>
                      <h3 className="text-2xl font-bold mt-1">{listingStats.total}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Briefcase className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Training</p>
                      <h3 className="text-2xl font-bold mt-1 text-blue-600">{listingStats.paid}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Stipend</p>
                      <h3 className="text-2xl font-bold mt-1 text-emerald-600">{listingStats.stipend}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <IndianRupee className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Free/Unpaid</p>
                      <h3 className="text-2xl font-bold mt-1 text-slate-600">{listingStats.unpaid}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                      <Layers className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b py-6 px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">
                {activeTab === "applications" ? "Applicants Hub" : "Curriculum Catalog"}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1 font-medium italic">
                {activeTab === "applications" ? "Monitor and finalize incoming talent requests" : "Architect and publish new internship programs"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {activeTab === "applications" ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Candidate search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 w-full sm:w-64 bg-white border shadow-sm rounded-xl focus:ring-primary/20"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 w-full sm:w-40 bg-white border shadow-sm rounded-xl">
                      <SelectValue placeholder="All Apps" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.keys(appStatusConfig).map(s => (
                        <SelectItem key={s} value={s}>{appStatusConfig[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={internshipTypeFilter} onValueChange={setInternshipTypeFilter}>
                    <SelectTrigger className="h-10 w-full sm:w-40 bg-white border shadow-sm rounded-xl font-bold">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Stipend">Stipend</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <div className="flex gap-3">
                  <Select value={internshipTypeFilter} onValueChange={setInternshipTypeFilter}>
                    <SelectTrigger className="h-10 w-full sm:w-40 bg-white border shadow-sm rounded-xl font-bold">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Paid">Paid Only</SelectItem>
                      <SelectItem value="Stipend">Stipend Only</SelectItem>
                      <SelectItem value="Unpaid">Unpaid Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={openAddDialog} className="h-10 px-6 rounded-xl gradient-primary shadow-lg shadow-primary/20 gap-2 font-bold">
                    <Plus className="h-4 w-4" />
                    New Program
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              {activeTab === "applications" ? (
                /* --- APPLICATIONS VIEW --- */
                <motion.div
                  key="apps"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {loading ? (
                    <div className="p-8 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : filteredApplications.length === 0 ? (
                    <div className="py-20 text-center">
                      <FileText className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">No applications found in this category</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="font-bold text-slate-600 py-4 px-8">Candidate</TableHead>
                            <TableHead className="font-bold text-slate-600">Application</TableHead>
                            <TableHead className="font-bold text-slate-600">Type</TableHead>
                            <TableHead className="font-bold text-slate-600 text-center">Status</TableHead>
                            <TableHead className="font-bold text-slate-600">Submission</TableHead>
                            <TableHead className="text-right font-bold text-slate-600 px-8">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredApplications.map((app, idx) => {
                            const config = appStatusConfig[app.status] || appStatusConfig.pending;
                            return (
                              <motion.tr
                                key={app.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="group hover:bg-slate-50/50 border-b last:border-0 transition-colors"
                              >
                                <TableCell className="py-5 px-8">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 leading-none">{app.full_name}</span>
                                    <span className="text-xs text-slate-400 mt-1 italic tracking-tight">{app.email}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 text-sm capitalize leading-none">{app.program_id.replace(/-/g, " ")}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{app.education.replace("-", " ")}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="rounded-md font-bold text-[10px] uppercase border-slate-200 text-slate-500 bg-slate-50 px-2 py-0.5">
                                    {app.preferred_type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-center">
                                    <Badge className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 shadow-none", config.color)}>
                                      <config.icon className="h-3 w-3" />
                                      {config.label}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm font-medium text-slate-500">
                                  {format(new Date(app.created_at), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right px-8">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedApplication(app)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-52 p-2 shadow-2xl rounded-xl border-none">
                                        <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">Set Decision</DropdownMenuLabel>
                                        {Object.keys(appStatusConfig).map(s => {
                                          const sConf = appStatusConfig[s as keyof typeof appStatusConfig];
                                          return (
                                            <DropdownMenuItem key={s} onClick={() => handleStatusUpdate(app.id, s as "pending" | "reviewing" | "accepted" | "rejected")} className="rounded-lg h-10 px-3 cursor-pointer mt-0.5">
                                              <sConf.icon className={cn("mr-2 h-4 w-4", app.status === s ? "text-primary" : "text-slate-400")} />
                                              <span className="text-sm font-medium">{sConf.label}</span>
                                            </DropdownMenuItem>
                                          );
                                        })}
                                        <DropdownMenuSeparator />
                                        {app.resume_url && (
                                          <DropdownMenuItem onClick={() => window.open(app.resume_url!, "_blank")} className="rounded-lg h-10 px-3 text-blue-600 font-bold cursor-pointer">
                                            <Download className="mr-2 h-4 w-4" /> CV / Resume
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* --- INTERNSHIPS VIEW --- */
                <motion.div
                  key="listings"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-b">
                          <TableHead className="font-bold text-slate-600 py-4 px-8">Program Designation</TableHead>
                          <TableHead className="font-bold text-slate-600">Entity & Location</TableHead>
                          <TableHead className="font-bold text-slate-600">Contract</TableHead>
                          <TableHead className="font-bold text-slate-600">Financials</TableHead>
                          <TableHead className="font-bold text-slate-600">Availability</TableHead>
                          <TableHead className="text-right font-bold text-slate-600 px-8">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {internships
                          .filter(i => internshipTypeFilter === "all" || i.type === internshipTypeFilter)
                          .map((internship, idx) => (
                          <motion.tr
                            key={internship.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="group hover:bg-slate-50/50 border-b last:border-0 transition-colors"
                          >
                            <TableCell className="py-5 px-8">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 leading-none">{internship.title}</span>
                                <div className="flex gap-2 mt-2">
                                  <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-bold uppercase">{internship.domain}</Badge>
                                  <Badge className="bg-purple-50 text-purple-700 border-purple-100 text-[9px] font-bold uppercase">{internship.category}</Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 text-sm">
                                <span className="font-bold text-slate-700 flex items-center gap-1.5"><Globe className="h-3 w-3 opacity-40" /> {internship.company || "Independent"}</span>
                                <span className="text-slate-400 flex items-center gap-1.5"><MapPin className="h-3 w-3 opacity-40" /> {internship.location}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 text-sm font-medium">
                                <span className="text-slate-900">{internship.type}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5"><Clock3 className="h-3 w-3 opacity-40" /> {internship.duration}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col justify-center">
                                {internship.type === "Paid" ? (
                                  <div className="text-orange-600 font-bold flex flex-col">
                                    <span className="text-xs uppercase tracking-tighter opacity-60">Program Fee</span>
                                    <span>{internship.training_fee}</span>
                                  </div>
                                ) : internship.type === "Stipend" ? (
                                  <div className="text-emerald-600 font-bold flex flex-col">
                                    <span className="text-xs uppercase tracking-tighter opacity-60">Grant Amount</span>
                                    <span>{internship.stipend}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-sm">Open/Unpaid</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  "font-bold text-sm",
                                  internship.available_slots <= 0 ? "text-red-600" : 
                                  internship.available_slots <= 3 ? "text-orange-600" : "text-slate-700"
                                )}>
                                  {internship.available_slots} / {internship.total_slots} Slots
                                </span>
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden border">
                                  <div 
                                    className={cn(
                                      "h-full transition-all",
                                      internship.available_slots <= 0 ? "bg-red-500" : 
                                      internship.available_slots <= 3 ? "bg-orange-500" : "bg-primary"
                                    )} 
                                    style={{ width: `${Math.min(100, (internship.available_slots / (internship.total_slots || 10)) * 100)}%` }} 
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-8">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(internship)} className="h-8 rounded-lg font-bold text-xs">Edit</Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50" onClick={() => handleDeleteInternship(internship.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddInternshipOpen} onOpenChange={setIsAddInternshipOpen}>
        <DialogContent className="max-w-2xl border-none shadow-2xl rounded-2xl overflow-hidden p-0 bg-white">
          <div className={cn("p-6 text-white flex items-center justify-between", editingInternship ? "bg-blue-600" : "bg-primary")}>
            <div>
              <h2 className="text-2xl font-bold italic tracking-tight">{editingInternship ? "Recalibrate Program" : "Architect New Program"}</h2>
              <p className="text-xs text-white/70 font-semibold uppercase tracking-widest mt-1">Global Internship Framework</p>
            </div>
            {editingInternship ? <Activity className="h-10 w-10 opacity-30" /> : <Plus className="h-10 w-10 opacity-30" />}
          </div>
          
          <div className="p-8 grid gap-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Official Designation</label>
                <Input value={newInternship.title || ''} onChange={e => setNewInternship({ ...newInternship, title: e.target.value })} placeholder="Lead UX Architect" className="h-12 bg-slate-50 border-none shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Geographic Access</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={newInternship.location || ''} onChange={e => setNewInternship({ ...newInternship, location: e.target.value })} placeholder="Global Remote / Dubai" className="pl-10 h-12 bg-slate-50 border-none shadow-inner" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sponsoring Entity</label>
                <Input value={newInternship.company || ''} onChange={e => setNewInternship({ ...newInternship, company: e.target.value })} placeholder="Emirates Group" className="h-12 bg-slate-50 border-none shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Agreement Model</label>
                <Select value={newInternship.type} onValueChange={v => setNewInternship({ ...newInternship, type: v })}>
                  <SelectTrigger className="h-12 bg-slate-50 border-none shadow-inner font-medium"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid" className="font-bold">Institutional / Paid</SelectItem>
                    <SelectItem value="Unpaid" className="font-bold">Standard / Unpaid</SelectItem>
                    <SelectItem value="Stipend" className="font-bold">Funded / Stipend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newInternship.type === "Paid" && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <label className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Global Program Tuition</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <Input value={newInternship.training_fee || ''} onChange={e => setNewInternship({ ...newInternship, training_fee: e.target.value })} placeholder="50,000" className="pl-10 h-11 bg-white border-blue-100 shadow-sm font-bold text-blue-700" />
                  </div>
                </motion.div>
              )}

              {newInternship.type === "Stipend" && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 col-span-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Monthly Financial Grant</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                    <Input value={newInternship.stipend || ''} onChange={e => setNewInternship({ ...newInternship, stipend: e.target.value })} placeholder="25,000" className="pl-10 h-11 bg-white border-emerald-100 shadow-sm font-bold text-emerald-700" />
                  </div>
                </motion.div>
              )}

              <div className="space-y-2 text-sm">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Temporal Window</label>
                <div className="relative">
                  <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={newInternship.duration || ''} onChange={e => setNewInternship({ ...newInternship, duration: e.target.value })} placeholder="6 Months" className="pl-10 h-12 bg-slate-50 border-none shadow-inner" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-primary">Available Slots</label>
                <Input 
                   type="number" 
                   value={newInternship.available_slots ?? 10} 
                   onChange={e => setNewInternship({ ...newInternship, available_slots: parseInt(e.target.value) })} 
                   className="h-12 bg-slate-50 border-none shadow-inner font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Total Capacity</label>
                <Input 
                   type="number" 
                   value={newInternship.total_slots ?? 10} 
                   onChange={e => setNewInternship({ ...newInternship, total_slots: parseInt(e.target.value) })} 
                   className="h-12 bg-slate-50 border-none shadow-inner" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Strategic Category</label>
                <Select value={showCustomCategory ? "other" : newInternship.category} 
                  onValueChange={v => { if (v === "other") setShowCustomCategory(true); else { setShowCustomCategory(false); setNewInternship({ ...newInternship, category: v }); } }}>
                  <SelectTrigger className="h-12 bg-slate-50 border-none shadow-inner font-medium"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {existingCategories.map(cat => <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>)}
                    <SelectItem value="other" className="font-bold text-primary italic">Custom / New Entry</SelectItem>
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {showCustomCategory && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <Input className="mt-2 h-11 bg-slate-50 border-primary/20 shadow-sm" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Type new category..." />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Expertise Domain</label>
                <Select value={showCustomDomain ? "other" : newInternship.domain} 
                  onValueChange={v => { if (v === "other") setShowCustomDomain(true); else { setShowCustomDomain(false); setNewInternship({ ...newInternship, domain: v }); } }}>
                  <SelectTrigger className="h-12 bg-slate-50 border-none shadow-inner font-medium"><SelectValue placeholder="Select domain" /></SelectTrigger>
                  <SelectContent>
                    {existingDomains.map(dom => <SelectItem key={dom} value={dom} className="font-bold">{dom}</SelectItem>)}
                    <SelectItem value="other" className="font-bold text-primary italic">Custom / New Entry</SelectItem>
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {showCustomDomain && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <Input className="mt-2 h-11 bg-slate-50 border-primary/20 shadow-sm" value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="Type new domain..." />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Program Blueprint (Description)</label>
              <Textarea value={newInternship.description || ''} onChange={e => setNewInternship({ ...newInternship, description: e.target.value })} placeholder="Comprehensive overview of learning objectives..." rows={4} className="bg-slate-50 border-none shadow-inner resize-none focus:ring-primary/10" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Required Competencies (Comma Separated)</label>
              <div className="relative">
                <Layers className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input value={newInternship.skills_required?.join(', ') || ''} placeholder="TypeScript, Figma, Strategic Analysis" onChange={e => setNewInternship({ ...newInternship, skills_required: e.target.value.split(',').map(s => s.trim()).filter(s => s !== "") })} className="pl-10 h-12 bg-slate-50 border-none shadow-inner" />
              </div>
            </div>
            
            <div className="pt-4 flex gap-3">
              <Button type="button" variant="ghost" onClick={closeDialog} className="h-12 px-6 font-bold text-slate-400">Cancel</Button>
              <Button onClick={handleAddInternship} className="h-12 flex-1 rounded-xl gradient-primary shadow-lg shadow-primary/30 font-bold text-lg">
                {editingInternship ? "Authorize Updates" : "Commission Program"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-3xl border-none shadow-2xl rounded-3xl overflow-hidden p-0 bg-white">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <GraduationCap className="h-24 w-24" />
            </div>
            <div className="relative z-10">
              <Badge className="mb-4 bg-primary/20 text-primary-foreground border-primary/30 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">Technical Dossier</Badge>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase">{selectedApplication?.full_name}</h2>
              <div className="flex flex-wrap gap-4 mt-4 text-slate-400">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-tighter">
                  <Mail className="h-4 w-4 text-primary" />
                  {selectedApplication?.email}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-tighter border-l border-slate-700 pl-4">
                  <Phone className="h-4 w-4 text-primary" />
                  {selectedApplication?.phone}
                </div>
              </div>
            </div>
          </div>

          {selectedApplication && (
            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Background</span>
                  <span className="font-bold text-slate-900 capitalize">{selectedApplication.education.replace("-", " ")}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Program</span>
                  <span className="font-bold text-slate-900 capitalize">{selectedApplication.program_id.replace("-", " ")}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preferred Track</span>
                  <Badge variant="outline" className="w-fit mt-1 rounded-md font-bold text-[10px] uppercase border-primary/20 text-primary bg-primary/5 px-2 py-0.5">
                    {selectedApplication.preferred_type}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <Target className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-sm uppercase tracking-widest">Strategic Motivation</h4>
                </div>
                <p className="text-slate-600 bg-slate-50/50 p-6 rounded-2xl border leading-relaxed italic text-sm font-medium">
                  "{selectedApplication.motivation}"
                </p>
              </div>

              {selectedApplication.experience && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Activity className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-sm uppercase tracking-widest">Field Experience</h4>
                  </div>
                  <p className="text-slate-600 bg-slate-50/50 p-6 rounded-2xl border leading-relaxed text-sm font-medium">
                    {selectedApplication.experience}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-6 items-center justify-between pt-6 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Current Status</span>
                  <Select
                    value={selectedApplication.status}
                    onValueChange={(value) => {
                      const status = value as "pending" | "reviewing" | "accepted" | "rejected";
                      handleStatusUpdate(selectedApplication.id, status);
                      setSelectedApplication({ ...selectedApplication, status });
                    }}
                  >
                    <SelectTrigger className="w-44 h-11 rounded-xl font-bold bg-white border shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {Object.keys(appStatusConfig).map(s => {
                         const sConf = appStatusConfig[s];
                         return (
                           <SelectItem key={s} value={s} className="font-bold rounded-lg h-10">
                              <div className="flex items-center gap-2">
                                <sConf.icon className="h-4 w-4" />
                                {sConf.label}
                              </div>
                           </SelectItem>
                         );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  {selectedApplication.linkedin_url && (
                    <Button variant="outline" onClick={() => window.open(selectedApplication.linkedin_url!, "_blank")} className="h-11 rounded-xl font-bold gap-2">
                       LinkedIn
                    </Button>
                  )}
                  {selectedApplication.resume_url && (
                    <Button onClick={() => window.open(selectedApplication.resume_url!, "_blank")} className="h-11 rounded-xl gradient-primary font-bold gap-2 shadow-lg shadow-primary/20">
                       <Download className="h-4 w-4" /> Final Resume
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInternships;
