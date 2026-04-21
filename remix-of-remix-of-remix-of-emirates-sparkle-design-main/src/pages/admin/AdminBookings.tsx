import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  Eye, 
  Calendar, 
  Mail, 
  Phone, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Activity,
  User,
  MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ServiceBooking {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  service_type: string;
  brief: string | null;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, label: "Pending" },
  confirmed: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Activity, label: "Confirmed" },
  completed: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Completed" },
  cancelled: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle, label: "Cancelled" },
};

const AdminBookings = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("service_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch service inquiries");
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchBookings();

    const channel = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_bookings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBookings(prev => [payload.new as ServiceBooking, ...prev]);
          toast.info("New service inquiry received!");
        } else if (payload.eventType === 'UPDATE') {
          setBookings(prev => prev.map(b => b.id === payload.new.id ? payload.new as ServiceBooking : b));
        } else if (payload.eventType === 'DELETE') {
          setBookings(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from("service_bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Inquiry status updated to ${newStatus}`);
      fetchBookings();
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  if (authLoading) {
    return (
      <AdminLayout title="Service Inquiries">
        <Skeleton className="h-96 rounded-2xl" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Service Inquiry Management">
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Inquiries</p>
                  <h3 className="text-2xl font-bold mt-1 text-primary">{stats.total}</h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Mail className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">New/Pending</p>
                  <h3 className="text-2xl font-bold mt-1 text-orange-600">{stats.pending}</h3>
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
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active/Confirmed</p>
                  <h3 className="text-2xl font-bold mt-1 text-blue-600">{stats.confirmed}</h3>
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
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
                  <h3 className="text-2xl font-bold mt-1 text-emerald-600">{stats.completed}</h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b py-6 px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Service Inquiries</CardTitle>
              <p className="text-sm text-slate-500 mt-1 font-medium italic">Manage project requests from Software Solutions page</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search name, service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 w-full sm:w-64 bg-white border shadow-sm rounded-xl"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full sm:w-40 bg-white border shadow-sm rounded-xl">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.keys(statusConfig).map(s => (
                    <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-20 text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No inquiries found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="font-bold text-slate-600 py-4 px-8">Client</TableHead>
                      <TableHead className="font-bold text-slate-600">Service Type</TableHead>
                      <TableHead className="font-bold text-slate-600">Date</TableHead>
                      <TableHead className="font-bold text-slate-600 text-center">Status</TableHead>
                      <TableHead className="text-right font-bold text-slate-600 px-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredBookings.map((booking, idx) => {
                        const config = statusConfig[booking.status] || statusConfig.pending;
                        return (
                          <motion.tr
                            key={booking.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            className="group hover:bg-slate-50/50 border-b last:border-0 transition-colors"
                          >
                            <TableCell className="py-5 px-8">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 leading-none">{booking.full_name}</span>
                                <span className="text-xs text-slate-500 mt-1">{booking.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">
                                {booking.service_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-600">
                                {format(new Date(booking.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <Badge className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 shadow-none", config.color)}>
                                  <config.icon className="h-3 w-3" />
                                  {config.label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-8">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedBooking(booking)}
                                  className="h-8 rounded-lg font-bold text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Details
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 p-2">
                                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">Set Status</DropdownMenuLabel>
                                    {Object.keys(statusConfig).map(s => {
                                      const sConf = statusConfig[s];
                                      return (
                                        <DropdownMenuItem 
                                          key={s} 
                                          onClick={() => handleStatusUpdate(booking.id, s)}
                                          className={cn("rounded-lg h-9 px-3 cursor-pointer mt-0.5", booking.status === s ? "bg-slate-100 font-bold" : "")}
                                        >
                                          <sConf.icon className={cn("mr-2 h-4 w-4", booking.status === s ? "text-primary" : "text-slate-400")} /> 
                                          <span className="text-sm">{sConf.label}</span>
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
              <MessageSquare className="h-6 w-6" />
              Inquiry Brief
            </DialogTitle>
            <DialogDescription>
              Detailed project requirements from {selectedBooking?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1 p-4 rounded-xl bg-slate-50 border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Client Info
                  </p>
                  <p className="font-bold text-lg">{selectedBooking.full_name}</p>
                  <div className="space-y-1 mt-2">
                    <p className="text-sm flex items-center gap-2 text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-primary" /> {selectedBooking.email}
                    </p>
                    {selectedBooking.phone && (
                      <p className="text-sm flex items-center gap-2 text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-primary" /> {selectedBooking.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1 p-4 rounded-xl bg-slate-50 border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Inquiry Date
                  </p>
                  <p className="font-bold text-lg">{format(new Date(selectedBooking.created_at), "PPP")}</p>
                  <p className="text-sm text-slate-500 mt-1">{format(new Date(selectedBooking.created_at), "h:mm a")}</p>
                </div>
              </div>

              <div className="p-6 rounded-xl border bg-primary/5 min-h-[200px]">
                <div className="flex items-center gap-2 border-b border-primary/10 pb-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg text-primary">Project Requirements</h3>
                </div>
                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed italic">
                  "{selectedBooking.brief || "No detailed requirements provided."}"
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedBooking(null)}>Close</Button>
                <Button className="gradient-primary shadow-glow" asChild>
                  <a href={`mailto:${selectedBooking.email}`}>
                    Reply via Email
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBookings;
