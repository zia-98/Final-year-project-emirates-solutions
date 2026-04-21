import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import DebugAdmin from "./pages/DebugAdmin";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import CartSidebar from "@/components/CartSidebar";
import AIChatbot from "@/components/AIChatbot";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import ServicesPage from "./pages/ServicesPage";
import InternshipsPage from "./pages/InternshipsPage";
import ApplicationTracking from "./pages/ApplicationTracking";
import ApplicationDetails from "./pages/ApplicationDetails";
import SavedRoadmaps from "./pages/SavedRoadmaps";
import InternshipApply from "./pages/InternshipApply";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
// import OpalShop from "./pages/OpalShop";
import ProductDetail from "./pages/ProductDetail";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import AuthPage from "./pages/AuthPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import OrderHistory from "./pages/OrderHistory";
import NotFound from "./pages/NotFound";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CookiesPage from "./pages/CookiesPage";
import ResetPassword from "./pages/ResetPassword";
import ProfilePage from "./pages/ProfilePage";


// Service pages
import ITHardwareSalesPage from "./pages/services/ITHardwareSalesPage";
import SoftwareSolutionsPage from "./pages/services/SoftwareSolutionsPage";
import SoftwareLicensingPage from "./pages/services/SoftwareLicensingPage";
import AMCServicesPage from "./pages/services/AMCServicesPage";
import CoursePage from "./pages/services/CoursePage";
// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminInternships from "./pages/admin/AdminInternships";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminResumeScreening from "./pages/admin/AdminResumeScreening";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminFeedback from "@/pages/admin/AdminFeedback";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <Sonner />
              <CartSidebar />
              <AIChatbot type="public" />
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />


              {/* Service pages - public for viewing */}
              <Route path="/services/it-hardware-sales" element={<ITHardwareSalesPage />} />
              <Route path="/services/software-solutions" element={<SoftwareSolutionsPage />} />
              <Route path="/services/software-licensing" element={<SoftwareLicensingPage />} />
              <Route path="/services/amc" element={<AMCServicesPage />} />
              <Route path="/courses/:courseId" element={<CoursePage />} />
              <Route path="/products/:id" element={<ProductDetail />} />

              {/* Internships - viewable by all, apply requires auth */}
              <Route path="/internships" element={<InternshipsPage />} />
              <Route path="/internships/apply" element={
                <ProtectedRoute>
                  <InternshipApply />
                </ProtectedRoute>
              } />



              <Route path="/applications" element={
                <ProtectedRoute>
                  <ApplicationTracking />
                </ProtectedRoute>
              } />

              <Route path="/applications/:id" element={
                <ProtectedRoute>
                  <ApplicationDetails />
                </ProtectedRoute>
              } />

              <Route path="/orders" element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              } />

              <Route path="/saved-roadmaps" element={
                <ProtectedRoute>
                  <SavedRoadmaps />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              {/* Protected routes - require authentication */}
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              } />
              <Route path="/order-confirmation" element={
                <ProtectedRoute>
                  <OrderConfirmation />
                </ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/internships" element={<AdminInternships />} />
              <Route path="/admin/newsletter" element={<AdminNewsletter />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/resume-screening" element={<AdminResumeScreening />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/feedback" element={<AdminFeedback />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="/debug-admin" element={<DebugAdmin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
