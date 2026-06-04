import { DiagnosticResult } from "../types";

const API_URL = ((import.meta as any).env?.VITE_API_URL as string | undefined) || "http://localhost:3001";

export async function diagnoseLeak(markerName: string, symptomDescription: string, cause?: string): Promise<DiagnosticResult> {
  try {
    const response = await fetch(`${API_URL}/api/diagnose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markerName, symptomDescription, cause }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json() as DiagnosticResult;
  } catch (error: any) {
    console.error("Diagnosis error:", error);

    let diagnosis = "The Technical AI system is currently unavailable.";
    let steps = [
      "Consult the official Planet Eclipse user manual.",
      "Check for common symptoms in the provided list.",
      "Contact a local certified paintball technician."
    ];
    let techTip = "Safety First: Always de-gas your marker and remove the hopper/paintballs before service!";

    const errorMessage = error?.message || "";

    if (!navigator.onLine) {
      diagnosis = "Connection Lost. It looks like you're in a dead zone at the field.";
      steps = [
        "Check your cellular signal or WiFi connection.",
        "Move to an area with better reception.",
        "Manual diagnosis: Check for dirt or debris in the drivetrain."
      ];
    } else if (errorMessage.includes("429") || errorMessage.includes("QUOTA_EXCEEDED")) {
      diagnosis = "The AI Tech is currently overwhelmed with requests.";
      steps = [
        "Wait 30-60 seconds and try again.",
        "Check the 'Common Symptoms' section on the previous screen.",
        "If you've diagnosed this before, check your 'History' tab."
      ];
      techTip = "Pro Tip: If you're at a large event, local tech booths can help immediately!";
    } else if (errorMessage.includes("API_KEY")) {
      diagnosis = "System Configuration Error (Authentication Failed).";
      steps = [
        "Please check if the CLAUDE_API_KEY is correctly set in the backend environment.",
        "Contact support if this persists.",
        "Use the manual override: Follow the steps in your marker's physical manual."
      ];
    } else if (errorMessage.includes("Safety") || errorMessage.includes("blocked")) {
      diagnosis = "The AI technician blocked this request for safety/policy reasons.";
      steps = [
        "Ensure your description doesn't contain sensitive or prohibited content.",
        "Try rephrasing your symptom description.",
        "Focus strictly on technical paintball marker hardware issues."
      ];
    }

    const isDye = markerName.toLowerCase().includes('dye');
    const fallbackManual = isDye 
      ? "https://shop.dyepaintball.com/pages/manuals?srsltid=AfmBOopmzZVdeMBIUggvYv6RrC8_cQljkL_5WVlFEetLCwMajVOUda7A"
      : "https://planeteclipse.com/manuals/";

    return {
      markerName,
      symptom: symptomDescription,
      diagnosis,
      recommendedOrings: [],
      steps,
      techTip,
      manualUrl: fallbackManual
    };
  }
}
