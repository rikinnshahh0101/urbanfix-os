import React from "react";
import { 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Hammer, 
  Users, 
  Activity, 
  Landmark, 
  FileText, 
  ChevronRight, 
  Sparkles, 
  Building2, 
  ArrowUpRight, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { CivicIssue } from "../types";

function getHomepageConciseSummary(issue: CivicIssue): string {
  const t = issue.issueType;
  if (t === "Pothole") {
    return "Large road surface failure causing vehicle safety risks.";
  }
  if (t === "Traffic Obstruction") {
    return "Severe congestion affecting commuter mobility on a major corridor.";
  }
  if (t === "Streetlight Damage") {
    return "Damaged public lighting requiring electrical maintenance.";
  }
  if (t === "Water Leakage") {
    return "Active water main leak causing pavement saturation and sub-base soil erosion.";
  }
  if (t === "Garbage Accumulation") {
    return "Large unmanaged waste pile creating sanitation and environmental risks.";
  }
  if (t === "Road Damage") {
    return "Significant road surface fracturing and loose gravel scattering, impeding normal transit.";
  }
  
  if (issue.description) {
    const sentences = issue.description.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    const firstSentence = sentences[0] || issue.description;
    const words = firstSentence.split(/\s+/);
    if (words.length <= 20) {
      return firstSentence + (firstSentence.endsWith(".") ? "" : ".");
    }
    return words.slice(0, 18).join(" ") + "...";
  }
  
  return "Physical infrastructure distress on public transit way requiring rapid response.";
}

interface LandingPageProps {
  onReportClick: () => void;
  onViewRegistry: () => void;
  totalIssuesCount: number;
  resolvedIssuesCount: number;
  issues: CivicIssue[];
  onInspectIssue: (id: string) => void;
}

export default function LandingPage({ 
  onReportClick, 
  onViewRegistry, 
  totalIssuesCount, 
  resolvedIssuesCount, 
  issues, 
  onInspectIssue 
}: LandingPageProps) {

  // Baseline demo data (representing a typical Metropolis backlog)
  const baselineDemoIssues: Partial<CivicIssue>[] = [
    { id: "demo-1", issueType: "Pothole", severity: "High", status: "In Progress", recommendedDepartment: "Public Works", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-2", issueType: "Water Leakage", severity: "Critical", status: "Reported", recommendedDepartment: "Utilities", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-3", issueType: "Streetlight Damage", severity: "Medium", status: "Resolved", recommendedDepartment: "Utilities", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-4", issueType: "Garbage Accumulation", severity: "Low", status: "Resolved", recommendedDepartment: "Sanitation", createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-5", issueType: "Traffic Obstruction", severity: "Critical", status: "In Progress", recommendedDepartment: "Traffic Operations", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-6", issueType: "Pothole", severity: "Medium", status: "Resolved", recommendedDepartment: "Public Works", createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-7", issueType: "Road Damage", severity: "High", status: "Under Review", recommendedDepartment: "Public Works", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-8", issueType: "Water Leakage", severity: "Medium", status: "Resolved", recommendedDepartment: "Utilities", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-9", issueType: "Streetlight Damage", severity: "Low", status: "Reported", recommendedDepartment: "Utilities", createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-10", issueType: "Garbage Accumulation", severity: "Medium", status: "In Progress", recommendedDepartment: "Sanitation", createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-11", issueType: "Traffic Obstruction", severity: "High", status: "Resolved", recommendedDepartment: "Traffic Operations", createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-12", issueType: "Pothole", severity: "Critical", status: "In Progress", recommendedDepartment: "Public Works", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-13", issueType: "Road Damage", severity: "Low", status: "Resolved", recommendedDepartment: "Public Works", createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-14", issueType: "Other", severity: "Medium", status: "Resolved", recommendedDepartment: "Parks Department", createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "demo-15", issueType: "Streetlight Damage", severity: "High", status: "Under Review", recommendedDepartment: "Utilities", createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  // Combine real and demo data if mode is hybrid (or always if real count is extremely low < 3)
  const isHybridActive = issues.length < 3;
  const analysisTargetIssues = isHybridActive
    ? [...issues, ...baselineDemoIssues.map(b => ({ ...b, id: `${b.id}-merged`, description: `Simulated backup incident: ${b.issueType}`, location: "District Metropolitan Grid" } as CivicIssue))]
    : issues;

  // Helpers for department mappings
  function getStandardDepartment(issue: { issueType: string; recommendedDepartment?: string }): string {
    const type = issue.issueType;
    const dept = (issue.recommendedDepartment || "").toLowerCase();
    
    if (type === "Traffic Obstruction" || dept.includes("traffic")) {
      return "Traffic Operations";
    }
    if (type === "Pothole" || type === "Road Damage" || dept.includes("road") || dept.includes("public") || dept.includes("works")) {
      return "Public Works";
    }
    if (type === "Water Leakage" || type === "Streetlight Damage" || dept.includes("leak") || dept.includes("streetlight") || dept.includes("utility") || dept.includes("utilities")) {
      return "Utilities";
    }
    if (type === "Garbage Accumulation" || dept.includes("garbage") || dept.includes("sanitation") || dept.includes("waste")) {
      return "Sanitation";
    }
    return "Other";
  }

  const getDeptBaseline = (dept: string) => {
    switch(dept) {
      case "Sanitation": return 12;
      case "Traffic Operations": return 18;
      case "Utilities": return 24;
      case "Public Works": return 48;
      default: return 36;
    }
  };

  // Section 1 — City Health Overview
  const totalCount = analysisTargetIssues.length;
  const resolvedCount = analysisTargetIssues.filter(i => i.status === "Resolved").length;
  const activeIssues = analysisTargetIssues.filter(i => i.status !== "Resolved");
  const criticalUnresolved = activeIssues.filter(i => i.severity === "Critical").length;
  const highUnresolved = activeIssues.filter(i => i.severity === "High").length;
  const mediumUnresolved = activeIssues.filter(i => i.severity === "Medium").length;
  const lowUnresolved = activeIssues.filter(i => i.severity === "Low").length;

  const deductions = (criticalUnresolved * 12) + (highUnresolved * 7) + (mediumUnresolved * 3) + (lowUnresolved * 1);
  const rawScore = 100 - deductions;
  const healthScore = Math.min(100, Math.max(12, rawScore));

  let healthStatus: "Excellent" | "Stable" | "Watchlist" | "Critical" = "Stable";
  let healthColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
  let healthBarColor = "bg-emerald-500";
  if (healthScore >= 90) {
    healthStatus = "Excellent";
    healthColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
    healthBarColor = "bg-emerald-500";
  } else if (healthScore >= 75) {
    healthStatus = "Stable";
    healthColor = "text-blue-700 bg-blue-50 border-blue-100";
    healthBarColor = "bg-blue-500";
  } else if (healthScore >= 50) {
    healthStatus = "Watchlist";
    healthColor = "text-amber-700 bg-amber-50 border-amber-100";
    healthBarColor = "bg-amber-500";
  } else {
    healthStatus = "Critical";
    healthColor = "text-red-700 bg-red-50 border-red-100";
    healthBarColor = "bg-red-500";
  }

  // Dynamic AI City Health Briefing Generator
  const generateAIHealthBriefing = (): string => {
    const totalOpen = activeIssues.length;
    const criticalCount = criticalUnresolved;
    const highCount = highUnresolved;
    
    let explanation = "";
    
    if (healthScore >= 90) {
      explanation = `City health remains excellent at ${healthScore}/100, driven by an exceptional incident resolution volume and the complete absence of unresolved critical infrastructure hazards. `;
      if (totalOpen > 0) {
        // Specifically state a streetlight or low-priority ticket active if possible to make it personalized
        const lowPriorityStreetlight = activeIssues.find(i => i.issueType === "Streetlight Damage" && i.severity === "Low");
        if (lowPriorityStreetlight) {
          explanation += `One low-priority streetlight issue remains active but does not currently impact overall municipal stability.`;
        } else {
          explanation += `One low-priority ${activeIssues[0].issueType.toLowerCase()} issue remains active but does not currently impact overall municipal stability.`;
        }
      } else {
        explanation += `All registered public works and utility tickets have been successfully cleared.`;
      }
    } else if (healthScore >= 75) {
      explanation = `The municipal health status is currently stable at ${healthScore}/100. This score reflects solid operational performance across departments, offset slightly by ${totalOpen} active pending cases. `;
      if (criticalCount > 0 || highCount > 0) {
        explanation += `Addressing the ${criticalCount + highCount} open high-priority safety tickets remains the critical path to restoring optimal levels.`;
      } else {
        explanation += `SLA response thresholds remain fully secure with no high-severity hazards reported in active zones.`;
      }
    } else if (healthScore >= 50) {
      explanation = `City infrastructure status is designated under watchlist status with a rating of ${healthScore}/100. This is caused by an increasing backlog of ${totalOpen} unresolved active tickets. `;
      if (criticalCount > 0 || highCount > 0) {
        explanation += `A cluster of ${criticalCount + highCount} high-severity infrastructure hazards demands urgent service dispatch to prevent municipal degradation.`;
      } else {
        explanation += `Although no critical hazards are active, the elevated ticket backlog requires strategic resource reallocation to speed up clearance.`;
      }
    } else {
      explanation = `CRITICAL ALERT: The municipal health index has fallen to a critical level of ${healthScore}/100 due to a severe congestion of ${totalOpen} unresolved cases. `;
      if (criticalCount > 0 || highCount > 0) {
        explanation += `Immediate intervention is required to clear ${criticalCount + highCount} unresolved critical and high-priority infrastructure hazards threatening civil safety.`;
      } else {
        explanation += `Departmental dispatch must immediately prioritize the active backlog to restore operational capability.`;
      }
    }
    
    return explanation;
  };

  // Section 2 — Critical Dispatch Alerts (Display only unresolved critical/high-priority incidents)
  const criticalDispatches = activeIssues.filter(
    i => i.severity === "Critical" || i.severity === "High"
  );

  // Section 3 — Department Performance Registry
  const departmentsList = [
    "Traffic Operations",
    "Public Works",
    "Utilities",
    "Sanitation",
    "Other"
  ];

  const deptPerformance = departmentsList.map(dept => {
    const deptIssues = analysisTargetIssues.filter(i => getStandardDepartment(i) === dept);
    const total = deptIssues.length;
    const resolved = deptIssues.filter(i => i.status === "Resolved").length;
    const open = total - resolved;

    const baseline = getDeptBaseline(dept);
    const averageHours = total > 0 
      ? Math.round((resolved * baseline * 0.8 + open * baseline * 2.2) / total)
      : baseline;

    const averageResolutionStr = total > 0
      ? (averageHours >= 24 ? `${(averageHours / 24).toFixed(1)} Days` : `${averageHours} Hours`)
      : "N/A";

    const completionRate = total > 0 ? (resolved / total) * 150 : 100; // calibrated range
    const cappedCompletionRate = total > 0 ? Math.min(100, Math.max(45, Math.round((resolved / total) * 100))) : 0;

    return {
      name: dept,
      total,
      resolved,
      open,
      averageResolutionStr,
      completionRate: cappedCompletionRate
    };
  }).sort((a, b) => {
    // Put departments with no cases at the end
    if (a.total === 0 && b.total > 0) return 1;
    if (a.total > 0 && b.total === 0) return -1;
    return b.completionRate - a.completionRate;
  });

  // Section 4 — Recent Incident Activity
  const recentIncidents = [...analysisTargetIssues]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const activeDepts = deptPerformance.filter(d => d.total > 0);
  const meetingSlaCount = activeDepts.filter(d => d.completionRate >= 75).length;
  const lowestSlaDept = activeDepts[activeDepts.length - 1] || { name: "Sanitation", completionRate: 50 };

  const autoRoutedCount = analysisTargetIssues.filter(i => i.recommendedDepartment).length;
  const highPriorityCount = analysisTargetIssues.filter(i => i.severity === "High" || i.severity === "Critical").length;
  const avgSlaDays = (() => {
    if (analysisTargetIssues.length === 0) return 1.4;
    const totalHours = deptPerformance.reduce((acc, dept) => {
      const baseline = getDeptBaseline(dept.name);
      return acc + (dept.open * baseline * 1.5 + dept.resolved * baseline * 0.5);
    }, 0);
    const avgHours = totalHours / totalCount;
    const avgDays = avgHours / 24;
    return Number(Math.min(4.2, Math.max(0.8, avgDays)).toFixed(1));
  })();

  const handleExportAnalytics = () => {
    const headers = ["ID", "Type", "Severity", "Status", "Location", "Department", "Created At"];
    const rows = analysisTargetIssues.map(i => [
      i.id,
      i.issueType,
      i.severity,
      i.status,
      i.location.replace(/,/g, " "),
      getStandardDepartment(i),
      i.createdAt
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `urbanfix_metropolis_analytics_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#FAFAF9] pb-20 pt-8 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Command Center Title & Badge */}
        <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1 text-[10px] font-black text-[#1E3A8A] tracking-wider uppercase font-mono">
              <Landmark className="h-3 w-3" />
              <span>City of Metropolis • Executive Operations</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl font-sans flex items-center">
              <Activity className="h-7 w-7 text-[#1E3A8A] mr-2 shrink-0 animate-pulse" />
              Municipal Operations Center
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5 tracking-wide uppercase">
              Primary Civil Command Platform • Live Diagnostics & Service dispatch
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            {isHybridActive && (
              <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 font-mono uppercase tracking-widest">
                <Sparkles className="h-3 w-3 mr-1 text-[#D4A017]" />
                Baseline Live Mesh
              </span>
            )}
            <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800 font-mono uppercase tracking-widest">
              ● Live Systems Active
            </span>
          </div>
        </div>

        {/* Core Operations Command Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Left / Main Section (Col span: 8) */}
          <div className="lg:col-span-8 space-y-6">

            {/* ==================================================
                SECTION 1 — CITY HEALTH OVERVIEW
                ================================================== */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden" id="city-health-overview-module">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-[#1E3A8A] uppercase tracking-widest font-mono block">
                    System Diagnostic
                  </span>
                  <h3 className="text-base font-black text-slate-900 font-sans">
                    City Health Index
                  </h3>
                  <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                    Composite score modeling active safety hazards, departmental compliance rates, and municipal response velocity.
                  </p>
                </div>
                
                {/* Score & Status Ring */}
                <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl shrink-0">
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Index Score</span>
                    <span className="text-3xl font-black text-[#1E3A8A] font-mono leading-none">{healthScore}</span>
                    <span className="text-xs text-slate-400 font-mono">/100</span>
                  </div>
                  <div className="border-l border-slate-200 h-10 py-1"></div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Status Rating</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${healthColor}`}>
                      {healthStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Health Gauge bar */}
              <div className="mt-4">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${healthBarColor} transition-all duration-500`} style={{ width: `${healthScore}%` }}></div>
                </div>
              </div>

              {/* Health Drivers Section */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-[#1E3A8A] uppercase tracking-widest font-mono block mb-2.5">
                  Health Drivers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Driver 1: Incidents Resolved */}
                  <div className="flex items-center space-x-2 py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span className="text-slate-700 font-medium">
                      {resolvedCount} of {totalCount} incidents resolved
                    </span>
                  </div>

                  {/* Driver 2: Departments Meeting SLA */}
                  <div className="flex items-center space-x-2 py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-emerald-600 font-bold shrink-0">✓</span>
                    <span className="text-slate-700 font-medium">
                      {meetingSlaCount} of {deptPerformance.length} departments meeting SLA targets
                    </span>
                  </div>

                  {/* Driver 3: Active Critical Incident */}
                  <div className={`flex items-center space-x-2 py-1 px-2.5 rounded-lg border ${
                    criticalUnresolved > 0 ? "bg-amber-50/75 border-amber-100 text-amber-800" : "bg-slate-50 border-slate-100 text-slate-700"
                  }`}>
                    <span className={criticalUnresolved > 0 ? "text-amber-600 font-bold shrink-0" : "text-emerald-600 font-bold shrink-0"}>
                      {criticalUnresolved > 0 ? "⚠" : "✓"}
                    </span>
                    <span className="font-medium">
                      {criticalUnresolved} active critical incident{criticalUnresolved === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Driver 4: Lowest SLA Department */}
                  <div className={`flex items-center space-x-2 py-1 px-2.5 rounded-lg border ${
                    lowestSlaDept.completionRate < 70 ? "bg-amber-50/75 border-amber-100 text-amber-800" : "bg-slate-50 border-slate-100 text-slate-700"
                  }`}>
                    <span className={lowestSlaDept.completionRate < 70 ? "text-amber-600 font-bold shrink-0" : "text-emerald-600 font-bold shrink-0"}>
                      {lowestSlaDept.completionRate < 70 ? "⚠" : "✓"}
                    </span>
                    <span className="font-medium">
                      {lowestSlaDept.name} operating at {lowestSlaDept.completionRate}% SLA
                    </span>
                  </div>
                </div>
              </div>


            </div>

            {/* ==================================================
                AI OPERATIONS SUMMARY
                ================================================== */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden" id="ai-operations-summary-module">
              
              <div className="space-y-1 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-extrabold text-[#1E3A8A] uppercase tracking-widest font-mono block">
                  Autonomous Monitoring
                </span>
                <h3 className="text-base font-black text-slate-900 font-sans">
                  AI Operations Summary
                </h3>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50/60 border border-slate-150 rounded-xl p-3 flex items-center space-x-3">
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-2 text-blue-750 shrink-0">
                    <Activity className="h-4 w-4 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Processed</span>
                    <span className="text-xs font-bold text-slate-800">{totalCount} incidents processed</span>
                  </div>
                </div>

                <div className="bg-slate-50/60 border border-slate-150 rounded-xl p-3 flex items-center space-x-3">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-emerald-700 shrink-0">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Routing</span>
                    <span className="text-xs font-bold text-slate-800">{autoRoutedCount} automatically routed</span>
                  </div>
                </div>

                <div className="bg-slate-50/60 border border-slate-150 rounded-xl p-3 flex items-center space-x-3">
                  <div className="rounded-lg bg-red-50 border border-red-100 p-2 text-red-750 shrink-0">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Severity Det.</span>
                    <span className="text-xs font-bold text-slate-800">{highPriorityCount} high-priority cases detected</span>
                  </div>
                </div>

                <div className="bg-slate-50/60 border border-slate-150 rounded-xl p-3 flex items-center space-x-3">
                  <div className="rounded-lg bg-purple-50 border border-purple-100 p-2 text-purple-700 shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Response Metric</span>
                    <span className="text-xs font-bold text-slate-800">Average dispatch SLA: {avgSlaDays} days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================
                SECTION 2 — CRITICAL DISPATCH ALERTS
                ================================================== */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs" id="critical-dispatch-module">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-5 w-5 text-red-600 animate-bounce" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold text-[#1E3A8A] uppercase tracking-widest font-mono block">Immediate Response Queue</span>
                    <h3 className="text-base font-black text-slate-900 font-sans">Critical Dispatch Alerts</h3>
                  </div>
                </div>
                <span className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Alerts ({criticalDispatches.length})
                </span>
              </div>

              {criticalDispatches.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-mono uppercase bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  ✓ No unresolved critical infrastructure hazards currently exist.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {criticalDispatches.map((issue) => {
                    const isCritical = issue.severity === "Critical";
                    return (
                      <div 
                        key={issue.id} 
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors relative overflow-hidden ${
                          isCritical 
                            ? "bg-red-50/30 border-red-150 hover:bg-red-50/50" 
                            : "bg-amber-50/30 border-amber-150 hover:bg-amber-50/50"
                        }`}
                      >
                        {/* Status Left Accent Accent */}
                        <div className={`absolute top-0 left-0 h-full w-1 ${isCritical ? "bg-red-500" : "bg-amber-500"}`}></div>

                        <div className="flex items-start space-x-3 min-w-0">
                          <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                            isCritical ? "bg-red-500" : "bg-amber-500"
                          }`} />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="text-xs font-black text-slate-900 font-sans">
                                {issue.issueType}
                              </span>
                              <span className={`text-[9px] font-black font-mono uppercase px-2 py-0.2 rounded ${
                                isCritical ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {issue.severity} Severity
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono mt-1 font-bold">
                              📍 Location: {issue.location}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              {getHomepageConciseSummary(issue)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center ml-5">
                          <span className="text-[9px] font-extrabold font-mono uppercase bg-slate-100 text-slate-600 border border-slate-150 px-2 py-0.5 rounded">
                            {getStandardDepartment(issue)}
                          </span>
                          
                          <button
                            onClick={() => onInspectIssue(issue.id)}
                            className="inline-flex h-8 px-2.5 items-center justify-center space-x-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                            title="Inspect operational ticket"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ==================================================
                SECTION 3 — DEPARTMENT PERFORMANCE REGISTRY
                ================================================== */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs" id="department-performance-module">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-[#1E3A8A] uppercase tracking-widest font-mono block">Agency Audits</span>
                  <h3 className="text-base font-black text-slate-900 font-sans">Department Performance Registry</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time operational efficiency metrics and dispatch SLA scores by agency.
                  </p>
                </div>
                <span className="mt-2 sm:mt-0 text-[9px] font-bold font-mono uppercase bg-blue-50 text-[#1E3A8A] border border-blue-100 px-2.5 py-1 rounded shrink-0 self-start sm:self-center">
                  System Audit Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {deptPerformance.map((dept, index) => {
                  let badgeStyle = "bg-slate-50 text-slate-650 border-slate-200";
                  if (dept.total === 0) {
                    badgeStyle = "bg-slate-100/70 text-slate-400 border-slate-200";
                  } else if (dept.completionRate >= 80) {
                    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-150";
                  } else if (dept.completionRate >= 50) {
                    badgeStyle = "bg-blue-50 text-blue-700 border-blue-150";
                  } else {
                    badgeStyle = "bg-amber-50 text-amber-700 border-amber-150";
                  }

                  return (
                    <div 
                      key={dept.name} 
                      className="rounded-xl border border-slate-150 bg-slate-50/30 p-3.5 flex flex-col justify-between shadow-xxs hover:shadow-sm hover:bg-white transition-all duration-150 relative overflow-hidden"
                    >
                      {/* Rank Order Accent line */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#1E3A8A]/10"></div>
                      {index === 0 && dept.total > 0 && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-extrabold font-mono text-slate-400 uppercase">
                            {dept.total === 0 ? "No Cases" : `Rank #${index + 1}`}
                          </span>
                          <span className={`rounded-sm px-1 py-0.2 text-[8px] font-black uppercase tracking-wider border ${badgeStyle}`}>
                            {dept.total === 0 ? "N/A" : `${dept.completionRate}% SLA`}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-800 leading-tight mb-3 truncate" title={dept.name}>
                          {dept.name}
                        </h4>

                        <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                          <div className="flex justify-between">
                            <span>Total cases:</span>
                            <span className="font-bold text-slate-850">{dept.total}</span>
                          </div>
                          <div className="flex justify-between text-emerald-600">
                            <span>Resolved:</span>
                            <span className="font-bold">{dept.resolved}</span>
                          </div>
                          <div className="flex justify-between text-rose-500">
                            <span>Active queue:</span>
                            <span className="font-bold">{dept.open}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Avg SLA:</span>
                        <span className="font-black text-slate-800 font-mono">{dept.averageResolutionStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right / Sidebar Section (Col span: 4) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Quick Actions Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden" id="quick-actions-module">
              
              <div className="border-b border-slate-100 pb-3 mb-4">
                <span className="text-[10px] font-extrabold text-[#1E3A8A] uppercase tracking-widest font-mono block">Operational Shortcuts</span>
                <h3 className="text-base font-black text-slate-900 font-sans">
                  Quick Actions
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={onReportClick}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-[#1E3A8A]/10 bg-[#1E3A8A]/5 hover:bg-[#1E3A8A]/10 transition text-center group"
                >
                  <AlertTriangle className="h-5 w-5 text-[#D4A017] mb-1.5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-black text-slate-850">Report</span>
                </button>

                <button
                  onClick={onViewRegistry}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-150 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition text-center group"
                >
                  <FileText className="h-5 w-5 text-[#1E3A8A] mb-1.5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-black text-slate-850">Registry</span>
                </button>

                <button
                  onClick={handleExportAnalytics}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-150 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition text-center group"
                >
                  <Activity className="h-5 w-5 text-emerald-650 mb-1.5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-black text-slate-850">Export</span>
                </button>
              </div>
            </div>

            {/* ==================================================
                SECTION 4 — RECENT INCIDENT ACTIVITY (Latest incident feed)
                ================================================== */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs" id="recent-incident-timeline-module">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4.5 w-4.5 text-slate-600" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold text-[#1E3A8A] uppercase tracking-widest font-mono block">Real-time Stream</span>
                    <h3 className="text-base font-black text-slate-900 font-sans">Recent Incident Activity</h3>
                  </div>
                </div>
                <span className="text-[9px] bg-slate-50 border border-slate-200 font-mono font-bold text-slate-500 px-2 py-0.5 rounded uppercase">
                  Feed Output
                </span>
              </div>

              <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-6">
                {recentIncidents.map((incident, idx) => {
                  const relativeTime = (() => {
                    const diffMs = Date.now() - new Date(incident.createdAt).getTime();
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                    if (diffHrs < 1) return "Just filed";
                    if (diffHrs < 24) return `${diffHrs}h ago`;
                    return `${Math.floor(diffHrs / 24)}d ago`;
                  })();

                  const isHigh = incident.severity === "Critical" || incident.severity === "High";

                  return (
                    <div key={incident.id} className="relative group" id={`recent-timeline-item-${idx}`}>
                      
                      {/* Bullet point nodes */}
                      <span className={`absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs shrink-0 flex items-center justify-center ${
                        incident.status === "Resolved" 
                          ? "bg-emerald-500" 
                          : isHigh 
                            ? "bg-red-500" 
                            : "bg-blue-500"
                      }`} />

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span 
                            onClick={() => onInspectIssue(incident.id)}
                            className="text-xs font-black text-slate-800 hover:text-[#1E3A8A] cursor-pointer transition-colors leading-tight"
                          >
                            {incident.issueType}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                            {relativeTime}
                          </span>
                        </div>

                        {/* Department Badge and Priority tag */}
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1 text-[9px] font-mono font-bold">
                          <span className="text-slate-500 bg-slate-100 border border-slate-150 px-1.5 py-0.2 rounded uppercase">
                            {getStandardDepartment(incident)}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded uppercase ${
                            incident.status === "Resolved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : incident.status === "In Progress"
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {incident.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-550 leading-normal">
                          {getHomepageConciseSummary(incident)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Registry redirection footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <button
                  onClick={onViewRegistry}
                  className="inline-flex items-center justify-center space-x-1 text-xs font-black text-[#1E3A8A] hover:text-[#152e72] transition"
                >
                  <span>Access all registered incidents</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
