import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import logo from '../assets/verinest.png';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle, ExternalLink, ArrowLeft, Mail, User, Lock, Shield, Eye, EyeOff, Sparkles, Zap, Crown, Loader2, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { PrivacyPolicy } from '../components/Landingpage/PrivacyPolicy';
import { TermsAndConditions } from '../components/Landingpage/TermsAndConditions';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../utils/api';

const Register = () => {
  const { register, loginWithOAuth } = useAuth();
  // Get referral code from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const referralFromUrl = urlParams.get('ref') || '';
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    referral_code: referralFromUrl,
    role: '', // Add role to form data
  });
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'worker' | 'employer' | 'vendor' | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  // Username validation states
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Username availability check
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError('');
      return;
    }

    // Only allow letters, numbers, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameAvailable(false);
      setUsernameError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setCheckingUsername(true);
    setUsernameError('');

    try {
      // Use fetch directly instead of apiClient to avoid authentication middleware
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.verinest.xyz'}/api/auth/check-username?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      

      if (!response.ok) {
        throw new Error('Failed to check username availability');
      }

      const data = await response.json();
      setUsernameAvailable(data.available);
      if (!data.available) {
        setUsernameError(data.message || 'This username is already taken');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
      setUsernameError('Unable to check username availability');
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounced username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.username) {
        checkUsernameAvailability(formData.username);
      } else {
        setUsernameAvailable(null);
        setUsernameError('');
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  // Enhanced OAuth handlers with role selection
  const handleOAuthLogin = async (provider: 'google' | 'twitter') => {
    if (!selectedRole) {
      toast.error('Please select your role first');
      return;
    }
    
    setOauthError(null);
    setOauthLoading(provider);
    
    try {
      if (provider === 'google') {
        // Use existing OAuth implementation
        loginWithOAuth('google');
      } else if (provider === 'twitter') {
        // Demo Twitter/X OAuth - in production, this would connect to actual Twitter/X OAuth
        await handleTwitterOAuth();
      }
    } catch (error: any) {
      setOauthError(error.message || `${provider} authentication failed`);
      setOauthLoading(null);
      setTimeout(() => setOauthError(null), 5000);
    }
  };

  // Demo Twitter/X OAuth implementation
  const handleTwitterOAuth = async () => {
    // Simulate OAuth flow for demo purposes
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate successful OAuth
        const mockUserData = {
          name: 'Demo User',
          username: 'demo_user',
          email: 'demo@twitter.com',
          provider: 'twitter'
        };
        
        // In real implementation, this would exchange OAuth code for tokens
        // For demo, we'll show success and redirect to register with prefilled data
        setOauthLoading(null);
        setFormData({
          ...formData,
          name: mockUserData.name,
          username: mockUserData.username,
          email: mockUserData.email,
          role: selectedRole || '', // Include selected role
        });
        setShowEmailForm(true);
        toast.success('Twitter/X connected! Please complete your registration.');
        resolve(mockUserData);
      }, 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.passwordConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!formData.role) {
      toast.error('Please select your role');
      return;
    }

    // Username validation
    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }

    if (usernameAvailable === false) {
      toast.error('Username is already taken. Please choose another one.');
      return;
    }

    if (usernameAvailable === null && formData.username.length >= 3) {
      toast.error('Please wait for username availability check to complete');
      return;
    }
    
    setLoading(true);
    try {
      // Store role in sessionStorage for post-registration redirect
      sessionStorage.setItem('selected_role', formData.role);
      
      await register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        referral_code: formData.referral_code,
        role: formData.role,
      });
      
      setRegistered(true);
      toast.success('Registration successful! Please check your email to verify your account.');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    const storedRole = sessionStorage.getItem('selectedRole');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>
              Please verify your email to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                We've sent a verification link to <strong>{formData.email}</strong>. 
                Check your inbox and click the link to verify your account.
                {storedRole && (
                  <span className="block mt-2 text-sm">
                    After verification, you'll be redirected to complete your {storedRole} profile.
                  </span>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = 'https://mail.google.com'} 
                className="w-full"
                variant="outline"
              >
                Open Gmail
              </Button>
              <Button 
                onClick={() => window.location.href = 'https://outlook.live.com'} 
                className="w-full"
                variant="outline"
              >
                Open Outlook
              </Button>
              <Button 
                onClick={() => navigate('/verify-email')}
                className="w-full"
              >
                Go to Verification Page
              </Button>
            </div>
            
            {/* Role-specific next steps */}
            {storedRole && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 text-center">
                  <strong>Next Steps:</strong> After verification, you'll be able to:
                  {storedRole === 'worker' && (
                    <span className="block mt-1">• Create your worker profile • Add portfolio • Set availability</span>
                  )}
                  {storedRole === 'employer' && (
                    <span className="block mt-1">• Post jobs • Manage applications • Handle payments</span>
                  )}
                  {storedRole === 'vendor' && (
                    <span className="block mt-1">• List services • Manage subscriptions • Track analytics</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Registration Screen
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-slate-200/50 bg-[size:60px_60px]"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-primary/20 to-transparent rounded-full blur-3xl"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl relative z-10"
        >
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                {/* Left Side - Welcome Section */}
                <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-primary to-primary/80 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10 space-y-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-center"
                    >
                      <div className="mx-auto w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                        <Sparkles className="w-10 h-10" />
                      </div>
                      <h1 className="text-4xl font-bold mb-4">Join VeriNest</h1>
                      <p className="text-xl text-white/90 mb-8">
                        Connect with trusted professionals and grow your career
                      </p>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Shield className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Secure Platform</h3>
                          <p className="text-white/80 text-sm">Escrow-protected payments</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Quick Verification</h3>
                          <p className="text-white/80 text-sm">Get verified in minutes</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Crown className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Premium Support</h3>
                          <p className="text-white/80 text-sm">24/7 customer assistance</p>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-center pt-8"
                    >
                      <p className="text-white/70 text-sm mb-2">Already have an account?</p>
                      <Link 
                        to="/login"
                        className="inline-flex items-center text-white hover:text-white/90 transition-colors font-medium"
                      >
                        Sign in here
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Link>
                    </motion.div>
                  </div>
                </div>
                
                {/* Right Side - Registration Form */}
                <div className="p-8 md:p-12">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Logo and Title */}
                    <div className="text-center md:text-left space-y-4">
                      <div className="flex justify-center md:justify-start">
                        <img src={logo} alt="VeriNest" className="h-12 w-auto" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
                        <p className="text-slate-600 mt-2">Choose your registration method</p>
                      </div>
                    </div>

                    {/* Role Selection */}
                    {!showEmailForm && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                      >
                        <Label className="text-sm font-medium text-slate-700">I am a:</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'worker', label: 'Worker', icon: <User className="w-4 h-4" /> },
                            { value: 'employer', label: 'Employer', icon: <Crown className="w-4 h-4" /> },
                            { value: 'vendor', label: 'Vendor', icon: <Sparkles className="w-4 h-4" /> }
                          ].map((role) => (
                            <motion.button
                              key={role.value}
                              type="button"
                              onClick={() => {
                              setSelectedRole(role.value as any);
                              setFormData({ ...formData, role: role.value });
                            }}
                              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                                selectedRole === role.value
                                  ? 'border-primary bg-primary/5 text-primary shadow-lg'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex flex-col items-center space-y-2">
                                {role.icon}
                                <span className="text-sm font-medium">{role.label}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* OAuth Section */}
                    {!showEmailForm && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200"></span>
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-4 text-slate-500">Quick Sign Up</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Google OAuth */}
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              type="button"
                              className="w-full h-12 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 transition-all duration-200"
                              onClick={() => handleOAuthLogin('google')}
                              disabled={oauthLoading !== null || !selectedRole}
                            >
                              {oauthLoading === 'google' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                              ) : (
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                              )}
                              Continue with Google
                            </Button>
                          </motion.div>

                          {/* Twitter/X OAuth */}
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              type="button"
                              className="w-full h-12 bg-black border-2 border-black hover:bg-slate-900 text-white transition-all duration-200"
                              onClick={() => handleOAuthLogin('twitter')}
                              disabled={oauthLoading !== null || !selectedRole}
                            >
                              {oauthLoading === 'twitter' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                              )}
                              Continue with X (Twitter)
                            </Button>
                          </motion.div>
                        </div>

                        {/* OAuth Error */}
                        <AnimatePresence>
                          {oauthError && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm"
                            >
                              {oauthError}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Email Registration Option */}
                    {!showEmailForm && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-4"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200"></span>
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-4 text-slate-500">Or continue with email</span>
                          </div>
                        </div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 border-2 border-slate-200 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                            onClick={() => setShowEmailForm(true)}
                            disabled={!selectedRole}
                          >
                            <Mail className="w-5 h-5 mr-3" />
                            Sign up with Email
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Email Registration Form */}
                    <AnimatePresence>
                      {showEmailForm && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">Complete Registration</h3>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowEmailForm(false)}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              <ArrowLeft className="w-4 h-4 mr-1" />
                              Back
                            </Button>
                          </div>

                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                  id="name"
                                  type="text"
                                  required
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  placeholder="Enter your full name"
                                  className="pl-10 h-11 border-slate-200 focus:border-primary"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                                Username
                                {usernameAvailable === true && (
                                  <span className="ml-2 text-green-600 text-xs flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Available
                                  </span>
                                )}
                              </Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                  id="username"
                                  type="text"
                                  required
                                  value={formData.username}
                                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                  placeholder="Choose a username"
                                  className={`pl-10 pr-10 h-11 border-slate-200 focus:border-primary ${
                                    usernameAvailable === false ? 'border-red-500 focus:border-red-500' : 
                                    usernameAvailable === true ? 'border-green-500 focus:border-green-500' : 
                                    ''
                                  }`}
                                />
                                {checkingUsername && (
                                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 animate-spin" />
                                )}
                                {usernameAvailable === true && !checkingUsername && (
                                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                                )}
                                {usernameAvailable === false && !checkingUsername && (
                                  <X className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4" />
                                )}
                              </div>
                              {usernameError && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                  <X className="w-3 h-3" />
                                  {usernameError}
                                </p>
                              )}
                              {formData.username && formData.username.length < 3 && (
                                <p className="text-xs text-slate-500">
                                  Username must be at least 3 characters long
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                  id="email"
                                  type="email"
                                  required
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  placeholder="Enter your email address"
                                  className="pl-10 h-11 border-slate-200 focus:border-primary"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                  id="password"
                                  type={showPassword ? "text" : "password"}
                                  required
                                  value={formData.password}
                                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                  placeholder="Create a strong password"
                                  className="pl-10 pr-10 h-11 border-slate-200 focus:border-primary"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="passwordConfirm" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                  id="passwordConfirm"
                                  type={showPasswordConfirm ? "text" : "password"}
                                  required
                                  value={formData.passwordConfirm}
                                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                                  placeholder="Confirm your password"
                                  className="pl-10 pr-10 h-11 border-slate-200 focus:border-primary"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="referral_code" className="text-sm font-medium text-slate-700">Referral Code (Optional)</Label>
                              <Input
                                id="referral_code"
                                type="text"
                                value={formData.referral_code}
                                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                                placeholder="Enter referral code if you have one"
                                className="h-11 border-slate-200 focus:border-primary"
                              />
                            </div>

                            {/* Terms Agreement */}
                            <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                              <Checkbox
                                id="terms-checkbox"
                                checked={acceptedTerms}
                                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                                className="mt-1"
                              />
                              <Label htmlFor="terms-checkbox" className="text-sm leading-relaxed text-slate-600">
                                I have read and agree to the{' '}
                                <button
                                  type="button"
                                  onClick={() => setActiveModal('terms')}
                                  className="text-primary hover:underline font-medium"
                                >
                                  Terms and Conditions
                                </button>{' '}
                                and{' '}
                                <button
                                  type="button"
                                  onClick={() => setActiveModal('privacy')}
                                  className="text-primary hover:underline font-medium"
                                >
                                  Privacy Policy
                                </button>
                              </Label>
                            </div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button 
                                type="submit" 
                                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                                disabled={loading || !acceptedTerms}
                              >
                                {loading ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating Account...
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Create Account
                                  </div>
                                )}
                              </Button>
                            </motion.div>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Terms Reminder for OAuth */}
                    {!showEmailForm && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-4"
                      >
                        <div className="text-center text-xs text-slate-500">
                          By continuing, you agree to our{' '}
                          <button
                            type="button"
                            onClick={() => setActiveModal('terms')}
                            className="text-primary hover:underline font-medium"
                          >
                            Terms
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            onClick={() => setActiveModal('privacy')}
                            className="text-primary hover:underline font-medium"
                          >
                            Privacy Policy
                          </button>
                        </div>
                        
                        {/* Mobile Login Link */}
                        <div className="text-center text-sm text-slate-600">
                          Already have an account?{' '}
                          <Link 
                            to="/login"
                            className="text-primary hover:underline font-medium"
                          >
                            Sign in
                          </Link>
                        </div>
                      </motion.div>
                    )}

                    {/* Mobile Login Link for Email Form */}
                    {showEmailForm && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-center text-sm text-slate-600"
                      >
                        Already have an account?{' '}
                        <Link 
                          to="/login"
                          className="text-primary hover:underline font-medium"
                        >
                          Sign in
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Legal Modals */}
      <Dialog open={!!activeModal} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh]">
            {activeModal === 'privacy' ? <PrivacyPolicy /> : <TermsAndConditions />}
          </div>
          <DialogFooter>
            <Button onClick={() => setActiveModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Register;