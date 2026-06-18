import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Camera, CameraOff, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { HandData } from '../types';
import { classifyGesture, getGestureMeta } from '../utils/handHelpers';

interface WebcamScannerProps {
  onHandDetected: (handData: HandData | null) => void;
  showOverlay: boolean;
  showSkeleton: boolean;
  className?: string;
}

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],         // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],         // Index
  [9, 10], [10, 11], [11, 12],            // Middle
  [13, 14], [14, 15], [15, 16],          // Ring
  [0, 17], [17, 18], [18, 19], [19, 20],  // Pinky
  [5, 9], [9, 13], [13, 17]               // Palm base joints
];

export default function WebcamScanner({
  onHandDetected,
  showOverlay,
  showSkeleton,
  className = '',
}: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeDeviceIdRef = useRef<string | null>(null);

  // States
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedGesture, setDetectedGesture] = useState<string>('none');
  const [fps, setFps] = useState<number>(0);
  const [cameras, setCameras] = useState<InputDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraPowerOn, setIsCameraPowerOn] = useState<boolean>(true);

  // FPS calculation help
  const lastLoopRef = useRef<number>(performance.now());
  const framesCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(0);

  // Initialize MediaPipe model
  useEffect(() => {
    async function initMediaPipe() {
      try {
        setIsLoadingModel(true);
        setModelError(null);

        // Load FilesetResolver from jsdelivr CDN
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );

        // Load HandLandmarker with float16 model
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1, // Focus on single high-precision hand to optimize processing speed
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });

        handLandmarkerRef.current = landmarker;
        setIsLoadingModel(false);
      } catch (err: any) {
        console.error('Failed to load MediaPipe model:', err);
        setModelError(
          'Could not load the AI Hand Tracking model from CDN. Please check your internet connection and reload.'
        );
        setIsLoadingModel(false);
      }
    }

    initMediaPipe();

    // Query available cameras
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === 'videoinput'
        ) as InputDeviceInfo[];
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      } catch (e) {
        console.warn('Could not enumerate media devices:', e);
      }
    }
    getDevices();

    return () => {
      stopCamera();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // Control camera startup (triggers auto-start even with deviceId = "")
  useEffect(() => {
    if (isCameraPowerOn && !isLoadingModel && !modelError) {
      startCamera(selectedCameraId);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isLoadingModel, modelError, selectedCameraId, isCameraPowerOn]);

  const startCamera = async (deviceId: string) => {
    // If stream is already running for this device, skip restarting
    if (streamRef.current && activeDeviceIdRef.current === deviceId) {
      return;
    }
    stopCamera();
    setCameraError(null);

    const constraints: MediaStreamConstraints = {
      video: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      activeDeviceIdRef.current = deviceId;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadedmetadata', onVideoLoaded);
      }
      setCameraActive(true);

      // Now that user granted permissions, query device list again to get real labels and IDs!
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === 'videoinput'
        ) as InputDeviceInfo[];
        setCameras(videoDevices);
        
        // If we ran with default "" and found a device, save it
        if (videoDevices.length > 0 && !deviceId) {
          const firstId = videoDevices[0].deviceId;
          activeDeviceIdRef.current = firstId;
          setSelectedCameraId(firstId);
        }
      } catch (e) {
        console.warn('Could not enumerate media devices inside startCamera:', e);
      }
    } catch (err: any) {
      console.error('Webcam access error:', err);
      activeDeviceIdRef.current = null;
      setCameraError(
        'Failed to access webcam. Please ensure frame permissions are allowed and no other app is using your camera.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    activeDeviceIdRef.current = null;
    setCameraActive(false);
    onHandDetected(null);
  };

  const onVideoLoaded = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        // Start the detection loop
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
        animationFrameIdRef.current = requestAnimationFrame(detectionLoop);
      });
    }
  };

  // Main high-frequency detection loop
  const detectionLoop = () => {
    if (
      !videoRef.current ||
      !handLandmarkerRef.current ||
      videoRef.current.paused ||
      videoRef.current.ended
    ) {
      animationFrameIdRef.current = requestAnimationFrame(detectionLoop);
      return;
    }

    const now = performance.now();
    
    // FPS counter
    framesCountRef.current++;
    if (now - fpsTimerRef.current >= 1000) {
      setFps(framesCountRef.current);
      framesCountRef.current = 0;
      fpsTimerRef.current = now;
    }

    try {
      const startTimeMs = now;
      const results = handLandmarkerRef.current.detectForVideo(
        videoRef.current,
        startTimeMs
      );

      // Draw skeleton layout
      drawSkeleton(results.landmarks);

      if (results.landmarks && results.landmarks.length > 0) {
        const rawLandmarks = results.landmarks[0];
        const category = results.handednesses?.[0]?.[0];
        const rawGesture = classifyGesture(rawLandmarks);

        setDetectedGesture(rawGesture);

        // Convert MediaPipe landmarks to our normalized HandData
        const handData: HandData = {
          landmarks: rawLandmarks.map((lm) => ({
            x: lm.x, // 0 to 1
            y: lm.y, // 0 to 1
            z: lm.z, // depth
          })),
          gesture: rawGesture,
          score: category ? category.score : 0.9,
          handedness: category && category.displayName === 'Left' ? 'Left' : 'Right',
        };

        onHandDetected(handData);
      } else {
        setDetectedGesture('none');
        onHandDetected(null);
      }
    } catch (err) {
      console.error('Detection frame error:', err);
    }

    animationFrameIdRef.current = requestAnimationFrame(detectionLoop);
  };

  // Draw the tracking skeleton on top of the webcam feed
  const drawSkeleton = (allLandmarks: any[][]) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showSkeleton || !allLandmarks || allLandmarks.length === 0) return;

    const landmarks = allLandmarks[0];

    // Style configuration based on current gesture
    const rawGesture = classifyGesture(landmarks);
    let neonColor = '#10b981'; // default emerald
    let glowColor = 'rgba(16, 185, 129, 0.5)';

    if (rawGesture === 'open_palm') {
      neonColor = '#f59e0b'; // Gold
      glowColor = 'rgba(245, 158, 11, 0.6)';
    } else if (rawGesture === 'closed_fist') {
      neonColor = '#3b82f6'; // Blue
      glowColor = 'rgba(59, 130, 246, 0.6)';
    } else if (rawGesture === 'index_pointer') {
      neonColor = '#ec4899'; // Hot pink
      glowColor = 'rgba(236, 72, 153, 0.6)';
    } else if (rawGesture === 'pinch') {
      neonColor = '#a855f7'; // Purple
      glowColor = 'rgba(168, 85, 247, 0.7)';
    } else if (rawGesture === 'peace_sign') {
      neonColor = '#10b981'; // Mint emerald
      glowColor = 'rgba(16, 185, 129, 0.6)';
    } else if (rawGesture === 'rock_horns') {
      neonColor = '#ef4444'; // Red
      glowColor = 'rgba(239, 68, 68, 0.6)';
    }

    // 1. Draw connecting structural lines (skeleton bones)
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.shadowBlur = 0;

    for (const [startIdx, endIdx] of CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      if (start && end) {
        ctx.beginPath();
        // Mirror horizontally to match visual feed
        ctx.moveTo((1 - start.x) * canvas.width, start.y * canvas.height);
        ctx.lineTo((1 - end.x) * canvas.width, end.y * canvas.height);
        ctx.stroke();
      }
    }

    // 2. Draw neon landmarks (joints)
    ctx.shadowBlur = 10;
    ctx.shadowColor = neonColor;

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const cx = (1 - lm.x) * canvas.width;
      const cy = lm.y * canvas.height;

      ctx.beginPath();
      
      // Give finger tips larger glow anchors
      const isTip = [4, 8, 12, 16, 20].includes(i);
      
      if (isTip) {
        ctx.fillStyle = '#ffffff';
        ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = neonColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = neonColor;
        ctx.arc(cx, cy, 4.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // 3. Draw specialized gesture overlay markers (like sparks at pinch point)
    if (rawGesture === 'pinch') {
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      if (thumbTip && indexTip) {
        const pinchX = (1 - (thumbTip.x + indexTip.x) / 2) * canvas.width;
        const pinchY = ((thumbTip.y + indexTip.y) / 2) * canvas.height;

        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffffff';
        ctx.arc(pinchX, pinchY, 12, 0, 2 * Math.PI);
        ctx.fill();

        // Draw radial spikes
        ctx.strokeStyle = '#d946ef';
        ctx.lineWidth = 2;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(pinchX + Math.cos(angle) * 12, pinchY + Math.sin(angle) * 12);
          ctx.lineTo(pinchX + Math.cos(angle) * 22, pinchY + Math.sin(angle) * 22);
          ctx.stroke();
        }
      }
    } else if (rawGesture === 'closed_fist') {
      const middleMCP = landmarks[9];
      if (middleMCP) {
        const cx = (1 - middleMCP.x) * canvas.width;
        const cy = middleMCP.y * canvas.height;

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#3b82f6';
        // Orbit ring around fist
        ctx.ellipse(cx, cy, 45, 20, Math.PI / 6, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0; // reset
  };

  const activeMeta = getGestureMeta(detectedGesture as any);

  return (
    <div className={`relative flex flex-col rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 ${className}`}>
      {/* Top Header stats */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/60 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cameraActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cameraActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span className="text-xs font-mono font-medium text-slate-400">
            {cameraActive ? `TRACKING : ${fps} FPS` : isCameraPowerOn ? 'CAMERA STANDBY' : 'CAMERA OFFLINE'}
          </span>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-3">
          {/* Camera device selector */}
          {cameras.length > 1 && isCameraPowerOn && (
            <div className="flex items-center gap-1.5 select-none text-[10px]">
              <Layers size={13} className="text-slate-500" />
              <select
                id="camera-select"
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 rounded px-1.5 py-0.5 border border-slate-800 focus:outline-none cursor-pointer"
              >
                {cameras.map((camera, i) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    Camera {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle Switch Button */}
          <button
            onClick={() => setIsCameraPowerOn(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-semibold uppercase tracking-wider border transition-all duration-200 ${
              isCameraPowerOn
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title={isCameraPowerOn ? "Disable Camera Link" : "Activate Camera Link"}
          >
            {isCameraPowerOn ? <CameraOff size={11} className="stroke-[2.5]" /> : <Camera size={11} className="stroke-[2.5]" />}
            <span>{isCameraPowerOn ? 'Turn Off' : 'Turn On'}</span>
          </button>
        </div>
      </div>

      {/* Main Stream Window */}
      <div className="relative flex-1 aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
        
        {/* Loading and Setup Indicator Overlay */}
        {isLoadingModel && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-center px-6">
            <RefreshCw size={36} className="text-violet-400 animate-spin mb-4" />
            <h3 className="text-sm font-semibold text-white tracking-wide">Initializing Neural AI Model</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Loading MediaPipe WebML engine (~5.2MB WebAssembly core) directly into browser memory for local private tracking...
            </p>
          </div>
        )}

        {/* Model Loading Error */}
        {modelError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 text-center px-6">
            <AlertCircle size={40} className="text-red-500 mb-3" />
            <h3 className="text-sm font-semibold text-white">Resource Load Failure</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">{modelError}</p>
          </div>
        )}

        {/* Camera Manually Powered Off Overlay */}
        {!isLoadingModel && !modelError && !isCameraPowerOn && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 text-center px-6">
            <CameraOff size={36} className="text-slate-500 mb-3" />
            <h3 className="text-sm font-semibold text-white">Camera Link Power Off</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              webcam feed is currently disabled. You can still brush, paint, or emit majestic particle spells inside the canvas using only your cursor & screen touch!
            </p>
            <button
              onClick={() => setIsCameraPowerOn(true)}
              className="mt-4 flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl transition-all shadow-md shadow-emerald-800/10"
            >
              <Camera size={13} /> Reactivate Webcam
            </button>
          </div>
        )}

        {/* Camera Access Error or Status */}
        {!isLoadingModel && !modelError && isCameraPowerOn && cameraError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 text-center px-6">
            <CameraOff size={36} className="text-amber-500 mb-3" />
            <h3 className="text-sm font-semibold text-white">Camera Permission Standby</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              {cameraError}
            </p>
            <div className="mt-4 p-3 bg-slate-900 border border-slate-800/80 rounded-xl max-w-xs text-left font-sans text-[11px] text-slate-300 space-y-1">
              <span className="font-semibold text-violet-300 block">💡 Sub-frame Fix:</span>
              <p className="leading-normal">
                Because this preview streams inside a secure AI Studio sub-frame, your browser might block camera access. Simply click the <strong className="text-white">Open in New Tab ↗</strong> or <strong className="text-white">Share</strong> link to access the app natively!
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startCamera(selectedCameraId)}
                className="mt-4 flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white rounded-xl transition-all shadow-md shadow-violet-800/10"
              >
                <Camera size={13} /> Retry Webcam
              </button>
            </div>
          </div>
        )}

        {/* Actual webcam element stream (fully hidden offscreen / embedded in window, mirrored) */}
        <video
          ref={videoRef}
          id="webcam-scanner-video"
          playsInline
          muted
          className={`absolute w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${
            cameraActive && showOverlay ? 'opacity-30' : 'opacity-0 pointer-events-none'
          }`}
          onLoadedMetadata={onVideoLoaded}
        />

        {/* Interactive Hand Skeletal Connection Overlay Canvas */}
        <canvas
          ref={drawingCanvasRef}
          id="webcam-scanner-overlay"
          width={640}
          height={480}
          className={`absolute w-full h-full object-cover z-10 pointer-events-none transition-opacity duration-300 ${
            cameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Prompt to place hand */}
        {cameraActive && detectedGesture === 'none' && (
          <div className="absolute bottom-4 left-4 right-4 z-10 py-1.5 px-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-center backdrop-blur text-[10px] text-slate-300 font-medium tracking-wide animate-pulse pointer-events-none">
            👋 Raise your hand in front of your camera to interact
          </div>
        )}
      </div>

      {/* Gesture Recognition Quick Panel */}
      <div className="flex items-center gap-3.5 p-4 bg-slate-950/80 border-t border-slate-800/80">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-2xl select-none shadow-inner">
          {activeMeta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white tracking-wide">
              {activeMeta.name}
            </span>
            {detectedGesture !== 'none' && (
              <span className="inline-flex items-center px-1 py-0.5 rounded text-[8px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
            {activeMeta.desc}
          </p>
        </div>
      </div>
    </div>
  );
}
