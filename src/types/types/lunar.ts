export type DataSourceMode = 'LIVE_HORIZONS' | 'CACHED_HORIZONS' | 'ANALYTICAL_MODEL';

export interface CandidateSite {
  id: string;
  name: string;
  regionTag: string;
  latitude: number; // Degrees (-90 to +90, South is negative)
  longitude: number; // East Longitude in degrees (0 to 360 or -180 to 180)
  elevationKm: number; // Relative to Moon reference radius (1737.4 km)
  provenance: string;
  scientificContext: string;
  terrainNotes: string;
  isCustom?: boolean;
}

export interface EphemerisPoint {
  timestampIso: string;
  epochMs: number;
  hoursFromStart: number;
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  earthElevationDeg: number;
  earthAzimuthDeg: number;
  isSunVisible: boolean;
  isEarthVisible: boolean;
}

export interface CelestialEvent {
  type: 'SUNRISE' | 'SUNSET' | 'EARTHRISE' | 'EARTHSET';
  timestampIso: string;
  hoursFromStart: number;
}

export interface ScenarioAnalysis {
  scenarioId: string;
  sourceMode: DataSourceMode;
  sourceDetails: string;
  fetchedAtIso: string;
  horizonModelNote: string;
  windowHours: number;
  stepMinutes: number;
  points: EphemerisPoint[];
  events: CelestialEvent[];
  metrics: {
    currentSunElevDeg: number;
    currentSunAzimDeg: number;
    currentEarthElevDeg: number;
    currentEarthAzimDeg: number;
    isCurrentlyIlluminated: boolean;
    isCurrentlyEarthVisible: boolean;
    sunlightDurationHours: number;
    sunlightPercentage: number;
    longestContinuousSunHours: number;
    earthVisibleDurationHours: number;
    earthVisiblePercentage: number;
    longestContinuousEarthHours: number;
    nextSunsetIso: string | null;
    nextSunriseIso: string | null;
    nextEarthsetIso: string | null;
    nextEarthriseIso: string | null;
  };
}

export interface MissionScenario {
  id: string;
  name: string;
  site: CandidateSite;
  startDateIso: string; // UTC ISO string e.g. "2026-11-15T00:00:00Z"
  durationDays: number; // e.g. 14 or 30 days
}

export interface SolarPanelConfig {
  enabled: boolean;
  ratedPowerWatts: number;
  efficiencyPercent: number;
  trackingMode: 'VERTICAL_TRACKING' | 'FIXED_HORIZONTAL';
}

export interface AssessmentWeights {
  minSunlightPercent: number;
  minContinuousSunHours: number;
  minEarthCommPercent: number;
  weightIllumination: number;
  weightContinuity: number;
  weightComm: number;
}