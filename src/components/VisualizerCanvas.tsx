import React, { useEffect, useRef, useState } from 'react';
import { HandData, Particle, VisualizerConfig, GestureType } from '../types';
import { GRADIENT_PRESETS } from '../utils/presets';

interface VisualizerCanvasProps {
  handData: HandData | null;
  config: VisualizerConfig;
  className?: string;
  clearTrigger?: number;
}

// Simple color helper for interpolation
interface RGB {
  r: number;
  g: number;
  b: number;
}

function parseHex(hex: string): RGB {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export default function VisualizerCanvas({
  handData,
  config,
  className = '',
  clearTrigger = 0,
}: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const [fallbackGesture, setFallbackGesture] = useState<GestureType>('index_pointer');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    if (touch) {
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        active: true,
      };
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    if (touch) {
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        active: true,
      };
    }
  };

  const handleMouseUp = () => {
    if (mouseRef.current) {
      mouseRef.current.active = false;
    }
  };

  const handleMouseLeave = () => {
    if (mouseRef.current) {
      mouseRef.current.active = false;
    }
  };

  const handleTouchEnd = () => {
    if (mouseRef.current) {
      mouseRef.current.active = false;
    }
  };

  // Maintain actual physics-related states inside refs to circumvent React re-render overhead
  const particlesRef = useRef<Particle[]>([]);

  // Clear all particles on manual trigger
  useEffect(() => {
    if (clearTrigger > 0) {
      particlesRef.current = [];
    }
  }, [clearTrigger]);
  const lastActiveHandRef = useRef<{ x: number; y: number } | null>(null);
  const targetColorsRef = useRef<RGB[]>([]);
  const currentColorsRef = useRef<RGB[]>([]);
  const currentPresetIdRef = useRef<string>('');
  
  // Transition detection
  const [totalParticles, setTotalParticles] = useState<number>(0);

  // Initialize and load the preset colors
  useEffect(() => {
    const preset = GRADIENT_PRESETS.find((p) => p.id === config.selectedPresetId) || GRADIENT_PRESETS[0];
    
    // Convert hex to rgb
    const rgbs = preset.colors.map(parseHex);
    targetColorsRef.current = rgbs;

    // Direct assignment if first time, else let it lerp
    if (currentColorsRef.current.length === 0) {
      currentColorsRef.current = rgbs.map((c) => ({ ...c }));
    }

    // Capture old preset and trigger "smoke transition" if it changes
    if (currentPresetIdRef.current && currentPresetIdRef.current !== preset.id) {
      triggerSmokeTransition();
    }
    currentPresetIdRef.current = preset.id;
  }, [config.selectedPresetId]);

  // Handle gesture-driven color/gradient modifications
  useEffect(() => {
    // Gesture overrides colors dynamically to match visual themes
    const activeG = handData ? handData.gesture : fallbackGesture;
    let targetId = config.selectedPresetId;

    if (activeG === 'open_palm') {
      targetId = 'fire';
    } else if (activeG === 'closed_fist') {
      targetId = 'ocean';
    } else if (activeG === 'pinch') {
      targetId = 'supernova';
    } else if (activeG === 'peace_sign') {
      targetId = 'forest';
    } else if (activeG === 'rock_horns') {
      targetId = 'hyperneon';
    } else if (activeG === 'index_pointer') {
      targetId = 'cosmic';
    }

    const preset = GRADIENT_PRESETS.find((p) => p.id === targetId) || GRADIENT_PRESETS[0];
    const rgbs = preset.colors.map(parseHex);
    targetColorsRef.current = rgbs;
  }, [handData?.gesture, fallbackGesture, config.selectedPresetId]);

  // Generate smoky fading particles from the previous colors
  const triggerSmokeTransition = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert old currentColors to strings
    const oldColorsStr = currentColorsRef.current.map(
      (rgb) => `rgba(${Math.floor(rgb.r)}, ${Math.floor(rgb.g)}, ${Math.floor(rgb.b)}, 0.4)`
    );

    // Spawn smoke in multiple parts of the screen
    for (let i = 0; i < 180; i++) {
      if (particlesRef.current.length >= config.particleLimit) break;

      const x = Math.random() * canvas.width;
      // Start mostly from bottom and middle to float up
      const y = canvas.height * (0.3 + Math.random() * 0.7);
      const randColor = oldColorsStr[Math.floor(Math.random() * oldColorsStr.length)];

      const maxLife = 60 + Math.random() * 90;

      const p: Particle = {
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.8 - Math.random() * 2.0, // Rising
        size: 20 + Math.random() * 45, // Large gaseous smoke puffy
        color: randColor,
        alpha: 0.25 + Math.random() * 0.45,
        life: 0,
        maxLife,
        type: 'smoke',
        spin: (Math.random() - 0.5) * 0.02,
        angle: Math.random() * Math.PI * 2,
        growth: 0.15 + Math.random() * 0.35, // Grows as it rises
      };

      particlesRef.current.push(p);
    }
  };

  // Canvas context layout resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = (rect?.width || window.innerWidth);
      canvas.height = (rect?.height || window.innerHeight);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Main Canvas Render Loop
    let animId: number;
    const ctx = canvas.getContext('2d');

    const render = () => {
      if (ctx && canvas) {
        drawScene(ctx, canvas);
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, [config, handData, fallbackGesture]); // recreate if config changes to bind new values

  // Core Canvas Drawing & Physics Update Frame
  const drawScene = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const W = canvas.width;
    const H = canvas.height;

    // 1. Lerp gradient colors smoothly frame by frame
    const lerpSpeed = 0.045; // Smooth drifting speed
    currentColorsRef.current.forEach((cur, idx) => {
      const target = targetColorsRef.current[idx];
      if (target) {
        cur.r += (target.r - cur.r) * lerpSpeed;
        cur.g += (target.g - cur.g) * lerpSpeed;
        cur.b += (target.b - cur.b) * lerpSpeed;
      }
    });

    // 2. Clear canvas with semi-transparent clear for tail/motion-blur tracing
    // Hand pose point draws longer ribbons if index_pointer is active
    let normalClear = config.trailLength; // e.g. 0.12
    if (handData && handData.gesture === 'index_pointer') {
      normalClear = Math.min(normalClear, 0.05); // Super long trails for drawings!
    } else if (handData && handData.gesture === 'rock_horns') {
      normalClear = 0.3; // Glitchy, fast-fading background
    }

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw background fading solid to allow alpha Trails
    const c1 = currentColorsRef.current[0] || { r: 15, g: 23, b: 42 }; // fallback slate
    const c2 = currentColorsRef.current[2] || { r: 9, g: 12, b: 24 };

    // Draw deep, rich linear background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    // Darken actual colors for background slate to allow glowing particles to stand out beautifully
    const bgR1 = Math.floor(c1.r * 0.15);
    const bgG1 = Math.floor(c1.g * 0.15);
    const bgB1 = Math.floor(c1.b * 0.15);
    const bgR2 = Math.floor(c2.r * 0.08);
    const bgG2 = Math.floor(c2.g * 0.08);
    const bgB2 = Math.floor(c2.b * 0.08);

    ctx.fillStyle = `rgba(${bgR1}, ${bgG1}, ${bgB1}, ${normalClear})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // 3. Process pointer anchoring from hands or mouse drag
    let pointerX = 0;
    let pointerY = 0;
    let activeHandInside = false;
    const currentActiveGesture = handData ? handData.gesture : (mouseRef.current?.active ? fallbackGesture : 'none');

    if (handData && handData.landmarks && handData.landmarks.length > 0) {
      activeHandInside = true;
      const indexTip = handData.landmarks[8]; // Index tip represents active pointer by default
      const wrist = handData.landmarks[0];
      const thumbTip = handData.landmarks[4];

      // Use index tip or palm center as focus point
      let fx = indexTip.x;
      let fy = indexTip.y;

      if (handData.gesture === 'closed_fist') {
        const middleMCP = handData.landmarks[9];
        fx = middleMCP.x;
        fy = middleMCP.y;
      } else if (handData.gesture === 'pinch') {
        fx = (indexTip.x + thumbTip.x) / 2;
        fy = (indexTip.y + thumbTip.y) / 2;
      }

      // Convert coordinates from 0..1 to canvas dimensions (mirrored on camera, so 1 - fx)
      const rawTargetX = (1 - fx) * W;
      const rawTargetY = fy * H;

      // Handle interpolative smoothing to prevent joint camera-jitter
      if (!lastActiveHandRef.current) {
        lastActiveHandRef.current = { x: rawTargetX, y: rawTargetY };
      }

      const smoothing = config.smoothingFactor; // e.g. 0.25 (lower is smoother)
      lastActiveHandRef.current.x += (rawTargetX - lastActiveHandRef.current.x) * smoothing;
      lastActiveHandRef.current.y += (rawTargetY - lastActiveHandRef.current.y) * smoothing;

      pointerX = lastActiveHandRef.current.x;
      pointerY = lastActiveHandRef.current.y;
    } else if (mouseRef.current && mouseRef.current.active) {
      activeHandInside = true;
      const rawTargetX = mouseRef.current.x;
      const rawTargetY = mouseRef.current.y;

      if (!lastActiveHandRef.current) {
        lastActiveHandRef.current = { x: rawTargetX, y: rawTargetY };
      }

      const smoothing = 0.25;
      lastActiveHandRef.current.x += (rawTargetX - lastActiveHandRef.current.x) * smoothing;
      lastActiveHandRef.current.y += (rawTargetY - lastActiveHandRef.current.y) * smoothing;

      pointerX = lastActiveHandRef.current.x;
      pointerY = lastActiveHandRef.current.y;
    } else {
      lastActiveHandRef.current = null;
    }

    // 4. Spawn active particles depending on real-time GestureType
    const activePreset = GRADIENT_PRESETS.find((p) => p.id === config.selectedPresetId) || GRADIENT_PRESETS[0];
    const particleColor = activePreset.accent;

    if (activeHandInside && lastActiveHandRef.current) {
      const g = currentActiveGesture;
      const spawnRateCount = g === 'none' ? 2 : 5;

      for (let i = 0; i < spawnRateCount; i++) {
        if (particlesRef.current.length >= config.particleLimit) break;

        const maxLife = 40 + Math.random() * 40;
        
        let p: Particle = {
          id: Math.random().toString(),
          x: pointerX + (Math.random() - 0.5) * 15,
          y: pointerY + (Math.random() - 0.5) * 15,
          vx: (Math.random() - 0.5) * config.particleSpeed,
          vy: (Math.random() - 0.5) * config.particleSpeed,
          size: 3 + Math.random() * 6,
          color: particleColor,
          alpha: 0.8 + Math.random() * 0.2,
          life: 0,
          maxLife,
          type: 'trail',
        };

        // GESTURE SPECIFIC CUSTOM PHYSICS INJECTION
        if (g === 'open_palm') {
          // Flame Blast: high-energy radial flow
          const angle = Math.random() * Math.PI * 2;
          const speedFactor = 1.8 + Math.random() * 3.5;
          p.vx = Math.cos(angle) * config.particleSpeed * speedFactor;
          p.vy = Math.sin(angle) * config.particleSpeed * speedFactor - 1.0; // slight uplift
          p.color = '#fbbf24'; // hot amber orange
          p.size = 5 + Math.random() * 12;
          p.type = 'spark';
          p.growth = -0.05; // shrinks
        } else if (g === 'closed_fist') {
          // Gravity pull system: Spawn further out and pull in
          const orbitAngle = Math.random() * Math.PI * 2;
          const orbitRadius = 150 + Math.random() * 200;
          p.x = pointerX + Math.cos(orbitAngle) * orbitRadius;
          p.y = pointerY + Math.sin(orbitAngle) * orbitRadius;
          
          // Tangent or radial force inwards
          const speed = 1.5 + Math.random() * 2.5;
          p.vx = -Math.cos(orbitAngle) * speed + (Math.random() - 0.5) * 1;
          p.vy = -Math.sin(orbitAngle) * speed + (Math.random() - 0.5) * 1;
          p.color = '#3b82f6'; // Deep space neon cyan-blue
          p.size = 2 + Math.random() * 4;
          p.type = 'ember';
          p.maxLife = 90;
        } else if (g === 'pinch') {
          // Magnesium spark spray: high velocity, high drag
          const angle = Math.random() * Math.PI * 2;
          const force = 4.0 + Math.random() * 6.5;
          p.vx = Math.cos(angle) * config.particleSpeed * force;
          p.vy = Math.sin(angle) * config.particleSpeed * force;
          p.color = Math.random() > 0.45 ? '#ffffff' : '#ec4899'; // Spark pink and white
          p.size = 1.5 + Math.random() * 3.5;
          p.type = 'spark';
          p.maxLife = 20 + Math.random() * 25; // short hot life
        } else if (g === 'index_pointer') {
          // Ribbon draw: smooth geometric trailing
          p.vx = (Math.random() - 0.5) * 0.8;
          p.vy = -0.5 - Math.random() * 1.0; // drifts elegantly high
          p.color = '#d946ef'; // Violet purple ribbon
          p.size = 4 + Math.random() * 7;
          p.maxLife = 100 + Math.random() * 80;
        } else if (g === 'peace_sign') {
          // Aura curtains: slow floating curtains
          p.x = Math.random() * W;
          p.y = H + 20;
          p.vx = (Math.random() - 0.5) * 0.5;
          p.vy = -0.6 - Math.random() * 1.2; // float up like auroral streams
          p.color = Math.random() > 0.5 ? '#10b981' : '#a3e635'; // green & lime
          p.size = 12 + Math.random() * 24;
          p.type = 'smoke';
          p.maxLife = 180;
        } else if (g === 'rock_horns') {
          // Wild speedway: violent jetstreams
          p.vx = -3.5 - Math.random() * 6.0; // flies rapidly left
          p.vy = (Math.random() - 0.5) * 2.5;
          p.x = W + 20;
          p.y = Math.random() * H;
          p.color = '#ef4444'; // Red warp
          p.maxLife = 90;
          p.type = 'spark';
        }

        particlesRef.current.push(p);
      }

      // Add ambient hand-glow aura (gaseous feedback)
      if (Math.random() > 0.3) {
        let smokeColor = `rgba(${Math.floor(c1.r)}, ${Math.floor(c1.g)}, ${Math.floor(c1.b)}, 0.12)`;
        const smokeP: Particle = {
          id: Math.random().toString(),
          x: pointerX + (Math.random() - 0.5) * 30,
          y: pointerY + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -0.3 - Math.random() * 0.8,
          size: 15 + Math.random() * 25,
          color: smokeColor,
          alpha: 0.2 + Math.random() * 0.2,
          life: 0,
          maxLife: 60 + Math.random() * 50,
          type: 'smoke',
          growth: 0.15,
        };
        particlesRef.current.push(smokeP);
      }
    }

    // 5. Update, interact and draw particles
    ctx.save();
    
    // Choose blend modes: screen/lighter makes colors integrate into vibrant atomic blooms
    ctx.globalCompositeOperation = 'screen';

    const updatedParticles: Particle[] = [];

    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      p.life++;

      if (p.life >= p.maxLife) continue;

      const progress = p.life / p.maxLife;

      // Classify particle physics based on type
      if (p.type === 'smoke') {
        // Drifts upward, expands and waves
        p.x += p.vx + Math.sin(p.life * 0.08) * 0.4;
        p.y += p.vy;
        if (p.growth) p.size += p.growth;
        if (p.angle !== undefined && p.spin !== undefined) {
          p.angle += p.spin;
        }
        // Alpha fades as progress nears 1
        p.alpha = (1 - progress) * 0.35;
      } else if (p.type === 'spark') {
        // High speed, feels air resistance friction
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.x += p.vx;
        p.y += p.vy;
        if (p.growth) p.size += p.growth;
        // Spark fades nicely
        p.alpha = (1 - progress);
      } else if (p.type === 'ember') {
        // Swirling vortex physics around fist
        if (currentActiveGesture === 'closed_fist' && lastActiveHandRef.current) {
          const dx = pointerX - p.x;
          const dy = pointerY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 15) {
            // Spiral angular velocity pulls inwards
            const pullForce = 0.08;
            const swirlForce = 0.055;
            p.vx += (dx / dist) * pullForce - (dy / dist) * swirlForce;
            p.vy += (dy / dist) * pullForce + (dx / dist) * swirlForce;
          } else {
            // Reaching center sparks!
            p.alpha *= 0.8;
          }
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = (1 - progress) * 0.9;
      } else {
        // Standard tracer trails: basic wind currents
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = (1 - progress);
      }

      // Bound safety
      if (p.x < -100 || p.x > W + 100 || p.y < -100 || p.y > H + 100) {
        continue;
      }

      // 6. DRAW THE PARTICLE
      ctx.globalAlpha = p.alpha;

      if (p.type === 'smoke') {
        // Draw fluffy, smoke-like vapor
        // To make it look incredibly gaseous and fluffy without slow radial gradients:
        // Use soft fuzzy rings or simply circles with screen blend and low opacity
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        // Draw sharp linear magnesium flashes
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, p.size / 2);
        ctx.beginPath();
        // Point drawing forward vector line
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 1.5, p.y - p.vy * 1.5);
        ctx.stroke();
      } else {
        // Draw standard round glowing orbits
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Optional tiny core glow
        if (config.glowEnabled && p.size > 5) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      updatedParticles.push(p);
    }

    particlesRef.current = updatedParticles;
    ctx.restore();

    // Render stats inside canvas occasionally or synchronize counter state
    // To prevent infinite render loop, write particle count inside ref and update state throttled
    if (Math.random() > 0.75) {
      setTotalParticles(particlesRef.current.length);
    }

    // 7. Render dynamic interactive hand pointer aura overlay
    if (activeHandInside && lastActiveHandRef.current) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      const g = handData?.gesture || 'none';
      let radialRadius = 70;
      let alpha = 0.18;
      let radialColor = particleColor;

      if (g === 'open_palm') {
        radialRadius = 140;
        radialColor = '#f59e0b';
        alpha = 0.28;
      } else if (g === 'closed_fist') {
        radialRadius = 90;
        radialColor = '#3b82f6';
        alpha = 0.35;
      } else if (g === 'pinch') {
        radialRadius = 50;
        radialColor = '#f472b6';
        alpha = 0.4;
      }

      const pointGrad = ctx.createRadialGradient(
        pointerX,
        pointerY,
        0,
        pointerX,
        pointerY,
        radialRadius
      );
      pointGrad.addColorStop(0, radialColor);
      pointGrad.addColorStop(0.25, radialColor + '3F'); // faded hex alpha
      pointGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = pointGrad;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pointerX, pointerY, radialRadius, 0, Math.PI * 2);
      ctx.fill();

      // Hand status texts or tracking guide orbiting the hand
      if (config.glowEnabled) {
        ctx.strokeStyle = radialColor;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(pointerX, pointerY, radialRadius * 0.75, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = radialColor;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.15;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.arc(pointerX, pointerY, radialRadius * 1.1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }
  };

  return (
    <div
      className={`relative h-full w-full bg-slate-950 overflow-hidden select-none touch-none ${className}`}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Graphic Canvas element */}
      <canvas
        ref={canvasRef}
        id="interactive-visualizer-canvas"
        className="block h-full w-full pointer-events-none"
      />

      {/* Aesthetic status panel in corner to keep client feeling "Tech-Crafted" */}
      <div className="absolute top-4 left-4 z-10 hidden sm:flex flex-col gap-1 font-mono text-[9px] text-slate-400 select-none bg-slate-950/60 border border-slate-800/60 rounded-xl px-3.5 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          RENDER ENGINE ACTIVE
        </div>
        <div>STABLE BUFFER: {totalParticles} PARTICLES</div>
        <div>GRADIENT: LERPING RGB [MATRIX]</div>
        {handData ? (
          <div className="text-violet-400 font-medium font-mono">
            HAND: {handData.handedness.toUpperCase()} [{handData.gesture.toUpperCase()}]
          </div>
        ) : mouseRef.current?.active ? (
          <div className="text-amber-400 font-medium font-mono uppercase">
            CURSOR EMULATOR: [{fallbackGesture.toUpperCase()}]
          </div>
        ) : (
          <div className="text-slate-500 font-mono italic">
            STANDBY (DRAG TO PAINT)
          </div>
        )}
      </div>

      {/* Fallback interactive gesture selector controls shown ONLY when hand tracking is offline / camera inactive */}
      {!handData && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-10 flex flex-col gap-2 p-3.5 bg-slate-950/90 border border-slate-800/80 rounded-2xl backdrop-blur-md sm:max-w-[400px] shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-amber-400 font-semibold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Webcam Feed Offline / Standby
            </div>
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">Device shortcuts</span>
          </div>
          
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            Webcam stream offline. Hover, click, or tap inside this canvas to paint! Choose your cursor's magic style below:
          </p>

          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {[
              { id: 'index_pointer', label: '☝️ Drawing Pen', desc: 'Cosmic trails' },
              { id: 'open_palm', label: '🖐️ Firestorm', desc: 'Solar blast' },
              { id: 'closed_fist', label: '✊ Gravity Curl', desc: 'Cyan vortex' },
              { id: 'pinch', label: '👌 Star Spray', desc: 'Magenta spark' },
              { id: 'peace_sign', label: '✌️ Auroral Rift', desc: 'Emerald waves' },
              { id: 'rock_horns', label: '🤘 Distortion Glow', desc: 'Glitch warp' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setFallbackGesture(item.id as GestureType);
                }}
                className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all duration-200 ${
                  fallbackGesture === item.id
                    ? 'bg-indigo-600/20 border-indigo-500/80 text-indigo-400 font-medium shadow-sm shadow-indigo-600/5'
                    : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700/85 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-semibold">{item.label}</span>
                <span className="text-[9px] opacity-60 font-mono truncate max-w-full leading-tight mt-0.5">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
