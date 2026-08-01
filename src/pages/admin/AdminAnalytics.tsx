import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Users,
  GraduationCap,
  ShoppingCart,
  Package,
  Calendar,
  Star,
  MessageSquare,
  Clock,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { format, subMonths, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface AnalyticsData {
  applicationsByDomain: Array<{ domain: string; count: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number; orders: number }>;
  popularCategories: Array<{ name: string; value: number }>;
  userGrowth: Array<{ month: string; users: number }>;
  recommendationsByDay: Array<{ date: string; count: number }>;
  totalApplications: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#8b5cf6"];

const AdminAnalytics = () => {
  const { isAdmin, loading: authLoading, user } = useAdminAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    if (!isAdmin) return;
    setRefreshing(true);
    console.log("Analytics: Starting fetch for user", user?.email);

    try {
      // Ensure we have a session before fetching sensitive data
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.warn("Analytics: No active session found during fetch");
      }

      // Fetch all data individually to be resilient to single fetch failures
      const [
        applicationsResult,
        ordersResult,
        productsResult,
        usersResult,
        recommendationsResult,
      ] = await Promise.all([
        supabase.from("internship_applications").select("*")
          .then(res => { if (res.error) toast.error("Applications sync failed"); return res; }),
        supabase.from("orders").select("*")
          .then(res => { if (res.error) toast.error("Orders sync failed"); return res; }),
        supabase.from("products").select("*")
          .then(res => { if (res.error) toast.error("Product sync failed"); return res; }),
        supabase.from("profiles").select("*")
          .then(res => { if (res.error) toast.error("User sync failed"); return res; }),
        supabase.from("recommendation_history").select("*")
          .then(res => { if (res.error) console.warn("Recs sync optional error:", res.error); return res; }),
      ]);

      const applications = applicationsResult.data || [];
      const orders = ordersResult.data || [];
      const products = productsResult.data || [];
      const users = usersResult.data || [];
      const recommendations = recommendationsResult.data || [];

      console.log("Analytics: Data received", { 
        orders: orders.length, 
        users: users.length, 
        apps: applications.length 
      });

      const now = new Date();
      const exchangeRate = 22.5;

      // Process applications by domain
      const domainCounts: Record<string, number> = {};
      applications.forEach(app => {
        const domain = app.program_id || "Other";
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      });
      const applicationsByDomain = Object.entries(domainCounts)
        .map(([domain, count]) => ({ domain: domain.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Process orders by status
      const statusCounts: Record<string, number> = {};
      orders.forEach(order => {
        const status = order.status || "pending";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      const ordersByStatus = Object.entries(statusCounts)
        .map(([status, count]) => ({ status: status.charAt(0).toUpperCase() + status.slice(1), count }));

      // Calculate total revenue
      const totalRevenue = orders.reduce((sum, order: any) => {
        const amount = Number(order.total_amount || 0);
        return sum + (order.currency === "AED" ? amount * exchangeRate : amount);
      }, 0);

      // Revenue by month (last 6 months) using date-fns for robustness
      const monthlyRevenueMap: Record<string, { revenue: number; orders: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, "MMM yy"); 
        monthlyRevenueMap[key] = { revenue: 0, orders: 0 };
      }

      orders.forEach(order => {
        if (order.created_at) {
          const d = new Date(order.created_at);
          const key = format(d, "MMM yy");
          if (monthlyRevenueMap[key]) {
            const amount = Number(order.total_amount || 0);
            const inrAmount = (order as any).currency === "AED" ? amount * exchangeRate : amount;
            monthlyRevenueMap[key].revenue += inrAmount;
            monthlyRevenueMap[key].orders += 1;
          }
        }
      });

      const revenueByMonth = Object.entries(monthlyRevenueMap).map(([month, stats]) => ({
        month,
        revenue: stats.revenue,
        orders: stats.orders
      }));

      // User growth
      const monthlyUsersMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, "MMM yy");
        monthlyUsersMap[key] = 0;
      }
      users.forEach(user => {
        if (user.created_at) {
          const d = new Date(user.created_at);
          const key = format(d, "MMM yy");
          if (monthlyUsersMap[key] !== undefined) {
            monthlyUsersMap[key]++;
          }
        }
      });
      const userGrowth = Object.entries(monthlyUsersMap).map(([month, usersCount]) => ({ month, users: usersCount }));

      // Popular categories (aggregated from order items)
      const categoryVolume: Record<string, number> = {};
      const productToCategory: Record<string, string> = {};
      products.forEach(p => {
        productToCategory[p.id] = (p as any).category || "Uncategorized";
      });

      orders.forEach(order => {
        const items = (order as any).items || [];
        items.forEach((item: any) => {
          const category = productToCategory[item.product_id] || "Other";
          categoryVolume[category] = (categoryVolume[category] || 0) + (item.quantity || 1);
        });
      });
      const popularCategories = Object.entries(categoryVolume)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Recommendation performance (last 14 days)
      const dailyRecs: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = subDays(now, i);
        const key = format(d, "MMM d");
        dailyRecs[key] = 0;
      }
      
      recommendations.forEach(rec => {
        if (rec.created_at) {
          const d = new Date(rec.created_at);
          const key = format(d, "MMM d");
          if (dailyRecs[key] !== undefined) {
            dailyRecs[key]++;
          }
        }
      });
      const recommendationsByDay = Object.entries(dailyRecs).map(([date, count]) => ({ date, count }));

      setData({
        applicationsByDomain,
        ordersByStatus,
        revenueByMonth,
        popularCategories,
        userGrowth,
        recommendationsByDay,
        totalApplications: applications.length,
        totalOrders: orders.length,
        totalRevenue,
        activeUsers: users.length,
      });
    } catch (error) {
      console.error("Analytics: critical error", error);
      toast.error("An unexpected error occurred while loading analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchAnalytics();
    }
  }, [isAdmin, authLoading]);

  if (authLoading || loading) {
    return (
      <AdminLayout title="Analytics Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <AdminLayout title="Analytics Dashboard">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Business Intelligence</h2>
          <p className="text-sm text-slate-500 font-medium italic">Emirates Solutions / Admin / Analytics</p>
        </div>
        <Button 
          onClick={fetchAnalytics} 
          disabled={refreshing}
          variant="outline"
          className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all duration-300 font-bold text-xs gap-2"
        >
          <Activity className={cn("h-4 w-4", refreshing ? "animate-spin text-primary" : "text-slate-500")} />
          {refreshing ? "Synchronizing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Summary Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Applications
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900">{data?.totalApplications || 0}</p>
                <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  12%
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Internship programs</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Total Orders
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900">{data?.totalOrders || 0}</p>
                <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  8%
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">New sales this month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Total Revenue
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{formatPrice(data?.totalRevenue || 0)}</p>
                <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  15%
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Combined AED/INR revenue</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Active Users
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900">{data?.activeUsers || 0}</p>
                <div className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  24%
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Registered platform users</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Applications by Domain */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/30">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-blue-600" />
              </div>
              In-Demand Domains
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.applicationsByDomain || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="domain" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                </defs>
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Categories */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/30">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-orange-600" />
              </div>
              Popular Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data?.popularCategories || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                >
                  {(data?.popularCategories || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 w-full mt-4">
                {(data?.popularCategories || []).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{entry.name} ({entry.value})</span>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/30">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              Revenue Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.revenueByMonth || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                    formatter={(value: number) => [formatPrice(value), "Revenue"]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '20px' }} />
                <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Revenue (₹)"
                />
                <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Orders Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Recommendation Performance */}
        <Card className="border-none shadow-sm bg-white overflow-hidden lg:col-span-2">
          <CardHeader className="border-b bg-slate-50/30">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-pink-600" />
              </div>
              AI Recommendation Performance (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.recommendationsByDay || []} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                    type="stepAfter" 
                    dataKey="count" 
                    stroke="#db2777" 
                    strokeWidth={3} 
                    dot={false}
                    name="Recommendations"
                    fill="#fbcfe8"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="border-none shadow-sm bg-white overflow-hidden lg:col-span-2">
          <CardHeader className="border-b bg-slate-50/30">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              User Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data?.userGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="users" fill="url(#userGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                </defs>
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
