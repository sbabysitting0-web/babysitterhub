import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import AuthCallback from "./pages/auth/AuthCallback";
import SelectRole from "./pages/auth/SelectRole";
import ParentOnboarding from "./pages/onboarding/ParentOnboarding";
import BabysitterOnboarding from "./pages/onboarding/BabysitterOnboarding";
import SearchSitters from "./pages/parent/SearchSitters";
import SitterProfile from "./pages/parent/SitterProfile";
import BookingPage from "./pages/parent/BookingPage";
import ParentDashboard from "./pages/parent/ParentDashboard";
import Inbox from "./pages/parent/Inbox";
import SubscriptionPage from "./pages/parent/SubscriptionPage";
import ReviewPage from "./pages/parent/ReviewPage";
import BabysitterDashboard from "./pages/babysitter/BabysitterDashboard";
import AdminPanel from "./pages/admin/AdminPanel";
import FixAccount from "./pages/FixAccount";
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";
import TermsPage from "./pages/TermsPage";
import TipsParentsPage from "./pages/TipsParentsPage";
import TipsBabysittersPage from "./pages/TipsBabysittersPage";
import SpecialNeedsPage from "./pages/SpecialNeedsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/babysitters" element={<SearchSitters />} />
            <Route path="/babysitters/:id" element={<SitterProfile />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/tips/parents" element={<TipsParentsPage />} />
            <Route path="/tips/babysitters" element={<TipsBabysittersPage />} />
            <Route path="/special-needs" element={<SpecialNeedsPage />} />

            {/* Onboarding */}
            <Route
              path="/onboarding/parent"
              element={
                <ProtectedRoute>
                  <ParentOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/babysitter"
              element={
                <ProtectedRoute>
                  <BabysitterOnboarding />
                </ProtectedRoute>
              }
            />

            {/* Parent routes */}
            <Route
              path="/parent/dashboard"
              element={
                <ProtectedRoute allowedRoles={["parent"]}>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/booking/:sitterId"
              element={
                <ProtectedRoute allowedRoles={["parent"]}>
                  <BookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/inbox"
              element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/subscription"
              element={
                <ProtectedRoute allowedRoles={["parent"]}>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/review/:bookingId"
              element={
                <ProtectedRoute allowedRoles={["parent"]}>
                  <ReviewPage />
                </ProtectedRoute>
              }
            />

            {/* Babysitter routes */}
            <Route
              path="/babysitter/dashboard"
              element={
                <ProtectedRoute allowedRoles={["babysitter"]}>
                  <BabysitterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/babysitter/inbox"
              element={
                <ProtectedRoute allowedRoles={["babysitter"]}>
                  <Inbox />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            <Route
              path="/fix-account"
              element={
                <ProtectedRoute>
                  <FixAccount />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
