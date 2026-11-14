import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Sun, Radio, Zap, Clock, AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';
import type { ScenarioAnalysis, SolarPanelConfig } from '../types/lunar';

interface TimelinePowerAnalysisProps {
  analysis: ScenarioAnalysis;
  panelConfig: SolarPanelConfig;
  onUpdatePanelConfig: (config: SolarPanelConfig) => void;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export const TimelinePowerAnalysis: React.FC<TimelinePowerAnalysisProps> = ({
  analysis,
  panelConfig,
  onUpdatePanelConfig,
  selectedIndex,
  onSelectIndex,
}) => {
  const currentPoint = analysis.points[selectedIndex] || analysis.points[0];

  // Calculate instantaneous power and cumulative energy (kWh) based on explicit panel assumptions
  const chartData = useMemo(() => {
    const deg2rad = Math.PI / 180;
    const effRatio = panelConfig.efficiencyPercent / 28; // Normalized to 28% triple-junction baseline

    return analysis.points.map((pt, idx) => {
      let instantWatts = 0;
      if (panelConfig.enabled && pt.isSunVisible && pt.sunElevationDeg > 0) {
        const elRad = pt.sunElevationDeg * deg2rad;
        // Vertical mast array tracks grazing polar sunlight (cos(el)); horizontal deck scales with sin(el)
        const incidenceFactor =
          panelConfig.trackingMode === 'VERTICAL_TRACKING'
            ? Math.cos(elRad)
            : Math.sin(elRad);
        instantWatts = Math.round(
          panelConfig.ratedPowerWatts * effRatio * Math.max(0, incidenceFactor)
        );
      }

      return {
        index: idx,
        hours: Number(pt.hoursFromStart.toFixed(1)),
        timestampShort: pt.timestampIso.slice(5, 16).replace('T', ' '),
        sunElev: pt.sunElevationDeg,
        earthElev: pt.earthElevationDeg,
        solarWatts: instantWatts,
      };
    });
  }, [analysis.points, panelConfig]);

  const totalEnergyKwh = useMemo(() => {
    if (!panelConfig.enabled) return null;
    const stepHours = analysis.stepMinutes / 60;
    const totalWh = chartData.reduce((acc, row) => acc + row.solarWatts * stepHours, 0);
    return Number((totalWh / 1000).toFixed(1));
  }, [chartData, panelConfig.enabled, analysis.stepMinutes]);

  // Compute time remaining until next horizon event from currently selected point
  const upcomingEvents = useMemo(() => {
    return analysis.events.filter((ev) => ev.hoursFromStart > currentPoint.hoursFromStart);
  }, [analysis.events, currentPoint.hoursFromStart]);

  const nextEvent = upcomingEvents[0] || null;

  return (
    <div className="space-y-4">
      {/* Top Telemetry Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-3.5">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>SUNLIGHT OPPORTUNITY</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono-tech mt-1">
            {analysis.metrics.sunlightDurationHours}h{' '}
            <span className="text-sm text-amber-400">
              ({analysis.metrics.sunlightPercentage}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Longest Continuous: <span className="text-slate-200 font-mono-tech">{analysis.metrics.longestContinuousSunHours}h</span>
          </div>
        </div>

        <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-3.5">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>DIRECT-TO-EARTH COMM</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono-tech mt-1">
            {analysis.metrics.earthVisibleDurationHours}h{' '}
            <span className="text-sm text-cyan-400">
              ({analysis.metrics.earthVisiblePercentage}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Longest Window: <span className="text-slate-200 font-mono-tech">{analysis.metrics.longestContinuousEarthHours}h</span>
          </div>
        </div>

        <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-3.5">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>EST. ENERGY HARVEST</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          {panelConfig.enabled && totalEnergyKwh !== null ? (
            <>
              <div className="text-xl font-bold text-white font-mono-tech mt-1">
                {totalEnergyKwh} kWh
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Now: <span className="text-emerald-400 font-mono-tech">{chartData[selectedIndex]?.solarWatts ?? 0} W</span> ({panelConfig.trackingMode === 'VERTICAL_TRACKING' ? 'Vertical Mast' : 'Horiz. Deck'})
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-amber-300 font-mono-tech mt-1.5">
                Panel Config Disabled
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Showing illumination opportunity only
              </div>
            </>
          )}
        </div>

        <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-3.5">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>NEXT HORIZON EVENT</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          {nextEvent ? (
            <>
              <div className="text-base font-bold text-white font-mono-tech mt-1">
                {nextEvent.type} in {(nextEvent.hoursFromStart - currentPoint.hoursFromStart).toFixed(1)}h
              </div>
              <div className="text-[11px] text-slate-400 font-mono-tech mt-1">
                At {nextEvent.timestampIso.slice(0, 16).replace('T', ' ')} UTC
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-emerald-400 font-mono-tech mt-1.5">
                No Horizon Crossings Ahead
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Steady visibility state for remaining window
              </div>
            </>
          )}
        </div>
      </div>

      {/* Elevation Profile Timeline Chart */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
              Sun & Earth Elevation Timeline (Airless Geometric Horizon = 0°)
            </h3>
            <p className="text-xs text-slate-400">
              Click any point along the curve to synchronize the 3D Horizon Simulator to that timestamp.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono-tech">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Sun Elevation (°)
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Earth Elevation (°)
            </span>
          </div>
        </div>

        <div className="h-[290px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              onClick={(state) => {
                if (state && typeof state.activeTooltipIndex === 'number') {
                  onSelectIndex(state.activeTooltipIndex);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="hours"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(v) => `T+${v}h`}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                unit="°"
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
                labelFormatter={(label, payload) => {
                  const row = payload?.[0]?.payload;
                  return row ? `T+${label}h (${row.timestampShort} UTC)` : `T+${label}h`;
                }}
              />
              <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: '0° Horizon', fill: '#f43f5e', fontSize: 10 }} />
              <ReferenceLine
                x={currentPoint.hoursFromStart}
                stroke="#e2e8f0"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="sunElev"
                name="Sun Elevation (°)"
                stroke="#facc15"
                fill="#facc15"
                fillOpacity={0.12}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="earthElev"
                name="Earth Elevation (°)"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Split: Configurable Solar Array Model & Horizon Event Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Solar Power Model Configuration */}
        <div className="lg:col-span-6 bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Solar Power Array Assumptions
            </h3>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={panelConfig.enabled}
                onChange={(e) =>
                  onUpdatePanelConfig({ ...panelConfig, enabled: e.target.checked })
                }
                className="accent-emerald-400"
              />
              Enable Wattage Estimate
            </label>
          </div>

