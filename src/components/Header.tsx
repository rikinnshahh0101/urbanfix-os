import React from "react";
import { User } from "firebase/auth";
import { LogOut, ShieldAlert, AlertTriangle, Clock, MapPin, Clipboard, BarChart3 } from "lucide-react";

interface HeaderProps {
  user: User | { displayName: string | null; email: string | null; photoURL: string | null } | null;
  currentTab: "landing" | "report" | "dashboard" | "report-detail" | "analytics";
  setTab: (tab: "landing" | "report" | "dashboard" | "report-detail" | "analytics") => void;
  onLogout: () => void;
  onLoginClick: () => void;
}

export default function Header({ user, currentTab, setTab, onLogout, onLoginClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Branding */}
        <div 
          onClick={() => setTab("landing")} 
          className="flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-90"
          id="logo-brand"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] font-sans text-lg font-black text-white shadow-sm">
            UF
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-sans font-extrabold tracking-tight text-slate-900 text-lg">UrbanFix</span>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-[#1E3A8A] border border-blue-100 uppercase tracking-widest">OS</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono font-bold tracking-wider uppercase">MUNICIPAL HUB</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1.5" id="nav-tabs">
          <button
            onClick={() => setTab("landing")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              currentTab === "landing"
                ? "bg-slate-100 text-slate-900 border border-slate-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
            id="tab-landing-btn"
          >
            Home
          </button>
          
          <button
            onClick={() => setTab("report")}
            className={`flex items-center space-x-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              currentTab === "report"
                ? "bg-blue-50/85 text-[#1E3A8A] border border-blue-150"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
            id="tab-report-btn"
          >
            <AlertTriangle className="h-4 w-4 text-[#D4A017]" />
            <span>Report Incident</span>
          </button>

          <button
            onClick={() => setTab("dashboard")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              currentTab === "dashboard" || currentTab === "report-detail"
                ? "bg-blue-50/85 text-[#1E3A8A] border border-blue-150"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
            id="tab-dashboard-btn"
          >
            Active Registry
          </button>

          <button
            onClick={() => setTab("analytics")}
            className={`flex items-center space-x-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              currentTab === "analytics"
                ? "bg-blue-50/85 text-[#1E3A8A] border border-blue-150"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
            id="tab-analytics-btn"
          >
            <BarChart3 className="h-4 w-4 text-[#1E3A8A]" />
            <span>City Analytics</span>
          </button>
        </nav>

        {/* Auth / Avatar block */}
        <div className="flex items-center space-x-4" id="header-auth">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-700">
                  {user.displayName || user.email?.split("@")[0] || "User"}
                </span>
              </div>
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                alt="user avatar"
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full border border-slate-200 object-cover bg-slate-50"
              />
              <button
                onClick={onLogout}
                className="flex items-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                title="Sign Out"
                id="sign-out-btn"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1E3A8A] px-4.5 text-sm font-bold text-white shadow-sm hover:bg-[#152e72] transition"
              id="header-login-btn"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav rail */}
      <div className="flex border-t border-slate-200 bg-white px-2 py-2 md:hidden justify-around">
        <button
          onClick={() => setTab("landing")}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-bold rounded-lg ${
            currentTab === "landing" ? "text-[#1E3A8A]" : "text-slate-500"
          }`}
          id="tab-landing-mobile-btn"
        >
          <span>Home</span>
        </button>
        <button
          onClick={() => setTab("report")}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-bold rounded-lg ${
            currentTab === "report" ? "text-[#1E3A8A]" : "text-slate-500"
          }`}
          id="tab-report-mobile-btn"
        >
          <AlertTriangle className="h-4 w-4 mb-0.5 text-[#D4A017]" />
          <span>Report</span>
        </button>
        <button
          onClick={() => setTab("dashboard")}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-bold rounded-lg ${
            currentTab === "dashboard" || currentTab === "report-detail" ? "text-[#1E3A8A]" : "text-slate-500"
          }`}
          id="tab-dashboard-mobile-btn"
        >
          <span>Registry</span>
        </button>
        <button
          onClick={() => setTab("analytics")}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-bold rounded-lg ${
            currentTab === "analytics" ? "text-[#1E3A8A]" : "text-slate-500"
          }`}
          id="tab-analytics-mobile-btn"
        >
          <BarChart3 className="h-4 w-4 mb-0.5" />
          <span>Analytics</span>
        </button>
      </div>
    </header>
  );
}
