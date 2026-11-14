import type {
  CelestialEvent,
  DataSourceMode,
  EphemerisPoint,
  MissionScenario,
  ScenarioAnalysis,
} from '../types/lunar';

const HORIZONS_BASE_URL =
  import.meta.env.VITE_HORIZONS_API_URL || 'https://ssd.jpl.nasa.gov/api/horizons.api';

const CACHE_PREFIX = 'lunanav_ephem_v1_';
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

interface RawHorizonSample {
  timestampIso: string;
  epochMs: number;
  azimuthDeg: number;
  elevationDeg: number;
}

function formatHorizonsDate(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function parseHorizonsDateString(raw: string): Date {
  // Format from Horizons CAL: "2026-Nov-15 00:00" or "2026-Nov-15 00:00:00"
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const clean = raw.trim();
  const match = clean.match(/^(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const year = Number(match[1]);
    const month = months[match[2]] ?? 0;
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6] || 0);
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
  return new Date(clean + 'Z');
}

function buildHorizonsUrl(
  targetCommand: '10' | '399',
  lonDeg: number,
  latDeg: number,
  altKm: number,
  startDate: Date,
  stopDate: Date,
  stepMinutes: number
): string {
  const params = new URLSearchParams({
    format: 'json',
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    COMMAND: `'${targetCommand}'`,
    CENTER: "'coord@301'",
    COORD_TYPE: "'GEODETIC'",
    SITE_COORD: `'${lonDeg.toFixed(4)},${latDeg.toFixed(4)},${altKm.toFixed(3)}'`,
    START_TIME: `'${formatHorizonsDate(startDate)}'`,
    STOP_TIME: `'${formatHorizonsDate(stopDate)}'`,
    STEP_SIZE: `'${stepMinutes}m'`,
    QUANTITIES: "'4'",
    APPARENT: "'AIRLESS'",
    CAL_FORMAT: "'CAL'",
    TIME_TYPE: "'UT'",
    CSV_FORMAT: "'YES'",
    OBJ_DATA: "'NO'",
  });
  return `${HORIZONS_BASE_URL}?${params.toString()}`;
}

function parseHorizonsResponseText(text: string): RawHorizonSample[] {
  const soeIndex = text.indexOf('$$SOE');
  const eoeIndex = text.indexOf('$$EOE');
  if (soeIndex === -1 || eoeIndex === -1 || eoeIndex <= soeIndex) {
    throw new Error('JPL Horizons response did not contain $$SOE/$$EOE ephemeris block.');
  }

  // Inspect header line immediately preceding $$SOE to locate Azi/Elev columns accurately
  const headerBlock = text.slice(Math.max(0, soeIndex - 600), soeIndex);
  const headerLines = headerBlock
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.includes('Date__(UT)'));
  let azColIdx = -1;
  let elColIdx = -1;

  if (headerLines.length > 0) {
    const cols = headerLines[headerLines.length - 1].split(',').map((c) => c.trim());
    azColIdx = cols.findIndex((c) => c.startsWith('Azi_'));
    elColIdx = cols.findIndex((c) => c.startsWith('Elev_'));
  }

  const body = text.slice(soeIndex + 5, eoeIndex).trim();
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const samples: RawHorizonSample[] = [];

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 4) continue;
    const dt = parseHorizonsDateString(parts[0]);
    if (Number.isNaN(dt.getTime())) continue;

    let az = Number.NaN;
    let el = Number.NaN;

    if (azColIdx >= 0 && elColIdx >= 0 && parts[azColIdx] && parts[elColIdx]) {
      az = parseFloat(parts[azColIdx]);
      el = parseFloat(parts[elColIdx]);
    } else {
      // Fallback: last two numeric tokens on the CSV row are Azi_(a-app) and Elev_(a-app)
      const numericCols = parts
        .slice(1)
        .map((v) => parseFloat(v))
        .filter((n) => !Number.isNaN(n));
      if (numericCols.length >= 2) {
        az = numericCols[numericCols.length - 2];
        el = numericCols[numericCols.length - 1];
      }
    }

    if (!Number.isNaN(az) && !Number.isNaN(el)) {
      samples.push({
        timestampIso: dt.toISOString(),
        epochMs: dt.getTime(),
        azimuthDeg: ((az % 360) + 360) % 360,
        elevationDeg: el,
      });
    }
  }

  if (samples.length === 0) {
    throw new Error('Parsed 0 valid ephemeris samples from JPL Horizons table.');
  }
  return samples;
}

