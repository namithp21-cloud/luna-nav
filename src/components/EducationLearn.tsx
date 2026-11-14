import React from 'react';
import {
  BookOpen,
  Sun,
  Globe,
  Mountain,
  Calendar,
  Database,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import type { MissionScenario, ScenarioAnalysis } from '../types/lunar';

interface EducationLearnProps {
  scenario: MissionScenario;
  analysis: ScenarioAnalysis;
}

export const EducationLearn: React.FC<EducationLearnProps> = ({ scenario, analysis }) => {
  const m = analysis.metrics;

  return (
    <div className="space-y-4">
      {/* Live Student Telemetry Translator Banner */}
      <div className="bg-[#0b1220] border border-cyan-500/40 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Compass className="w-4 h-4" /> Plain-English Live Telemetry Guide ({scenario.site.name})
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          Right now at <span className="text-white font-semibold">{scenario.site.name}</span> (
          <span className="font-mono-tech text-cyan-300">{scenario.site.latitude.toFixed(2)}°S</span>), the Sun is at an angle of{' '}
          <span className="font-mono-tech text-amber-300">{m.currentSunElevDeg.toFixed(2)}°</span> relative to the flat horizon.{' '}
          {m.isCurrentlyIlluminated
            ? 'Because this angle is above 0°, the solar panels are in daylight, casting long sideways shadows across the lunar dust.'
            : 'Because this angle is below 0°, the Sun is hidden below the horizon and the lander must rely on batteries and heaters.'}{' '}
          Meanwhile, Earth is at{' '}
          <span className="font-mono-tech text-cyan-300">{m.currentEarthElevDeg.toFixed(2)}°</span>{' '}
          elevation—meaning{' '}
          {m.isCurrentlyEarthVisible
            ? 'antennas on the lander have a direct line-of-sight to mission control on Earth.'
            : 'Earth has dipped below the lunar horizon, requiring a lunar relay orbiter to talk to Earth.'}
        </p>
      </div>

      {/* 5 Core Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" /> 1. Why the Sun Stays Close to the Horizon
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Earth is tilted on its axis by <span className="text-white font-semibold">23.4°</span>, giving us warm summers and cold winters. The Moon’s axis is tilted by only{' '}
            <span className="text-amber-300 font-semibold">1.54°</span> relative to the ecliptic plane. At the Lunar South Pole (90°S), the Sun never rises high overhead—it skims horizontally around the horizon like a lighthouse beam, peaking between <span className="font-mono-tech">~1.5° and 7°</span> above the horizon depending on local latitude.
          </p>
        </div>

        <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Mountain className="w-4 h-4 text-purple-400" /> 2. Why Craters Create Extreme Lighting
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Because sunlight arrives at such a shallow grazing angle, even a small ridge casts a shadow kilometers long. Deep impact basins like <span className="text-white font-semibold">Shackleton</span> and <span className="text-white font-semibold">Shoemaker</span> have interiors that never see sunlight—creating <span className="text-cyan-300">Permanently Shadowed Regions (PSRs)</span> colder than -200°C that trap ancient water ice, while their elevated rims just a few kilometers away receive sunlight for over 70%–85% of the lunar year.
          </p>
        </div>

        <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" /> 3. Why Earth Visibility Matters (Libration)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Although the Moon is tidally locked to Earth, its orbit is slightly elliptical and tilted by <span className="text-white font-semibold">6.68°</span>. From a landing site near the South Pole, Earth does not sit still—it nods up and down in a <span className="text-cyan-300">27.2-day draconic cycle</span> called optical libration. For roughly half the month, Earth drops below the polar horizon, cutting off Direct-to-Earth (DTE) radio links unless the site sits at a lower latitude (like Malapert Massif at 86°S) or uses a relay satellite.
          </p>
        </div>

        <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" /> 4. Why Changing Landing Dates Changes Everything
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Shifting a mission launch by just <span className="text-white font-semibold">7 to 14 days</span> can flip a landing site from 100% continuous daylight into a freezing multi-day eclipse, or shift Earth from +6° above the horizon to -6° below the horizon. Mission planners use tools like <span className="text-cyan-400 font-semibold">LUNA NAV</span> to align the 29.5-day solar cycle with the 27.2-day Earth libration cycle so astronauts and rovers have both power and communication simultaneously.
          </p>
        </div>
      </div>

      {/* Scientific Data Provenance, Assumptions & Limitations */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2.5">
          <Database className="w-4 h-4" /> Scientific Data Sources, Ephemeris Standards & Limitations
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-1.5">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> 1. JPL Horizons Ephemeris API
            </div>
            <p className="text-slate-400 leading-relaxed">
              Official endpoint: <code className="text-cyan-300">https://ssd.jpl.nasa.gov/api/horizons.api</code>. Configured for a lunar surface topocentric observer (<code className="text-slate-200">CENTER='coord@301'</code>, <code className="text-slate-200">COORD_TYPE='GEODETIC'</code>, <code className="text-slate-200">QUANTITIES='4'</code>). Uses <code className="text-amber-300">APPARENT='AIRLESS'</code> so Earth atmospheric refraction is strictly excluded.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-1.5">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-purple-400" /> 2. LOLA & NASA Moon Trek Reference
            </div>
            <p className="text-slate-400 leading-relaxed">
              Candidate site coordinates reference the IAU Mean Earth/Polar Axis (<code className="text-slate-200">MOON_ME</code>) frame with a 1737.4 km spherical datum, sourced from NASA GSFC Planetary Geodynamics Data Archive (LRO LOLA 5 m/px South Pole DEMs, Mazarico et al.) and NASA Moon Trek WMTS (<code className="text-cyan-300">trek.nasa.gov/moon</code>).
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-1.5">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 3. Horizon Baseline & Limitations
            </div>
            <p className="text-slate-400 leading-relaxed">
              Visibility intervals are evaluated against the <span className="text-white">0° airless geometric horizon</span> of the lunar reference sphere at the site’s elevation. Distant crater-rim terrain masking requires full 360° LOLA DEM ray-tracing. When offline or blocked by browser CORS, LUNA NAV clearly badges its analytical selenographic fallback model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};