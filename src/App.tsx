// ============================================================
// FinanceMe — App Root
// Auth flow: check user → onboarding or login → protected routes
// ============================================================

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { api } from './api/ipc';

// Layout
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Savings from './pages/Savings';
import Investment from './pages/Investment';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AIAdvisor from './pages/AIAdvisor';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

/**
 * AuthProvider — Runs globally on app launch to initialize user state.
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('[AuthProvider] Calling api.auth.getUser()...');
        const user = await api.auth.getUser();
        console.log('[AuthProvider] Result:', user);
        
        if (!user) {
          // No user exists — navigate to onboarding
          navigate('/onboarding', { replace: true });
        } else {
          // User exists but not authenticated — navigate to login
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('[Auth] Failed to check user:', err);
        navigate('/onboarding', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl tracking-tighter font-extrabold flex items-center justify-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
              Finance
            </span>
            <span className="text-slate-100 ml-0.5">Me</span>
          </h1>
          <p className="text-slate-400 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes (no sidebar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected routes with sidebar layout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/investment" element={<Investment />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/ai-advisor" element={<AIAdvisor />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
