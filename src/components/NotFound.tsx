import React from "react";
import { AlertTriangle } from "lucide-react";

interface NotFoundProps {
  onBack: () => void;
  message?: string;
}

export function NotFound({
  onBack,
  message = "The section you requested could not be located.",
}: NotFoundProps) {
  return (
    <div
      className="max-w-md mx-auto px-6 py-20 text-center flex flex-col items-center"
      id="not-found-view"
    >
      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-6">
        <AlertTriangle size={28} />
      </div>
      <h2 className="font-serif text-2xl md:text-3xl font-semibold text-gray-800 mb-3">
        Page Not Found
      </h2>
      <p className="text-gray-500 font-sans text-sm md:text-base leading-relaxed mb-8">
        {message} Please return to the homepage to explore existing blog entries.
      </p>
      <button
        onClick={onBack}
        className="px-6 py-2.5 bg-[#7DB095] hover:bg-[#648E77] text-white font-sans text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm cursor-pointer"
        id="btn-not-found-home"
      >
        Go back to Home
      </button>
    </div>
  );
}
