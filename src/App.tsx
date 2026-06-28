import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Header from "./components/Header";
import LandingPage from "./components/LandingPage";
import AuthScreen from "./components/AuthScreen";
import IssueReportForm from "./components/IssueReportForm";
import Dashboard from "./components/Dashboard";
import IssueReportDetail from "./components/IssueReportDetail";
import CityAnalytics from "./components/CityAnalytics";
import { Loader2 } from "lucide-react";
import { CivicIssue } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  
  const [tab, setTab] = useState<"landing" | "report" | "dashboard" | "report-detail" | "analytics">("landing");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  // Show dedicated Login Modal/Screen if not logged in
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [redirectTab, setRedirectTab] = useState<"landing" | "report" | "dashboard" | "report-detail" | "analytics">("landing");

  // Stats derived from Firestore
  const [totalIssues, setTotalIssues] = useState(0);
  const [resolvedIssues, setResolvedIssues] = useState(0);
  const [issues, setIssues] = useState<CivicIssue[]>([]);

  // Real-time Authentication Monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync user record to Firestore users/{uid} upon successful authentication
  useEffect(() => {
    if (!user) return;

    const syncUserRecord = async () => {
      setSyncLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
          displayName: user.displayName || user.email?.split("@")[0] || "Anonymous User",
          email: user.email || "",
          photoURL: user.photoURL || "",
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (err: any) {
        console.error("Error syncing user record:", err);
      } finally {
        setSyncLoading(false);
      }
    };

    syncUserRecord();
  }, [user]);

  // Sync general statistics and issues for Landing Page/Operations Center
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "issues"), (snapshot) => {
      const items: CivicIssue[] = [];
      let resolvedCount = 0;
      snapshot.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as CivicIssue;
        items.push(item);
        if (item.status === "Resolved") {
          resolvedCount++;
        }
      });
      setIssues(items);
      setTotalIssues(items.length);
      setResolvedIssues(resolvedCount);
    });
    return () => unsubscribe();
  }, []);

  // Parse path on initial load and handle browser back/forward (popstate) actions
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/report\/([a-zA-Z0-9_-]+)/);
      if (match) {
        setSelectedReportId(match[1]);
        setTab("report-detail");
      } else if (path === "/dashboard") {
        setTab("dashboard");
        setSelectedReportId(null);
      } else if (path === "/report") {
        setTab("report");
        setSelectedReportId(null);
      } else if (path === "/analytics") {
        setTab("analytics");
        setSelectedReportId(null);
      } else {
        setTab("landing");
        setSelectedReportId(null);
      }
    };

    // Evaluate once on initial load
    handleLocationChange();

    // Listen to popstate changes
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Perform logout action
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigateTo("landing");
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  // Unified routing navigator updating pathname and state contiguously
  const navigateTo = (newTab: "landing" | "report" | "dashboard" | "report-detail" | "analytics", id?: string) => {
    // If attempting to access interactive elements but not logged in, prompt Auth
    if ((newTab === "report" || newTab === "dashboard" || newTab === "report-detail" || newTab === "analytics") && !user) {
      setRedirectTab(newTab);
      setShowAuthOverlay(true);
      return;
    }

    setShowAuthOverlay(false);

    if (newTab === "report-detail" && id) {
      setSelectedReportId(id);
      setTab("report-detail");
      window.history.pushState({}, "", `/report/${id}`);
    } else {
      setSelectedReportId(null);
      setTab(newTab);
      const targetPath = newTab === "landing" ? "/" : `/${newTab}`;
      window.history.pushState({}, "", targetPath);
    }
  };

  // Switch to report page, request auth if missing
  const navigateToReport = () => {
    if (!user) {
      setRedirectTab("report");
      setShowAuthOverlay(true);
    } else {
      navigateTo("report");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1E293B] font-sans antialiased selection:bg-[#1E3A8A] selection:text-white">
      
      {/* Universal Header */}
      <Header
        user={user}
        currentTab={tab}
        setTab={(newTab) => navigateTo(newTab)}
        onLogout={handleLogout}
        onLoginClick={() => {
          setRedirectTab("dashboard");
          setShowAuthOverlay(true);
        }}
      />

      {/* Main App Container */}
      <main className="min-h-[calc(100vh-4rem)]">
        
        {/* Auth prompt overlay triggers when users attempt protected work without a session */}
        {showAuthOverlay && !user ? (
          <AuthScreen 
            onSuccess={() => {
              setShowAuthOverlay(false);
              navigateTo(redirectTab === "landing" ? "dashboard" : redirectTab); // Route to intended workflow or default to dashboard once authenticated
            }} 
          />
        ) : (
          <>
            {/* Loading state indicator */}
            {authChecking && (
              <div className="flex h-[50vh] flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 text-[#1E40AF] animate-spin" />
                <p className="text-xs text-slate-500 font-mono tracking-wider uppercase">Verifying authenticated session...</p>
              </div>
            )}

            {/* View Switching */}
            {!authChecking && (
              <>
                {tab === "landing" && (
                  <LandingPage
                    onReportClick={navigateToReport}
                    onViewRegistry={() => navigateTo("dashboard")}
                    totalIssuesCount={totalIssues}
                    resolvedIssuesCount={resolvedIssues}
                    issues={issues}
                    onInspectIssue={(id) => navigateTo("report-detail", id)}
                  />
                )}

                {tab === "report" && (
                  <IssueReportForm
                    user={user}
                    onSuccess={(id) => {
                      navigateTo("report-detail", id); // Dynamic two-step redirect
                    }}
                  />
                )}

                {/* Dashboard Access Control - Unlocked for all signed-in users */}
                {tab === "dashboard" && (
                  <Dashboard 
                    currentUser={user} 
                    onInspectIssue={(id) => navigateTo("report-detail", id)}
                  />
                )}

                {tab === "analytics" && (
                  <CityAnalytics
                    currentUser={user}
                    onInspectIssue={(id) => navigateTo("report-detail", id)}
                  />
                )}

                {tab === "report-detail" && selectedReportId && (
                  <IssueReportDetail
                    issueId={selectedReportId}
                    currentUser={user}
                    onBack={() => navigateTo("dashboard")}
                    allIssues={issues}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Modern minimal civic footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 URBANFIX OPERATIONS PLATFORM • CITY OF METROPOLIS</p>
        <p className="mt-1 text-[10px] text-slate-400">STATE REGULATORY ASSISTANCE DIVISION • DURABLE FIRESTORE ENGINE</p>
      </footer>
    </div>
  );
}
