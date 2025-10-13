// components/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { JobsList } from '../components/JobsList';
import { WorkerProfileSetup } from '../components/WorkerProfileSetup';
import { CreateJob } from '../components/CreateJob';
import { Navbar } from '../components/Navbar';
import { WalletManagement } from '@/components/WalletManagement';
import { Footer } from '../components/Footer';
import { MyJobs } from '../components/MyJobs';
import { MyContracts } from '../components/MyContracts';
import { WorkerDashboard } from '../components/WorkerDashboard';
import { EmployerDashboard } from '../components/EmployerDashboard';
import { JobProgress } from '../components/JobProgress';
import { JobReviews } from '../components/JobReviews';
import { DisputeManagement } from '../components/DisputeManagement';
import { EscrowManagement } from '../components/EscrowManagement';
import { AlertCircle, Briefcase, UserPlus, Wallet, Home, Settings, FileText, TrendingUp, Users, Star, Shield, CreditCard } from 'lucide-react';
import { RoleSelection } from '@/components/RoleSelection';

const Dashboard = () => {
  const { user, token, logout, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalJobs: 0,
    activeContracts: 0,
    completedJobs: 0,
    totalEarnings: 0,
    pendingApplications: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchDashboardStats();
      setLoading(false);
    }
  }, [isAuthenticated, navigate]);

  if (user && !user.role) {
    return <RoleSelection />;
  }

  const fetchDashboardStats = async () => {
    try {
      let endpoint = '';
      if (user?.role === 'worker') {
        endpoint = 'https://verinest.up.railway.app/api/labour/worker/dashboard';
      } else if (user?.role === 'employer') {
        endpoint = 'https://verinest.up.railway.app/api/labour/employer/dashboard';
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDashboardStats(data.stats || data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  if (!user || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  // Render different sections based on active section
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'home':
        return <JobsList />;
      case 'worker-setup':
        return <WorkerProfileSetup />;
      case 'create-job':
        return <CreateJob />;
      case 'wallet':
        return <WalletManagement />;
      case 'my-jobs':
        return <MyJobs />;
      case 'contracts':
        return <MyContracts />;
      case 'worker-dashboard':
        return <WorkerDashboard />;
      case 'employer-dashboard':
        return <EmployerDashboard />;
      case 'job-progress':
        return <JobProgress />;
      case 'reviews':
        return <JobReviews />;
      case 'disputes':
        return <DisputeManagement />;
      case 'escrow':
        return <EscrowManagement />;
      default:
        return <JobsList />;
    }
  };

  const getRoleBasedStats = () => {
    if (user.role === 'worker') {
      return [
        { label: 'Total Jobs', value: dashboardStats.totalJobs, icon: Briefcase },
        { label: 'Active Contracts', value: dashboardStats.activeContracts, icon: FileText },
        { label: 'Completed Jobs', value: dashboardStats.completedJobs, icon: TrendingUp },
        { label: 'Total Earnings', value: `₦${dashboardStats.totalEarnings?.toLocaleString() || '0'}`, icon: Wallet },
      ];
    } else if (user.role === 'employer') {
      return [
        { label: 'Jobs Posted', value: dashboardStats.totalJobs, icon: Briefcase },
        { label: 'Active Workers', value: dashboardStats.activeContracts, icon: Users },
        { label: 'Completed Jobs', value: dashboardStats.completedJobs, icon: TrendingUp },
        { label: 'Pending Applications', value: dashboardStats.pendingApplications, icon: UserPlus },
      ];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-80 space-y-4">
            {/* User Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Welcome, {user.name}!</CardTitle>
                <CardDescription>
                  {!user.role ? 'Choose your path to get started' : `Role: ${user.role}`}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-2">
                {/* Main Navigation */}
                <Button
                  variant={activeSection === 'home' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setActiveSection('home')}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>

                <Button
                  variant={activeSection === 'wallet' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setActiveSection('wallet')}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet
                </Button>

                <Button
                  variant={activeSection === 'my-jobs' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setActiveSection('my-jobs')}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  My Jobs
                </Button>

                <Button
                  variant={activeSection === 'contracts' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setActiveSection('contracts')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Contracts
                </Button>
              </CardContent>
            </Card>

            {/* Role-specific Dashboard */}
            {user.role && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {user.role === 'worker' ? 'Worker Dashboard' : 'Employer Dashboard'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={activeSection === `${user.role}-dashboard` ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setActiveSection(`${user.role}-dashboard`)}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Dashboard Overview
                  </Button>

                  {user.role === 'worker' && (
                    <>
                      <Button
                        variant={activeSection === 'job-progress' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setActiveSection('job-progress')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Job Progress
                      </Button>
                      <Button
                        variant={activeSection === 'reviews' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setActiveSection('reviews')}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        My Reviews
                      </Button>
                    </>
                  )}

                  {user.role === 'employer' && (
                    <>
                      <Button
                        variant={activeSection === 'escrow' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setActiveSection('escrow')}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Escrow Management
                      </Button>
                    </>
                  )}

                  <Button
                    variant={activeSection === 'disputes' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setActiveSection('disputes')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Disputes
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Role Selection for New Users */}
            {!user.role && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Get Started</CardTitle>
                  <CardDescription>Choose how you want to use VeriNest</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => setActiveSection('worker-setup')}
                  >
                    <div className="text-left">
                      <Briefcase className="h-5 w-5 mb-1" />
                      <div className="font-semibold">Become a Worker</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Find jobs and get hired
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => setActiveSection('create-job')}
                  >
                    <div className="text-left">
                      <UserPlus className="h-5 w-5 mb-1" />
                      <div className="font-semibold">Hire Workers</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Post jobs and find talent
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Role-specific actions for existing users */}
            {user.role === 'worker' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Worker Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveSection('worker-setup')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </CardContent>
              </Card>
            )}

            {user.role === 'employer' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employer Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveSection('create-job')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Post New Job
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Email Verification Alert */}
            {!user.email_verified && (
              <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Please verify your email to access all features. 
                  <Button 
                    variant="link" 
                    className="text-yellow-800 p-0 ml-1 h-auto" 
                    onClick={() => navigate('/verify-email')}
                  >
                    Verify now
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Stats for Registered Users */}
            {user.role && getRoleBasedStats().length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {getRoleBasedStats().map((stat, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Welcome Message for New Users */}
            {!user.role && activeSection === 'home' && (
              <Card className="mb-6 bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle>Welcome to VeriNest! 🎉</CardTitle>
                  <CardDescription>
                    Get started by choosing your role. Become a worker to find jobs, or become an employer to hire talent.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button onClick={() => setActiveSection('worker-setup')}>
                      <Briefcase className="h-4 w-4 mr-2" />
                      Become a Worker
                    </Button>
                    <Button variant="outline" onClick={() => setActiveSection('create-job')}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Hire Workers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Section Content */}
            {renderActiveSection()}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;