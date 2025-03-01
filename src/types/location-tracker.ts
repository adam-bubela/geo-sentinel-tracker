
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LocationState {
  isTracking: boolean;
  currentLocation: Coordinates | null;
  lastSentLocation: Coordinates | null;
  error: string | null;
  nextUpdateIn: number;
  isOnline: boolean;
  pendingUpdates: number;
  showDetails: boolean;
  capturedImage: string | null;
  isCameraActive: boolean;
}

export const API_ENDPOINT = "https://your-api-endpoint.com/locations";
export const UPDATE_INTERVAL = 60; // seconds

