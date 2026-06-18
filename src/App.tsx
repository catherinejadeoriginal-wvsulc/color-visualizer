import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  Video, 
  Settings2, 
  Hand, 
  MonitorPlay, 
  HelpCircle,
  X,
  Gauge
} from 'lucide-react';

import { VisualizerConfig, HandData } from './types';
import WebcamScanner from './components/WebcamScanner';
import VisualizerCanvas from './components/VisualizerCanvas';
import ControlPanel from './components/ControlPanel';
import { getGestureMeta } from './utils/handHelpers';

const INITIAL_CONFIG: VisualizerConfig = {
  particleLimit: 950,
  particleSpeed: 2.2,
  trailLength: 0.12, // default balanced trace length
  smokeDensity: 0.5,
  smoothingFactor: 0.35, // balanced interpolation smoothing
  showWebcamOverlay: true,
  showSkeleton: true,
  selectedPresetId: 'cosmic',
  renderMode: 'immersive', // default responsive split layout
  glowEnabled: true
};

export default function App() {
  const [handData, setHandData] = useState<HandData | null>(null);
  const [config, setConfig] = useState<VisualizerConfig>(INITIAL_CONFIG);
  const [clearTrigger, setClearTrigger] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // Clear all particles inside canvas
  const handleClearParticles = () => {
    setClearTrigger(Date.now());
  };

  const detectedGesture = handData ? handData.gesture : 'none';
  const gestureMeta = getGestureMeta(detectedGesture);

  return (
    <div className="relative min-h-screen w-screen bg-[#020512] font-sans text-slate-100 flex flex-col overflow-hidden select-none">
      
      {/* 1. FUTURISTIC NEON HEADER BAR */}
      <header className="relative z-20 w-full px-6 py-4 bg-slate-950/45 border-b border-slate-900/85 backdrop-blur-xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/25">
            <Sparkles size={18} className="text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-display tracking-tight text-white flex items-center gap-2">
              AuraGesture Visualizer
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                v1.2.0-PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5 hidden xs:block">
              Touchless Digital Art Laboratory
            </p>
          </div>
        </div>

        {/* Real-time telemetry status readout */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-5 py-1 px-3.5 bg-slate-900/60 border border-slate-800/60 rounded-full font-mono text-[10px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <Hand size={11} className="text-violet-400" /> 
              Gesture: <strong className="text-white font-semibold">{gestureMeta.emoji} {gestureMeta.name.toUpperCase()}</strong>
            </span>
            <span className="h-3 w-[1px] bg-slate-800" />
            <span className="flex items-center gap-1.5">
              <Gauge size={11} className="text-violet-400" /> 
              Engine: <strong className="text-white font-semibold">{config.particleLimit} CAP</strong>
            </span>
          </div>

          {/* Toggle sidebar display button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold tracking-wide transition-all duration-300 shadow cursor-pointer ${
              sidebarOpen
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-violet-600 border-violet-500 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/10'
            }`}
            title={sidebarOpen ? "Enter Fullscreen Mode" : "Show Management Sidebar"}
          >
            {sidebarOpen ? <EyeOff size={14} /> : <Eye size={14} />}
            <span className="hidden sm:inline">
              {sidebarOpen ? 'Full Workspace' : 'Show Dashboard'}
            </span>
          </button>
        </div>
      </header>

      {/* 2. MASTER LAYOUT VIEWPORTS ROUTER */}
      <main className="relative flex-1 w-full flex overflow-hidden min-h-0">
        
        {/* A. IMMERSIVE CANVAS INTERACTIVE AREA */}
        <div className="relative flex-1 h-full min-w-0 bg-slate-950 flex flex-col">
          
          {/* Welcome Info Overlay Panel */}
          <AnimatePresence>
            {showWelcome && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="absolute top-6 left-6 right-6 sm:max-w-md z-10 p-5 rounded-3xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col gap-4 text-slate-100 ring-1 ring-white/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
                      <MonitorPlay size={18} />
                    </span>
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">
                      Welcome to AuraGesture
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowWelcome(false)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed font-normal flex flex-col gap-2.5">
                  <p>
                    AuraGesture is an interactive touchless digital art sandbox. It detects hand gestures locally in real-time to shape dynamic color fields on the canvas:
                  </p>
                  <ul className="flex flex-col gap-1.5 list-none pl-0">
                    <li>🖐️ <strong className="text-white">Open Palm</strong>: Expands blazing solar magma gusts.</li>
                    <li>✊ <strong className="text-white">Closed Fist</strong>: Pulls star dust into a gravity vortex.</li>
                    <li>☝️ <strong className="text-white">Index Point</strong>: Traces ribbon drawings on the canvas.</li>
                    <li>👌 <strong className="text-white">Pinch</strong>: Emits intense sparkling physical embers.</li>
                  </ul>
                  <p className="border-t border-slate-900 pt-2.5 text-slate-450 text-[10px]">
                    💡 Set up your camera on the right panel, allow webcam access, and steer your hands in front of your camera.
                  </p>
                </div>

                <button
                  onClick={() => setShowWelcome(false)}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-500 transition text-[11px] font-bold text-white rounded-xl"
                >
                  Start Experimenting
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating diagnostic indicator inside full screen */}
          {!sidebarOpen && (
            <div className="absolute top-6 right-6 z-10 flex items-center gap-3 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-2.5 shadow-xl backdrop-blur-md animate-fade-in">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative h-2 w-2 bg-violet-500 rounded-full"></span>
              </span>
              <span className="text-[10px] font-mono text-slate-300 font-bold mr-1 flex items-center gap-2">
                <span>{gestureMeta.emoji} {gestureMeta.name.toUpperCase()}</span>
                <span className="text-slate-600 font-normal">|</span>
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="text-violet-400 hover:text-violet-300 text-[9px] hover:underline cursor-pointer"
                >
                  Open Dashboard
                </button>
              </span>
            </div>
          )}

          {/* Core Graphics Canvas Rendering engine */}
          <VisualizerCanvas
            handData={handData}
            config={config}
            clearTrigger={clearTrigger}
            className="flex-1"
          />

          {/* Bottom quick visual hint overlay */}
          {handData && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 py-2 px-4 bg-slate-950/80 border border-slate-800/80 rounded-full text-center backdrop-blur-md shadow-2xl flex items-center gap-2 pointer-events-none"
            >
              <span className="text-xl leading-none">{gestureMeta.emoji}</span>
              <span className="text-xs font-semibold text-white tracking-wide">
                {gestureMeta.name} Active
              </span>
              <span className="text-slate-600 text-[10px] px-1 font-normal">•</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {handData.handedness === 'Left' ? 'Left Hand' : 'Right Hand'} Detected ({Math.round(handData.score * 100)}% accuracy)
              </span>
            </motion.div>
          )}
        </div>

        {/* B. MODULAR SIDEBAR DESIGN CONTROLLER PANEL */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '380px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-[380px] h-full bg-slate-950/45 border-l border-slate-900/85 backdrop-blur-xl shrink-0 overflow-y-auto hidden lg:flex flex-col select-none ring-1 ring-white/5"
            >
              <div className="flex flex-col gap-6 p-6 min-h-full">
                
                {/* Visual Camera Scanner Panel */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <Video size={15} className="text-violet-400 animate-pulse" />
                    <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
                      Camera Input & Tracking
                    </h2>
                  </div>
                  <WebcamScanner
                    onHandDetected={setHandData}
                    showOverlay={config.showWebcamOverlay}
                    showSkeleton={config.showSkeleton}
                    className="w-full"
                  />
                </div>

                <hr className="border-slate-900" />

                {/* Laboratory controls and switches */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <Settings2 size={15} className="text-violet-400" />
                    <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
                      Laboratory Console
                    </h2>
                  </div>
                  <ControlPanel
                    config={config}
                    onChangeConfig={setConfig}
                    detectedGesture={detectedGesture as any}
                    onClearParticles={handleClearParticles}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. MOBILE DIAGNOSTICS & CONTROLS FOOTER DRAWER */}
      <footer className="lg:hidden relative z-20 w-full bg-slate-950 border-t border-slate-900 py-6 px-5 max-h-[50vh] overflow-y-auto shrink-0 select-none">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Camera module on touch screens */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-slate-300">
                <Video size={14} className="text-violet-400" />
                <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">
                  Mobile Camera Input
                </h3>
              </div>
              <WebcamScanner
                onHandDetected={setHandData}
                showOverlay={config.showWebcamOverlay}
                showSkeleton={config.showSkeleton}
                className="w-full"
              />
            </div>

            {/* Laborator Controls on touch screens */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-slate-300">
                <Settings2 size={14} className="text-violet-400" />
                <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">
                  Mobile Lab Console
                </h3>
              </div>
              <ControlPanel
                config={config}
                onChangeConfig={setConfig}
                detectedGesture={detectedGesture as any}
                onClearParticles={handleClearParticles}
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
