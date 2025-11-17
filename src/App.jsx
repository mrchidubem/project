import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Auth Components
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import PasswordReset from "./components/Auth/PasswordReset";
import PrivateRoute from "./components/PrivateRoute";

// Core Components
import Dashboard from "./components/Dashboard";
import MedicationList from "./components/MedicationList";
import ADRForm from "./components/ADRForm";
import PharmacyFinder from "./components/PharmacyFinder";
import OnboardingOverlay from "./components/OnboardingOverlay";

// Navigation
import { Header, BottomNav, Sidebar } from "./components/Navigation";

// Pages
import PaymentPage from "./pages/PaymentPage.jsx";
import Premium from "./pages/Premium.jsx";
import MockCheckout from "./pages/MockCheckout.jsx";
import Upgrade from "./pages/Upgrade.jsx";
import PrivacySettings from "./pages/PrivacySettings.jsx";
import Settings from "./pages/Settings.jsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";

// Utils
import onboardingManager from "./utils/onboardingManager";
import authService from "./utils/authService";

const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      // Only check for onboarding if user is authenticated
      if (currentUser) {
        const shouldShow = onboardingManager.shouldShowTutorial();
        setShowOnboarding(shouldShow);
      } else {
        // Reset onboarding state when user logs out
        setShowOnboarding(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for custom event to restart onboarding from any component
  useEffect(() => {
    const handleRestartOnboarding = () => {
      setShowOnboarding(true);
    };

    window.addEventListener('restartOnboarding', handleRestartOnboarding);
    return () => window.removeEventListener('restartOnboarding', handleRestartOnboarding);
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Router>
      <div className="app">
        {/* Skip Navigation Link for Accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        {user && <Header user={user} onLogout={handleLogout} />}
        {user && <Sidebar />}
        
        <main id="main-content" className="app__main" role="main">
          {user && (
            <OnboardingOverlay
              isActive={showOnboarding}
              onComplete={handleOnboardingComplete}
              onSkip={handleOnboardingSkip}
            />
          )}

            <Routes>
              <Route path="/" element={
                user ? <Navigate to="/dashboard" replace /> : <Login />
              } />
              <Route path="/signup" element={
                user ? <Navigate to="/dashboard" replace /> : <Signup />
              } />
              <Route path="/password-reset" element={
                user ? <Navigate to="/dashboard" replace /> : <PasswordReset />
              } />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/medications" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <MedicationList />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/adr" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <ADRForm />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/pharmacy-finder" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <PharmacyFinder />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/upgrade" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <Upgrade />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/premium" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <Premium />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <MockCheckout />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/payment" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <PaymentPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/privacy" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <PrivacySettings />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <Settings />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <PrivateRoute user={user} loading={authLoading}>
                    <AnalyticsDashboard />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </main>

        {user && <BottomNav />}
      </div>
    </Router>
  );
};

export default App;
