import { Landmark, GestureType } from '../types';

/**
 * Calculates Euclidean distance between two points in 2D or 3D space.
 */
export function getDistance(p1: Landmark, p2: Landmark, use3D = false): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  if (use3D) {
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalizes coordinate mapping from camera aspect ratio to canvas.
 */
export function mapCoordinate(
  val: number,
  srcMin: number,
  srcMax: number,
  dstMin: number,
  dstMax: number
): number {
  return dstMin + ((val - srcMin) / (srcMax - srcMin)) * (dstMax - dstMin);
}

/**
 * Classifies the active hand gesture based on 3D/2D joint landmarks from MediaPipe.
 */
export function classifyGesture(landmarks: Landmark[]): GestureType {
  if (!landmarks || landmarks.length < 21) return 'none';

  const wrist = landmarks[0];
  
  // Pivot knuckles / joints for finger length calculations
  const thumbBase = landmarks[1];
  const thumbMCP = landmarks[2];
  const thumbIP = landmarks[3];
  const thumbTip = landmarks[4];

  const indexMCP = landmarks[5];
  const indexPIP = landmarks[6];
  const indexDIP = landmarks[7];
  const indexTip = landmarks[8];

  const middleMCP = landmarks[9];
  const middlePIP = landmarks[10];
  const middleDIP = landmarks[11];
  const middleTip = landmarks[12];

  const ringMCP = landmarks[13];
  const ringPIP = landmarks[14];
  const ringDIP = landmarks[15];
  const ringTip = landmarks[16];

  const pinkyMCP = landmarks[17];
  const pinkyPIP = landmarks[18];
  const pinkyDIP = landmarks[19];
  const pinkyTip = landmarks[20];

  // Palm reference size (wrist to middle MCP)
  const palmSize = getDistance(wrist, middleMCP);

  // Check which fingers are extended
  // To be rotation-invariant, compare distance from wrist to tip vs. wrist to PIP joint
  const isIndexExtended = getDistance(wrist, indexTip) > getDistance(wrist, indexPIP) * 1.05;
  const isMiddleExtended = getDistance(wrist, middleTip) > getDistance(wrist, middlePIP) * 1.05;
  const isRingExtended = getDistance(wrist, ringTip) > getDistance(wrist, ringPIP) * 1.10;
  const isPinkyExtended = getDistance(wrist, pinkyTip) > getDistance(wrist, pinkyPIP) * 1.08;
  
  // Thumb check (is thumb tip significantly further from index base MCP than thumb MCP base is?)
  const thumbSpread = getDistance(thumbTip, indexMCP);
  const thumbTucked = getDistance(thumbMCP, indexMCP);
  const isThumbExtended = thumbSpread > thumbTucked * 1.15;

  // Let's count how many main fingers (excluding thumb) are extended
  const extendedFingers = [isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended];
  const extendedCount = extendedFingers.filter(Boolean).length;

  // 1. PINCH DETECTION
  // A pinch is when the index tip and thumb tip are very close.
  // Normalize pinch distance by palm size to make it scale invariant.
  const indexThumbDist = getDistance(indexTip, thumbTip);
  const pinchThreshold = palmSize * 0.28;
  if (indexThumbDist < pinchThreshold) {
    return 'pinch';
  }

  // 2. OPEN PALM
  // Standard hand open: at least 3 fingers are fully extended and spread.
  if (extendedCount >= 3 && isThumbExtended) {
    return 'open_palm';
  }
  if (extendedCount === 4) {
    return 'open_palm';
  }

  // 3. CLOSED FIST
  // Standard hand closed: no fingers are extended.
  if (extendedCount === 0 && !isThumbExtended) {
    return 'closed_fist';
  }
  if (extendedCount === 0) {
    return 'closed_fist';
  }

  // 4. PEACE SIGN
  // Index and Middle are extended, Ring and Pinky are closed.
  if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return 'peace_sign';
  }

  // 5. ROCK HORN SIGN (ROCK ON)
  // Index and Pinky are extended, Middle and Ring are closed.
  if (isIndexExtended && isPinkyExtended && !isMiddleExtended && !isRingExtended) {
    return 'rock_horns';
  }

  // 6. INDEX POINTER / DRAW
  // Only index is extended, others are closed.
  if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    return 'index_pointer';
  }

  return 'none';
}

/**
 * Returns a human-friendly name and emojis for each gesture category.
 */
export function getGestureMeta(gesture: GestureType): { name: string; emoji: string; desc: string } {
  switch (gesture) {
    case 'open_palm':
      return {
        name: 'Open Palm',
        emoji: '🖐️',
        desc: 'Wave & Spread: Expands colors, creates outward heatwave particles',
      };
    case 'closed_fist':
      return {
        name: 'Closed Fist',
        emoji: '✊',
        desc: 'Gravity Charge: Concentrates energy into a dark, rotating black hole orb',
      };
    case 'index_pointer':
      return {
        name: 'Index Point',
        emoji: '☝️',
        desc: 'Ribbon Draw: Traces fluid laser lines and glowing trails across the canvas',
      };
    case 'peace_sign':
      return {
        name: 'Peace Sign',
        emoji: '✌️',
        desc: 'Aurora Fusion: Ripples shifting emerald and electric green waves',
      };
    case 'pinch':
      return {
        name: 'Pinch Click',
        emoji: '👌',
        desc: 'Spark Igniter: Generates high-velocity sparks and glowing cosmic dust',
      };
    case 'rock_horns':
      return {
        name: 'Rock On',
        emoji: '🤘',
        desc: 'Neon Warp: Hyper-speed turbulence particles and psychedelic visualizer distortion',
      };
    default:
      return {
        name: 'Searching...',
        emoji: '🔍',
        desc: 'Place your hand in front of the camera to begin the touchless experience',
      };
  }
}
