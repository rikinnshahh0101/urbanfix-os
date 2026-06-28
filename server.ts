import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limits for base64 image uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Shared Gemini AI client setup (using process.env.GEMINI_API_KEY)
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please set it in the Secrets panel.");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// API endpoint for Gemini civic analysis
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { imageBase64, mimeType, optionalDescription, location } = req.body;

    if (!imageBase64 || !mimeType) {
      res.status(400).json({ error: "Missing required image content or MIME type." });
      return;
    }

    const client = getGeminiClient();

    // Setup contents array with the base64 media and analysis prompt
    const promptText = `
      You are an expert civil engineering inspector, municipal safety advisor, and civic dispatcher for the "UrbanFix OS" (UFOS) city services platform.
      Analyze this civic issue image. Use the following context/description provided by the citizen (if any): "${optionalDescription || "No user description provided"}".
      
      Part 1: Basic Analysis
      1. issueType: Must be exactly one of: "Pothole", "Water Leakage", "Streetlight Damage", "Garbage Accumulation", "Road Damage", "Traffic Obstruction", or "Other".
      2. severity: Must be exactly one of: "Low", "Medium", "High", "Critical".
      3. description: Generate a clear, professional, structural description under 150 words of what needs repairing.
      4. priorityScore: An integer scale of 0 to 100 representing urgency (higher means more dangerous, blocking, or public health hazard).
      5. recommendedDepartment: Suggest the correct municipal department responsible (e.g. "Department of Public Works", "Water and Sanitation Division", "Bureau of Street Lighting", "Waste Management Department", "Traffic Operations", etc.).

      Part 2: Civic Impact Intelligence (A structured confidence-based civic estimation system)
      Analyze further to produce:
      - impactLevel: Overall impact level: Low, Medium, High, Critical.
      - estimatedPopulationRange: Estimated group size: "0-50", "50-200", "200-500", "500+".
      - confidenceLevel: Confidence of this projection: "Low", "Medium", "High".
      - publicSafetyRisk: Rate the threat to physical safety (pedestrian injury, vehicular crash, health hazard, etc.): "Low", "Medium", "High", or "Critical".
      - trafficImpact: Rate the blockage velocity risk: "Low", "Medium", "High".
      - environmentalImpact: Rate the ecological risk (standing water, breeding ground, erosion, toxic runoff, garbage pollution): "Low", "Medium", "High".
      - criticalInfrastructureNearby: Identify any likely surrounding institutions (e.g., "School", "Hospital", "Public Transport", "Residential Area", "Commercial Zone") affected. Return as a list of strings.
      - recommendedResponseTime: "Immediate", "24 Hours", "48 Hours", "3 Days", "7 Days".
      - reasoning: Professional explanation of why this specific group and safety level were estimated, under 80 words. Never present assumptions as absolute facts. Do not mention exact citizen counts.

      Part 3: Municipal Response Recommendation (AI Decision Support System)
      Generate a municipal response recommendation plan for city officials and civic operations teams:
      - department: Responsible municipal department name.
      - priorityLevel: Strictly one of: "Low", "Medium", "High", "Critical" on urgency.
      - estimatedCostRange: A reasonable cost estimate in Indian Rupees (₹) with comma separator formatted like "₹8,000 - ₹12,000" or similar.
      - estimatedResolutionTime: Expected resolution time (e.g., "24 Hours", "24-48 Hours", "3 Days").
      - recommendedAction: A single concise sentence of the recommended response action. Do NOT generate engineering procedures, equipment, or personnel lists.
      - riskIfIgnored: A single concise warning of hazard consequence if ignored.
      - justification: A solid explanation of WHY this specific recommendation was generated.

      Part 4: AI Civic Consequence Forecast
      Generate realistic, consequence-focused estimates if unresolved:
      - sevenDayForecast: Brief consequence-focused estimate for 7 days (e.g. road deterioration worsens, odor/pests likely, or night visibility reduced).
      - thirtyDayForecast: Brief consequence-focused estimate for 30 days (e.g. vehicle damage complaints, pedestrian safety concerns, or health complaints).
      - ninetyDayForecast: Brief consequence-focused estimate for 90 days (e.g. repair costs increase significantly, potential safety risks increase, or ecological hazard).
      - forecastConfidence: Confidence level: strictly "Low", "Medium", "High".
      - forecastSummary: Concise overview of the forecast projections.
      Do not make scientific claims; present as AI estimates.

      Part 5: Executive Summary Briefing
      Generate a concise general summary briefing (maximum 50 words) suitable for civic operations leaders (e.g. "UrbanFixOS has identified a high-priority infrastructure issue requiring intervention...").

      Provide your analysis in the exact JSON schema requested.
    `;

    let response;
    let attempts = 0;
    const maxAttempts = 3;
    let fallbackModel = "gemini-3.1-flash-lite";

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const currentModel = attempts === 3 ? fallbackModel : "gemini-3.5-flash";
        console.log(`Attempting Gemini analysis with model: ${currentModel} (Attempt ${attempts}/${maxAttempts})`);

        response = await client.models.generateContent({
          model: currentModel,
          contents: [
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
            promptText,
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                issueType: {
                  type: Type.STRING,
                  description: "Strictly one of: 'Pothole', 'Water Leakage', 'Streetlight Damage', 'Garbage Accumulation', 'Road Damage', 'Traffic Obstruction', 'Other'"
                },
                severity: {
                  type: Type.STRING,
                  description: "Strictly one of: 'Low', 'Medium', 'High', 'Critical'"
                },
                description: {
                  type: Type.STRING,
                  description: "A summary under 150 words indicating the civil hazard, estimated size/scope, and required fixes."
                },
                priorityScore: {
                  type: Type.INTEGER,
                  description: "An urgency rating from 0 (negligible) to 100 (lethal or main route blockage)."
                },
                recommendedDepartment: {
                  type: Type.STRING,
                  description: "Municipal agency suggested to handle this repair."
                },
                impactAssessment: {
                  type: Type.OBJECT,
                  properties: {
                    impactLevel: {
                      type: Type.STRING,
                      description: "Overall impact level: 'Low', 'Medium', 'High', 'Critical'"
                    },
                    estimatedPopulationRange: {
                      type: Type.STRING,
                      description: "Estimate range: '0-50', '50-200', '200-500', '500+'"
                    },
                    confidenceLevel: {
                      type: Type.STRING,
                      description: "Analysis confidence check: 'Low', 'Medium', 'High'"
                    },
                    publicSafetyRisk: {
                      type: Type.STRING,
                      description: "Risk threat level: strictly one of 'Low', 'Medium', 'High', 'Critical'"
                    },
                    trafficImpact: {
                      type: Type.STRING,
                      description: "Traffic degradation rating: strictly one of 'Low', 'Medium', 'High'"
                    },
                    environmentalImpact: {
                      type: Type.STRING,
                      description: "Ecological/pollution degradation threat: strictly one of 'Low', 'Medium', 'High'"
                    },
                    criticalInfrastructureNearby: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Nearby facilities: School, Hospital, Public Transport, Residential Area, Commercial Zone"
                    },
                    recommendedResponseTime: {
                      type: Type.STRING,
                      description: "Calculated response deadline: 'Immediate', '24 Hours', '48 Hours', '3 Days', '7 Days'"
                    },
                    reasoning: {
                      type: Type.STRING,
                      description: "Concise reasoning for the impact metrics under 80 words. Never present assumptions as absolute facts."
                    }
                  },
                  required: [
                    "impactLevel",
                    "estimatedPopulationRange",
                    "confidenceLevel",
                    "publicSafetyRisk",
                    "trafficImpact",
                    "environmentalImpact",
                    "criticalInfrastructureNearby",
                    "recommendedResponseTime",
                    "reasoning"
                  ]
                },
                resolutionPlan: {
                  type: Type.OBJECT,
                  properties: {
                    department: {
                      type: Type.STRING,
                      description: "Responsible municipal department"
                    },
                    priorityLevel: {
                      type: Type.STRING,
                      description: "Municipal recommendation priority level: strictly 'Low', 'Medium', 'High', or 'Critical'"
                    },
                    estimatedCostRange: {
                      type: Type.STRING,
                      description: "Reasonable cost range in ₹ (INR), e.g., '₹8,000 - ₹12,000'"
                    },
                    estimatedResolutionTime: {
                      type: Type.STRING,
                      description: "Estimated resolution time (e.g. '24-48 Hours')"
                    },
                    recommendedAction: {
                      type: Type.STRING,
                      description: "Single concise recommended response action sentence"
                    },
                    riskIfIgnored: {
                      type: Type.STRING,
                      description: "Single concise risk outcome sentence if ignored"
                    },
                    justification: {
                      type: Type.STRING,
                      description: "Professional justification of why this recommendation, priority and cost was generated"
                    }
                  },
                  required: [
                    "department",
                    "priorityLevel",
                    "estimatedCostRange",
                    "estimatedResolutionTime",
                    "recommendedAction",
                    "riskIfIgnored",
                    "justification"
                  ]
                },
                consequenceForecast: {
                  type: Type.OBJECT,
                  properties: {
                    sevenDayForecast: {
                      type: Type.STRING,
                      description: "Estimate of consequence in 7 days"
                    },
                    thirtyDayForecast: {
                      type: Type.STRING,
                      description: "Estimate of consequence in 30 days"
                    },
                    ninetyDayForecast: {
                      type: Type.STRING,
                      description: "Estimate of consequence in 90 days"
                    },
                    forecastConfidence: {
                      type: Type.STRING,
                      description: "Confidence strictly 'Low', 'Medium', 'High'"
                    },
                    forecastSummary: {
                      type: Type.STRING,
                      description: "Consequence overview summary"
                    }
                  },
                  required: ["sevenDayForecast", "thirtyDayForecast", "ninetyDayForecast", "forecastConfidence", "forecastSummary"]
                },
                executiveSummary: {
                  type: Type.STRING,
                  description: "Executive general summary under 50 words"
                }
              },
              required: ["issueType", "severity", "description", "priorityScore", "recommendedDepartment", "impactAssessment", "resolutionPlan", "consequenceForecast", "executiveSummary"]
            }
          }
        });
        break; // Success! Break out of the loop
      } catch (err: any) {
        console.warn(`Gemini analysis attempt ${attempts} failed:`, err.message || err);
        const errStr = String(err.message || err);
        const isUnavailable = err.status === 429 || err.status === 503 ||
                              errStr.includes("503") || errStr.toLowerCase().includes("unavailable") || 
                              errStr.toLowerCase().includes("high demand") || errStr.includes("429");
        
        if (isUnavailable && attempts < maxAttempts) {
          const delay = attempts * 1200;
          console.log(`Model unavailable. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }

    if (!response) {
      throw new Error("No response generated from Gemini API after multiple attempt retries.");
    }

    const textResult = response.text?.trim() || "{}";
    const analysisData = JSON.parse(textResult);

    if (analysisData.impactAssessment) {
      analysisData.impactAssessment.populationRange = analysisData.impactAssessment.estimatedPopulationRange;
      analysisData.impactAssessment.reasoning = analysisData.impactAssessment.reasoning || analysisData.impactAssessment.impactSummary || "";
      analysisData.impactAssessment.impactSummary = analysisData.impactAssessment.reasoning;
    }

    res.json(analysisData);
  } catch (error: any) {
    console.error("Gemini Analysis API Error:", error);
    res.status(500).json({
      error: error.message || "Internal server error occurred during civil analysis."
    });
  }
});

// Configure Vite middleware or static serving
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Index static distribution server mounted in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UrbanFix OS server booting on http://0.0.0.0:${PORT}`);
  });
}

configureServer();