          <p className="text-xs text-slate-400">
            At the lunar south pole, Sun elevation stays near the horizon (0°–7°). Vertical mast-mounted solar arrays capture grazing rays (<span className="font-mono-tech text-slate-200">cos θ</span>), whereas flat deck arrays suffer severe cosine loss (<span className="font-mono-tech text-slate-200">sin θ</span>).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Rated Array Capacity (W)</label>
              <input
                type="number"
                min={100}
                max={50000}
                step={100}
                disabled={!panelConfig.enabled}
                value={panelConfig.ratedPowerWatts}
                onChange={(e) =>
                  onUpdatePanelConfig({
                    ...panelConfig,
                    ratedPowerWatts: Math.max(100, Number(e.target.value) || 1000),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono-tech disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Cell Efficiency (%)</label>
              <input
                type="number"
                min={10}
                max={45}
                step={1}
                disabled={!panelConfig.enabled}
                value={panelConfig.efficiencyPercent}
                onChange={(e) =>
                  onUpdatePanelConfig({
                    ...panelConfig,
                    efficiencyPercent: Math.max(10, Math.min(45, Number(e.target.value) || 28)),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono-tech disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Panel Orientation</label>
              <select
                disabled={!panelConfig.enabled}
                value={panelConfig.trackingMode}
                onChange={(e) =>
                  onUpdatePanelConfig({
                    ...panelConfig,
                    trackingMode: e.target.value as SolarPanelConfig['trackingMode'],
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono-tech disabled:opacity-50"
              >
                <option value="VERTICAL_TRACKING">Vertical Mast (cos EL)</option>
                <option value="FIXED_HORIZONTAL">Horizontal Deck (sin EL)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sunrise/Sunset & Earthrise/Earthset Event Table */}
        <div className="lg:col-span-6 bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 border-b border-slate-800 pb-2.5">
            Computed Horizon Crossing Events ({analysis.events.length})
          </h3>

          {analysis.events.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center flex flex-col items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>
                No sunrise, sunset, Earthrise, or Earthset horizon crossings occur during this {analysis.windowHours}h mission window.
              </span>
            </div>
          ) : (
            <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
              {analysis.events.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs font-mono-tech bg-slate-900/70 border border-slate-800 rounded px-3 py-1.5"
                >
                  <span
                    className={`font-semibold flex items-center gap-1.5 ${
                      ev.type.includes('SET') ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {ev.type.includes('SET') ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {ev.type}
                  </span>
                  <span className="text-slate-300">
                    {ev.timestampIso.slice(0, 16).replace('T', ' ')} UTC
                  </span>
                  <span className="text-cyan-400">T+{ev.hoursFromStart.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};