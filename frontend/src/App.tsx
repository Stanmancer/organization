// App.tsx - Updated with proper dashboard routing
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedLayout } from './components/ProtectedLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { PaymentVerification } from './components/PaymentVerification';
import { EmailVerification } from './components/EmailVerification';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentFailed } from './pages/PaymentFailed';
import { JobsList } from './components/JobsList';
import { JobDetails } from './components/JobDetails';
import { CreateJob } from './components/CreateJob';
import { WorkerProfileSetup } from './components/WorkerProfileSetup';
import { MyJobs } from './components/MyJobs';
import { MyContracts } from './components/MyContracts';
import { CreateJobApplication } from './components/CreateJobApplication';
import { TermsAndConditions } from './components/TermsAndConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { AboutUs } from './components/AboutUs';
import { ContactUs } from './components/ContactUs';
import { HelpCenter } from './components/HelpCenter';
import { DisputeResolution } from './components/DisputeResolution';
import { SafetyGuidelines } from './components/SafetyGuidelines';
import { Careers } from './components/Careers';
import { PressKit } from './components/PressKit';
import { Blog } from './components/Blog';
import { KYCFlow } from './components/KYCFlow';
import { RoleSelection } from './components/RoleSelection';
import { Settings } from './components/Settings';
import { TransactionsPage } from './components/TransactionsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboard } from './components/AdminDashboard';
import { VerifierDashboard } from './components/VerifierDashboard';
import { WorkerPortfolio } from './components/WorkerPortfolio';
import { Analytics } from "@vercel/analytics/react"

// Main App Routes - All protected routes now go through Dashboard
const AppRoutes = () => {
  const { authInitialized } = useAuth();
  
  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Public Routes - No authentication required */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/payment/verify" element={<PaymentVerification />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed" element={<PaymentFailed />} />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/support" element={<ContactUs />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/disputes" element={<DisputeResolution />} />
      <Route path="/safety" element={<SafetyGuidelines />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/press" element={<PressKit />} />
      <Route path="/blog" element={<Blog />} />
      
      {/* KYC Verification Flow */}
      <Route path="/verify/kyc" element={
        <ProtectedRoute>
          <KYCFlow />
        </ProtectedRoute>
      } />
      
      {/* Role Selection */}
      <Route path="/select-role" element={
        <ProtectedRoute>
          <RoleSelection />
        </ProtectedRoute>
      } />

      {/* Main Dashboard - All authenticated routes are nested here */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground">
          <AppRoutes />
          <Toaster position="top-right" />
          <Analytics />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;