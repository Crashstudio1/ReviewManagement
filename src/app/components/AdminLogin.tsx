import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, AlertCircle, Lock, User } from "lucide-react";
import { api, type AuthUser } from "../api";
import { DevelopingPartner } from "./DevelopingPartner";
import { GovernmentLogo } from "./GovernmentLogo";

interface Props {
  onLogin: (user: AuthUser) => void;
  onBack: () => void;
}

export function AdminLogin({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<"user" | "pass" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await api.login(email, password);
      onLogin(result.user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Invalid email or password. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--gov-cream)", fontFamily: "'Inter', 'Noto Sans Tamil', sans-serif" }}
    >
      {/* Split layout */}
      <div className="flex flex-1 flex-col lg:flex-row min-h-screen">

        {/* Left panel — branding */}
        <div
          className="relative flex flex-col items-center justify-center px-10 py-16 lg:w-[42%] overflow-hidden"
          style={{ background: "linear-gradient(160deg, #3D0010 0%, #800020 55%, #B03A48 100%)" }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-10" style={{ background: "var(--gov-gold)" }} />
          <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: "var(--gov-gold)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5 border-2" style={{ borderColor: "var(--gov-gold)" }} />

          <div className="relative flex flex-col items-center text-center max-w-xs">
            <GovernmentLogo className="mb-7 h-32 w-32 rounded-2xl border-4 border-white/20 p-1" />

            <p
              className="text-white leading-snug mb-2"
              style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontSize: "1.15rem", fontWeight: 700 }}
            >
              வவுனியா தெற்கு தமிழ் பிரதேச சபை
            </p>
            <p className="text-white/70 mb-6" style={{ fontSize: "0.85rem" }}>
              Vavuniya South Tamil Pradeshiya Sabha
            </p>

            <div className="h-px w-16 mb-6" style={{ background: "rgba(212,175,55,0.5)" }} />

            <p
              className="text-white mb-1"
              style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--gov-gold)" }}
            >
              Admin Portal
            </p>
            <p className="text-white/60" style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>
              Citizen Review &amp; Queue Management System
            </p>

            {/* Feature pills */}
            <div className="mt-8 flex flex-col gap-2 w-full">
              {[
                { icon: "📊", label: "Real-time Analytics Dashboard" },
                { icon: "🎫", label: "Queue Token Management" },
                { icon: "⭐", label: "Citizen Review Monitoring" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <span style={{ fontSize: "1rem" }}>{f.icon}</span>
                  <span className="text-white/75 text-xs">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — login form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-14">
          <div className="w-full max-w-md">

            {/* Shield icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #800020 0%, #B03A48 100%)" }}
              >
                <ShieldCheck size={32} color="#fff" strokeWidth={1.5} />
              </div>
            </div>

            <h2
              className="text-center mb-1"
              style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--gov-maroon)" }}
            >
              Admin Sign In
            </h2>
            <p className="text-center mb-8" style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
              Authorised personnel only
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Email
                </label>
                <div
                  className="flex items-center rounded-2xl overflow-hidden transition-all duration-150"
                  style={{
                    background: "#fff",
                    border: `2px solid ${focused === "user" ? "var(--gov-maroon)" : "var(--border)"}`,
                    boxShadow: focused === "user" ? "0 0 0 4px rgba(128,0,32,0.08)" : "none",
                  }}
                >
                  <div className="px-4 py-4 flex-shrink-0" style={{ color: focused === "user" ? "var(--gov-maroon)" : "var(--muted-foreground)" }}>
                    <User size={18} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onFocus={() => setFocused("user")}
                    onBlur={() => setFocused(null)}
                    placeholder="Enter your email"
                    className="flex-1 py-4 pr-4 bg-transparent focus:outline-none text-sm"
                    style={{ color: "var(--foreground)" }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Password
                </label>
                <div
                  className="flex items-center rounded-2xl overflow-hidden transition-all duration-150"
                  style={{
                    background: "#fff",
                    border: `2px solid ${focused === "pass" ? "var(--gov-maroon)" : "var(--border)"}`,
                    boxShadow: focused === "pass" ? "0 0 0 4px rgba(128,0,32,0.08)" : "none",
                  }}
                >
                  <div className="px-4 py-4 flex-shrink-0" style={{ color: focused === "pass" ? "var(--gov-maroon)" : "var(--muted-foreground)" }}>
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onFocus={() => setFocused("pass")}
                    onBlur={() => setFocused(null)}
                    placeholder="Enter your password"
                    className="flex-1 py-4 bg-transparent focus:outline-none text-sm"
                    style={{ color: "var(--foreground)" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="px-4 py-4 flex-shrink-0 transition-colors"
                    style={{ color: "var(--muted-foreground)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--gov-maroon)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)")}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "#FFEBEE", border: "1.5px solid #FFCDD2" }}
                >
                  <AlertCircle size={16} color="#C62828" className="flex-shrink-0" />
                  <p style={{ fontSize: "0.82rem", color: "#C62828" }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-4 rounded-2xl text-white font-semibold text-base shadow-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                style={{
                  background: "linear-gradient(135deg, #3D0010 0%, #800020 60%, #B03A48 100%)",
                  letterSpacing: "0.02em",
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Sign In to Admin Panel
                  </>
                )}
              </button>
            </form>

            {/* Back to kiosk */}
            <div className="mt-8 text-center">
              <button
                onClick={onBack}
                className="text-sm transition-colors"
                style={{ color: "var(--muted-foreground)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--gov-maroon)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)")}
              >
                ← Return to Citizen Kiosk
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="py-2.5 text-center text-xs"
        style={{ background: "var(--gov-maroon-dark)", color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif" }}
      >
        <div>© 2024 Vavuniya South Tamil Pradeshiya Sabha — Secure Admin Access &nbsp;|&nbsp; All activity is logged</div>
        <div className="mt-1">
          <DevelopingPartner linkClassName="text-[var(--gov-gold)] underline underline-offset-2 hover:text-white" />
        </div>
      </div>
    </div>
  );
}
