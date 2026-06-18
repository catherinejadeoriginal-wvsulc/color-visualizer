import { Sparkles, Sliders, Play, Palette, HelpCircle, Layers, EyeOff, RotateCcw } from 'lucide-react';
import { VisualizerConfig, GestureType } from '../types';
import { GRADIENT_PRESETS } from '../utils/presets';
import { getGestureMeta } from '../utils/handHelpers';

interface ControlPanelProps {
  config: VisualizerConfig;
  onChangeConfig: (newConfig: VisualizerConfig) => void;
  detectedGesture: GestureType;
  onClearParticles: () => void;
}

export default function ControlPanel({
  config,
  onChangeConfig,
  detectedGesture,
  onClearParticles,
}: ControlPanelProps) {
  
  // Handlers for sliders and switches
  const handlePresetSelect = (presetId: string) => {
    onChangeConfig({ ...config, selectedPresetId: presetId });
  };

  const handleToggleSkeleton = () => {
    onChangeConfig({ ...config, showSkeleton: !config.showSkeleton });
  };

  const handleToggleOverlay = () => {
    onChangeConfig({ ...config, showWebcamOverlay: !config.showWebcamOverlay });
  };

  const handleToggleGlow = () => {
    onChangeConfig({ ...config, glowEnabled: !config.glowEnabled });
  };

  const handleSliderChange = (key: keyof VisualizerConfig, val: number) => {
    onChangeConfig({ ...config, [key]: val });
  };

  // Supported gesture checklist to show interactive states
  const GESTURE_DIAGNOSTICS: GestureType[] = [
    'open_palm',
    'closed_fist',
    'index_pointer',
    'peace_sign',
    'pinch',
    'rock_horns',
  ];

  return (
    <div className="flex flex-col gap-6 w-full text-slate-100 select-none pb-8 lg:pb-0">
      
      {/* 1. GESTURAL CHEAT SHEET & ACTIVE STATE */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle size={15} className="text-violet-400" />
          <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
            Aura Gesture Controls
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {GESTURE_DIAGNOSTICS.map((g) => {
            const meta = getGestureMeta(g);
            const isActive = detectedGesture === g;

            return (
              <div
                key={g}
                className={`relative flex items-center gap-2.5 p-3 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? 'bg-violet-950/40 border-violet-500/75 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30 translate-y-[-2px]'
                    : 'bg-slate-900/45 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-750'
                }`}
              >
                <div className="text-xl shrink-0 select-none">
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-semibold text-slate-200 truncate leading-snug">
                    {meta.name}
                  </h4>
                  <p className="text-[9px] text-slate-400 truncate leading-snug mt-0.5">
                    {g === 'open_palm' ? 'Sunset Heat' : 
                     g === 'closed_fist' ? 'Gravity Orb' : 
                     g === 'index_pointer' ? 'Vapor Trail' :
                     g === 'peace_sign' ? 'Lime Aurora' :
                     g === 'pinch' ? 'White Spark' : 'Neon Glitch'}
                  </p>
                </div>

                {/* Micro circular pulse for highly active states */}
                {isActive && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. GRADIENT PRESET COMPOSITIONS */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={15} className="text-violet-400" />
          <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
            Ambient Color Palettes
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GRADIENT_PRESETS.map((p) => {
            const isSelected = config.selectedPresetId === p.id;
            
            return (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`flex flex-col items-start text-left p-3.5 rounded-2xl border transition-all duration-300 group cursor-pointer ${
                  isSelected
                    ? 'bg-violet-950/45 border-violet-500/60 shadow-md ring-1 ring-violet-500/20'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-750'
                }`}
              >
                {/* Circles stop colors indicator */}
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex -space-x-1.5">
                    {p.colors.map((color, cIdx) => (
                      <span
                        key={cIdx}
                        className="w-3.5 h-3.5 rounded-full border border-slate-950 shadow"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-violet-500/25 text-violet-300'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300'
                    }`}
                  >
                    SELECT
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-white tracking-wide group-hover:text-violet-300 transition-colors">
                  {p.name}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. SIMULATION PARAMETER ADJUSTMENTS */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Sliders size={15} className="text-violet-400" />
          <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
            Physics Laboratory
          </h2>
        </div>

        <div className="flex flex-col gap-4 bg-slate-900/40 border border-slate-800/65 rounded-2xl p-4.5">
          {/* A. Limit Sliders */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles size={11} className="text-slate-400" /> Particle Buffer Cap
              </span>
              <span className="font-mono text-violet-400 font-semibold">{config.particleLimit}</span>
            </div>
            <input
              type="range"
              min="200"
              max="1500"
              step="50"
              value={config.particleLimit}
              onChange={(e) => handleSliderChange('particleLimit', parseInt(e.target.value))}
              className="w-full accent-violet-500 h-1 bg-slate-800 rounded-lg cursor-pointer appearance-none"
            />
            <p className="text-[9px] text-slate-500">Regulates maximum canvas density particles to optimize browser thread speed.</p>
          </div>

          {/* B. Kinetic Velocity multiplier */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-300">
              <span>Velocity Force</span>
              <span className="font-mono text-violet-400 font-semibold">{config.particleSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={config.particleSpeed}
              onChange={(e) => handleSliderChange('particleSpeed', parseFloat(e.target.value))}
              className="w-full accent-violet-500 h-1 bg-slate-800 rounded-lg cursor-pointer appearance-none"
            />
          </div>

          {/* C. Clear Trail value */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-300">
              <span>Optical Trail Decay (Motion Blur)</span>
              <span className="font-mono text-violet-400 font-semibold">
                {Math.round((1 - config.trailLength) * 100)}%
              </span>
            </div>
            {/* Range is reversed or maps cleanly, 0.4 trail clears fast (low trail), 0.02 trail clears slow (long trail) */}
            <input
              type="range"
              min="0.01"
              max="0.35"
              step="0.01"
              value={config.trailLength}
              // reverse presentation: low clear value = long trail, high clear value = short trail
              onChange={(e) => handleSliderChange('trailLength', parseFloat(e.target.value))}
              className="w-full accent-violet-500 h-1 bg-slate-800 rounded-lg cursor-pointer appearance-none"
            />
          </div>
        </div>
      </section>

      {/* 4. UTILITY OVERLAYS SWITCHES */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={15} className="text-violet-400" />
          <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
            Diagnostic Overlays
          </h2>
        </div>

        <div className="flex flex-col gap-2.5 bg-slate-900/40 border border-slate-800/65 rounded-2xl p-4">
          
          {/* Skeleton Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex flex-col select-none">
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-violet-300 transition-colors">
                Neon Skeletal Mesh
              </span>
              <span className="text-[9px] text-slate-400">Renders glow joints and connecting lines over the hand</span>
            </div>
            <input
              type="checkbox"
              checked={config.showSkeleton}
              onChange={handleToggleSkeleton}
              className="sr-only peer"
            />
            <div className="relative w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 peer-checked:after:bg-violet-400 after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-violet-950 border border-slate-700 peer-checked:border-violet-500"></div>
          </label>

          <hr className="border-slate-800/80 my-1" />

          {/* Webcam stream check overlay */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex flex-col select-none">
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-violet-300 transition-colors">
                Mirror Cameray Overlay
              </span>
              <span className="text-[9px] text-slate-400">Overlays a low opacity mirror stream on the canvas</span>
            </div>
            <input
              type="checkbox"
              checked={config.showWebcamOverlay}
              onChange={handleToggleOverlay}
              className="sr-only peer"
            />
            <div className="relative w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 peer-checked:after:bg-violet-400 after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-violet-950 border border-slate-700 peer-checked:border-violet-500"></div>
          </label>

          <hr className="border-slate-800/80 my-1" />

          {/* Core glow Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex flex-col select-none">
              <span className="text-[11px] font-medium text-slate-200 group-hover:text-violet-300 transition-colors">
                Core Hotspot Glow
              </span>
              <span className="text-[9px] text-slate-400">Renders high-intensity white cores and custom focus rings</span>
            </div>
            <input
              type="checkbox"
              checked={config.glowEnabled}
              onChange={handleToggleGlow}
              className="sr-only peer"
            />
            <div className="relative w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 peer-checked:after:bg-violet-400 after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-violet-950 border border-slate-700 peer-checked:border-violet-500"></div>
          </label>

        </div>
      </section>

      {/* 5. LAB ACTIONS */}
      <div className="flex justify-between items-center gap-3">
        <button
          onClick={onClearParticles}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 rounded-2xl shadow transition cursor-pointer"
        >
          <RotateCcw size={13} /> Sweep Particles
        </button>
      </div>

    </div>
  );
}
