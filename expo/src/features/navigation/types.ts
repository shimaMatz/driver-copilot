export type CongestionLevel = 'low' | 'medium' | 'high';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface RestSpotCandidate {
  id: string;
  name: string;
  lat: number;
  lng: number;
  etaMinutes: number;
  congestionLevel: CongestionLevel;
  predictedAvailableLots: number;
  confidence: ConfidenceLevel;
  isRecommended: boolean;
  reason: string;
}

export interface EmergencySuggestion {
  title: string;
  message: string;
  safetySteps: string[];
  suggestedLat: number;
  suggestedLng: number;
}

export interface NavigationRecommendation {
  remainingDrivingSeconds: number;
  candidates: RestSpotCandidate[];
  avoidedReasons: string[];
  emergency?: EmergencySuggestion;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

export type QolSpotType = 'sento' | 'restaurant_24h' | 'laundry';

export interface QolSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: QolSpotType;
  address?: string;
  openNow?: boolean;
}
