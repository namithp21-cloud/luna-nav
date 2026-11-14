import type {
  AssessmentWeights,
  CandidateSite,
  MissionScenario,
  SolarPanelConfig,
} from '../types/lunar';

/**
 * Candidate Lunar South Pole Landing Regions (Preliminary Planning Reference Coordinates).
 * Provenance: NASA GSFC Planetary Geodynamics Data Archive (PGDA Product 78: LRO LOLA 5 m/px
 * South Pole DEMs, Mazarico et al., 2011) & NASA Moon-to-Mars Lunar Surface Data Book (M2M-30044).
 * NOTE: Coordinates represent regional reference centroids (~15 x 15 km candidate regions),
 * NOT certified flight-target landing coordinates.
 */
export const CANDIDATE_SITES: CandidateSite[] = [
  {
    id: 'site-04-shackleton-rim',
    name: 'Shackleton Crater Rim Region',
    regionTag: 'NASA PGDA Site 04 • Rim Sector',
    latitude: -89.7668,
    longitude: -171.87,
    elevationKm: 1.52,
    provenance:
      'NASA GSFC PGDA Site 04 / M2M-30044 regional centroid (LRO LOLA MOON_ME frame). Candidate region, not a certified landing point.',
    scientificContext:
      'Located along the elevated rim of the 21 km-wide Shackleton crater right beside the lunar rotational axis. Offers high seasonal solar illumination while bordering a 4.2 km-deep Permanently Shadowed Region (PSR) cold trap.',
    terrainNotes:
      'Elevated crater rim crest (~1.5 km above 1737.4 km reference sphere) with steep interior crater walls (>30° slope) adjacent to narrow ridge benches.',
  },
  {
    id: 'site-01-connecting-ridge',
    name: 'Connecting Ridge Region',
    regionTag: 'NASA PGDA Site 01 • Ridge Link',
    latitude: -89.4632,
    longitude: -137.49,
    elevationKm: 1.65,
    provenance:
      'NASA GSFC PGDA Site 01 / M2M-30044 regional centroid (LRO LOLA MOON_ME frame). Candidate region, not a certified landing point.',
    scientificContext:
      'Topographic ridge linking Shackleton and de Gerlache craters. Identified in LOLA illumination studies for prolonged multi-month sunlight peaks and proximity to volatile-bearing micro-cold traps.',
    terrainNotes:
      'Narrow highland ridge crest; illumination and direct-to-Earth visibility vary sharply with meter-scale local relief.',
  },
  {
    id: 'site-23-malapert-massif',
    name: 'Malapert Massif Region',
    regionTag: 'NASA PGDA Site 23 • SPA Rim Massif',
    latitude: -85.9948,
    longitude: -2.5,
    elevationKm: 4.24,
    provenance:
      'NASA GSFC PGDA Site 23 / M2M-30044 regional centroid (LRO LOLA MOON_ME frame). Candidate region, not a certified landing point.',
    scientificContext:
      'High-relief massif (~120 km north of the South Pole near 0° longitude) on the South Pole-Aitken basin rim. Its ~4.2 km elevation provides strong Earth line-of-sight geometry for direct communications.',
    terrainNotes:
      'Broad upper massif plateau with moderate local slopes surrounded by steep bounding scarps dropping toward Haworth and Shoemaker craters.',
  },
  {
    id: 'site-06-nobile-rim',
    name: 'Nobile Crater Rim Region',
    regionTag: 'NASA PGDA Site 06 • Nobile Rim 1',
    latitude: -85.20,
    longitude: 53.50,
    elevationKm: 3.85,
    provenance:
      'NASA GSFC PGDA Site 06 / LRO LOLA South Pole regional reference (MOON_ME frame). Candidate region, not a certified landing point.',
    scientificContext:
      'Western/southwestern rim highlands bordering the 73 km Nobile impact basin. Studied extensively for rover-accessible terrain slopes leading toward shadowed volatile deposits.',
    terrainNotes:
      'Rolling massif highlands (~3.8–4.1 km above reference datum) with lower latitude (85.2°S), yielding higher midday Sun arcs and wider day/night thermal swings than 89°S sites.',
  },
  {
    id: 'site-11-de-gerlache-rim',
    name: 'de Gerlache Crater Rim Region',
    regionTag: 'NASA PGDA Site 11 • Polar Rim',
    latitude: -88.48,
    longitude: -88.34,
    elevationKm: 1.95,
    provenance:
      'NASA GSFC PGDA Site 11 / LRO LOLA regional reference (MOON_ME frame). Candidate region, not a certified landing point.',
    scientificContext:
      'Elevated rim segment of the 32.4 km de Gerlache crater, offering access to ancient South Pole-Aitken basin ejecta and nearby permanently shadowed floor deposits.',
    terrainNotes:
      'High-elevation rim terrace subject to strong azimuth-dependent horizon masking from neighboring Shackleton and Sverdrup peaks.',
  },
];

export const DEFAULT_PRIMARY_SCENARIO: MissionScenario = {
  id: 'scenario-primary',
  name: 'Alpha • Shackleton Rim Polar Ops',
  site: CANDIDATE_SITES[0],
  startDateIso: '2026-11-15T00:00:00Z',
  durationDays: 14,
};

export const DEFAULT_COMPARISON_SCENARIO: MissionScenario = {
  id: 'scenario-comparison',
  name: 'Beta • Malapert Massif High-Comm',
  site: CANDIDATE_SITES[2],
  startDateIso: '2026-11-15T00:00:00Z',
  durationDays: 14,
};

export const DEFAULT_PANEL_CONFIG: SolarPanelConfig = {
  enabled: true,
  ratedPowerWatts: 1200,
  efficiencyPercent: 28,
  trackingMode: 'VERTICAL_TRACKING',
};

export const DEFAULT_ASSESSMENT_WEIGHTS: AssessmentWeights = {
  minSunlightPercent: 60,
  minContinuousSunHours: 120,
  minEarthCommPercent: 45,
  weightIllumination: 40,
  weightContinuity: 30,
  weightComm: 30,
};