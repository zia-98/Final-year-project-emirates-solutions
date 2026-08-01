import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  ShoppingCart,
  Users,
  GraduationCap,
  TrendingUp,
  DollarSign,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalApplications: number;
  totalRevenue: number;
  pendingOrders: number;
  totalInquiries: number;
}

interface RecentActivityItem {
  id: string;
  type: "order" | "application" | "inquiry";
  title: string;
  subtitle: string;
  status: string;
  date: string;
}

const AdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;

      try {
        const [
          productsResult,
          ordersResult,
          usersResult,
          applicationsResult,
          bookingsResult,
        ] = await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id, status, total_amount, created_at").order("created_at", { ascending: false }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("internship_applications").select("id, full_name, program_id, status, created_at").order("created_at", { ascending: false }),
          supabase.from("service_bookings").select("id, full_name, service_type, status, created_at").order("created_at", { ascending: false }),
        ]);

        const orders = ordersResult.data || [];
        const applications = applicationsResult.data || [];
        const bookings = bookingsResult.data || [];

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        const pendingOrders = orders.filter(order => order.status === "pending").length;

        setStats({
          totalProducts: productsResult.count || 0,
          totalOrders: orders.length,
          totalUsers: usersResult.count || 0,
          totalApplications: applicationsResult.count || 0,
          totalRevenue,
          pendingOrders,
          totalInquiries: bookingsResult.data?.length || 0,
        });

        // Process Recent Activity
        const recentOrders = orders.slice(0, 5).map(order => ({
          id: order.id,
          type: "order" as const,
          title: `New Order #${order.id.slice(0, 8)}`,
          subtitle: `₹${order.total_amount}`,
          status: order.status,
          date: order.created_at,
        }));

        const recentApplications = applications.slice(0, 5).map(app => ({
          id: app.id,
          type: "application" as const,
          title: `New Application: ${app.full_name}`,
          subtitle: app.program_id.replace(/-/g, " "),
          status: app.status,
          date: app.created_at,
        }));

        const recentInquiries = bookings.slice(0, 5).map(booking => ({
          id: booking.id,
          type: "inquiry" as const,
          title: `New Inquiry: ${booking.full_name}`,
          subtitle: booking.service_type,
          status: booking.status,
          date: booking.created_at,
        }));

        const combined = [...recentOrders, ...recentApplications, ...recentInquiries]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 6);

        setRecentActivity(combined);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  if (authLoading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "bg-secondary/10 text-secondary",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "bg-accent/10 text-accent-foreground",
    },
    {
      title: "Applications",
      value: stats?.totalApplications || 0,
      icon: GraduationCap,
      color: "bg-brand-purple/10 text-brand-purple",
    },
    {
      title: "Total Revenue",
      value: `₹${stats?.totalRevenue?.toLocaleString("en-IN") || 0}`,
      icon: DollarSign,
      color: "bg-brand-green/10 text-brand-green",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: TrendingUp,
      color: "bg-brand-yellow/10 text-brand-yellow",
    },
    {
      title: "Service Inquiries",
      value: stats?.totalInquiries || 0,
      icon: Mail,
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-3xl font-bold">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/admin/products"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Package className="h-5 w-5 text-primary" />
              <span>Manage Products</span>
            </a>
            <a
              href="/admin/orders"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-secondary" />
              <span>View Orders</span>
            </a>
            <a
              href="/admin/internships"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <GraduationCap className="h-5 w-5 text-accent-foreground" />
              <span>Review Applications</span>
            </a>
            <a
              href="/admin/bookings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Mail className="h-5 w-5 text-primary" />
              <span>Service Inquiries</span>
            </a>
            <a
              href="/admin/feedback"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-pink-500" />
              <span>User Feedback</span>
            </a>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No recent activity found.</p>
              ) : (
                recentActivity.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        item.type === 'order' ? 'bg-secondary/10 text-secondary' : 
                        item.type === 'application' ? 'bg-brand-purple/10 text-brand-purple' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {item.type === 'order' ? <ShoppingCart className="h-4 w-4" /> : 
                         item.type === 'application' ? <GraduationCap className="h-4 w-4" /> :
                         <Mail className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'confirmed' || item.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          item.status === 'rejected' || item.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {item.status}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