/**
 * Analytical Selenographic Fallback Model (IAU WGCCRE / Meeus Topocentric Geometry).
 * Used ONLY when live JPL Horizons is unreachable (e.g., offline or CORS restriction).
 * Models airless spherical Moon geometry without local DEM terrain masking.
 */
function computeAnalyticalEphemeris(
  scenario: MissionScenario,
  stepMinutes: number
): EphemerisPoint[] {
  const startMs = new Date(scenario.startDateIso).getTime();
  const totalMinutes = scenario.durationDays * 24 * 60;
  const steps = Math.floor(totalMinutes / stepMinutes);

  const latRad = scenario.site.latitude * DEG2RAD;
  const lonRad = scenario.site.longitude * DEG2RAD;

  // J2000.0 reference epoch: 2000-01-01T12:00:00Z
  const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
  const SYNODIC_MONTH_DAYS = 29.530588853;
  const DRACONIC_MONTH_DAYS = 27.212220817;
  const ANOMALISTIC_MONTH_DAYS = 27.554549878;
  const TROPICAL_YEAR_DAYS = 365.24219;

  const points: EphemerisPoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const epochMs = startMs + i * stepMinutes * 60 * 1000;
    const d = (epochMs - J2000_MS) / 86400000; // Days since J2000.0

    // Sub-solar selenographic longitude & latitude (seasonal obliquity 1.5424 deg)
    const synodicPhase = ((d / SYNODIC_MONTH_DAYS) * 2 * Math.PI + 5.14) % (2 * Math.PI);
    const subSolarLon = Math.PI - synodicPhase;
    const eclipticLon = ((d / TROPICAL_YEAR_DAYS) * 2 * Math.PI + 4.89) % (2 * Math.PI);
    const subSolarLat = 1.5424 * DEG2RAD * Math.sin(eclipticLon);

    // Topocentric Sun elevation & azimuth (airless spherical geometry)
    const dLonSun = subSolarLon - lonRad;
    const sinElSun =
      Math.sin(latRad) * Math.sin(subSolarLat) +
      Math.cos(latRad) * Math.cos(subSolarLat) * Math.cos(dLonSun);
    const sunElevationDeg = Math.asin(Math.max(-1, Math.min(1, sinElSun))) * RAD2DEG;

    const ySun = Math.sin(dLonSun) * Math.cos(subSolarLat);
    const xSun =
      Math.cos(latRad) * Math.sin(subSolarLat) -
      Math.sin(latRad) * Math.cos(subSolarLat) * Math.cos(dLonSun);
    const sunAzimuthDeg = ((Math.atan2(ySun, xSun) * RAD2DEG) % 360 + 360) % 360;

    // Sub-Earth selenographic libration in longitude (~7.9 deg) and latitude (~6.7 deg)
    const anomAngle = (d / ANOMALISTIC_MONTH_DAYS) * 2 * Math.PI + 2.35;
    const dracAngle = (d / DRACONIC_MONTH_DAYS) * 2 * Math.PI + 1.62;
    const subEarthLon = 7.6 * DEG2RAD * Math.sin(anomAngle);
    const subEarthLat = 6.68 * DEG2RAD * Math.sin(dracAngle);

    const dLonEarth = subEarthLon - lonRad;
    const sinElEarth =
      Math.sin(latRad) * Math.sin(subEarthLat) +
      Math.cos(latRad) * Math.cos(subEarthLat) * Math.cos(dLonEarth);
    const earthElevationDeg = Math.asin(Math.max(-1, Math.min(1, sinElEarth))) * RAD2DEG;

    const yEarth = Math.sin(dLonEarth) * Math.cos(subEarthLat);
    const xEarth =
      Math.cos(latRad) * Math.sin(subEarthLat) -
      Math.sin(latRad) * Math.cos(subEarthLat) * Math.cos(dLonEarth);
    const earthAzimuthDeg = ((Math.atan2(yEarth, xEarth) * RAD2DEG) % 360 + 360) % 360;

    points.push({
      timestampIso: new Date(epochMs).toISOString(),
      epochMs,
      hoursFromStart: (i * stepMinutes) / 60,
      sunElevationDeg: Number(sunElevationDeg.toFixed(3)),
      sunAzimuthDeg: Number(sunAzimuthDeg.toFixed(2)),
      earthElevationDeg: Number(earthElevationDeg.toFixed(3)),
      earthAzimuthDeg: Number(earthAzimuthDeg.toFixed(2)),
      isSunVisible: sunElevationDeg > 0,
      isEarthVisible: earthElevationDeg > 0,
    });
  }

  return points;
}

