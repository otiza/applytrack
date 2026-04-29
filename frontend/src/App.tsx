import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthPage from './AuthPage';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Pipeline from './pages/Pipeline';
import Companies from './pages/Companies';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';

type AuthMode = 'login' | 'register';

function AuthPageRoute({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  return (
    <AuthPage
      mode={mode}
      onAuthed={async () => {
        await refresh();
        navigate('/');
      }}
      onSwitch={(nextMode) => navigate(nextMode === 'register' ? '/register' : '/login')}
    />
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

function AuthLogoutShell() {
  const navigate = useNavigate();
  const { logout, refresh } = useAuth();

  return (
    <AppShell
      onLogout={() => {
        logout();
        void refresh().finally(() => navigate('/login', { replace: true }));
      }}
    />
  );
}

export default function AppContainer() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPageRoute mode="login" />} />
          <Route path="/register" element={<AuthPageRoute mode="register" />} />

          <Route
            element={<RequireAuth><AuthLogoutShell /></RequireAuth>}
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
