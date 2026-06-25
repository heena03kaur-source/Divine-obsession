import React, { useState, useEffect } from "react";
import { Mail, Lock, ShieldAlert, X, Loader2, User } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, email: string, isAdmin: boolean) => void;
  closable?: boolean;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess, closable = true }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [devVerifyLink, setDevVerifyLink] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
    setNeedsVerification(false);
    setDevVerifyLink(null);
  }, [tab, isForgotPassword]);

  if (!isOpen) return null;

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      setError(null);
      setDevVerifyLink(null);
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend verification email.");
      }
      
      if (data.devVerifyLink) {
        setDevVerifyLink(data.devVerifyLink);
        setSuccessMsg("Check configuration. Dev Verification URL is printed to DevTools Console.");
        console.log("-----------------------------------------");
        console.log("DEV VERIFICATION LINK (Copy & Paste):", data.devVerifyLink);
        console.log("-----------------------------------------");
      } else {
        setSuccessMsg(data.message || "Verification email sent.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setNeedsVerification(false);
    setLoading(true);

    if (isForgotPassword) {
      try {
        const response = await fetch("/api/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        
        const text = await response.text();
        if (text.startsWith("<!DOCTYPE") || text.includes("<html")) {
          throw new Error("Cannot send email from GitHub Pages. A backend server is required.");
        }
        
        const data = JSON.parse(text);
        if (!response.ok) {
          throw new Error(data.error || "Failed to send reset email.");
        }
        setSuccessMsg(data.message || "Reset link sent successfully.");
      } catch (err: any) {
        if (err.message.includes("network") || err.message.includes("pattern") || err.message.includes("JSON")) {
          setError("Cannot send emails from static hosting like GitHub Pages. Please deploy to Cloud Run.");
        } else {
          setError(err.message || "An error occurred.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    const apiPath = tab === "login" ? "/api/login" : "/api/register";
    
    const bodyPayload = tab === "login"
      ? { email: email.trim().toLowerCase(), password: password.trim() }
      : { email: email.trim().toLowerCase(), password: password.trim(), name: name.trim() || email.split("@")[0] };

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const text = await response.text();
      if (text.startsWith("<!DOCTYPE") || text.includes("<html")) {
        throw new Error("Cannot authenticate from GitHub Pages. A backend server is required.");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: "Server response was not valid JSON." };
      }

      if (!response.ok) {
        if (data.verificationRequired) {
          setNeedsVerification(true);
          throw new Error(data.error || "Please verify your email.");
        }
        throw new Error(
          data.error || "Authentication failed. Please verify your credentials."
        );
      }
      
      if (data.requireVerification) {
        if (data.devVerifyLink) {
           setDevVerifyLink(data.devVerifyLink);
           setSuccessMsg("Check configuration. Dev Verification URL is printed to DevTools Console.");
           console.log("-----------------------------------------");
           console.log("DEV VERIFICATION LINK (Copy & Paste):", data.devVerifyLink);
           console.log("-----------------------------------------");
        } else {
           setSuccessMsg(data.message || "Please check your email to verify your account.");
        }
        setNeedsVerification(true);
        setTab("login");
        return;
      }
      
      onLoginSuccess(data.token, data.email, !!data.isAdmin);
      setEmail("");
      setPassword("");
      onClose();
    } catch (err: any) {
      if (err.message.includes("pattern") || err.message.includes("Unexpected token")) {
        setError("Cannot authenticate from static hosting like GitHub Pages. Please deploy to Cloud Run.");
      } else {
        setError(
          err.message ||
            "An unexpected error occurred during active credentials validation."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      id="login-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && closable) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-sm bg-[#FAF9F6] border border-[#7DB095]/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        id="login-modal-container"
      >
        <div className="px-6 py-5 border-b border-[#7DB095]/10 flex items-center justify-between">
          <div>
            <h3
              className="font-serif text-xl font-bold text-gray-800"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Join the Journal
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Access administrative features or standard reader mode
            </p>
          </div>
          {closable && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              id="login-modal-close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex border-b border-[#7DB095]/10 bg-white" id="login-modal-tabs">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border-b-2 cursor-pointer ${
              tab === "login" ? "border-[#7DB095] text-[#7DB095]" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-200 border-b-2 cursor-pointer ${
              tab === "register" ? "border-[#7DB095] text-[#7DB095]" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-6 space-y-4">
          {successMsg && (
            <div className="px-4 py-3 bg-[#7DB095]/10 border border-[#7DB095]/20 rounded-xl text-[#7DB095] flex flex-col gap-2 text-xs font-sans">
              <span className="leading-relaxed">{successMsg}</span>
              {devVerifyLink && (
                  <a href={devVerifyLink} className="inline-block mt-2 px-3 py-1.5 bg-[#7DB095]/20 hover:bg-[#7DB095]/30 text-[#7DB095] rounded-md font-medium text-xs transition-colors truncate">
                    Test Link: Click here to verify
                  </a>
              )}
            </div>
          )}
          {error && (
            <div
              className="px-4 py-3 bg-red-50 border border-red-200/50 rounded-xl text-red-600 flex flex-col gap-2 text-xs font-sans"
              id="login-error-alert"
            >
              <div className="flex items-start gap-2.5">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
              {needsVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading || !email}
                  className="mt-1 self-start px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {loading ? "Re-sending..." : "Resend Verification Email"}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="login-form" noValidate>
            {tab === "register" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7DB095] font-sans">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] outline-none rounded-xl text-xs transition-all duration-200 text-gray-800 font-sans shadow-sm"
                    id="register-name-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#7DB095] font-sans">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] outline-none rounded-xl text-xs transition-all duration-200 text-gray-800 font-sans shadow-sm"
                  id="login-email-input"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7DB095] font-sans">
                    Password
                  </label>
                  {tab === "login" && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-[10px] text-gray-500 hover:text-[#7DB095] transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={15} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] outline-none rounded-xl text-xs transition-all duration-200 text-gray-800 font-sans shadow-sm"
                    id="login-password-input"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#7DB095] hover:bg-[#648E77] text-white font-sans text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              id="login-submit-button"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{isForgotPassword ? "Sending..." : "Authing..."}</span>
                </>
              ) : (
                <span>{isForgotPassword ? "Send Reset Link" : tab === "login" ? "Sign In" : "Register & Sign In"}</span>
              )}
            </button>
            
            {isForgotPassword && (
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="w-full text-[10px] text-gray-500 hover:text-gray-700 font-medium py-2"
              >
                Back to Login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
