import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { useUi } from "@/store/ui";
import { AppShell } from "@/pages/AppShell";
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from "@/pages/AuthPages";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[rgb(var(--muted))]">
        Restoring your session…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Guest({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  const hydrate = useAuth((s) => s.hydrate);
  const theme = useUi((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route
        path="/login"
        element={
          <Guest>
            <LoginPage />
          </Guest>
        }
      />
      <Route
        path="/register"
        element={
          <Guest>
            <RegisterPage />
          </Guest>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Guest>
            <ForgotPasswordPage />
          </Guest>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/app/*"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      />
    </Routes>
  );
}
