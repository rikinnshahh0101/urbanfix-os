# UrbanFixOS (UFOS)

UrbanFixOS is an AI-powered municipal operations platform that transforms a single citizen report into a complete civic response workflow.

Cities often struggle with fragmented reporting systems, delayed responses, limited transparency, and inefficient resource allocation. UrbanFixOS addresses this challenge by converting citizen-reported issues into structured operational intelligence. From issue detection and prioritization to department assignment, response planning, performance monitoring, and citizen verification, the platform creates a transparent and accountable civic management ecosystem.

Built for Vibe2Ship Hackathon.

## Problem Statement

Citizens frequently encounter civic issues such as potholes, waste accumulation, damaged infrastructure, traffic obstructions, and public safety hazards. While reporting these issues is often possible, the process after reporting is usually opaque and inefficient.

Authorities face challenges in:

- Identifying issue severity consistently
- Prioritizing limited resources
- Routing incidents to the correct departments
- Detecting recurring problem areas
- Monitoring operational performance
- Maintaining transparency with citizens

UrbanFixOS bridges this gap by providing an AI-driven operational workflow that transforms reports into actionable intelligence.


## Solution Overview

UrbanFixOS enables citizens to report civic issues using images and location data. The platform analyzes each report, validates issue relevance, classifies the incident type, calculates a priority score, assigns the responsible department, generates response recommendations, and tracks the incident throughout its lifecycle.

The platform also provides operational insights through city-wide analytics, department performance monitoring, related incident intelligence, citizen validation mechanisms, and a real-time City Health Index.


## Key Features

### AI Incident Analysis
- Visual analysis of uploaded incident images
- Automated issue identification and classification
- Context-aware operational assessment
- Confidence scoring and reasoning

### Civic Issue Validation
- Filters irrelevant or non-civic image submissions
- Prevents misleading or unrelated reports
- Improves reliability of incident records

### Priority Scoring Engine
- Calculates urgency and operational impact
- Generates transparent priority explanations
- Supports data-driven decision making

### Department Assignment
- Automatically routes incidents to the appropriate department
- Supports Public Works, Sanitation, Utilities, Traffic Operations, and Other Services

### Related Incident Intelligence
- Identifies previously reported nearby incidents
- Detects recurring operational patterns
- Provides contextual awareness for response planning

### Operational Response Planning
- Recommended actions for issue resolution
- Estimated response windows
- Projected operational costs
- Risk assessment for delayed intervention

### Citizen Validation & Audit
- Community verification of reported incidents
- Public confirmation after issue resolution
- Encourages transparency and accountability

### Executive Operations Dashboard
- City Health Index
- Critical dispatch alerts
- Department performance registry
- Operational summaries and response metrics

### City Analytics
- Incident type distribution
- Priority level distribution
- Operational intelligence debrief
- Executive city-wide summaries
- Performance trend monitoring

### Reporting & Export
- Incident registry management
- CSV export functionality
- Historical operational tracking


## System Workflow

```text
Citizen Report
        ↓
Image & Location Upload
        ↓
Civic Issue Validation
        ↓
Issue Analysis
        ↓
Issue Classification
        ↓
Priority Scoring
        ↓
Department Assignment
        ↓
Related Incident Intelligence
        ↓
Response Planning
        ↓
Incident Registry
        ↓
Citizen Validation & Audit
        ↓
Executive Dashboard
        ↓
City Analytics
```


## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend & Data
- Firebase Authentication
- Cloud Firestore
- Firestore Security Rules

### Artificial Intelligence
- Google Gemini API


## Google Technologies Utilized

### Google Gemini
Used for:
- Civic issue analysis
- Incident classification
- Operational recommendations
- Risk assessment
- Impact analysis
- Context generation

### Google AI Studio
Used during development, prompt engineering, testing, and iterative refinement of AI workflows.

### Firebase Authentication
Provides secure Google Sign-In and user authentication.

### Cloud Firestore
Stores incidents, analytics, operational data, citizen validations, and platform records.

### Google Antigravity
For final changes and polishing minor things in the app.


## Local Development Setup

### Prerequisites

- Node.js
- npm

### Installation

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
GEMINI_API_KEY=YOUR_API_KEY
```

Start the development server:

```bash
npm run dev
```


## Project Vision

UrbanFixOS is designed around a simple idea:

A citizen report should not end as a complaint. It should become the starting point of a transparent, intelligent, and accountable civic response process.

By combining AI-powered analysis, operational intelligence, and citizen participation, UrbanFixOS helps transform isolated reports into coordinated civic action.


## Hackathon Submission

Google for Developers X Coding Ninjas 
Vibe2Ship 2026

UrbanFixOS transforms civic complaints into actionable intelligence, enabling cities to prioritize smarter, respond faster, and build more transparent and accountable public services.
