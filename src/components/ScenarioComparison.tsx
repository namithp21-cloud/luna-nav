import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  GitCompare,
  Award,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Download,
  ShieldAlert,
} from 'lucide-react';
import type {
  AssessmentWeights,
  CandidateSite,
  MissionScenario,
  ScenarioAnalysis,
} from '../types/lunar';
import { evaluateScenario, exportScenarioToCsv } from '../services/assessmentService';

interface ScenarioComparisonProps {
  primaryScenario: MissionScenario;
  comparisonScenario: MissionScenario;
  primaryAnalysis: ScenarioAnalysis;
  comparisonAnalysis: ScenarioAnalysis;
  sites: CandidateSite[];
  weights: AssessmentWeights;
  onUpdatePrimaryScenario: (scenario: MissionScenario) => void;
  onUpdateComparisonScenario: (scenario: MissionScenario) => void;
  onUpdateWeights: (weights: AssessmentWeights) => void;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  primaryScenario,
  comparisonScenario,
  primaryAnalysis,
  comparisonAnalysis,
  sites,
  weights,
  onUpdatePrimaryScenario,
  onUpdateComparisonScenario,
  onUpdateWeights,
}) => {
  const evalPrimary = useMemo(
    () => evaluateScenario(primaryAnalysis, weights),
    [primaryAnalysis, weights]
  );
  const evalComparison = useMemo(
    () => evaluateScenario(comparisonAnalysis, weights),
    [comparisonAnalysis, weights]
  );

  // Merge time-series points by mission elapsed hour (T+Xh) for direct overlay comparison
  const mergedChartData = useMemo(() => {
    const len = Math.min(primaryAnalysis.points.length, comparisonAnalysis.points.length);
    const rows = [];
    for (let i = 0; i < len; i++) {
      const pA = primaryAnalysis.points[i];
      const pB = comparisonAnalysis.points[i];
      rows.push({
        hours: Number(pA.hoursFromStart.toFixed(1)),
        alphaSun: pA.sunElevationDeg,
        betaSun: pB.sunElevationDeg,
        alphaEarth: pA.earthElevationDeg,
        betaEarth: pB.earthElevationDeg,
      });
    }
    return rows;
  }, [primaryAnalysis.points, comparisonAnalysis.points]);

  const exportComparisonSummaryCsv = () => {
    const mA = primaryAnalysis.metrics;
    const mB = comparisonAnalysis.metrics;
    const headers = [
      'Metric',
      `Scenario Alpha (${primaryScenario.site.name})`,
      `Scenario Beta (${comparisonScenario.site.name})`,
      'Delta (Alpha - Beta)',
      'Better Scenario',
    ];
    const rows = [
      [
        'Landing Site Coordinates',
        `${primaryScenario.site.latitude.toFixed(4)}N / ${primaryScenario.site.longitude.toFixed(2)}E`,
        `${comparisonScenario.site.latitude.toFixed(4)}N / ${comparisonScenario.site.longitude.toFixed(2)}E`,
        '-',
        '-',
      ],
      [
        'Mission Start (UTC)',
        primaryScenario.startDateIso,
        comparisonScenario.startDateIso,
        '-',
        '-',
      ],
      [
        'Sunlight Percentage (%)',
        `${mA.sunlightPercentage}%`,
        `${mB.sunlightPercentage}%`,
        `${(mA.sunlightPercentage - mB.sunlightPercentage).toFixed(1)}%`,
        mA.sunlightPercentage >= mB.sunlightPercentage ? 'Alpha' : 'Beta',
      ],
      [
        'Longest Continuous Sun (h)',
        `${mA.longestContinuousSunHours}h`,
        `${mB.longestContinuousSunHours}h`,
        `${(mA.longestContinuousSunHours - mB.longestContinuousSunHours).toFixed(1)}h`,
        mA.longestContinuousSunHours >= mB.longestContinuousSunHours ? 'Alpha' : 'Beta',
      ],
      [
        'Direct-to-Earth Comm (%)',
        `${mA.earthVisiblePercentage}%`,
        `${mB.earthVisiblePercentage}%`,
        `${(mA.earthVisiblePercentage - mB.earthVisiblePercentage).toFixed(1)}%`,
        mA.earthVisiblePercentage >= mB.earthVisiblePercentage ? 'Alpha' : 'Beta',
      ],
      [
        'Longest Continuous Earth Window (h)',
        `${mA.longestContinuousEarthHours}h`,
        `${mB.longestContinuousEarthHours}h`,
        `${(mA.longestContinuousEarthHours - mB.longestContinuousEarthHours).toFixed(1)}h`,
        mA.longestContinuousEarthHours >= mB.longestContinuousEarthHours ? 'Alpha' : 'Beta',
      ],
      [
        'Overall Suitability Score (%)',
        `${evalPrimary.scorePercent}% (${evalPrimary.suitability})`,
        `${evalComparison.scorePercent}% (${evalComparison.suitability})`,
        `${evalPrimary.scorePercent - evalComparison.scorePercent}%`,
        evalPrimary.scorePercent >= evalComparison.scorePercent ? 'Alpha' : 'Beta',
      ],
    ];

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'luna_nav_scenario_comparison.csv';
    link.click();
  };

  const mA = primaryAnalysis.metrics;
  const mB = comparisonAnalysis.metrics;

  return (
    <div className="space-y-4">
      {/* Top Header & Export Bar */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <GitCompare className="w-4 h-4" /> Multi-Scenario Trade Study & Decision Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare candidate landing sites or launch epochs side-by-side with explainable operational scoring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportComparisonSummaryCsv}
            className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Comparison CSV
          </button>
          <button
            onClick={() => exportScenarioToCsv(primaryAnalysis, primaryScenario.name)}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono-tech cursor-pointer"
          >
            Alpha Ephemeris CSV
          </button>
          <button
            onClick={() => exportScenarioToCsv(comparisonAnalysis, comparisonScenario.name)}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono-tech cursor-pointer"
          >
            Beta Ephemeris CSV
          </button>
        </div>
      </div>

      {/* Side-by-Side Scenario Configuration & Assessment Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SCENARIO ALPHA CARD */}
        <div className="bg-[#0b1220] border border-cyan-500/40 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] font-mono-tech uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                SCENARIO ALPHA (PRIMARY)
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {primaryScenario.site.name}
              </h3>
            </div>
            <div className="text-right font-mono-tech">
              <div className="text-2xl font-bold text-cyan-400">{evalPrimary.scorePercent}/100</div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded ${
                  evalPrimary.suitability === 'EXCELLENT'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : evalPrimary.suitability === 'MARGINAL'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {evalPrimary.suitability}
              </span>
            </div>
          </div>

          {/* Inline Site & Date Controls for Alpha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Candidate Site</label>
              <select
                value={primaryScenario.site.id}
                onChange={(e) => {
                  const found = sites.find((s) => s.id === e.target.value);
                  if (found) onUpdatePrimaryScenario({ ...primaryScenario, site: found });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.latitude.toFixed(2)}°)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Landing Date (UTC)</label>
              <input
                type="date"
                value={primaryScenario.startDateIso.slice(0, 10)}
                onChange={(e) => {
                  if (e.target.value) {
                    onUpdatePrimaryScenario({
                      ...primaryScenario,
                      startDateIso: `${e.target.value}T00:00:00Z`,
                    });
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono-tech"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono-tech bg-slate-900/60 p-2.5 rounded border border-slate-800">
            <div>
              <span className="text-slate-400 block">Total Illumination:</span>
              <span className="text-amber-300 font-semibold">
                {mA.sunlightDurationHours}h ({mA.sunlightPercentage}%)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Continuous Sunlight:</span>
              <span className="text-slate-100 font-semibold">{mA.longestContinuousSunHours}h</span>
            </div>
            <div>
              <span className="text-slate-400 block">Earth DTE Visibility:</span>
              <span className="text-cyan-300 font-semibold">
                {mA.earthVisibleDurationHours}h ({mA.earthVisiblePercentage}%)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Initial Sun / Earth El:</span>
              <span className="text-slate-200">
                {mA.currentSunElevDeg.toFixed(1)}° / {mA.currentEarthElevDeg.toFixed(1)}°
              </span>
            </div>
          </div>

          {/* Strengths / Weaknesses / Risks */}
          <div className="space-y-1.5 text-xs">
            {evalPrimary.strengths.map((st, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{st}</span>
              </div>
            ))}
            {evalPrimary.weaknesses.map((wk, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{wk}</span>
              </div>
            ))}
            {evalPrimary.risks.map((rk, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-rose-300">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Operational Risk: {rk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SCENARIO BETA CARD */}
        <div className="bg-[#0b1220] border border-purple-500/40 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] font-mono-tech uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                SCENARIO BETA (COMPARISON)
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {comparisonScenario.site.name}
              </h3>
            </div>
            <div className="text-right font-mono-tech">
              <div className="text-2xl font-bold text-purple-400">
                {evalComparison.scorePercent}/100
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded ${
                  evalComparison.suitability === 'EXCELLENT'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : evalComparison.suitability === 'MARGINAL'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {evalComparison.suitability}
              </span>
            </div>
          </div>

          {/* Inline Site & Date Controls for Beta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Candidate Site</label>
              <select
                value={comparisonScenario.site.id}
                onChange={(e) => {
                  const found = sites.find((s) => s.id === e.target.value);
                  if (found) onUpdateComparisonScenario({ ...comparisonScenario, site: found });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.latitude.toFixed(2)}°)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Landing Date (UTC)</label>
              <input
                type="date"
                value={comparisonScenario.startDateIso.slice(0, 10)}
                onChange={(e) => {
                  if (e.target.value) {
                    onUpdateComparisonScenario({
                      ...comparisonScenario,
                      startDateIso: `${e.target.value}T00:00:00Z`,
                    });
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono-tech"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono-tech bg-slate-900/60 p-2.5 rounded border border-slate-800">
            <div>
              <span className="text-slate-400 block">Total Illumination:</span>
              <span className="text-amber-300 font-semibold">
                {mB.sunlightDurationHours}h ({mB.sunlightPercentage}%)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Continuous Sunlight:</span>
              <span className="text-slate-100 font-semibold">{mB.longestContinuousSunHours}h</span>
            </div>
            <div>
              <span className="text-slate-400 block">Earth DTE Visibility:</span>
              <span className="text-cyan-300 font-semibold">
                {mB.earthVisibleDurationHours}h ({mB.earthVisiblePercentage}%)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Initial Sun / Earth El:</span>
              <span className="text-slate-200">
                {mB.currentSunElevDeg.toFixed(1)}° / {mB.currentEarthElevDeg.toFixed(1)}°
              </span>
            </div>
          </div>

          {/* Strengths / Weaknesses / Risks */}
          <div className="space-y-1.5 text-xs">
            {evalComparison.strengths.map((st, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{st}</span>
              </div>
            ))}
            {evalComparison.weaknesses.map((wk, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{wk}</span>
              </div>
            ))}
            {evalComparison.risks.map((rk, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-rose-300">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Operational Risk: {rk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Head-to-Head Metric Winner Table */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-400" /> Quantitative Trade-Off Verdict
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono-tech">
                <th className="py-2 pr-3">Operational Metric</th>
                <th className="py-2 px-3 text-cyan-300">Alpha ({primaryScenario.site.name.replace(' Region', '')})</th>
                <th className="py-2 px-3 text-purple-300">Beta ({comparisonScenario.site.name.replace(' Region', '')})</th>
                <th className="py-2 px-3">Difference (Alpha vs Beta)</th>
                <th className="py-2 pl-3">Engineering Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono-tech">
              <tr>
                <td className="py-2.5 pr-3 font-sans text-slate-200">Solar Illumination Fraction</td>
                <td className="py-2.5 px-3">{mA.sunlightPercentage}% ({mA.sunlightDurationHours}h)</td>
                <td className="py-2.5 px-3">{mB.sunlightPercentage}% ({mB.sunlightDurationHours}h)</td>
                <td className="py-2.5 px-3 text-amber-300">
                  {(mA.sunlightPercentage - mB.sunlightPercentage) >= 0 ? '+' : ''}
                  {(mA.sunlightPercentage - mB.sunlightPercentage).toFixed(1)}%
                </td>
                <td className="py-2.5 pl-3 font-sans text-slate-300">
                  {mA.sunlightPercentage === mB.sunlightPercentage
                    ? 'Equal solar exposure duration'
                    : mA.sunlightPercentage > mB.sunlightPercentage
                    ? 'Alpha offers longer total solar array charging'
                    : 'Beta offers longer total solar array charging'}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-sans text-slate-200">Longest Uninterrupted Sunlight</td>
                <td className="py-2.5 px-3">{mA.longestContinuousSunHours}h</td>
                <td className="py-2.5 px-3">{mB.longestContinuousSunHours}h</td>
                <td className="py-2.5 px-3 text-amber-300">
                  {(mA.longestContinuousSunHours - mB.longestContinuousSunHours) >= 0 ? '+' : ''}
                  {(mA.longestContinuousSunHours - mB.longestContinuousSunHours).toFixed(1)}h
                </td>
                <td className="py-2.5 pl-3 font-sans text-slate-300">
                  {mA.longestContinuousSunHours >= mB.longestContinuousSunHours
                    ? 'Alpha reduces battery depth-of-discharge stress'
                    : 'Beta reduces battery depth-of-discharge stress'}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-sans text-slate-200">Direct-to-Earth (DTE) Comm Fraction</td>
                <td className="py-2.5 px-3">{mA.earthVisiblePercentage}% ({mA.earthVisibleDurationHours}h)</td>
                <td className="py-2.5 px-3">{mB.earthVisiblePercentage}% ({mB.earthVisibleDurationHours}h)</td>
                <td className="py-2.5 px-3 text-cyan-300">
                  {(mA.earthVisiblePercentage - mB.earthVisiblePercentage) >= 0 ? '+' : ''}
                  {(mA.earthVisiblePercentage - mB.earthVisiblePercentage).toFixed(1)}%
                </td>
                <td className="py-2.5 pl-3 font-sans text-slate-300">
                  {mA.earthVisiblePercentage >= mB.earthVisiblePercentage
                    ? 'Alpha provides superior direct Earth telemetry window'
                    : 'Beta provides superior direct Earth telemetry window'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual Overlay Elevation Chart */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Comparative Elevation Trajectory Overlay (Alpha vs. Beta)
        </h3>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="hours"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(v) => `T+${v}h`}
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="°" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="alphaSun"
                name="Alpha Sun El (°)"
                stroke="#facc15"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="betaSun"
                name="Beta Sun El (°)"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="alphaEarth"
                name="Alpha Earth El (°)"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="betaEarth"
                name="Beta Earth El (°)"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transparent & Configurable Scoring Thresholds */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" /> Transparent Mission Assessment Thresholds & Weights
          </h3>
          <span className="text-[11px] text-slate-400">
            Preliminary planning & educational decision-support only — does not certify flight safety.
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">
              Target Sunlight Fraction Threshold ({weights.minSunlightPercent}%) • Weight: {weights.weightIllumination}pts
            </label>
            <input
              type="range"
              min={20}
              max={95}
              value={weights.minSunlightPercent}
              onChange={(e) =>
                onUpdateWeights({ ...weights, minSunlightPercent: Number(e.target.value) })
              }
              className="w-full accent-cyan-400"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">
              Min Continuous Sun Hours ({weights.minContinuousSunHours}h) • Weight: {weights.weightContinuity}pts
            </label>
            <input
              type="range"
              min={24}
              max={300}
              step={12}
              value={weights.minContinuousSunHours}
              onChange={(e) =>
                onUpdateWeights({ ...weights, minContinuousSunHours: Number(e.target.value) })
              }
              className="w-full accent-cyan-400"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">
              Target Direct-to-Earth Comm ({weights.minEarthCommPercent}%) • Weight: {weights.weightComm}pts
            </label>
            <input
              type="range"
              min={10}
              max={95}
              value={weights.minEarthCommPercent}
              onChange={(e) =>
                onUpdateWeights({ ...weights, minEarthCommPercent: Number(e.target.value) })
              }
              className="w-full accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};