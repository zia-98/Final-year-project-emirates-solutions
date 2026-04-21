import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  GraduationCap,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  ChevronRight,
  BarChart3,
  Bell,
  Search,
  User,
  MessageSquare,
  FileSearch,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/bookings", label: "Service Inquiries", icon: Mail },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/internships", label: "Internships", icon: GraduationCap },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/feedback", label: "User Feedback", icon: MessageSquare },
  { href: "/admin/resume-screening", label: "Resume Screening", icon: FileSearch },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const breadcrumbs = location.pathname.split("/").filter(Boolean).map((path, index, arr) => {
    const href = `/${arr.slice(0, index + 1).join("/")}`;
    const label = path === "admin" ? "Home" : path.charAt(0).toUpperCase() + path.slice(1);
    return { href, label };
  });

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Mobile header */}
      <header className={cn(
        "lg:hidden sticky top-0 z-50 glass border-b transition-all duration-300",
        scrolled ? "py-2" : "py-3"
      )}>
        <div className="flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-lg gradient-text-primary">Admin</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-[70] lg:z-30 h-full w-72 bg-white border-r shadow-sm transition-all duration-300 lg:translate-x-0 overflow-hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl block leading-tight">Emirates</span>
                <span className="text-sm font-medium text-muted-foreground block">Admin Control</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-50">Main Menu</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "hover:bg-primary/5 text-slate-600 hover:text-primary"
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 bg-muted/20 border-t space-y-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <Home className="h-[18px] w-[18px]" />
              <span className="font-medium text-sm">Main Site</span>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-4 py-2.5 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={handleSignOut}
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span className="font-medium text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen flex flex-col">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 h-16 items-center justify-between border-b bg-white/80 backdrop-blur-md px-8 shadow-sm">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-4 w-4 opacity-50" />}
                <Link
                  to={crumb.href}
                  className={cn(
                    "hover:text-primary transition-colors",
                    i === breadcrumbs.length - 1 ? "text-foreground font-semibold" : ""
                  )}
                >
                  {crumb.label}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden xl:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 w-64 bg-slate-50 border-none ring-offset-transparent focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-primary rounded-full hover:bg-primary/5">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </Button>
            <div className="h-8 w-[1px] bg-slate-200 mx-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 hover:bg-transparent group">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold leading-none">{user?.email?.split('@')[0]}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">Administrator</p>
                  </div>
                  <Avatar className="h-9 w-9 border-2 border-slate-100 group-hover:border-primary/20 transition-all">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 mt-2">
                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase opacity-50">Account</DropdownMenuLabel>
                <DropdownMenuItem className="rounded-lg h-10 px-3 cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg h-10 px-3 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg h-10 px-3 text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-10 flex-1 flex flex-col max-w-[1600px] mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
              >
                {title}
              </motion.h1>
              <p className="text-muted-foreground mt-1 font-medium">
                Emirates Solutions / Admin / <span className="text-slate-400 capitalize">{location.pathname.split("/").pop()}</span>
              </p>
            </div>
            {/* Optional current date display */}
            <div className="hidden lg:block bg-white px-4 py-2 rounded-xl shadow-sm border text-sm font-semibold text-slate-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
