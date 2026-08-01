
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Calendar, Clock, CreditCard, ShoppingBag, ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { COMPANY } from "@/lib/constants";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  items: any[];
  shipping_address: any;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-purple-100 text-purple-800 border-purple-200",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const OrderHistory = () => {
  const { user, session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load your orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Subscribe to real-time order updates
    const channel = supabase
      .channel(`user-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time order update:', payload);
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
          toast.info(`Order #${payload.new.order_number || payload.new.id.slice(0, 8)} status updated to ${payload.new.status}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusStep = (status: string) => {
    const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
    if (status === "paid") return 1;
    if (status === "pending_payment" || status === "cod_pending") return 0;
    const index = steps.indexOf(status);
    return index !== -1 ? index : 0;
  };

  const canCancelOrder = (status: string) => {
    return ["pending", "confirmed", "paid", "cod_pending", "pending_payment"].includes(status);
  };

  const handleCancelOrder = async (order: Order) => {
    if (!user) return;
    if (!canCancelOrder(order.status)) {
      toast.error("This order can no longer be cancelled.");
      return;
    }

    const confirmCancel = window.confirm(`Cancel order ${order.order_number || order.id.slice(0, 12)}?`);
    if (!confirmCancel) return;

    const previousStatus = order.status;

    try {
      setCancellingOrderId(order.id);
      // Optimistically reflect cancellation in UI while backend confirms.
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o)));

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const { data, error } = await supabase.functions.invoke("cancel-order", {
        body: { orderId: order.id, accessToken },
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      });

      if (error) {
        throw new Error(error.message || "Unable to cancel order");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Order cancelled and stock restored successfully.");
    } catch (error) {
      console.error("Error cancelling order:", error);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: previousStatus } : o)));
      toast.error(error instanceof Error ? error.message : "Failed to cancel order. Please contact support.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const openSupportEmail = (order: Order) => {
    const orderRef = order.order_number || order.id;
    const subject = encodeURIComponent(`Support request for order ${orderRef}`);
    const body = encodeURIComponent(`Hi Support,%0D%0A%0D%0AI need help with my order ${orderRef}.%0D%0AOrder status: ${order.status}%0D%0A%0D%0AThanks.`);
    window.location.href = `mailto:${COMPANY.emailSupport}?subject=${subject}&body=${body}`;
  };


  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 bg-gray-50/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Orders</h1>
              <p className="text-muted-foreground">Track and manage your recent purchases</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/services" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse h-40" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card className="text-center py-16 border-dashed">
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">No orders yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    You haven't placed any orders yet. Explore our products and services to get started!
                  </p>
                  <Button asChild className="mt-4 gradient-primary shadow-glow">
                    <Link to="/services">Browse Products</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden border-2 hover:border-primary/20 transition-colors">
                  <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order ID</span>
                          <span className="font-mono text-sm font-bold">{order.order_number || order.id.slice(0, 12)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(order.created_at), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(order.created_at), "h:mm a")}
                          </span>
                        </div>
                      </div>
                      <Badge className={statusColors[order.status] || ""}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Items Brief */}
                      <div className="space-y-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Summary</div>
                        <div className="space-y-2">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-slate-700">
                                {item.quantity}x {item.product_name || `Product ${item.product_id?.slice(0, 5)}...`}
                              </span>
                              <span className="font-medium">
                                {order.currency === 'AED' ? 'AED ' : '₹'}{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t flex justify-between items-center font-bold">
                          <span>Total</span>
                          <span className="text-primary text-lg">
                            {order.currency === 'AED' ? 'AED ' : '₹'}{order.total_amount}
                          </span>
                        </div>
                      </div>

                      {/* Delivery & Actions */}
                      <div className="space-y-6 border-t md:border-t-0 md:border-l md:pl-8 pt-4 md:pt-0">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Order Status Tracking</div>
                          <div className="relative pt-2 pb-6">
                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 rounded-full mt-2">
                              {order.status !== 'cancelled' && (
                                <div 
                                  className="h-full bg-primary transition-all duration-500 rounded-full" 
                                  style={{ width: `${(getStatusStep(order.status) / 4) * 100}%` }}
                                />
                              )}
                            </div>
                            <div className="flex justify-between relative">
                              {["Pending", "Confirmed", "Processing", "Shipped", "Delivered"].map((step, i) => {
                                const currentStep = getStatusStep(order.status);
                                const isCompleted = i <= currentStep && order.status !== 'cancelled';
                                const isCurrent = i === currentStep && order.status !== 'cancelled';
                                
                                return (
                                  <div key={step} className="flex flex-col items-center">
                                    <div className={`w-4 h-4 rounded-full border-2 z-10 bg-white transition-colors duration-300 ${isCompleted ? 'border-primary bg-primary' : 'border-slate-200'} ${isCurrent ? 'ring-4 ring-primary/20 scale-125' : ''}`} />
                                    <span className={`text-[10px] mt-2 font-bold ${isCompleted ? 'text-primary' : 'text-slate-400'}`}>{step}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipping Details</div>
                          <div className="flex items-start gap-3 text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div className="text-slate-600">
                              <p className="font-medium text-slate-800">{order.shipping_address?.fullName}</p>
                              <p className="line-clamp-2">{order.shipping_address?.address}, {order.shipping_address?.city}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            type="button"
                            onClick={() => openSupportEmail(order)}
                          >
                            Support
                          </Button>
                          {canCancelOrder(order.status) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full gap-2"
                              type="button"
                              onClick={() => handleCancelOrder(order)}
                              disabled={cancellingOrderId === order.id}
                            >
                              {cancellingOrderId === order.id ? "Cancelling..." : "Cancel Order"}
                            </Button>
                          )}
                          <Button size="sm" className="w-full gap-2" variant="secondary" asChild>
                             <Link to={`/order-confirmation?orderId=${order.id}`}>
                                Details
                                <ArrowRight className="w-4 h-4" />
                             </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderHistory;
