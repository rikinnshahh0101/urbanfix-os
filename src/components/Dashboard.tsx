import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { CivicIssue, IssueType, IssueSeverity, IssueStatus, ResolutionPlan } from "../types";
import { 
  Building, 
  MapPin, 
  Clock, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Check, 
  AlertCircle,
  Eye,
  Trash2,
  ListFilter,
  BarChart2,
  X,
  Users,
  Shield,
  Activity,
  Landmark
} from "lucide-react";

function getFallbackResolutionPlan(issue: CivicIssue): ResolutionPlan {
  const isPothole = issue.issueType === "Pothole";
  const isWater = issue.issueType === "Water Leakage";
  const isLight = issue.issueType === "Streetlight Damage";
  const isGarbage = issue.issueType === "Garbage Accumulation";
  const isRoad = issue.issueType === "Road Damage";
  const isTraffic = issue.issueType === "Traffic Obstruction";

  let department = issue.recommendedDepartment || "Department of Public Works";
  let priorityLevel: "Low" | "Medium" | "High" | "Critical" = issue.severity || "Medium";
  let estimatedCostRange = "₹5,000 - ₹10,000";
  let estimatedResolutionTime = "48 Hours";
  let recommendedAction = "Dispatch inspection advisory and implement site remediation support.";
  let riskIfIgnored = "Slight risk to pedestrian safety and dynamic utility failure.";
  let justification = "This recommendation was generated because localized degradation can compound civic structural risks.";

  if (isPothole) {
    department = "Road Maintenance Department";
    priorityLevel = "Critical";
    estimatedCostRange = "₹5,000 - ₹15,000";
    estimatedResolutionTime = "24 Hours";
    recommendedAction = "Repair pothole and restore road surface integrity.";
    riskIfIgnored = "Continued road degradation may cause vehicle damage and accidents.";
    justification = "The detected pothole presents a direct transportation safety hazard.";
  } else if (isWater) {
    department = "Municipal Water Supply Bureau";
    priorityLevel = "High";
    estimatedCostRange = "₹15,000 - ₹25,000";
    estimatedResolutionTime = "24-48 Hours";
    recommendedAction = "Inspect local pressure valves and seal ruptured conduit piping immediately.";
    riskIfIgnored = "Severe sub-surface erosion and significant clean water wastage.";
    justification = "The leak has a high potential for causing underground erosion affecting nearby public walkways.";
  } else if (isLight) {
    department = "Street Lighting Department";
    priorityLevel = "High";
    estimatedCostRange = "₹3,000 - ₹8,000";
    estimatedResolutionTime = "24-48 Hours";
    recommendedAction = "Replace damaged streetlight fixture and inspect electrical connections.";
    riskIfIgnored = "Reduced visibility may increase public safety risks during nighttime.";
    justification = "The damaged lighting infrastructure affects pedestrian safety and public visibility.";
  } else if (isGarbage) {
    department = "Waste Management Division";
    priorityLevel = "Medium";
    estimatedCostRange = "₹3,500 - ₹6,000";
    estimatedResolutionTime = "12-24 Hours";
    recommendedAction = "Clear accumulated waste stack and spray bio-disinfectant over site.";
    riskIfIgnored = "Foul odor emission, public feedback issues, and vector breeding risks.";
    justification = "Prompt cleanup mitigates public health risks and restores basic neighborhood hygiene.";
  } else if (isRoad) {
    department = "Highway Development Department";
    priorityLevel = "Critical";
    estimatedCostRange = "₹45,000 - ₹80,000";
    estimatedResolutionTime = "3 Days";
    recommendedAction = "Mill and repave unstable highway surface wearing layers.";
    riskIfIgnored = "Complete lane failure causing severe metropolitan commute bottlenecks.";
    justification = "Structural road cracks pose high risks to multi-axle heavy transit vehicles.";
  } else if (isTraffic) {
    department = "Traffic Engineering Bureau";
    priorityLevel = "High";
    estimatedCostRange = "₹6,000 - ₹10,000";
    estimatedResolutionTime = "6 Hours";
    recommendedAction = "Deploy transit marshals to detour flow and clear road occupancy blockages.";
    riskIfIgnored = "Prolonged vehicle gridlocks, high stress levels, and passenger delays.";
    justification = "Ensuring clear lanes is critical during high-commute periods to avoid severe city backlog.";
  }

  if (issue.severity === "Critical") {
    priorityLevel = "Critical";
    estimatedResolutionTime = "Immediate (under 12 hours)";
    try {
      const minVal = parseInt(estimatedCostRange.replace(/[^0-9]/g, ""));
      const maxVal = parseInt(estimatedCostRange.split("-")[1].replace(/[^0-9]/g, ""));
      estimatedCostRange = `₹${Math.round(minVal * 1.5).toLocaleString()} - ₹${Math.round(maxVal * 2.0).toLocaleString()}`;
    } catch {
      // Ignored
    }
  }

  return {
    department,
    priorityLevel,
    estimatedCostRange,
    estimatedResolutionTime,
    recommendedAction,
    riskIfIgnored,
    justification
  };
}

