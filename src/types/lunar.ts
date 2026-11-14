export type DataSourceMode = 'LIVE_HORIZONS' | 'CACHED_HORIZONS' | 'ANALYTICAL_MODEL';

export interface CandidateSite {
  id: string;
  name: string;
  regionTag: string;
  latitude: number;
  longitude: number;
  elevationKm: number;
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
  startDateIso: string;
  durationDays: number;
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