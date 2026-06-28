import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { AlertCircle, Shield, CheckCircle2, ClipboardList, BarChart3, Map, FileText } from "lucide-react";

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setErrorMsg(
        err?.message || "Google Authentication was blocked or failed. Please check your popup blocker settings and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#FAFAF9]">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        
        {/* UrbanFixOS Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1E3A8A] font-sans text-2xl font-black text-white shadow-md">
            UF
          </div>
          <h2 className="mt-4 font-sans text-3xl font-black tracking-tight text-[#1E293B]">
            UrbanFixOS
          </h2>
          <p className="mt-1 text-xs text-slate-500 font-mono tracking-wider uppercase font-bold">
            Civic Reporting &amp; Infrastructure Monitoring
          </p>
        </div>

        {/* Auth Panel & Project Description */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
            
            {errorMsg && (
              <div className="mb-5 rounded-xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-800">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Mandatory Messaging (Requirement 9) */}
              <p className="text-sm text-slate-600 text-center leading-relaxed font-semibold">
                Sign in securely using your Google account to access UrbanFixOS civic reporting and infrastructure monitoring services.
              </p>

              {/* Continue with Google button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center space-x-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:ring-offset-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                id="google-signin-btn"
              >
                {/* Google Logo SVG */}
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.377-2.87-6.377-6.377s2.868-6.377 6.377-6.377c1.5 0 2.87.519 3.978 1.411l3.14-3.141C18.277 1.445 15.385.5 12.24.5.5 12.24.5 12.24 12.24s11.74 3.111 11.74 11.74c0 .851-.082 1.636-.211 2.385H12.24z"
                  />
                </svg>
                <span>{loading ? "Authenticating Session..." : "Continue with Google"}</span>
              </button>

              {/* Project Description (Requirement 10) */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Integrated Platform Features:
                </h3>
                
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/50">
                    <ClipboardList className="h-4 w-4 text-[#1E3A8A] mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Civic Incident Reporting</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">Submit and detail hazards, potholes, or water leaks with coordinates.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/50">
                    <Map className="h-4 w-4 text-[#1E3A8A] mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Active Registry &amp; Map</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">Monitor city-wide active problems and dispatcher progress live.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/50">
                    <BarChart3 className="h-4 w-4 text-[#1E3A8A] mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">Impact Analytics</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">Explore public safety risk indexing, metrics, and trends.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/50">
                    <FileText className="h-4 w-4 text-[#1E3A8A] mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">PDF Document Exports</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">Generate and download standard inspection digests instantly.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <p className="mt-6 text-center text-[10px] text-slate-400 leading-relaxed font-sans">
              All infrastructure tracking and analytics tools are unlocked upon sign-in. This is a secure portal operated under standard city safety protocols.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
