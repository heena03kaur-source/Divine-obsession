import React, { useState } from "react";
import { Lock, ShieldAlert, Loader2, X } from "lucide-react";
import { getApiUrl } from "../utils/api";

interface ResetProps {
  email: string;
  token: string;
  onClose: () => void;
}

export function ResetPasswordModal({ email, token, onClose }: ResetProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(getApiUrl("/api/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password })
      });
      
      const text = await resp.text();
      if (text.startsWith("<!DOCTYPE") || text.includes("<html")) {
        throw new Error("Cannot reset password from GitHub Pages. A backend server is required.");
      }
      
      const data = JSON.parse(text);
      if (!resp.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }
      setSuccess("Your password has been reset successfully. You can now close this window and sign in.");
    } catch (err: any) {
      if (err.message.includes("pattern") || err.message.includes("network") || err.message.includes("JSON")) {
        setError("Cannot communicate with backend from static hosting like GitHub Pages.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" id="reset-modal-overlay">
      <div className="bg-[#FAF9F6] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[#7DB095]/20 animate-in zoom-in-95 duration-200" id="reset-modal-container">
        <div className="flex items-center justify-between p-6 border-b border-[#7DB095]/10 bg-white">
          <div>
            <h2 className="text-xl font-sans font-semibold text-gray-900 tracking-tight">Set New Password</h2>
            <p className="text-xs text-gray-400 mt-1.5 font-sans font-medium tracking-wide">
              {email}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" id="reset-modal-close">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success ? (
            <div className="px-4 py-3 bg-[#7DB095]/10 border border-[#7DB095]/20 rounded-xl text-[#7DB095] flex items-start gap-2.5 text-xs font-sans">
              <span className="leading-relaxed">{success}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200/50 rounded-xl text-red-600 flex items-start gap-2.5 text-xs font-sans">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7DB095] font-sans">
                  New Password
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
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#7DB095] hover:bg-[#648E77] text-white font-sans text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /><span>Saving...</span></> : <span>Update Password</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
