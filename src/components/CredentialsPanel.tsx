import React, { useState } from "react";
import { ArrowLeft, ShieldCheck, Check, AlertTriangle, Loader2 } from "lucide-react";

interface CredentialsPanelProps {
  token: string | null;
  onSuccess: (newEmail: string) => void;
  onCancel: () => void;
}

export function CredentialsPanel({ token, onSuccess, onCancel }: CredentialsPanelProps) {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorAlert("Authorization missing. Please log in again.");
      return;
    }
    if (!emailInput.trim() || !passwordInput || !confirmInput) {
      setErrorAlert("Please fill in all the required fields.");
      return;
    }
    if (passwordInput !== confirmInput) {
      setErrorAlert("New password and confirm password fields must match.");
      return;
    }
    if (passwordInput.length < 6) {
      setErrorAlert("Your secure password must contain at least 6 characters.");
      return;
    }

    setErrorAlert(null);
    setSuccessAlert(null);
    setSaving(true);

    try {
      const response = await fetch("/api/credentials", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newEmail: emailInput.trim().toLowerCase(),
          newPassword: passwordInput,
          confirmPassword: confirmInput,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update credentials.");
      }
      setSuccessAlert(
        "Your owner credentials have been updated successfully! Please use them for future logins."
      );
      setTimeout(() => {
        onSuccess(emailInput.trim().toLowerCase());
      }, 2000);
    } catch (err: any) {
      setErrorAlert(err.message || "An error occurred while updating.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="max-w-3xl mx-auto px-6 py-12 md:py-16 animate-in fade-in duration-200 text-left"
      id="change-credentials-page"
    >
      <button
        onClick={onCancel}
        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-[#7DB095]/10 text-gray-600 hover:text-[#7DB095] border border-gray-200 hover:border-[#7DB095]/30 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 mb-6 font-sans focus:outline-none cursor-pointer shadow-sm"
        id="btn-creds-cancel"
      >
        <ArrowLeft size={16} className="text-[#7DB095]" />
        <span>Go Back</span>
      </button>

      <header className="mb-8 md:mb-10 text-left">
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <span className="p-2 bg-[#7DB095]/10 rounded-lg text-[#7DB095]">
            <ShieldCheck size={22} />
          </span>
          <span>Access Management</span>
        </h1>
        <p className="mt-2 text-gray-500 font-sans text-sm md:text-base">
          Update the primary administrator email and sign-on password used to protect and compose posts.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white border border-[#7DB095]/15 rounded-2xl p-6 md:p-8"
        id="credentials-form"
      >
        {errorAlert && (
          <div
            className="px-4 py-3 bg-red-50 border border-red-200/50 rounded-lg text-red-600 flex items-start gap-2.5 text-sm"
            id="creds-error-alert"
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{errorAlert}</span>
          </div>
        )}

        {successAlert && (
          <div
            className="px-4 py-3 bg-emerald-50 border border-emerald-200/50 rounded-lg text-emerald-700 flex items-start gap-2.5 text-sm animate-in fade-in duration-150"
            id="creds-success-alert"
          >
            <Check size={18} className="shrink-0 mt-0.5" />
            <span>{successAlert}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
            New Administrator Email
          </label>
          <input
            type="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="new-owner@example.com"
            className="w-full px-4 py-3 bg-[#FAF9F6]/50 border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 text-gray-800 font-sans"
            id="creds-email-input"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
            New Password
          </label>
          <input
            type="password"
            required
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="At least 6 characters long..."
            className="w-full px-4 py-3 bg-[#FAF9F6]/50 border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 text-gray-800 font-sans"
            id="creds-password-input"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="Re-enter the password exactly..."
            className="w-full px-4 py-3 bg-[#FAF9F6]/50 border border-[#7DB095]/20 hover:border-[#7DB095]/40 focus:border-[#7DB095] focus:bg-white outline-none rounded-xl text-sm transition-all duration-200 text-gray-800 font-sans"
            id="creds-confirm-input"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/50 text-gray-700 font-sans text-sm font-semibold rounded-xl transition-all duration-150 cursor-pointer"
            id="creds-footer-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#7DB095] hover:bg-[#648E77] text-white font-sans text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            id="creds-footer-submit"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Credentials...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save credentials</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
