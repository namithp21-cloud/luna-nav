import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, Sun, Globe, Compass, Eye } from 'lucide-react';
import type { EphemerisPoint, ScenarioAnalysis } from '../types/lunar';

interface HorizonVisualizerProps {
  analysis: ScenarioAnalysis;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  siteName: string;
}

export const HorizonVisualizer: React.FC<HorizonVisualizerProps> = ({
  analysis,
  selectedIndex,
  onSelectIndex,
  siteName,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [cameraYaw, setCameraYaw] = useState<number>(0.6);
  const [cameraPitch, setCameraPitch] = useState<number>(0.45);

  const sunGroupRef = useRef<THREE.Group | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const points = analysis.points;
  const currentPoint: EphemerisPoint = points[selectedIndex] || points[0];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      onSelectIndex((selectedIndex + playbackSpeed) % points.length);
    }, 120);
    return () => window.clearInterval(interval);
  }, [isPlaying, playbackSpeed, selectedIndex, points.length, onSelectIndex]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050811);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const r = 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.48;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.7 });
    scene.add(new THREE.Points(starGeo, starMat));

    const groundGeo = new THREE.CircleGeometry(40, 64);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.92,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    scene.add(groundMesh);

    const horizonGeo = new THREE.RingGeometry(39.6, 40.0, 96);
    horizonGeo.rotateX(-Math.PI / 2);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const horizonRing = new THREE.Mesh(horizonGeo, horizonMat);
    horizonRing.position.y = 0.05;
    scene.add(horizonRing);

    const domeGeo = new THREE.SphereGeometry(40, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    scene.add(new THREE.Mesh(domeGeo, domeMat));

    const landerGeo = new THREE.ConeGeometry(0.9, 2.2, 6);
    const landerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5, roughness: 0.3 });
    const landerMesh = new THREE.Mesh(landerGeo, landerMat);
    landerMesh.position.y = 1.1;
    scene.add(landerMesh);

    const ambient = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
    sunLightRef.current = sunLight;
    scene.add(sunLight);

    const sunGroup = new THREE.Group();
    const sunSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    sunGroup.add(sunSphere);
    sunGroupRef.current = sunGroup;
    scene.add(sunGroup);

    const earthGroup = new THREE.Group();
    const earthSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    earthGroup.add(earthSphere);
    earthGroupRef.current = earthGroup;
    scene.add(earthGroup);

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const dist = 62;
    camera.position.x = dist * Math.cos(cameraPitch) * Math.sin(cameraYaw);
    camera.position.y = dist * Math.sin(cameraPitch);
    camera.position.z = dist * Math.cos(cameraPitch) * Math.cos(cameraYaw);
    camera.lookAt(0, 4, 0);
  }, [cameraYaw, cameraPitch]);

  useEffect(() => {
    if (!currentPoint) return;
    const R = 38;
    const deg2rad = Math.PI / 180;

    const sunEl = currentPoint.sunElevationDeg * deg2rad;
    const sunAz = currentPoint.sunAzimuthDeg * deg2rad;
    const sunX = R * Math.cos(sunEl) * Math.sin(sunAz);
    const sunY = R * Math.sin(sunEl);
    const sunZ = -R * Math.cos(sunEl) * Math.cos(sunAz);

    if (sunGroupRef.current) {
      sunGroupRef.current.position.set(sunX, sunY, sunZ);
    }
    if (sunLightRef.current) {
      sunLightRef.current.position.set(sunX, Math.max(0.5, sunY), sunZ);
      sunLightRef.current.intensity = currentPoint.isSunVisible ? 2.5 : 0.15;
    }

    const earthEl = currentPoint.earthElevationDeg * deg2rad;
    const earthAz = currentPoint.earthAzimuthDeg * deg2rad;
    const earthX = R * Math.cos(earthEl) * Math.sin(earthAz);
    const earthY = R * Math.sin(earthEl);
    const earthZ = -R * Math.cos(earthEl) * Math.cos(earthAz);

    if (earthGroupRef.current) {
      earthGroupRef.current.position.set(earthX, earthY, earthZ);
    }
  }, [currentPoint]);

  const toPolarSvg = (azDeg: number, elDeg: number) => {
    const clampedEl = Math.max(-15, Math.min(90, elDeg));
    const r = clampedEl >= 0 ? 78 * (1 - clampedEl / 90) : 78 + (-clampedEl / 15) * 17;
    const rad = ((azDeg - 90) * Math.PI) / 180;
    return {
      x: 110 + r * Math.cos(rad),
      y: 110 + r * Math.sin(rad),
    };
  };

  const sunPolar = toPolarSvg(currentPoint.sunAzimuthDeg, currentPoint.sunElevationDeg);
  const earthPolar = toPolarSvg(currentPoint.earthAzimuthDeg, currentPoint.earthElevationDeg);

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Compass className="w-4 h-4" /> Local Horizon & Sky Dome Simulator • {siteName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {analysis.horizonModelNote}
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono-tech text-xs">
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200">
            UTC: {currentPoint.timestampIso.replace('T', ' ').slice(0, 16)}
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300">
            T+{currentPoint.hoursFromStart.toFixed(1)}h
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative rounded-lg overflow-hidden border border-slate-800 bg-[#050811]">
          <div ref={mountRef} className="w-full h-[360px]" />

          <div className="absolute top-3 left-3 flex flex-wrap gap-2 text-xs font-mono-tech">
            <span
              className={`px-2 py-1 rounded border ${
                currentPoint.isSunVisible
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900/90 border-slate-700 text-slate-400'
              }`}
            >
              SUN: {currentPoint.sunElevationDeg.toFixed(2)}° EL / {currentPoint.sunAzimuthDeg.toFixed(1)}° AZ (
              {currentPoint.isSunVisible ? 'DAYLIGHT' : 'SHADOW'})
            </span>
            <span
              className={`px-2 py-1 rounded border ${
                currentPoint.isEarthVisible
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              EARTH: {currentPoint.earthElevationDeg.toFixed(2)}° EL / {currentPoint.earthAzimuthDeg.toFixed(1)}° AZ (
              {currentPoint.isEarthVisible ? 'DTE LINK OPEN' : 'OCCLUDED'})
            </span>
          </div>

          <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-950/85 border border-slate-800 px-3 py-1.5 rounded text-xs">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Orbit View:</span>
            <input
              type="range"
              min={-Math.PI}
              max={Math.PI}
              step={0.05}
              value={cameraYaw}
              onChange={(e) => setCameraYaw(parseFloat(e.target.value))}
              className="w-20 accent-cyan-400"
              title="Rotate Azimuth View"
            />
            <input
              type="range"
              min={0.15}
              max={1.3}
              step={0.05}
              value={cameraPitch}
              onChange={(e) => setCameraPitch(parseFloat(e.target.value))}
              className="w-16 accent-cyan-400"
              title="Adjust Camera Pitch"
            />
          </div>
        </div>

        <div className="bg-[#070b14] border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span>Polar Horizon Radar (0° Ring)</span>
            <span className="text-[11px] text-cyan-400 font-mono-tech">N = 0° Az</span>
          </div>

          <div className="flex justify-center my-1">
            <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible">
              <circle cx="110" cy="110" r="95" fill="#090d16" stroke="#1e293b" strokeDasharray="3 3" />
              <circle cx="110" cy="110" r="78" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="110" cy="110" r="52" fill="none" stroke="#1e293b" strokeWidth="1" />
              <circle cx="110" cy="110" r="26" fill="none" stroke="#1e293b" strokeWidth="1" />
              <line x1="110" y1="15" x2="110" y2="205" stroke="#1e293b" />
              <line x1="15" y1="110" x2="205" y2="110" stroke="#1e293b" />
              <text x="110" y="12" textAnchor="middle" fill="#94a3b8" fontSize="10">N (0°)</text>
              <text x="212" y="113" textAnchor="start" fill="#94a3b8" fontSize="10">E (90°)</text>
              <text x="110" y="216" textAnchor="middle" fill="#94a3b8" fontSize="10">S (180°)</text>
              <text x="8" y="113" textAnchor="end" fill="#94a3b8" fontSize="10">W</text>

              <circle
                cx={earthPolar.x}
                cy={earthPolar.y}
                r="6"
                fill={currentPoint.isEarthVisible ? '#38bdf8' : '#f43f5e'}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <text
                x={earthPolar.x + 8}
                y={earthPolar.y + 3}
                fill="#38bdf8"
                fontSize="9"
                fontWeight="bold"
              >
                EARTH
              </text>

              <circle
                cx={sunPolar.x}
                cy={sunPolar.y}
                r="7"
                fill={currentPoint.isSunVisible ? '#facc15' : '#64748b'}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <text
                x={sunPolar.x + 9}
                y={sunPolar.y - 4}
                fill="#facc15"
                fontSize="9"
                fontWeight="bold"
              >
                SUN
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono-tech border-t border-slate-800 pt-2">
            <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
              <div className="text-amber-400 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5" /> SOLAR STATE
              </div>
              <div className="text-slate-200 mt-0.5">El: {currentPoint.sunElevationDeg.toFixed(2)}°</div>
              <div className="text-slate-400">Az: {currentPoint.sunAzimuthDeg.toFixed(1)}°</div>
            </div>
            <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
              <div className="text-cyan-400 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> EARTH LINK
              </div>
              <div className="text-slate-200 mt-0.5">El: {currentPoint.earthElevationDeg.toFixed(2)}°</div>
              <div className="text-slate-400">Az: {currentPoint.earthAzimuthDeg.toFixed(1)}°</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#070b14] border border-slate-800 rounded-lg p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause Sim' : 'Play Sim'}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                onSelectIndex(0);
              }}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset T+0
            </button>
            <div className="flex items-center gap-1 text-xs text-slate-400 ml-2">
              <span>Speed:</span>
              {[1, 4, 12].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded font-mono-tech cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {analysis.events.slice(0, 4).map((ev, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const targetIdx = points.findIndex((p) => p.hoursFromStart >= ev.hoursFromStart);
                  if (targetIdx >= 0) onSelectIndex(targetIdx);
                }}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono-tech cursor-pointer"
              >
                Jump {ev.type} (T+{ev.hoursFromStart.toFixed(1)}h)
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(0, points.length - 1)}
          value={selectedIndex}
          onChange={(e) => onSelectIndex(Number(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer"
        />
      </div>
    </div>
  );
};