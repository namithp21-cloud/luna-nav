import React, { useState } from 'react';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  PlusCircle,
  CheckCircle2,
  Info,
  Layers,
} from 'lucide-react';
import type { CandidateSite } from '../types/lunar';

interface SiteExplorerProps {
  sites: CandidateSite[];
  selectedSite: CandidateSite;
  comparisonSite: CandidateSite;
  onSelectPrimarySite: (site: CandidateSite) => void;
  onSelectComparisonSite: (site: CandidateSite) => void;
  onAddCustomSite: (site: CandidateSite) => void;
}

export const SiteExplorer: React.FC<SiteExplorerProps> = ({
  sites,
  selectedSite,
  comparisonSite,
  onSelectPrimarySite,
  onSelectComparisonSite,
  onAddCustomSite,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showTrekOverlay, setShowTrekOverlay] = useState<boolean>(true);

  // Custom site form state
  const [customName, setCustomName] = useState<string>('Custom Polar Target');
  const [customLat, setCustomLat] = useState<string>('-88.90');
  const [customLon, setCustomLon] = useState<string>('125.00');
  const [customElev, setCustomElev] = useState<string>('1.80');

  /**
   * Convert selenographic South Pole (Lat -84° to -90°, Lon -180° to +180°)
   * into 2D South Polar Stereographic SVG coordinates centered at (220, 220).
   * 0° Longitude (Sub-Earth Mean Direction) points UP (North on map = 0° Mean Earth).
   */
  const latLonToPolarXY = (latDeg: number, lonDeg: number) => {
    const clampedLat = Math.max(-90, Math.min(-83.5, latDeg));
    const colatDeg = 90 + clampedLat; // 0 at -90°S pole, 6 at -84°S
    const maxRadius = 180;
    const r = (colatDeg / 6.5) * maxRadius;
    const rad = ((lonDeg - 90) * Math.PI) / 180;
    return {
      x: 220 + r * Math.cos(rad),
      y: 220 + r * Math.sin(rad),
    };
  };

  const handleCreateCustomSite = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = Math.max(-90, Math.min(-60, parseFloat(customLat) || -89.0));
    const lon = Math.max(-180, Math.min(180, parseFloat(customLon) || 0.0));
    const elev = Math.max(-5, Math.min(10, parseFloat(customElev) || 1.5));

    const newSite: CandidateSite = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || `Custom Site (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
      regionTag: 'User-Defined Selenographic Coordinate',
      latitude: lat,
      longitude: lon,
      elevationKm: elev,
      provenance:
        'User-entered selenographic coordinate (IAU MOON_ME reference sphere, 1737.4 km datum).',
      scientificContext:
        'Custom exploratory landing coordinate configured for preliminary solar illumination and Direct-to-Earth visibility trade studies.',
      terrainNotes:
        'Geometric horizon baseline applied; local DEM terrain obstruction requires LOLA topographic horizon profile.',
      isCustom: true,
    };

    onAddCustomSite(newSite);
    onSelectPrimarySite(newSite);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left Interactive South Pole Stereographic Map */}
      <div className="lg:col-span-7 bg-[#0b1220] border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Lunar South Pole Stereographic Navigator (84°S – 90°S)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              IAU Mean Earth/Polar Axis (MOON_ME) frame • 0° Longitude points toward Earth
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowTrekOverlay(!showTrekOverlay)}
              className={`px-2.5 py-1 rounded text-xs font-mono-tech flex items-center gap-1 border cursor-pointer ${
                showTrekOverlay
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              title="Toggle NASA Moon Trek LOLA Shaded Relief Layer"
            >
              <Layers className="w-3.5 h-3.5" /> LOLA DEM Relief
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2.6, Number((z + 0.3).toFixed(2))))}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.3).toFixed(2))))}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              title="Reset Map View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Interactive SVG Polar Map Viewport */}
        <div className="relative my-3 rounded-lg overflow-hidden border border-slate-800 bg-[#050811] flex items-center justify-center h-[420px]">
          <svg
            width="440"
            height="440"
            viewBox="0 0 440 440"
            className="select-none"
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transition: 'transform 0.18s ease-out',
            }}
          >
            <defs>
              <radialGradient id="polarRelief" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#0f172a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#050811" stopOpacity="1" />
              </radialGradient>
            </defs>

            {/* Base Polar Albedo / LOLA Topographic Shading */}
            <circle cx="220" cy="220" r="190" fill="url(#polarRelief)" stroke="#1e293b" strokeWidth="1.5" />

            {/* Representative South Pole Permanently Shadowed Regions (PSRs) & Craters */}
            {showTrekOverlay && (
              <g opacity="0.65">
                {/* Shackleton Crater PSR near Pole */}
                <circle cx="223" cy="225" r="12" fill="#020617" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 1" />
                {/* Shoemaker Crater */}
                <circle cx="255" cy="252" r="24" fill="#030712" stroke="#334155" strokeWidth="1" />
                {/* Faustini Crater */}
                <circle cx="282" cy="232" r="19" fill="#030712" stroke="#334155" strokeWidth="1" />
                {/* Haworth Crater */}
                <circle cx="212" cy="168" r="22" fill="#030712" stroke="#334155" strokeWidth="1" />
                {/* de Gerlache Crater */}
                <circle cx="178" cy="222" r="17" fill="#030712" stroke="#334155" strokeWidth="1" />
              </g>
            )}

            {/* Latitude Rings: 88°S, 86°S, 84°S */}
            {[2, 4, 6].map((degFromPole) => {
              const r = (degFromPole / 6.5) * 180;
              return (
                <g key={degFromPole}>
                  <circle
                    cx="220"
                    cy="220"
                    r={r}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="224"
                    y={220 - r + 10}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    -{90 - degFromPole}°S
                  </text>
                </g>
              );
            })}

            {/* Longitude Spokes */}
            <line x1="220" y1="25" x2="220" y2="415" stroke="#1e293b" strokeWidth="1" />
            <line x1="25" y1="220" x2="415" y2="220" stroke="#1e293b" strokeWidth="1" />
            <text x="220" y="18" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
              0° LON (MEAN EARTH DIRECTION)
            </text>
            <text x="220" y="432" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
              180° LON (FAR SIDE)
            </text>
            <text x="425" y="223" textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">
              90°E
            </text>
            <text x="15" y="223" textAnchor="start" fill="#64748b" fontSize="10" fontFamily="monospace">
              90°W
            </text>

            {/* Exact 90°S South Pole Crosshair */}
            <circle cx="220" cy="220" r="3" fill="#f8fafc" />

            {/* Candidate Site Markers */}
            {sites.map((site) => {
              const pos = latLonToPolarXY(site.latitude, site.longitude);
              const isPrimary = site.id === selectedSite.id;
              const isSecondary = site.id === comparisonSite.id;

              return (
                <g
                  key={site.id}
                  onClick={() => onSelectPrimarySite(site)}
                  className="cursor-pointer"
                >
                  {isPrimary && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="13"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  )}
                  {isSecondary && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="10"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isPrimary ? '6' : '5'}
                    fill={isPrimary ? '#38bdf8' : isSecondary ? '#a855f7' : '#facc15'}
                    stroke="#050811"
                    strokeWidth="1.5"
                  />
                  <text
                    x={pos.x + 9}
                    y={pos.y + 3}
                    fill={isPrimary ? '#38bdf8' : '#e2e8f0'}
                    fontSize="10"
                    fontWeight={isPrimary ? 'bold' : 'normal'}
                  >
                    {site.name.replace(' Region', '')}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Pan Nudge Controls */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-slate-950/85 border border-slate-800 px-2.5 py-1 rounded text-[11px] text-slate-400 font-mono-tech">
            <span>Click any marker to set Primary Site</span>
            <span className="text-cyan-400 ml-2">● Alpha</span>
            <span className="text-purple-400 ml-1">● Beta</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
          <span>
            Reference: NASA Moon Trek South Pole WMTS (`LRO_LOLA_ClrShade_SPole85_10mp`) & NASA GSFC PGDA LOLA DEM
          </span>
          <span className="font-mono-tech text-cyan-400">Zoom: {zoom.toFixed(1)}x</span>
        </div>
      </div>

      {/* Right Column: Candidate Region Cards + Custom Coordinate Input */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Curated Lunar South Pole Candidate Regions
          </h3>
          <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/30 rounded p-2">
            Note: These are candidate reference regions derived from NASA LRO LOLA studies, not certified flight target coordinates.
          </p>

          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {sites.map((site) => {
              const isPrimary = site.id === selectedSite.id;
              const isComparison = site.id === comparisonSite.id;
              return (
                <div
                  key={site.id}
                  className={`p-3 rounded-lg border transition ${
                    isPrimary
                      ? 'bg-cyan-950/30 border-cyan-500/60'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                        {site.name}
                        {isPrimary && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono-tech">
                            ALPHA
                          </span>
                        )}
                        {isComparison && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono-tech">
                            BETA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-cyan-400 font-mono-tech mt-0.5">
                        Lat: {site.latitude.toFixed(4)}° | Lon: {site.longitude.toFixed(2)}° | Elev: +{site.elevationKm.toFixed(2)} km
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {site.scientificContext}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{site.provenance}</span>
                  </p>

                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => onSelectPrimarySite(site)}
                      className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-pointer ${
                        isPrimary
                          ? 'bg-cyan-500 text-slate-950 font-semibold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isPrimary ? 'Active Primary (Alpha)' : 'Set as Primary (Alpha)'}
                    </button>
                    <button
                      onClick={() => onSelectComparisonSite(site)}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                        isComparison
                          ? 'bg-purple-500 text-white font-semibold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isComparison ? 'Active Comparison (Beta)' : 'Set as Comparison (Beta)'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Coordinate Entry Form */}
        <form
          onSubmit={handleCreateCustomSite}
          className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-3"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4" /> Custom Selenographic Coordinates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="sm:col-span-3">
              <label className="block text-slate-400 mb-1">Site Label</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono-tech"
                placeholder="e.g. Shackleton West Ridge"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Latitude (°N, -90 to -60)</label>
              <input
                type="number"
                step="0.01"
                min="-90"
                max="-60"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono-tech"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Longitude (°E, -180 to 180)</label>
              <input
                type="number"
                step="0.01"
                min="-180"
                max="180"
                value={customLon}
                onChange={(e) => setCustomLon(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono-tech"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Elevation (km vs datum)</label>
              <input
                type="number"
                step="0.1"
                min="-5"
                max="10"
                value={customElev}
                onChange={(e) => setCustomElev(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono-tech"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs cursor-pointer"
          >
            Plot & Analyze Custom Lunar Coordinate
          </button>
        </form>
      </div>
    </div>
  );
};