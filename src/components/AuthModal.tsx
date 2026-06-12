import React, { useState, useEffect } from "react";
import { Mail, Lock, ShieldAlert, X, Loader2, User } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, email: string, isAdmin: boolean) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    setError(null);
  }, [tab]);

  useEffect(() => {
    const handleOauthMessage = (e: MessageEvent) => {
      const origin = e.origin;
      if (
        !(
          !origin.endsWith(".run.app") &&
          !origin.includes("localhost") &&
          !origin.includes("0.0.0.0")
        ) &&
        e.data?.type === "OAUTH_AUTH_SUCCESS"
      ) {
        const { token, email: userEmail, isAdmin } = e.data;
        onLoginSuccess(token, userEmail, !!isAdmin);
        setEmail("");
        setPassword("");
        onClose();
        setOauthLoading(false);
      }
    };
    
    window.addEventListener("message", handleOauthMessage);
    return () => window.removeEventListener("message", handleOauthMessage);
  }, [onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const apiPath = tab === "login" ? "/api/login" : "/api/register";
    
    const bodyPayload = tab === "login"
      ? { email: email.trim().toLowerCase(), password }
      : { email: email.trim().toLowerCase(), password, name: name.trim() || email.split("@")[0] };

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "Authentication failed. Please verify your credentials."
        );
      }
      onLoginSuccess(data.token, data.email, !!data.isAdmin);
      setEmail("");
      setPassword("");
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          "An unexpected error occurred during active credentials validation."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/google/url");
      if (!response.ok) {
        throw new Error("Could not retrieve Google sign-in details.");
      }
      const { url } = await response.json();
      const popupWidth = 500;
      const popupHeight = 650;
      const left = window.screenX + (window.innerWidth - popupWidth) / 2;
      const top = window.screenY + (window.innerHeight - popupHeight) / 2;
      
      const popup = window.open(
        url,
        "google_oauth_popup",
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},status=no,resizable=yes`
      );

      if (!popup) {
        throw new Error(
          "Popup blocked. Please enable popups in your browser settings to continue."
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to launch Google Sign-In popup.");
      setOauthLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      id="login-modal-overlay"
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
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            id="login-modal-close"
          >
            <X size={18} />
          </button>
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
          {error && (
            <div
              className="px-4 py-3 bg-red-50 border border-red-200/50 rounded-xl text-red-600 flex items-start gap-2.5 text-xs font-sans"
              id="login-error-alert"
            >
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#7DB095] font-sans">
                Password
              </label>
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

            <button
              type="submit"
              disabled={loading || oauthLoading}
              className="w-full py-2.5 bg-[#7DB095] hover:bg-[#648E77] text-white font-sans text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              id="login-submit-button"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Authing...</span>
                </>
              ) : (
                <span>{tab === "login" ? "Sign In" : "Register & Sign In"}</span>
              )}
            </button>
          </form>

          <div className="relative flex py-2 items-center text-xs text-gray-400">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase tracking-widest text-[#7DB095]/60">
              Or alternative
            </span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || oauthLoading}
            className="w-full py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl flex items-center justify-center gap-2.5 text-xs text-gray-700 font-medium transition-all shadow-sm cursor-pointer hover:bg-gray-50 focus:outline-none"
            id="btn-google-login"
          >
            {oauthLoading ? (
              <Loader2 size={14} className="animate-spin text-gray-400" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.643.95 14.996 0 12 0 7.354 0 3.307 2.658 1.277 6.545z"
                />
                <path
                  fill="#4285F4"
                  d="M24 12.273c0-.818-.082-1.609-.218-2.386H12v4.545h6.727A5.766 5.766 0 0 1 16.2 18.25v3.818h3.818c2.236-2.064 3.982-5.114 3.982-9.795z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.266 14.235 1.277 17.3c2.03 3.887 6.077 6.545 10.723 6.545 3 0 5.618-.995 7.509-2.705l-3.818-2.955c-1.023.682-2.332 1.109-3.691 1.109a7.077 7.077 0 0 1-6.734-4.859z"
                />
                <path
                  fill="#34A853"
                  d="M12 4.909c1.69 0 3.23.605 4.43 1.595l3.5-3.5C17.65 1.16 15 .2 12 .2 7.35 1.16 3.307 3.818 1.277 7.7l3.989 3.091A7.08 7.08 0 0 1 12 4.909"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
