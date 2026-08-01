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
import { sendOrderEmail } from "@/lib/resend";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  Eye, 
  Calendar, 
  Briefcase, 
  Target, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Activity
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

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  items: any;
  shipping_address: any;
  created_at: string;
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, label: "Pending" },
  confirmed: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2, label: "Confirmed" },
  processing: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Activity, label: "Processing" },
  shipped: { color: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: Truck, label: "Shipped" },
  delivered: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Delivered" },
  cancelled: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle, label: "Cancelled" },
};

const AdminOrders = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;

    fetchOrders();

    // Subscribe to orders changes
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Real-time order change:', payload);
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);


  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
    } else {
      toast.success("Order status updated");
      
      const order = orders.find(o => o.id === orderId);
      if (order && order.shipping_address) {
        const shipping = order.shipping_address as any;
        const emailResult = await sendOrderEmail(
          shipping.email || "",
          shipping.fullName || "Customer",
          orderId,
          newStatus,
          order.items as any[] || [],
          order.total_amount
        );

        if (!emailResult.success) {
          console.warn("Order status email failed:", emailResult.error);
        }

        const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: `Order Status Updated: ${statusText}`,
          message: `Your order #${orderId.slice(0, 8)} status has been updated to ${newStatus}.`,
          type: newStatus === "cancelled" ? "warning" : newStatus === "delivered" ? "success" : "info",
          reference_id: orderId,
          reference_type: "order",
        });
      }
      
      fetchOrders();
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  };

  if (authLoading) {
    return (
      <AdminLayout title="Orders">
        <Skeleton className="h-96 rounded-2xl" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Order Management">
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Orders</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
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
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Delivered</p>
                  <h3 className="text-2xl font-bold mt-1 text-emerald-600">{stats.delivered}</h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Truck className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">₹{stats.revenue.toLocaleString()}</h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b py-6 px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Invoices & Shipments</CardTitle>
              <p className="text-sm text-slate-500 mt-1 font-medium italic">Manage customer orders and status updates</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 w-full sm:w-64 bg-white border shadow-sm rounded-xl focus:ring-primary/20"
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
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No orders found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="w-[150px] font-bold text-slate-600 py-4 px-8">Order ID</TableHead>
                      <TableHead className="font-bold text-slate-600">Customer</TableHead>
                      <TableHead className="font-bold text-slate-600">Date</TableHead>
                      <TableHead className="font-bold text-slate-600">Amount</TableHead>
                      <TableHead className="font-bold text-slate-600 text-center">Status</TableHead>
                      <TableHead className="text-right font-bold text-slate-600 px-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredOrders.map((order, idx) => {
                        const config = statusConfig[order.status] || { color: "bg-slate-100", label: order.status, icon: Clock };
                        return (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            className="group hover:bg-slate-50/50 border-b last:border-0 transition-colors"
                          >
                            <TableCell className="font-mono text-sm py-5 px-8">
                                <span className="font-bold text-slate-900 leading-none">#{order.id.slice(0, 8)}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 leading-none">{order.shipping_address?.fullName || "Guest"}</span>
                                <span className="text-xs text-slate-500 mt-1">{order.shipping_address?.email || "No email"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-600">
                                {format(new Date(order.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="font-bold text-slate-900">
                                ₹{Number(order.total_amount).toLocaleString()}
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
                                  onClick={() => setSelectedOrder(order)}
                                  className="h-8 rounded-lg font-bold text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 p-2">
                                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">Update Status</DropdownMenuLabel>
                                    {Object.keys(statusConfig).map(s => {
                                      const sConf = statusConfig[s];
                                      return (
                                        <DropdownMenuItem 
                                          key={s} 
                                          onClick={() => handleStatusUpdate(order.id, s)}
                                          className={cn("rounded-lg h-9 px-3 cursor-pointer mt-0.5", order.status === s ? "bg-slate-100 font-bold" : "")}
                                        >
                                          <sConf.icon className={cn("mr-2 h-4 w-4", order.status === s ? "text-primary" : "text-slate-400")} /> 
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

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
              <Search className="h-6 w-6" />
              Order Details
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-8 py-4">
              {/* Order Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm bg-muted p-2 rounded border truncate" title={selectedOrder.id}>
                    {selectedOrder.id}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {format(new Date(selectedOrder.created_at), "PPP")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold text-primary">₹{selectedOrder.total_amount}</p>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">Purchased Items</h3>
                </div>
                <div className="space-y-3">
                  {Array.isArray(selectedOrder.items) ? (
                    selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                        <div className="space-y-1">
                          <p className="font-bold text-md">Product ID: <span className="text-muted-foreground font-mono font-normal">{item.product_id?.slice(0, 8)}...</span></p>
                          <div className="flex gap-2 flex-wrap">
                            {item.size && <Badge variant="secondary">Size: {item.size}</Badge>}
                            {item.color && <Badge variant="secondary">Color: {item.color}</Badge>}
                            <Badge variant="outline">Qty: {item.quantity}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">₹{item.price}</p>
                          <p className="text-xs text-muted-foreground">Per Unit</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No items found</p>
                  )}
                </div>
              </div>

              {/* Shipping Address Section */}
              {selectedOrder.shipping_address && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Shipping Address</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border bg-primary/5">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Full Name</p>
                        <p className="font-medium text-lg">{selectedOrder.shipping_address.fullName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Contact</p>
                        <p className="text-sm">{selectedOrder.shipping_address.email}</p>
                        <p className="text-sm font-mono">{selectedOrder.shipping_address.phone}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Location</p>
                        <p className="text-sm leading-relaxed">
                          {selectedOrder.shipping_address.address}<br />
                          {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zipCode}<br />
                          <span className="font-bold">{selectedOrder.shipping_address.country}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
