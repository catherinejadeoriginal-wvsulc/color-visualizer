import { GradientPreset } from '../types';

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'cosmic',
    name: 'Galactic Pulse',
    colors: ['#8b5cf6', '#ec4899', '#bfdbfe'], // Violet to Hot Pink to Light Blue
    accent: '#d946ef',
    description: 'Ethereal cosmic nebula palette, glowing with deep violet and stellar pink particles.',
  },
  {
    id: 'fire',
    name: 'Sunset Ignite',
    colors: ['#f97316', '#facc15', '#ef4444'], // Orange to Gold to Red
    accent: '#fbbf24',
    description: 'Violent thermo-dynamic solar currents, throwing orange sparks and magma trails.',
  },
  {
    id: 'ocean',
    name: 'Abyssal Current',
    colors: ['#06b6d4', '#3b82f6', '#1e1b4b'], // Cyan to Blue to Indigo
    accent: '#22d3ee',
    description: 'High-density deep sea bioluminescence, creating glowing cyan waves and cool particles.',
  },
  {
    id: 'forest',
    name: 'Emerald Aurora',
    colors: ['#10b981', '#a3e635', '#042f1a'], // Green to Lime to Dark Pine
    accent: '#34d399',
    description: 'Ethereal northern lights flowing with deep jade, lime sparks, and organic drifting smoke.',
  },
  {
    id: 'supernova',
    name: 'Stardust Void',
    colors: ['#f472b6', '#a855f7', '#ffffff'], // Pink to Purple to White
    accent: '#f472b6',
    description: 'Searing particle explosion, releasing hot magenta dust and bright white star particles.',
  },
  {
    id: 'hyperneon',
    name: 'Cyberpunk Warp',
    colors: ['#e11d48', '#fbbf24', '#06b6d4'], // Crimson to Gold to Cyan
    accent: '#f43f5e',
    description: 'Fast-paced virtual speedway, with high-intensity glitch trails and high-speed ember elements.',
  }
];