function analyzePoints(
  scenario: MissionScenario,
  points: EphemerisPoint[],
  stepMinutes: number,
  sourceMode: DataSourceMode,
  sourceDetails: string,
  fetchedAtIso: string
): ScenarioAnalysis {
  const stepHours = stepMinutes / 60;
  const events: CelestialEvent[] = [];

  let sunSteps = 0;
  let earthSteps = 0;
  let currentSunRun = 0;
  let maxSunRun = 0;
  let currentEarthRun = 0;
  let maxEarthRun = 0;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];

    if (pt.isSunVisible) {
      sunSteps++;
      currentSunRun++;
      if (currentSunRun > maxSunRun) maxSunRun = currentSunRun;
    } else {
      currentSunRun = 0;
    }

    if (pt.isEarthVisible) {
      earthSteps++;
      currentEarthRun++;
      if (currentEarthRun > maxEarthRun) maxEarthRun = currentEarthRun;
    } else {
      currentEarthRun = 0;
    }

    if (i > 0) {
      const prev = points[i - 1];
      // Detect Sun horizon crossing via linear interpolation
      if (prev.sunElevationDeg <= 0 && pt.sunElevationDeg > 0) {
        const frac = -prev.sunElevationDeg / (pt.sunElevationDeg - prev.sunElevationDeg);
        const crossMs = prev.epochMs + frac * (pt.epochMs - prev.epochMs);
        events.push({
          type: 'SUNRISE',
          timestampIso: new Date(crossMs).toISOString(),
          hoursFromStart: prev.hoursFromStart + frac * stepHours,
        });
      } else if (prev.sunElevationDeg > 0 && pt.sunElevationDeg <= 0) {
        const frac = prev.sunElevationDeg / (prev.sunElevationDeg - pt.sunElevationDeg);
        const crossMs = prev.epochMs + frac * (pt.epochMs - prev.epochMs);
        events.push({
          type: 'SUNSET',
          timestampIso: new Date(crossMs).toISOString(),
          hoursFromStart: prev.hoursFromStart + frac * stepHours,
        });
      }

      // Detect Earth horizon crossing via linear interpolation
      if (prev.earthElevationDeg <= 0 && pt.earthElevationDeg > 0) {
        const frac = -prev.earthElevationDeg / (pt.earthElevationDeg - prev.earthElevationDeg);
        const crossMs = prev.epochMs + frac * (pt.epochMs - prev.epochMs);
        events.push({
          type: 'EARTHRISE',
          timestampIso: new Date(crossMs).toISOString(),
          hoursFromStart: prev.hoursFromStart + frac * stepHours,
        });
      } else if (prev.earthElevationDeg > 0 && pt.earthElevationDeg <= 0) {
        const frac = prev.earthElevationDeg / (prev.earthElevationDeg - pt.earthElevationDeg);
        const crossMs = prev.epochMs + frac * (pt.epochMs - prev.epochMs);
        events.push({
          type: 'EARTHSET',
          timestampIso: new Date(crossMs).toISOString(),
          hoursFromStart: prev.hoursFromStart + frac * stepHours,
        });
      }
    }
  }

  const first = points[0];
  const windowHours = scenario.durationDays * 24;
  const totalCount = Math.max(1, points.length);

  const nextSunset = events.find((e) => e.type === 'SUNSET')?.timestampIso ?? null;
  const nextSunrise = events.find((e) => e.type === 'SUNRISE')?.timestampIso ?? null;
  const nextEarthset = events.find((e) => e.type === 'EARTHSET')?.timestampIso ?? null;
  const nextEarthrise = events.find((e) => e.type === 'EARTHRISE')?.timestampIso ?? null;

  return {
    scenarioId: scenario.id,
    sourceMode,
    sourceDetails,
    fetchedAtIso,
    horizonModelNote:
      'Geometric 0° airless local horizon (IAU MOON_ME frame, APPARENT=AIRLESS). Local topographic crater-rim DEM occlusion is not applied unless LOLA horizon profile data is loaded.',
    windowHours,
    stepMinutes,
    points,
    events,
    metrics: {
      currentSunElevDeg: first.sunElevationDeg,
      currentSunAzimDeg: first.sunAzimuthDeg,
      currentEarthElevDeg: first.earthElevationDeg,
      currentEarthAzimDeg: first.earthAzimuthDeg,
      isCurrentlyIlluminated: first.isSunVisible,
      isCurrentlyEarthVisible: first.isEarthVisible,
      sunlightDurationHours: Number((sunSteps * stepHours).toFixed(1)),
      sunlightPercentage: Number(((sunSteps / totalCount) * 100).toFixed(1)),
      longestContinuousSunHours: Number((maxSunRun * stepHours).toFixed(1)),
      earthVisibleDurationHours: Number((earthSteps * stepHours).toFixed(1)),
      earthVisiblePercentage: Number(((earthSteps / totalCount) * 100).toFixed(1)),
      longestContinuousEarthHours: Number((maxEarthRun * stepHours).toFixed(1)),
      nextSunsetIso: nextSunset,
      nextSunriseIso: nextSunrise,
      nextEarthsetIso: nextEarthset,
      nextEarthriseIso: nextEarthrise,
    },
  };
}