interface DashboardProps {
  currentUser: { uid: string; displayName: string | null } | null;
  onInspectIssue?: (id: string) => void;
}

export default function Dashboard({ currentUser, onInspectIssue }: DashboardProps) {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterType, setFilterType] = useState<IssueType | "All">("All");
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | "All">("All");
  const [filterStatus, setFilterStatus] = useState<IssueStatus | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed Modal Issue (As custom inspection popup backup)
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Load issues in real-time from Firestore
  useEffect(() => {
    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const issuesData: CivicIssue[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          issuesData.push({
            id: docSnap.id,
            userId: data.userId || "",
            imageUrl: data.imageUrl || "",
            issueType: data.issueType || "Other",
            severity: data.severity || "Medium",
            description: data.description || "",
            priorityScore: data.priorityScore || 0,
            recommendedDepartment: data.recommendedDepartment || "",
            status: data.status || "Reported",
            location: data.location || "Central District",
            createdAt: data.createdAt || new Date().toISOString(),
            impactAssessment: data.impactAssessment || undefined,
            resolutionPlan: data.resolutionPlan || undefined,
            confirmations: data.confirmations || [],
            confirmationCount: data.confirmationCount || 0,
            resolutionYesVoters: data.resolutionYesVoters || [],
            resolutionNoVoters: data.resolutionNoVoters || [],
          } as CivicIssue);
        });
        setIssues(issuesData);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch real-time issues:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update Status in Firestore
  const handleUpdateStatus = async (issueId: string, newStatus: IssueStatus) => {
    try {
      const issueDocRef = doc(db, "issues", issueId);
      await updateDoc(issueDocRef, { status: newStatus });
      
      // Update selected modal text if currently open
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue({ ...selectedIssue, status: newStatus });
      }
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  // Delete matching issue report
  const handleDeleteIssue = async (issueId: string) => {
    if (!window.confirm("Are you sure you want to retract/delete this civic report?")) return;
    try {
      await deleteDoc(doc(db, "issues", issueId));
      setSelectedIssue(null);
    } catch (err: any) {
      console.error("Failed to delete issue:", err);
      alert("Failed to delete issue: " + err.message);
    }
  };

  // Handle Community Confirmations (Feature 1)
  const handleConfirmObservation = async (issueId: string) => {
    if (!selectedIssue) return;
    if (!currentUser) {
      alert("Please sign in to confirm this observation.");
      return;
    }
    const currentConfirmations = selectedIssue.confirmations || [];
    if (currentConfirmations.includes(currentUser.uid)) {
      alert("You have already confirmed this observation.");
      return;
    }

    try {
      setConfirming(true);
      const docRef = doc(db, "issues", issueId);
      const updatedConfirmations = [...currentConfirmations, currentUser.uid];
      const updatedCount = updatedConfirmations.length;
      
      await updateDoc(docRef, {
        confirmations: updatedConfirmations,
        confirmationCount: updatedCount
      });

      setSelectedIssue({
        ...selectedIssue,
        confirmations: updatedConfirmations,
        confirmationCount: updatedCount
      });
    } catch (err: any) {
      console.error("Failed to save confirmation:", err);
      alert("Failed to save confirmation: " + err.message);
    } finally {
      setConfirming(false);
    }
  };

  // Handle Resolution Feedback (Feature 2)
  const handleResolutionFeedback = async (issueId: string, vote: "Yes" | "No") => {
    if (!selectedIssue) return;
    if (!currentUser) {
      alert("Please sign in to verify this resolution.");
      return;
    }

    const yesVoters = selectedIssue.resolutionYesVoters || [];
    const noVoters = selectedIssue.resolutionNoVoters || [];

    if (yesVoters.includes(currentUser.uid) || noVoters.includes(currentUser.uid)) {
      alert("You have already submitted feedback for this resolution.");
      return;
    }

    try {
      setVerifying(true);
      const docRef = doc(db, "issues", issueId);
      const updatedYesVoters = vote === "Yes" ? [...yesVoters, currentUser.uid] : yesVoters;
      const updatedNoVoters = vote === "No" ? [...noVoters, currentUser.uid] : noVoters;

      await updateDoc(docRef, {
        resolutionYesVoters: updatedYesVoters,
        resolutionNoVoters: updatedNoVoters
      });

      setSelectedIssue({
        ...selectedIssue,
        resolutionYesVoters: updatedYesVoters,
        resolutionNoVoters: updatedNoVoters
      });
    } catch (err: any) {
      console.error("Failed to save resolution feedback:", err);
      alert("Failed to save verification: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Filters logic application
  const filteredIssues = issues.filter((issue) => {
    const matchType = filterType === "All" || issue.issueType === filterType;
    const matchSeverity = filterSeverity === "All" || issue.severity === filterSeverity;
    const matchStatus = filterStatus === "All" || issue.status === filterStatus;
    
    const textToSearch = `${issue.description} ${issue.location} ${issue.recommendedDepartment}`.toLowerCase();
    const matchSearch = textToSearch.includes(searchQuery.toLowerCase());

    return matchType && matchSeverity && matchStatus && matchSearch;
  });

  const getSeverityStyle = (severity: IssueSeverity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-50 text-red-700 border-red-200";
      case "High":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Medium":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusStyle = (status: IssueStatus) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "In Progress":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Under Review":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#FAFAF9]">
      
      {/* Dashboard Greetings */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-sans text-2xl font-black text-slate-900">Active Incident Registry</h2>
          <p className="mt-1 text-xs text-slate-500 font-mono uppercase tracking-wider">
            Real-Time Citizen Incidents and Dispatch Logs
          </p>
        </div>
        
        {/* Simple analytics overview block */}
        <div className="flex items-center space-x-3 text-xs font-mono font-bold bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm" id="registry-summary">
          <div className="px-3 text-center border-r border-slate-150">
            <p className="text-slate-405 uppercase text-[9.5px]">TOTAL INCIDENTS</p>
            <p className="text-sm font-black text-[#1E3A8A]">{issues.length}</p>
          </div>
          <div className="px-3 text-center border-r border-slate-150">
            <p className="text-slate-405 uppercase text-[9.5px]">RESOLVED</p>
            <p className="text-sm font-black text-emerald-600">
              {issues.filter(i => i.status === "Resolved").length}
            </p>
          </div>
          <div className="px-3 text-center">
            <p className="text-slate-405 uppercase text-[9.5px]">CRITICAL</p>
            <p className="text-sm font-black text-[#D00000]">
              {issues.filter(i => i.severity === "Critical").length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Panel Panel */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <SlidersHorizontal className="h-4.5 w-4.5 text-[#1E3A8A]" />
          <h3 className="text-xs font-bold font-mono tracking-wider text-slate-800 uppercase">
            Filter & Query Operations Registry
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search bar */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
              Incident Search query
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locations, departments, visual descriptions..."
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A] transition outline-none"
              id="dash-search-input"
            />
          </div>

          {/* Issue Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
              Defect Category
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A] transition outline-none"
              id="filter-type-select"
            >
              <option value="All">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Streetlight Damage">Streetlight Damage</option>
              <option value="Garbage Accumulation">Garbage Accumulation</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Traffic Obstruction">Traffic Obstruction</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
              Severity Rating
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A] transition outline-none"
              id="filter-severity-select"
            >
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
              Dispatch Action Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A] transition outline-none"
              id="filter-status-select"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" id="loading-skeletons">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
              <div className="h-44 w-full rounded-lg bg-slate-100" />
              <div className="mt-4 h-5 w-2/3 rounded bg-slate-150" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-150" />
            </div>
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-xs" id="empty-state">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-300" />
          <h4 className="mt-4 text-base font-bold text-slate-800">No operational records match criteria</h4>
          <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
            Refine your query, severity filters, or active dispatch statuses to find specific entries.
          </p>
        </div>
      ) : (
        /* Issue Cards Grid */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" id="issues-cards-root">
          {filteredIssues.map((issue) => (
            <div 
              key={issue.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer"
              id={`issue-card-${issue.id}`}
              onClick={() => onInspectIssue ? onInspectIssue(issue.id) : setSelectedIssue(issue)}
            >
              {/* Photo Banner with floating badges */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-50">
                <img
                  src={issue.imageUrl || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop"}
                  alt={issue.issueType}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                />
                
                {/* floating badges */}
                <span className={`absolute top-3 left-3 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest font-mono shadow-xs border ${getSeverityStyle(issue.severity)}`}>
                  {issue.severity}
                </span>

                <div className="absolute top-3 right-3 flex items-center space-x-1 rounded bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xs">
                  <span>Priority: {issue.priorityScore}</span>
                </div>
              </div>

              {/* Card Contents */}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-extrabold text-[#1E3A8A] tracking-widest uppercase">
                    {issue.issueType}
                  </span>
                  <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(issue.status)}`}>
                    {issue.status}
                  </span>
                </div>

                <h4 className="mt-3 font-sans font-bold text-slate-900 text-sm line-clamp-1 title" title={issue.description}>
                  {issue.description || "Reported municipal fault"}
                </h4>

                {/* Location and Department row */}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate text-slate-600">{issue.location}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 pb-1">
                    <Building className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate font-semibold text-slate-700">{issue.recommendedDepartment}</span>
                  </div>
                </div>

                {/* Card footer details & actions */}
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onInspectIssue ? onInspectIssue(issue.id) : setSelectedIssue(issue)}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-505 hover:bg-slate-50 hover:text-slate-750"
                      title="Inspect Report Detail"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                    
                    {/* Inline Quick-Resolve action for easier testing */}
                    {issue.status !== "Resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(issue.id, "Resolved")}
                        className="rounded-lg border border-green-200 bg-green-50 p-1.5 text-green-700 hover:bg-green-100/70"
                        title="Mark resolved"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Modal Overlay (Backup review layer) */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn animate-duration-150" id="detail-modal">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl max-h-[90vh] flex flex-col">
            
            {/* Modal Header banner */}
            <div className="relative h-60 w-full shrink-0">
              <img
                src={selectedIssue.imageUrl || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop"}
                alt="Detailed issue presentation"
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => setSelectedIssue(null)}
                className="absolute top-4 right-4 rounded-full bg-slate-900/70 p-2 text-white hover:bg-slate-905 transition-colors"
                id="modal-close-btn"
              >
                <X className="h-4.5 w-4.5" />
              </button>
              
              <div className="absolute bottom-4 left-4 flex space-x-2">
                <span className={`rounded-sm px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest font-mono text-white border ${
                  selectedIssue.severity === "Critical" ? "bg-red-600/90 border-red-500" :
                  selectedIssue.severity === "High" ? "bg-amber-600/90 border-amber-500" :
                  "bg-blue-600/90 border-blue-500"
                }`}>
                  {selectedIssue.severity}
                </span>

                <span className="rounded bg-slate-900/80 backdrop-blur-xs px-2.5 py-0.5 text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Priority Rating: {selectedIssue.priorityScore}
                </span>
              </div>
            </div>

            {/* Modal details body */}
            <div className="p-6 overflow-y-auto flex-1 font-sans">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold text-[#1E3A8A] uppercase tracking-widest font-mono">
                    {selectedIssue.issueType} Category
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    Civic Incident Report Details
                  </h3>
                </div>
                
                <span className={`rounded border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusStyle(selectedIssue.status)}`}>
                  {selectedIssue.status}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Identified Description
                  </p>
                  <p className="mt-1 text-sm text-slate-755 leading-relaxed">
                    {selectedIssue.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-105 pt-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Site location / coordinates
                    </span>
                    <div className="mt-1 flex items-center space-x-1.5 text-xs text-slate-700">
                      <MapPin className="h-4 w-4 text-[#1E3A8A]" />
                      <span className="font-semibold">{selectedIssue.location}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                      assisting agency
                    </span>
                    <div className="mt-1 flex items-center space-x-1.5 text-xs text-slate-700">
                      <Building className="h-4 w-4 text-[#1E3A8A]" />
                      <span className="font-semibold">{selectedIssue.recommendedDepartment}</span>
                    </div>
                  </div>
                </div>

                {/* Civic Impact Matrix for selected issue */}
                {selectedIssue.impactAssessment && (
                  <div className="mt-4 border-t border-slate-105 pt-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Activity className="h-4 w-4 text-[#1E3A8A] shrink-0" />
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                        Civic Impact Matrix
                      </span>
                      <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.2 text-[8px] font-bold text-[#1E3A8A] select-none scale-90 uppercase tracking-wider border border-blue-100">
                        ASSESSMENT MODULE
                      </span>
                    </div>

                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                      
                      {/* Population Impact */}
                      <div className="flex flex-col justify-between p-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Impacted Area</span>
                        <span className="text-xs font-extrabold text-slate-800 mt-1 block">
                          {selectedIssue.impactAssessment.populationRange || selectedIssue.impactAssessment.estimatedPopulationRange || (
                            selectedIssue.impactAssessment.affectedCitizensPerDay ? (
                              selectedIssue.impactAssessment.affectedCitizensPerDay > 500 ? "500+" :
                              selectedIssue.impactAssessment.affectedCitizensPerDay > 200 ? "200-500" :
                              selectedIssue.impactAssessment.affectedCitizensPerDay > 50 ? "50-200" : "0-50"
                            ) : "Pending"
                          )} residents
                        </span>
                      </div>

                      {/* Confidence Level */}
                      <div className="flex flex-col justify-between p-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Confidence</span>
                        <div className="mt-1">
                          <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            selectedIssue.impactAssessment.confidenceLevel === "High" ? "bg-green-50 text-green-700 border border-green-150" :
                            "bg-amber-150 text-amber-800"
                          }`}>
                            {selectedIssue.impactAssessment.confidenceLevel || "High"}
                          </span>
                        </div>
                      </div>

                      {/* Public Safety Risk */}
                      <div className="flex flex-col justify-between p-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Safety Threat</span>
                        <div className="mt-1">
                          <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            selectedIssue.impactAssessment.publicSafetyRisk === "Critical" ? "bg-red-50 text-red-700 border border-red-150" :
                            selectedIssue.impactAssessment.publicSafetyRisk === "High" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                            "bg-green-50 text-green-700"
                          }`}>
                            {selectedIssue.impactAssessment.publicSafetyRisk}
                          </span>
                        </div>
                      </div>

                      {/* Traffic Impact */}
                      <div className="flex flex-col justify-between p-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Transit effect</span>
                        <div className="mt-1">
                          <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            selectedIssue.impactAssessment.trafficImpact === "High" ? "bg-red-50 text-red-700 border border-red-150" :
                            selectedIssue.impactAssessment.trafficImpact === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                            "bg-green-55 text-green-700"
                          }`}>
                            {selectedIssue.impactAssessment.trafficImpact}
                          </span>
                        </div>
                      </div>

                      {/* Response window */}
                      <div className="flex flex-col justify-between p-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">SLA window</span>
                        <div className="mt-1">
                          <span className="inline-flex rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                            {selectedIssue.impactAssessment.recommendedResponseTime}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Infrastructure surrounding facilities */}
                    {selectedIssue.impactAssessment.criticalInfrastructureNearby && selectedIssue.impactAssessment.criticalInfrastructureNearby.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block mb-1">
                          Critical Facilities Nearby
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {selectedIssue.impactAssessment.criticalInfrastructureNearby.map((item, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Municipal Response Recommendation Card (Unified Schema) */}
                {(() => {
                  const plan = selectedIssue.resolutionPlan || getFallbackResolutionPlan(selectedIssue);
                  return (
                    <div className="mt-4 border-t border-slate-105 pt-4 font-sans animate-fade-in" id="ref-resolution-plan-card">
                      <div className="flex items-center space-x-2 mb-4">
                        <Shield className="h-4.5 w-4.5 text-[#1E3A8A] shrink-0" />
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-mono">
                          Municipal Response Recommendation
                        </span>
                        <span className="inline-flex items-center rounded bg-amber-50 border border-amber-150 px-1.5 py-0.2 text-[8px] font-mono font-bold text-[#D4A017] select-none scale-90 uppercase tracking-wider">
                          DECISION SUPPORT
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-3 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Department Assign</span>
                          <span className="text-xs font-bold text-slate-800 mt-1">{plan.department}</span>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-3 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Priority Level</span>
                          <div className="mt-1">
                            <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-bold font-mono tracking-wide border ${
                              plan.priorityLevel === "Critical" ? "bg-red-50 text-red-700 border-red-150" :
                              plan.priorityLevel === "High" ? "bg-amber-50 text-amber-700 border-amber-150" :
                              "bg-blue-50 text-blue-700 border-blue-150"
                            }`}>
                              {plan.priorityLevel || "Medium"}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-3 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Estimated cost</span>
                          <span className="text-xs font-bold text-slate-800 mt-1">{plan.estimatedCostRange}</span>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-3 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Resolution Time</span>
                          <span className="text-xs font-bold text-slate-800 mt-1">{plan.estimatedResolutionTime}</span>
                        </div>
                      </div>

                      {/* Detailed sections */}
                      <div className="space-y-3">
                        {/* 5. Recommended Action */}
                        <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                          <span className="text-[9px] font-bold text-[#1E3A8A] uppercase tracking-widest font-mono block mb-1">Recommended Action</span>
                          <p className="text-xs font-bold text-slate-800 leading-relaxed">
                            {plan.recommendedAction}
                          </p>
                        </div>

                        {/* 6. Risk If Ignored */}
                        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50/10">
                          <span className="text-[9px] font-bold text-red-650 uppercase tracking-widest font-mono block mb-1">Risk If Ignored</span>
                          <p className="text-xs font-bold text-red-750 leading-relaxed">
                            {plan.riskIfIgnored}
                          </p>
                        </div>

                        {/* 7. AI Justification */}
                        <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                          <span className="text-[9px] font-bold text-[#D4A017] uppercase tracking-widest font-mono block mb-1">Support justification</span>
                          <p className="text-xs font-medium text-slate-650 italic leading-relaxed">
                            "{plan.justification}"
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ==================================================
                    CIVIC VALIDATION & VERIFICATION PANEL (Feature 1 & Feature 2)
                    ================================================== */}
                <div className="border-t border-slate-105 pt-4 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Community Confirmations */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-[#1E3A8A] uppercase tracking-widest font-mono block mb-1">
                        Community Confirmations
                      </span>
                      <p className="text-xs font-black text-slate-800">
                        {(selectedIssue.confirmations?.length || 0)} Citizens Confirmed
                      </p>
                    </div>
                    <button
                      onClick={() => handleConfirmObservation(selectedIssue.id)}
                      disabled={confirming || !currentUser || selectedIssue.confirmations?.includes(currentUser.uid)}
                      className={`mt-2 w-full text-center py-1 rounded text-xs font-bold transition-all border ${
                        currentUser && selectedIssue.confirmations?.includes(currentUser.uid)
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white border-[#1E3A8A] shadow-2xs active:scale-[0.98] disabled:opacity-50"
                      }`}
                    >
                      {currentUser && selectedIssue.confirmations?.includes(currentUser.uid)
                        ? "✓ Observed & Confirmed"
                        : "I Observed This Too"}
                    </button>
                  </div>

                  {/* Resolution Verification */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block mb-1">
                        Resolution Audit Status
                      </span>
                      {(() => {
                        const yesCount = selectedIssue.resolutionYesVoters?.length || 0;
                        const noCount = selectedIssue.resolutionNoVoters?.length || 0;
                        let statusLabel = "Under Review";
                        let statusStyle = "text-slate-650 bg-slate-105 border-slate-250";
                        if (noCount > 0) {
                          statusLabel = "Resolution Disputed";
                          statusStyle = "text-red-700 bg-red-50 border-red-150";
                        } else if (yesCount > 0) {
                          statusLabel = "Verified by Citizens";
                          statusStyle = "text-emerald-750 bg-emerald-50 border-emerald-150";
                        }
                        return (
                          <span className={`inline-flex items-center rounded-sm px-1.5 py-0.2 text-[9px] font-extrabold uppercase border ${statusStyle}`}>
                            {statusLabel}
                          </span>
                        );
                      })()}
                    </div>

                    {selectedIssue.status === "Resolved" ? (
                      <div className="mt-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">
                          Was this actually resolved?
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleResolutionFeedback(selectedIssue.id, "Yes")}
                            disabled={verifying || !currentUser || (selectedIssue.resolutionYesVoters?.includes(currentUser.uid) || selectedIssue.resolutionNoVoters?.includes(currentUser.uid))}
                            className={`py-1 text-center rounded text-xs font-bold border transition ${
                              currentUser && selectedIssue.resolutionYesVoters?.includes(currentUser.uid)
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 disabled:opacity-50"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleResolutionFeedback(selectedIssue.id, "No")}
                            disabled={verifying || !currentUser || (selectedIssue.resolutionYesVoters?.includes(currentUser.uid) || selectedIssue.resolutionNoVoters?.includes(currentUser.uid))}
                            className={`py-1 text-center rounded text-xs font-bold border transition ${
                              currentUser && selectedIssue.resolutionNoVoters?.includes(currentUser.uid)
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 disabled:opacity-50"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-mono uppercase italic block mt-2">
                        Awaiting resolved status...
                      </span>
                    )}
                  </div>
                </div>

                {/* Status transitions (Admin actions or simulation panel) */}
                <div className="border-t border-slate-105 pt-4 mt-6">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-3">
                    Authorized Status Management
                  </span>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {(["Reported", "Under Review", "In Progress", "Resolved"] as IssueStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(selectedIssue.id, status)}
                          className={`rounded px-3 py-1.5 text-xs font-bold tracking-wide border transition-all ${
                            selectedIssue.status === status
                              ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                          id={`status-transition-${status}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                    {/* Delete Report Option if owner or inspector */}
                    <button
                      onClick={() => handleDeleteIssue(selectedIssue.id)}
                      className="inline-flex items-center space-x-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-650 hover:bg-red-100 transition-colors"
                      id="del-report-btn"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Retract Report</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
