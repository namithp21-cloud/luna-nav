import { useEffect, useState } from 'react';
import {
  Compass,
  MapPin,
  Sun,
  Globe,
  GitCompare,
  BarChart3,
  BookOpen,
  Download,
  RefreshCw,
  BookmarkPlus,
  Printer,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Database,
} from 'lucide-react';
import type {
  AssessmentWeights,
  CandidateSite,
  MissionScenario,
  ScenarioAnalysis,
  SolarPanelConfig,
} from './types/lunar';
import {
  CANDIDATE_SITES,
  DEFAULT_ASSESSMENT_WEIGHTS,
  DEFAULT_COMPARISON_SCENARIO,
  DEFAULT_PANEL_CONFIG,
  DEFAULT_PRIMARY_SCENARIO,
} from './data/candidateSites';
import { fetchScenarioAnalysis } from './services/ephemerisService';
import { evaluateScenario, exportScenarioToCsv } from './services/assessmentService';
import { HorizonVisualizer } from './components/HorizonVisualizer';
import { SiteExplorer } from './components/SiteExplorer';
import { TimelinePowerAnalysis } from './components/TimelinePowerAnalysis';
import { ScenarioComparison } from './components/ScenarioComparison';
import { EducationLearn } from './components/EducationLearn';

type NavTab =
  | 'OVERVIEW'
  | 'EXPLORER'
  | 'HORIZON'
  | 'ANALYSIS'
  | 'COMPARISON'
  | 'LEARN';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('OVERVIEW');
  const [sites, setSites] = useState<CandidateSite[]>(CANDIDATE_SITES);

  const [primaryScenario, setPrimaryScenario] = useState<MissionScenario>(
    DEFAULT_PRIMARY_SCENARIO
  );
  const [comparisonScenario, setComparisonScenario] = useState<MissionScenario>(
    DEFAULT_COMPARISON_SCENARIO
  );

  const [primaryAnalysis, setPrimaryAnalysis] = useState<ScenarioAnalysis | null>(null);
  const [comparisonAnalysis, setComparisonAnalysis] = useState<ScenarioAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number>(0);

  const [panelConfig, setPanelConfig] = useState<SolarPanelConfig>(DEFAULT_PANEL_CONFIG);
  const [weights, setWeights] = useState<AssessmentWeights>(DEFAULT_ASSESSMENT_WEIGHTS);
  const [savedScenarios, setSavedScenarios] = useState<MissionScenario[]>([
    DEFAULT_PRIMARY_SCENARIO,
    DEFAULT_COMPARISON_SCENARIO,
  ]);

  // Fetch or compute ephemeris for PrimaryScenario
  const loadPrimary = async (forceRefresh = false) => {
    setIsLoading(true);
    const result = await fetchScenarioAnalysis(primaryScenario, 60, forceRefresh);
    setPrimaryAnalysis(result);
    setSelectedTimeIndex(0);
    setIsLoading(false);
  };

  // Fetch or compute ephemeris for ComparisonScenario
  const loadComparison = async (forceRefresh = false) => {
    const result = await fetchScenarioAnalysis(comparisonScenario, 60, forceRefresh);
    setComparisonAnalysis(result);
  };

  useEffect(() => {
    loadPrimary(false);
  }, [
    primaryScenario.site.id,
    primaryScenario.site.latitude,
    primaryScenario.site.longitude,
    primaryScenario.startDateIso,
    primaryScenario.durationDays,
  ]);

  useEffect(() => {
    loadComparison(false);
  }, [
    comparisonScenario.site.id,
    comparisonScenario.site.latitude,
    comparisonScenario.site.longitude,
    comparisonScenario.startDateIso,
    comparisonScenario.durationDays,
  ]);

  const handleSaveCurrentScenario = () => {
    const label = `${primaryScenario.site.name.replace(' Region', '')} (${primaryScenario.startDateIso.slice(0, 10)})`;
    const newSaved: MissionScenario = {
      ...primaryScenario,
      id: `saved-${Date.now()}`,
      name: label,
    };
    setSavedScenarios((prev) => [newSaved, ...prev.slice(0, 7)]);
  };

  if (!primaryAnalysis || !comparisonAnalysis) {
    return (
      <div className="min-h-screen bg-[#070b12] text-slate-200 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-mono-tech uppercase tracking-widest text-cyan-400">
          LUNA NAV • Initializing Lunar Ephemeris Engine...
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Querying NASA JPL Horizons / Selenographic Topocentric Solver
        </p>
      </div>
    );
  }

  const currentPoint =
    primaryAnalysis.points[selectedTimeIndex] || primaryAnalysis.points[0];
  const assessment = evaluateScenario(primaryAnalysis, weights);

  const sourceBadgeColor =
    primaryAnalysis.sourceMode === 'LIVE_HORIZONS'
      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
      : primaryAnalysis.sourceMode === 'CACHED_HORIZONS'
      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
      : 'bg-amber-500/15 border-amber-500/40 text-amber-300';

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-200 telemetry-grid flex flex-col">
      {/* Top Aerospace Telemetry Header */}
      <header className="sticky top-0 z-30 bg-[#070b12]/95 backdrop-blur border-b border-slate-800 px-4 lg:px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono-tech">
              LN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-wider text-white">
                  LUNA NAV
                </h1>
                <span className="text-[10px] font-mono-tech uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  Lunar South Pole Decision Support
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                One interface. Multiple landing scenarios. Smarter lunar mission decisions.
              </p>
            </div>
          </div>

          {/* Ephemeris Provenance Badge & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div
              className={`px-2.5 py-1 rounded border font-mono-tech flex items-center gap-1.5 ${sourceBadgeColor}`}
              title={primaryAnalysis.sourceDetails}
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {primaryAnalysis.sourceMode === 'LIVE_HORIZONS'
                  ? 'LIVE JPL HORIZONS API'
                  : primaryAnalysis.sourceMode === 'CACHED_HORIZONS'
                  ? 'CACHED JPL HORIZONS'
                  : 'SIMULATED ANALYTICAL MODEL'}
              </span>
            </div>

            <button
              onClick={() => loadPrimary(true)}
              className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
              title="Force Refresh Ephemeris Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button
              onClick={handleSaveCurrentScenario}
              className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Save Scenario</span>
            </button>

            <button
              onClick={() =>
                exportScenarioToCsv(primaryAnalysis, primaryScenario.site.name)
              }
              className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
              title="Print / Save PDF Mission Dossier"
            >
              <Printer className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">PDF Report</span>
            </button>
          </div>
        </div>

        {/* Navigation Bar + Active Scenario Parameter Bar */}
        <div className="max-w-[1440px] mx-auto mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-1">
            {[
              { id: 'OVERVIEW', label: 'Mission Overview', icon: Compass },
              { id: 'EXPLORER', label: 'Site Explorer', icon: MapPin },
              { id: 'HORIZON', label: 'Horizon Simulator', icon: Sun },
              { id: 'ANALYSIS', label: 'Mission Analysis', icon: BarChart3 },
              { id: 'COMPARISON', label: 'Scenario Comparison', icon: GitCompare },
              { id: 'LEARN', label: 'Learn', icon: BookOpen },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavTab)}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Global Mission Site & Date Selector */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={primaryScenario.site.id}
              onChange={(e) => {
                const found = sites.find((s) => s.id === e.target.value);
                if (found) setPrimaryScenario({ ...primaryScenario, site: found });
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-medium"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  Alpha: {s.name} ({s.latitude.toFixed(2)}°)
                </option>
              ))}
            </select>

            <input
              type="date"
              value={primaryScenario.startDateIso.slice(0, 10)}
              onChange={(e) => {
                if (e.target.value) {
                  setPrimaryScenario({
                    ...primaryScenario,
                    startDateIso: `${e.target.value}T00:00:00Z`,
                  });
                }
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono-tech"
            />

            <select
              value={primaryScenario.durationDays}
              onChange={(e) =>
                setPrimaryScenario({
                  ...primaryScenario,
                  durationDays: Number(e.target.value),
                })
              }
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono-tech"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days (1/2 Lunation)</option>
              <option value={30}>30 Days (Full Lunation)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-6 py-5 space-y-5">
        {/* KPI Telemetry Strip (Always visible for immediate situational awareness) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase">Landing Region</div>
            <div className="text-sm font-bold text-white truncate mt-0.5">
              {primaryScenario.site.name.replace(' Region', '')}
            </div>
            <div className="text-[11px] text-cyan-400 font-mono-tech mt-0.5">
              {primaryScenario.site.latitude.toFixed(3)}°N, {primaryScenario.site.longitude.toFixed(2)}°E
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase flex items-center justify-between">
              <span>Current Sun El</span>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono-tech mt-0.5">
              {currentPoint.sunElevationDeg.toFixed(2)}°
            </div>
            <div
              className={`text-[11px] font-mono-tech mt-0.5 ${
                currentPoint.isSunVisible ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currentPoint.isSunVisible ? '● ILLUMINATED' : '● ECLIPSE / NIGHT'}
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase flex items-center justify-between">
              <span>Current Earth El</span>
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono-tech mt-0.5">
              {currentPoint.earthElevationDeg.toFixed(2)}°
            </div>
            <div
              className={`text-[11px] font-mono-tech mt-0.5 ${
                currentPoint.isEarthVisible ? 'text-cyan-400' : 'text-rose-400'
              }`}
            >
              {currentPoint.isEarthVisible ? '● DTE COMM OPEN' : '● EARTH OCCLUDED'}
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase">Window Sunlight</div>
            <div className="text-lg font-bold text-amber-300 font-mono-tech mt-0.5">
              {primaryAnalysis.metrics.sunlightPercentage}%
            </div>
            <div className="text-[11px] text-slate-400 font-mono-tech mt-0.5">
              {primaryAnalysis.metrics.sunlightDurationHours}h / {primaryAnalysis.windowHours}h
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase flex items-center justify-between">
              <span>Earth Comm Window</span>
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-cyan-300 font-mono-tech mt-0.5">
              {primaryAnalysis.metrics.earthVisiblePercentage}%
            </div>
            <div className="text-[11px] text-slate-400 font-mono-tech mt-0.5">
              Max Cont: {primaryAnalysis.metrics.longestContinuousEarthHours}h
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400 uppercase">Mission Readiness</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-white font-mono-tech">
                {assessment.scorePercent}/100
              </span>
              <span
                className={`text-[10px] font-mono-tech px-1.5 py-0.5 rounded ${
                  assessment.suitability === 'EXCELLENT'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : assessment.suitability === 'MARGINAL'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {assessment.suitability}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('COMPARISON')}
              className="text-[11px] text-cyan-400 hover:underline mt-0.5 cursor-pointer"
            >
              Compare vs Beta →
            </button>
          </div>
        </section>

        {/* TAB 1: MISSION OVERVIEW (Integrated Command View) */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-5">
            <HorizonVisualizer
              analysis={primaryAnalysis}
              selectedIndex={selectedTimeIndex}
              onSelectIndex={setSelectedTimeIndex}
              siteName={primaryScenario.site.name}
            />

            <TimelinePowerAnalysis
              analysis={primaryAnalysis}
              panelConfig={panelConfig}
              onUpdatePanelConfig={setPanelConfig}
              selectedIndex={selectedTimeIndex}
              onSelectIndex={setSelectedTimeIndex}
            />

            {/* Mission Assessment & Saved Scenarios Quick Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Automated Operational Assessment ({primaryScenario.site.name})
                  </h3>
                  <span className="text-xs font-mono-tech text-slate-400">
                    Score: {assessment.scorePercent}% ({assessment.suitability})
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {assessment.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                  {assessment.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Saved Mission Scenarios ({savedScenarios.length})
                  </h3>
                  <button
                    onClick={() => setActiveTab('COMPARISON')}
                    className="text-xs text-cyan-400 hover:underline cursor-pointer"
                  >
                    Open Comparison Matrix →
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[130px] overflow-y-auto">
                  {savedScenarios.map((sc) => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between text-xs bg-slate-900/70 border border-slate-800 rounded px-2.5 py-1.5"
                    >
                      <div>
                        <span className="font-medium text-slate-200">{sc.name}</span>
                        <span className="text-slate-400 font-mono-tech ml-2">
                          {sc.startDateIso.slice(0, 10)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPrimaryScenario(sc)}
                          className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono-tech cursor-pointer"
                        >
                          Load Alpha
                        </button>
                        <button
                          onClick={() => setComparisonScenario(sc)}
                          className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono-tech cursor-pointer"
                        >
                          Load Beta
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SITE EXPLORER */}
        {activeTab === 'EXPLORER' && (
          <SiteExplorer
            sites={sites}
            selectedSite={primaryScenario.site}
            comparisonSite={comparisonScenario.site}
            onSelectPrimarySite={(site) =>
              setPrimaryScenario({ ...primaryScenario, site })
            }
            onSelectComparisonSite={(site) =>
              setComparisonScenario({ ...comparisonScenario, site })
            }
            onAddCustomSite={(newSite) => setSites((prev) => [newSite, ...prev])}
          />
        )}

        {/* TAB 3: HORIZON SIMULATOR */}
        {activeTab === 'HORIZON' && (
          <HorizonVisualizer
            analysis={primaryAnalysis}
            selectedIndex={selectedTimeIndex}
            onSelectIndex={setSelectedTimeIndex}
            siteName={primaryScenario.site.name}
          />
        )}

        {/* TAB 4: MISSION ANALYSIS (TIMELINE, POWER & COMM) */}
        {activeTab === 'ANALYSIS' && (
          <TimelinePowerAnalysis
            analysis={primaryAnalysis}
            panelConfig={panelConfig}
            onUpdatePanelConfig={setPanelConfig}
            selectedIndex={selectedTimeIndex}
            onSelectIndex={setSelectedTimeIndex}
          />
        )}

        {/* TAB 5: SCENARIO COMPARISON */}
        {activeTab === 'COMPARISON' && (
          <ScenarioComparison
            primaryScenario={primaryScenario}
            comparisonScenario={comparisonScenario}
            primaryAnalysis={primaryAnalysis}
            comparisonAnalysis={comparisonAnalysis}
            sites={sites}
            weights={weights}
            onUpdatePrimaryScenario={setPrimaryScenario}
            onUpdateComparisonScenario={setComparisonScenario}
            onUpdateWeights={setWeights}
          />
        )}

        {/* TAB 6: EDUCATION & SCIENTIFIC PROVENANCE */}
        {activeTab === 'LEARN' && (
          <EducationLearn scenario={primaryScenario} analysis={primaryAnalysis} />
        )}
      </main>

      {/* Footer with Data Transparency, Timestamps, and Units */}
      <footer className="border-t border-slate-800/80 bg-[#050811] px-4 lg:px-6 py-3 text-[11px] text-slate-400">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-slate-200 font-semibold">LUNA NAV</span> • Source:{' '}
            <span className="font-mono-tech text-cyan-300">
              {primaryAnalysis.sourceDetails}
            </span>
          </div>
          <div className="font-mono-tech">
            Units: Deg (°), km, UTC • Frame: IAU MOON_ME (Airless) • Fetched:{' '}
            {primaryAnalysis.fetchedAtIso.slice(0, 19).replace('T', ' ')}Z
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;