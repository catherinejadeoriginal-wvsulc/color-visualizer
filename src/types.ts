export type GestureType =
  | 'none'
  | 'open_palm'
  | 'closed_fist'
  | 'index_pointer'
  | 'peace_sign'
  | 'pinch'
  | 'rock_horns';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: Landmark[];
  gesture: GestureType;
  score: number;
  handedness: 'Left' | 'Right';
}

export interface GradientPreset {
  id: string;
  name: string;
  colors: string[]; // hex or rgb strings for linear gradient
  accent: string;
  description: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number; // 0 to 1
  maxLife: number;
  type: 'spark' | 'smoke' | 'trail' | 'ember';
  angle?: number;
  spin?: number;
  growth?: number;
}

export interface VisualizerConfig {
  particleLimit: number;
  particleSpeed: number;
  trailLength: number; // 0.01 to 0.5 (alpha clear value)
  smokeDensity: number; // 0 to 1
  smoothingFactor: number; // For hand movement interpolation
  showWebcamOverlay: boolean;
  showSkeleton: boolean;
  selectedPresetId: string;
  renderMode: 'split' | 'immersive' | 'fullscreen';
  glowEnabled: boolean;
}
