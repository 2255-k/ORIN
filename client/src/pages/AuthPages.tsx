import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Field, PasswordInput, TextInput } from "@/components/ui/Input";
import { api, getErrorMessage } from "@/services/api";
import { useAuth } from "@/store/auth";

function Shell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.22),transparent_42%),rgb(var(--bg-elevated))] p-10 lg:flex">
        <Logo />
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[rgb(var(--accent))]">Messaging, refined</p>
          <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight">Connect Beyond Words.</h1>
          <p className="mt-4 max-w-md text-[rgb(var(--muted))]">
            ORIN is a private, real-time workspace for conversations that stay fast, calm, and under your control.
          </p>
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">© {new Date().getFullYear()} ORIN</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-panel))] p-7 shadow-panel">
          <div className="mb-6 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const login = useAuth((s) => s.login);
  const loading = useAuth((s) => s.loading);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  return (
    <Shell title="Welcome back" subtitle="Sign in with your email or username.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await login(identifier, password, remember);
            navigate("/app");
          } catch (err) {
            setError(getErrorMessage(err, "Invalid credentials"));
          }
        }}
      >
        {error && <p className="text-sm text-[rgb(var(--danger))]">{error}</p>}
        <Field label="Email or username">
          <TextInput value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember me
        </label>
        <Button className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <div className="flex justify-between text-sm text-[rgb(var(--muted))]">
          <Link to="/register">Create account</Link>
          <Link to="/forgot-password">Forgot password</Link>
        </div>
      </form>
    </Shell>
  );
}

export function RegisterPage() {
  const register = useAuth((s) => s.register);
  const loading = useAuth((s) => s.loading);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  return (
    <Shell title="Create your ORIN" subtitle="A calmer place to keep the people who matter.">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
          }
          try {
            await register(form);
            navigate("/app");
          } catch (err) {
            setError(getErrorMessage(err));
          }
        }}
      >
        {error && <p className="text-sm text-[rgb(var(--danger))]">{error}</p>}
        <Field label="Full name">
          <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Username">
          <TextInput value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Password">
          <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        <Field label="Confirm password">
          <PasswordInput value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
        </Field>
        <Button className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
        <p className="text-sm text-[rgb(var(--muted))]">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </Shell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  return (
    <Shell title="Reset password" subtitle="We’ll send a secure reset link if that email exists.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const { data } = await api.post("/auth/forgot-password", { email });
          setMessage(data.message);
        }}
      >
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        {message && <p className="text-sm text-[rgb(var(--muted))]">{message}</p>}
        <Button className="w-full">Send reset link</Button>
        <Link className="text-sm text-[rgb(var(--muted))]" to="/login">
          Back to sign in
        </Link>
      </form>
    </Shell>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  return (
    <Shell title="Choose a new password" subtitle="Use at least 8 characters.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const { data } = await api.post("/auth/reset-password", { token, password, confirmPassword });
            setMessage(data.message);
            setTimeout(() => navigate("/login"), 1200);
          } catch (err) {
            setMessage(getErrorMessage(err));
          }
        }}
      >
        <Field label="New password">
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Field label="Confirm password">
          <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </Field>
        {message && <p className="text-sm">{message}</p>}
        <Button className="w-full">Update password</Button>
      </form>
    </Shell>
  );
}
