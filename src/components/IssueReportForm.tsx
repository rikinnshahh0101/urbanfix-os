import React, { useState, useRef } from "react";
import { User } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { CivicIssue, IssueType, IssueSeverity } from "../types";
import { 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  Loader2, 
  Upload, 
  X,
  FileText,
  Landmark,
  Compass,
  ArrowRight
} from "lucide-react";

// Helper to resize and compress image to keep base64 strings small (under ~50KB) so they fit inside Firestore's 1MB limit easily
function resizeAndCompressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for resizing"));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

interface IssueReportFormProps {
  user: User | { uid: string; displayName: string | null } | null;
  onSuccess: (issueId: string) => void;
}

export default function IssueReportForm({ user, onSuccess }: IssueReportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  
  const [optionalDesc, setOptionalDesc] = useState("");
  const [location, setLocation] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  // Loading States
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Handle Location detection
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setGettingLocation(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation Error:", error);
        setLocation("Simulated District: Central District 7, Sector B");
        setGettingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  // Convert File to Base64 helper with image compression & resizing
  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file.");
      return;
    }

    setErrorMsg(null);
    setFile(selectedFile);
    setMimeType("image/jpeg");

    try {
      const compressedDataUrl = await resizeAndCompressImage(selectedFile, 800, 600, 0.7);
      setPreviewUrl(compressedDataUrl);

      const base64Parts = compressedDataUrl.split(",");
      if (base64Parts.length > 1) {
        setBase64Data(base64Parts[1]);
      }
    } catch (err: any) {
      console.error("Image compression error:", err);
      setErrorMsg("Failed to process image files: " + err.message);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragRef.current) {
      dragRef.current.classList.add("border-blue-500", "bg-blue-50/10");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragRef.current) {
      dragRef.current.classList.remove("border-blue-500", "bg-blue-50/10");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragRef.current) {
      dragRef.current.classList.remove("border-blue-500", "bg-blue-50/10");
    }
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      handleFileChange(droppedFiles[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setBase64Data(null);
    setMimeType(null);
  };

  // Two-step automated dispatch pipeline trigger
  const handleIngestAndAnalyze = async () => {
    if (!base64Data || !mimeType) {
      setErrorMsg("Please upload or drag an incident evidence image before filing a report.");
      return;
    }

    if (!user) {
      setErrorMsg("Authentication required. Please sign in to submit professional reports.");
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);

    try {
      // 1. Trigger server side Gemini full-workflow analysis
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: mimeType,
          optionalDescription: optionalDesc,
          location: location || "Unspecified Location"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze incident with the municipal dispatch module.");
      }

      const analysis = await response.json();

      // 2. Save full payload to Firestore issues collection
      const issuesCollectionRef = collection(db, "issues");
      const savedDocRef = await addDoc(issuesCollectionRef, {
        userId: user.uid,
        imageUrl: previewUrl || "", // compressed data URL base64
        issueType: analysis.issueType || "Other",
        severity: analysis.severity || "Medium",
        description: analysis.description || "No specific details provided.",
        priorityScore: analysis.priorityScore !== undefined ? Number(analysis.priorityScore) : 55,
        recommendedDepartment: analysis.recommendedDepartment || "General Municipal Services",
        status: "Reported",
        location: location || "Unspecified Location",
        createdAt: new Date().toISOString(),
        impactAssessment: analysis.impactAssessment || null,
        resolutionPlan: analysis.resolutionPlan || null,
        consequenceForecast: analysis.consequenceForecast || null,
        executiveSummary: analysis.executiveSummary || null
      });

      // 3. Trigger the success coordinate callback
      onSuccess(savedDocRef.id);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during dispatch initialization. Please verify your system configuration.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Page Title & Subtitle */}
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h2 className="font-sans text-2xl font-black text-[#1E293B]">Filing New Incident Report</h2>
        <p className="mt-1 text-xs text-slate-500 font-mono uppercase tracking-wider">
          MUNICIPAL INGEST DIRECTIVE • STEP 1 OF 2
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-lg bg-amber-50 p-4 border border-amber-200 text-sm text-amber-805">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Component 1: Drag & Drop Media Evidence Upload */}
        <div className="rounded-xl border border-slate-205 bg-white p-6 shadow-xs">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-xs font-extrabold font-mono text-slate-800 uppercase tracking-widest">
              Incident Evidence Image
            </h3>
            <span className="inline-flex items-center rounded bg-red-50 border border-red-100 px-2 py-0.5 text-[9px] font-mono font-bold text-red-650">
              REQUIRED
            </span>
          </div>

          {!previewUrl ? (
            <div
              ref={dragRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-12 px-6 cursor-pointer hover:border-[#1E3A8A] hover:bg-slate-50/50 transition-all"
              id="drag-drop-zone"
            >
              <Upload className="h-10 w-10 text-slate-400 mb-3" />
              <p className="text-sm font-bold text-slate-700">
                Drag and drop your incident image here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PNG, JPG, JPEG, or WEBP formats (automatically scaled and compressed for performance)
              </p>
              <button
                type="button"
                className="mt-4 rounded-lg bg-blue-50/50 border border-blue-100 px-4 py-2 text-xs font-bold text-[#1E3A8A] hover:bg-blue-50 transition"
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
                id="file-input-manual"
              />
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-slate-200">
              <img
                src={previewUrl}
                alt="Uploaded evidence"
                className="w-full max-h-[380px] object-cover"
              />
              <button
                onClick={clearFile}
                className="absolute top-3 right-3 rounded-full bg-slate-900/70 p-2 text-white hover:bg-slate-900 transition"
                title="Remove evidence"
                id="clear-image-btn"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-xs rounded px-3 py-1.5 text-[10.5px] font-semibold text-white uppercase tracking-widest font-mono">
                {file?.name || "EVIDENCE_SNAPSHOT.JPG"}
              </div>
            </div>
          )}
        </div>

        {/* Component 2 & 3: Location and Notes Field */}
        <div className="rounded-xl border border-slate-205 bg-white p-6 shadow-xs">
          <h3 className="text-xs font-extrabold font-mono text-slate-800 uppercase tracking-widest mb-4">
            Operational Location & Telemetry
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-2">
                Operational Location Address
              </label>
              <div className="relative flex rounded-lg">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. 5th Ave and Broadway intersection, Block C"
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A] transition outline-none"
                  id="loc-input"
                />
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={gettingLocation}
                  className="absolute right-2 top-2 rounded p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  title="Detect GPS coordinate telemetry"
                  id="gps-btn"
                >
                  {gettingLocation ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#1E3A8A]" />
                  ) : (
                    <MapPin className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-400 font-mono leading-relaxed">
                Click Map Pin to instantly associate precise device hardware GPS coordinates back into the database.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-widest font-mono mb-2">
                Operational Notes / Description (Optional)
              </label>
              <textarea
                value={optionalDesc}
                onChange={(e) => setOptionalDesc(e.target.value)}
                placeholder="Clarify specific site indications, immediate traffic obstacles, or relevant local reference points..."
                rows={3}
                className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A] transition outline-none"
                id="notes-input"
              />
            </div>
          </div>
        </div>

        {/* Action button layer & loading display */}
        {!analyzing ? (
          <div className="flex justify-center pt-2" id="analyze-action-block">
            <button
              onClick={handleIngestAndAnalyze}
              disabled={analyzing}
              className="inline-flex h-12 items-center justify-center space-x-2.5 rounded-xl bg-[#1E3A8A] px-8 text-sm font-bold text-white shadow-sm hover:bg-[#152e72] transition duration-150 transform active:scale-[0.99]"
              id="trigger-analyze-btn"
            >
              <Compass className="h-4.5 w-4.5 text-blue-200" />
              <span>Submit & Dispatch Incident</span>
            </button>
          </div>
        ) : (
          /* Premium animated loader mapping server workflows */
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs" id="analyzing-loader">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1E3A8A]" />
            <h4 className="mt-4 text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">
              INITIALIZING REGULATORY ANALYSIS PIPELINE...
            </h4>
            <p className="mt-2.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Standard operations are parsing environmental variables, estimating population reach, categorizing risk ratings, and suggesting the optimal municipal SLA.
            </p>
            <div className="mx-auto mt-5 max-w-sm border-t border-slate-100 pt-3">
              <div className="flex justify-center space-x-3 text-[9.5px] text-[#1E3A8A] font-mono font-bold uppercase tracking-wider">
                <span>CLASSIFYING ISSUE</span>
                <span>•</span>
                <span>ASSESSING SAFETY THREAT</span>
                <span>•</span>
                <span>DETERMINING DEPT</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
