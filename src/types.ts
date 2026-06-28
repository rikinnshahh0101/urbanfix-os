export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
}

export type IssueType =
  | "Pothole"
  | "Water Leakage"
  | "Streetlight Damage"
  | "Garbage Accumulation"
  | "Road Damage"
  | "Traffic Obstruction"
  | "Other";

export type IssueSeverity = "Low" | "Medium" | "High" | "Critical";

export type IssueStatus = "Reported" | "Under Review" | "In Progress" | "Resolved";

export interface CivicImpact {
  affectedCitizensPerDay?: number;
  populationRange?: "0-50" | "50-200" | "200-500" | "500+";
  estimatedPopulationRange?: "0-50" | "50-200" | "200-500" | "500+";
  confidenceLevel: "Low" | "Medium" | "High";
  reasoning: string;
  impactLevel?: "Low" | "Medium" | "High" | "Critical";
  publicSafetyRisk: "Low" | "Medium" | "High" | "Critical";
  trafficImpact: "Low" | "Medium" | "High";
  environmentalImpact: "Low" | "Medium" | "High";
  criticalInfrastructureNearby: string[];
  recommendedResponseTime: "Immediate" | "24 Hours" | "48 Hours" | "3 Days" | "7 Days";
  impactSummary?: string;
}

export interface ResolutionPlan {
  department: string;
  priorityLevel: "Low" | "Medium" | "High" | "Critical";
  estimatedCostRange: string;
  estimatedResolutionTime: string;
  recommendedAction: string;
  riskIfIgnored: string;
  justification: string;
}

export interface CivicIssue {
  id: string;
  userId: string;
  imageUrl: string;
  issueType: IssueType;
  severity: IssueSeverity;
  description: string;
  priorityScore: number;
  recommendedDepartment: string;
  status: IssueStatus;
  location: string;
  createdAt: string;
  impactAssessment?: CivicImpact;
  resolutionPlan?: ResolutionPlan;
  consequenceForecast?: ConsequenceForecast;
  executiveSummary?: string;
  confirmations?: string[];
  confirmationCount?: number;
  resolutionYesVoters?: string[];
  resolutionNoVoters?: string[];
}

export interface ConsequenceForecast {
  sevenDayForecast: string;
  thirtyDayForecast: string;
  ninetyDayForecast: string;
  forecastConfidence: "Low" | "Medium" | "High";
  forecastSummary: string;
}
