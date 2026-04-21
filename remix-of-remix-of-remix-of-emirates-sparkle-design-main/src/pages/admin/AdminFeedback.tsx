import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  ThumbsUp, 
  AlertCircle,
  Calendar,
  Filter,
  Search,
  Quote
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Feedback {
  id: string;
  user_id: string | null;
  rating: number;
  category: string;
  comment: string | null;
  nps_score: number | null;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  ui: "Platform Experience",
  support: "Customer Support",
  quality: "Hardware Quality",
  delivery: "Delivery Speed",
  other: "Other",
};

const AdminFeedback = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to fetch feedback records");
    } else {
      setFeedbacks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchFeedback();

      const channel = supabase
        .channel('admin-feedback')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, () => {
          fetchFeedback();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesCategory = filterCategory === "all" || f.category === filterCategory;
    const matchesSearch = !searchQuery || 
      (f.comment?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       categoryLabels[f.category]?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const stats = {
    total: feedbacks.length,
    avgRating: feedbacks.length ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) : "0",
    npsScore: feedbacks.length ? (() => {
      const promoters = feedbacks.filter(f => (f.nps_score || 0) >= 9).length;
      const detractors = feedbacks.filter(f => (f.nps_score || 0) <= 6).length;
      return Math.round(((promoters - detractors) / feedbacks.length) * 100);
    })() : "0",
    recentCount: feedbacks.filter(f => new Date(f.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
  };

  if (authLoading) return <AdminLayout title="User Feedback"><Skeleton className="h-96 w-full rounded-2xl" /></AdminLayout>;

  return (
    <AdminLayout title="User Feedback Analysis">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Feedback</p>
                  <h3 className="text-3xl font-black mt-1 text-primary">{stats.total}</h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <MessageSquare className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Star Rating</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-3xl font-black text-yellow-500">{stats.avgRating}</h3>
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-yellow-50 text-yellow-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Star className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Promoter Score (NPS)</p>
                  <h3 className={cn(
                    "text-3xl font-black mt-1",
                    Number(stats.npsScore) > 30 ? "text-emerald-600" : 
                    Number(stats.npsScore) > 0 ? "text-yellow-500" : "text-red-500"
                  )}>{stats.npsScore}</h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent (7 Days)</p>
                  <h3 className="text-3xl font-black mt-1 text-blue-600">{stats.recentCount}</h3>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and List */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b bg-slate-50/50 py-6 px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Feedback Details</CardTitle>
              <p className="text-sm text-slate-500 font-medium italic mt-1">Direct insights from your users</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search comments..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px] h-10 rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([id, label]) => (
                    <SelectItem key={id} value={id}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-20">
                <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No feedback entries matching your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredFeedbacks.map((f, idx) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-6 rounded-2xl border-2 hover:border-primary/20 hover:bg-primary/5 transition-all group relative bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                             <div className="flex gap-0.5">
                               {[...Array(5)].map((_, i) => (
                                 <Star 
                                   key={i} 
                                   className={cn("h-4 w-4", i < f.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200")} 
                                 />
                               ))}
                             </div>
                             <Badge variant="outline" className="bg-slate-50 font-bold text-[10px] uppercase tracking-tighter">
                               {categoryLabels[f.category] || f.category}
                             </Badge>
                          </div>
                          
                          {f.comment ? (
                            <div className="relative">
                              <Quote className="absolute -left-1 -top-1 h-8 w-8 text-slate-100 -z-10" />
                              <p className="text-slate-700 font-medium leading-relaxed pl-2 italic">
                                "{f.comment}"
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-400 text-sm italic">No written comment provided.</p>
                          )}
                          
                          <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" /> {format(new Date(f.created_at), "PPP")}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NPS Score</p>
                             <div className={cn(
                               "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-lg font-black shadow-sm",
                               (f.nps_score || 0) >= 9 ? "bg-emerald-100 text-emerald-700" :
                               (f.nps_score || 0) >= 7 ? "bg-yellow-100 text-yellow-700" : "bg-red-50 text-red-600"
                             )}>
                               {f.nps_score ?? "-"}
                             </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFeedback;
