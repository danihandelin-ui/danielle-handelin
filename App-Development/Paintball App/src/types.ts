export interface Symptom {
  description: string;
  likelyCauses: string[];
  solution: string;
}

export interface Marker {
  id: string;
  name: string;
  brand: string;
  category: 'Modern' | 'Legacy';
  seriesGroup: string;
  series: string;
  engine: string;
  description:string;
  boltImageUrl?: string;
  youtubeUrl?: string;
  youtubeSearch?: string;
  commonSymptoms: Symptom[];
  manualUrl?: string;
  image?: string;
}

export interface DiagnosticResult {
  markerName: string;
  symptom: string;
  cause?: string;
  diagnosis: string;
  recommendedOrings: {
    name: string;
    size: string;
    location: string; // Simplified location for ELI5
    quantity: number;
  }[];
  steps: string[];
  techTip: string; // ELI5 bit of advice
  manualUrl?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  markerId: string;
  markerName: string;
  brand: string;
  userSymptom: string;
  userCause: string;
  diagnosis: DiagnosticResult;
  rating?: number; // 1-5
  feedback?: string;
}