export async function fetchScenarioAnalysis(
  scenario: MissionScenario,
  stepMinutes = 60,
  forceRefresh = false
): Promise<ScenarioAnalysis> {
  const cacheKey = `${CACHE_PREFIX}${scenario.site.latitude.toFixed(4)}_${scenario.site.longitude.toFixed(4)}_${scenario.site.elevationKm.toFixed(2)}_${scenario.startDateIso}_${scenario.durationDays}d_${stepMinutes}m`;

  if (!forceRefresh) {
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as {
          fetchedAtIso: string;
          points: EphemerisPoint[];
        };
        if (cached.points && cached.points.length > 0) {
          return analyzePoints(
            scenario,
            cached.points,
            stepMinutes,
            'CACHED_HORIZONS',
            `Cached NASA JPL Horizons DE441 ephemeris (Observer: coord@301, Airless)`,
            cached.fetchedAtIso
          );
        }
      }
    } catch {
      // Ignore storage errors and proceed to fetch
    }
  }

  const startDate = new Date(scenario.startDateIso);
  const stopDate = new Date(startDate.getTime() + scenario.durationDays * 24 * 3600 * 1000);

  try {
    const sunUrl = buildHorizonsUrl(
      '10',
      scenario.site.longitude,
      scenario.site.latitude,
      scenario.site.elevationKm,
      startDate,
      stopDate,
      stepMinutes
    );
    const earthUrl = buildHorizonsUrl(
      '399',
      scenario.site.longitude,
      scenario.site.latitude,
      scenario.site.elevationKm,
      startDate,
      stopDate,
      stepMinutes
    );

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 9000);

    const [sunRes, earthRes] = await Promise.all([
      fetch(sunUrl, { signal: controller.signal }),
      fetch(earthUrl, { signal: controller.signal }),
    ]);
    window.clearTimeout(timeoutId);

    if (!sunRes.ok || !earthRes.ok) {
      throw new Error(`JPL Horizons HTTP status ${sunRes.status}/${earthRes.status}`);
    }

    const [sunJson, earthJson] = await Promise.all([sunRes.json(), earthRes.json()]);
    const sunText: string = sunJson.result || '';
    const earthText: string = earthJson.result || '';

    const sunSamples = parseHorizonsResponseText(sunText);
    const earthSamples = parseHorizonsResponseText(earthText);

    const count = Math.min(sunSamples.length, earthSamples.length);
    const mergedPoints: EphemerisPoint[] = [];
    const startMs = sunSamples[0].epochMs;

    for (let i = 0; i < count; i++) {
      const s = sunSamples[i];
      const e = earthSamples[i];
      mergedPoints.push({
        timestampIso: s.timestampIso,
        epochMs: s.epochMs,
        hoursFromStart: Number(((s.epochMs - startMs) / 3600000).toFixed(3)),
        sunElevationDeg: Number(s.elevationDeg.toFixed(3)),
        sunAzimuthDeg: Number(s.azimuthDeg.toFixed(2)),
        earthElevationDeg: Number(e.elevationDeg.toFixed(3)),
        earthAzimuthDeg: Number(e.azimuthDeg.toFixed(2)),
        isSunVisible: s.elevationDeg > 0,
        isEarthVisible: e.elevationDeg > 0,
      });
    }

    const fetchedAtIso = new Date().toISOString();
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ fetchedAtIso, points: mergedPoints })
      );
    } catch {
      // Ignore quota exceeded
    }

    return analyzePoints(
      scenario,
      mergedPoints,
      stepMinutes,
      'LIVE_HORIZONS',
      `Live NASA JPL Horizons DE441 API (Observer: coord@301, Airless Apparent)`,
      fetchedAtIso
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Network/CORS unreachable';
    const simPoints = computeAnalyticalEphemeris(scenario, stepMinutes);
    return analyzePoints(
      scenario,
      simPoints,
      stepMinutes,
      'ANALYTICAL_MODEL',
      `Simulated Analytical Selenographic Model (JPL Horizons fallback: ${reason})`,
      new Date().toISOString()
    );
  }
}