import type { AssessmentWeights, ScenarioAnalysis } from '../types/lunar';

export interface AssessmentResult {
  scorePercent: number;
  suitability: 'EXCELLENT' | 'MARGINAL' | 'HIGH_RISK';
  strengths: string[];
  weaknesses: string[];
  risks: string[];
}

export function evaluateScenario(
  analysis: ScenarioAnalysis,
  weights: AssessmentWeights
): AssessmentResult {
  const m = analysis.metrics;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const risks: string[] = [];

  let score = 0;
  const maxScore = weights.weightIllumination + weights.weightContinuity + weights.weightComm;

  // 1. Evaluate Total Illumination
  if (m.sunlightPercentage >= weights.minSunlightPercent) {
    score += weights.weightIllumination;
    strengths.push(`High solar illumination (${m.sunlightPercentage}%) supports power generation.`);
  } else {
    score += weights.weightIllumination * (m.sunlightPercentage / weights.minSunlightPercent);
    weaknesses.push(`Low total illumination (${m.sunlightPercentage}%). Auxiliary power required.`);
  }

  // 2. Evaluate Continuous Illumination
  if (m.longestContinuousSunHours >= weights.minContinuousSunHours) {
    score += weights.weightContinuity;
    strengths.push(`Continuous sunlight window (${m.longestContinuousSunHours}h) exceeds baseline.`);
  } else {
    score += weights.weightContinuity * (m.longestContinuousSunHours / weights.minContinuousSunHours);
    weaknesses.push(`Longest sun window is only ${m.longestContinuousSunHours}h. Thermal survival risk.`);
    risks.push('Extended eclipse duration threatens battery heating limits.');
  }

  // 3. Evaluate Direct-to-Earth Communication
  if (m.earthVisiblePercentage >= weights.minEarthCommPercent) {
    score += weights.weightComm;
    strengths.push(`Strong Direct-to-Earth visibility (${m.earthVisiblePercentage}%).`);
  } else {
    score += weights.weightComm * (m.earthVisiblePercentage / weights.minEarthCommPercent);
    weaknesses.push(`Poor Earth visibility (${m.earthVisiblePercentage}%). Relay satellite needed.`);
    risks.push('Loss of telemetry during critical surface operations.');
  }

  const scorePercent = Math.round((score / maxScore) * 100);
  let suitability: 'EXCELLENT' | 'MARGINAL' | 'HIGH_RISK' = 'HIGH_RISK';
  
  if (scorePercent >= 80) suitability = 'EXCELLENT';
  else if (scorePercent >= 50) suitability = 'MARGINAL';

  return {
    scorePercent,
    suitability,
    strengths,
    weaknesses,
    risks,
  };
}

export function exportScenarioToCsv(analysis: ScenarioAnalysis, scenarioName: string) {
  const headers = [
    'Timestamp (UTC)',
    'Mission Time (Hours)',
    'Sun Elevation (deg)',
    'Sun Azimuth (deg)',
    'Earth Elevation (deg)',
    'Earth Azimuth (deg)',
    'Sun Visible',
    'Earth Visible'
  ];

  const rows = analysis.points.map((p) => [
    p.timestampIso,
    p.hoursFromStart.toFixed(2),
    p.sunElevationDeg.toFixed(3),
    p.sunAzimuthDeg.toFixed(2),
    p.earthElevationDeg.toFixed(3),
    p.earthAzimuthDeg.toFixed(2),
    p.isSunVisible ? 'YES' : 'NO',
    p.isEarthVisible ? 'YES' : 'NO',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  const safeName = scenarioName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute('download', `luna_nav_${safeName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}