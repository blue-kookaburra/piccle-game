"use client";

import { useRef, useCallback, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, RoundedBox, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { SHUTTER_SPEEDS, APERTURES, FOCAL_LENGTHS } from "@/lib/camera-values";
import type { AttemptFeedback } from "@/lib/scoring";

// ─── Drag/scroll hook ───────────────────────────────────────────────
function useDial(
  values: (string | number)[],
  currentIndex: number,
  onChange: (i: number) => void,
  disabled: boolean,
  sensitivity = 0.018
) {
  const n = values.length;
  const dragRef = useRef<{ startIdx: number; accum: number } | null>(null);

  const onPointerDown = useCallback(
    (e: { nativeEvent: PointerEvent; stopPropagation: () => void; pointerId: number }) => {
      if (disabled) return;
      e.stopPropagation();
      (e.nativeEvent.target as Element).setPointerCapture(e.pointerId);
      dragRef.current = { startIdx: currentIndex, accum: 0 };
    },
    [disabled, currentIndex]
  );

  const onPointerMove = useCallback(
    (e: { nativeEvent: MouseEvent }) => {
      if (!dragRef.current || disabled) return;
      dragRef.current.accum += e.nativeEvent.movementX * sensitivity;
      const step = (Math.PI * 2) / n;
      const idxDelta = Math.round(dragRef.current.accum / step);
      const next = Math.max(0, Math.min(n - 1, dragRef.current.startIdx + idxDelta));
      if (next !== currentIndex) { onChange(next); navigator.vibrate?.(8); }
    },
    [disabled, n, currentIndex, onChange, sensitivity]
  );

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  const onWheel = useCallback(
    (e: { deltaY: number; stopPropagation: () => void }) => {
      if (disabled) return;
      e.stopPropagation();
      const next = Math.max(0, Math.min(n - 1, currentIndex + (e.deltaY > 0 ? 1 : -1)));
      if (next !== currentIndex) onChange(next);
    },
    [disabled, n, currentIndex, onChange]
  );

  return { onPointerDown, onPointerMove, onPointerUp, onWheel };
}

// ─── Canvas texture for ring side surfaces ──────────────────────────
// Cylinder UV: U=0 → +Z (near/front), wraps CCW from above.
// Canvas top row → cylinder top edge (most visible from top-down angle).
function makeRingTexture(
  values: (string | number)[],
  variant: "fine" | "coarse",
  accentHex: string
): THREE.CanvasTexture {
  const W = 2048, H = 320;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Base rubber colour
  ctx.fillStyle = variant === "fine" ? "#1b1b1b" : "#4a2a08";
  ctx.fillRect(0, 0, W, H);

  // Photographic grain
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = (Math.random() - 0.5) * 28;
    d[i]   = Math.max(0, Math.min(255, d[i]   + g));
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + g));
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + g));
  }
  ctx.putImageData(img, 0, 0);

  // Top-light gradient (top of cylinder catches overhead light)
  const lg = ctx.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, "rgba(255,255,255,0.26)");
  lg.addColorStop(0.28, "rgba(0,0,0,0)");
  lg.addColorStop(1, "rgba(0,0,0,0.24)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);

  // Knurling
  if (variant === "fine") {
    // 160 fine rubber ridges — Fujifilm XF zoom ring style
    const count = 160;
    const sw = W / count;
    for (let i = 0; i < count; i += 2) {
      ctx.fillStyle = "rgba(0,0,0,0.54)";
      ctx.fillRect(i * sw, 0, sw * 0.54, H);
    }
  } else {
    // 24 wide raised ridges — Fujifilm XF aperture ring style
    const count = 24;
    const sw = W / count;
    for (let i = 0; i < count; i++) {
      const x = i * sw;
      const rw = sw * 0.62;
      // Ridge face with subtle bevel lighting
      const rg = ctx.createLinearGradient(x, 0, x + rw, 0);
      rg.addColorStop(0,    "rgba(0,0,0,0.74)");
      rg.addColorStop(0.07, "rgba(120,70,8,0.60)");
      rg.addColorStop(0.5,  "rgba(160,90,12,0.45)");
      rg.addColorStop(0.93, "rgba(120,70,8,0.60)");
      rg.addColorStop(1,    "rgba(0,0,0,0.74)");
      ctx.fillStyle = rg;
      ctx.fillRect(x, 1, rw, H - 2);
      // Deep gap shadow
      ctx.fillStyle = "rgba(0,0,0,0.76)";
      ctx.fillRect(x + rw, 0, sw - rw, H);
    }
  }

  // Tick marks + labels (at top of canvas = top of cylinder = most visible from above)
  const N = values.length;
  const stripeW = W / N;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let i = 0; i < N; i++) {
    const x = (i / N) * W;  // tick at U = i/N (aligns with indicator at U=0 for i=0)
    // Tick
    ctx.fillStyle = accentHex;
    ctx.globalAlpha = 0.88;
    ctx.fillRect(x, 0, 2.5, H * 0.21);
    // Label — every value for coarse ring, every other for fine
    if (variant === "coarse" || i % 2 === 0) {
      ctx.globalAlpha = 0.72;
      ctx.font = `bold ${Math.floor(H * 0.26)}px 'Courier New', monospace`;
      ctx.fillText(String(values[i]), x + stripeW * 0.5, H * 0.26);
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// ─── LensRing ───────────────────────────────────────────────────────
interface LensRingProps {
  variant: "fine" | "coarse";
  outerR: number;
  innerR: number;
  height: number;
  posY: number;
  lensX: number;
  values: (string | number)[];
  currentIndex: number;
  onChange: (i: number) => void;
  disabled: boolean;
  feedback?: "green" | "yellow" | "red";
}

function LensRing({
  variant, outerR, innerR, height, posY, lensX,
  values, currentIndex, onChange, disabled, feedback,
}: LensRingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef  = useRef<THREE.MeshStandardMaterial>(null);
  const visualRotY = useRef(0);
  const prevIdx    = useRef(currentIndex);
  const glowT      = useRef(0);
  const n = values.length;

  const accentHex = variant === "fine" ? "#c8c8c8" : "#e2b35a";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const texture = useMemo(() => makeRingTexture(values, variant, accentHex), []);

  // Accumulate rotation (drag right → clockwise from above → negative Y rotation)
  if (prevIdx.current !== currentIndex) {
    visualRotY.current -= (currentIndex - prevIdx.current) * (Math.PI * 2) / n;
    prevIdx.current = currentIndex;
  }

  const prevFeedback = useRef(feedback);
  if (feedback && prevFeedback.current !== feedback) {
    glowT.current = 0.9;
    prevFeedback.current = feedback;
  }

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y, visualRotY.current, 14, dt
    );
    if (matRef.current) {
      if (glowT.current > 0) {
        glowT.current = Math.max(0, glowT.current - dt);
        matRef.current.emissiveIntensity = Math.sin((glowT.current / 0.9) * Math.PI) * 0.55;
      } else {
        matRef.current.emissiveIntensity = THREE.MathUtils.damp(
          matRef.current.emissiveIntensity, 0, 10, dt
        );
      }
    }
  });

  const { onPointerDown, onPointerMove, onPointerUp, onWheel } = useDial(
    values, currentIndex, onChange, disabled
  );

  const emissive =
    feedback === "green" ? "#22c55e" : feedback === "yellow" ? "#eab308" : "#ef4444";
  const capColor = variant === "fine" ? "#202020" : "#3a1e04";

  return (
    <group position={[lensX, posY, 0]}>
      {/* Rotating ring */}
      <group
        ref={groupRef}
        onPointerDown={onPointerDown as never}
        onPointerMove={onPointerMove as never}
        onPointerUp={onPointerUp as never}
        onPointerCancel={onPointerUp as never}
        onWheel={onWheel as never}
      >
        {/* Outer cylindrical surface with knurling texture */}
        <mesh castShadow>
          <cylinderGeometry args={[outerR, outerR, height, 128, 1, true]} />
          <meshStandardMaterial
            ref={matRef}
            map={texture}
            color={variant === "fine" ? "#1b1b1b" : "#4a2a08"}
            roughness={variant === "fine" ? 0.94 : 0.91}
            metalness={0.04}
            envMapIntensity={0.12}
            emissive={emissive}
            emissiveIntensity={0}
          />
        </mesh>
        {/* Top annular cap */}
        <mesh position={[0, height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[innerR, outerR, 128]} />
          <meshStandardMaterial color={capColor} metalness={0.52} roughness={0.48} envMapIntensity={0.18} />
        </mesh>
        {/* Bottom annular cap */}
        <mesh position={[0, -height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[innerR, outerR, 128]} />
          <meshStandardMaterial color={capColor} metalness={0.3} roughness={0.7} />
        </mesh>
      </group>

      {/* Fixed indicator — lit marker on the near (+Z) side */}
      <mesh position={[0, height / 2 + 0.01, outerR + 0.055]}>
        <boxGeometry args={[0.09, 0.030, 0.11]} />
        <meshStandardMaterial
          color={accentHex}
          emissive={accentHex}
          emissiveIntensity={1.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// ─── ShutterDial ────────────────────────────────────────────────────
function ShutterDial({
  position, values, currentIndex, onChange, disabled,
}: {
  position: [number, number, number];
  values: (string | number)[];
  currentIndex: number;
  onChange: (i: number) => void;
  disabled: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const visualRotY = useRef(0);
  const prevIdx = useRef(currentIndex);
  const n = values.length;

  if (prevIdx.current !== currentIndex) {
    visualRotY.current -= (currentIndex - prevIdx.current) * (Math.PI * 2) / n;
    prevIdx.current = currentIndex;
  }

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y, visualRotY.current, 14, dt
    );
  });

  const { onPointerDown, onPointerMove, onPointerUp, onWheel } = useDial(
    values, currentIndex, onChange, disabled, 0.025
  );

  const texture = useMemo(() => {
    const W = 1024, H = 160;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#1a1714"; ctx.fillRect(0, 0, W, H);
    const img = ctx.getImageData(0, 0, W, H); const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = (Math.random() - 0.5) * 20;
      d[i] = Math.max(0, Math.min(255, d[i]+g));
      d[i+1] = Math.max(0, Math.min(255, d[i+1]+g));
      d[i+2] = Math.max(0, Math.min(255, d[i+2]+g));
    }
    ctx.putImageData(img, 0, 0);
    const lg = ctx.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, "rgba(255,255,255,0.13)"); lg.addColorStop(0.35, "rgba(0,0,0,0)");
    lg.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    const count = 36; const sw = W / count;
    for (let i = 0; i < count; i += 2) {
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(i*sw, 0, sw*0.5, H);
    }
    const N = values.length; const tsw = W / N;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let i = 0; i < N; i++) {
      const x = (i / N) * W;
      ctx.fillStyle = "#c8b090"; ctx.globalAlpha = 0.86;
      ctx.fillRect(x, 0, 2.5, H * 0.2);
      if (i % 2 === 0) {
        ctx.globalAlpha = 0.7;
        ctx.font = `bold ${Math.floor(H*0.25)}px 'Courier New', monospace`;
        ctx.fillText(String(values[i]).replace("1/",""), x + tsw*0.5, H*0.25);
      }
      ctx.globalAlpha = 1;
    }
    const tex = new THREE.CanvasTexture(canvas); tex.wrapS = THREE.RepeatWrapping;
    return tex;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const R = 0.40, H = 0.30;
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[R + 0.04, R + 0.04, 0.038, 48]} />
        <meshStandardMaterial color="#111" metalness={0.88} roughness={0.12} />
      </mesh>
      <group
        ref={groupRef}
        onPointerDown={onPointerDown as never} onPointerMove={onPointerMove as never}
        onPointerUp={onPointerUp as never} onPointerCancel={onPointerUp as never}
        onWheel={onWheel as never}
      >
        <mesh castShadow>
          <cylinderGeometry args={[R, R, H, 64, 1, true]} />
          <meshStandardMaterial map={texture} color="#1a1714" roughness={0.82} metalness={0.08} envMapIntensity={0.18} />
        </mesh>
        <mesh position={[0, H/2, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <circleGeometry args={[R, 64]} />
          <meshStandardMaterial color="#141210" metalness={0.62} roughness={0.38} envMapIntensity={0.28} />
        </mesh>
        <mesh position={[0, -H/2, 0]} rotation={[Math.PI/2, 0, 0]}>
          <circleGeometry args={[R, 64]} />
          <meshStandardMaterial color="#101010" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
      <mesh position={[0, H/2 + 0.01, R + 0.042]}>
        <boxGeometry args={[0.05, 0.02, 0.06]} />
        <meshStandardMaterial color="#e2b35a" emissive="#e2b35a" emissiveIntensity={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─── ShutterButton ──────────────────────────────────────────────────
function ShutterButton({
  position, onFire, disabled, firing,
}: {
  position: [number, number, number];
  onFire: () => void;
  disabled: boolean;
  firing: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshStandardMaterial>(null);
  const pressing = useRef(false);

  useFrame((_, dt) => {
    if (!meshRef.current || !matRef.current) return;
    meshRef.current.position.y = THREE.MathUtils.damp(
      meshRef.current.position.y, pressing.current ? -0.032 : 0, 20, dt
    );
    matRef.current.emissiveIntensity = THREE.MathUtils.damp(
      matRef.current.emissiveIntensity, firing ? 0.55 : 0, 8, dt
    );
  });

  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.20, 0.22, 0.045, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.82} roughness={0.18} />
      </mesh>
      <mesh
        ref={meshRef} position={[0, 0.038, 0]}
        onPointerDown={(e) => { if (disabled) return; e.stopPropagation(); pressing.current = true; }}
        onPointerUp={() => { if (disabled) return; pressing.current = false; onFire(); }}
        onPointerLeave={() => { pressing.current = false; }}
        onPointerCancel={() => { pressing.current = false; }}
        castShadow
      >
        <cylinderGeometry args={[0.155, 0.175, 0.082, 32]} />
        <meshStandardMaterial
          ref={matRef}
          color={disabled ? "#262626" : "#706860"}
          metalness={0.72} roughness={0.28}
          emissive="#cc2222" emissiveIntensity={0}
        />
      </mesh>
      <mesh position={[0, 0.082, 0]}>
        <cylinderGeometry args={[0.058, 0.058, 0.01, 24]} />
        <meshStandardMaterial
          color={firing ? "#ff4444" : "#cc2222"}
          emissive="#cc2222" emissiveIntensity={firing ? 1.4 : 0.4}
        />
      </mesh>
    </group>
  );
}

// ─── Main scene ──────────────────────────────────────────────────────
interface SceneProps {
  shutterIdx: number; apertureIdx: number; focalIdx: number;
  onShutterChange: (i: number) => void;
  onApertureChange: (i: number) => void;
  onFocalChange: (i: number) => void;
  onFire: () => void;
  disabled: boolean; firing: boolean;
  lastAttemptFeedback?: AttemptFeedback;
}

const LENS_X = -0.28;

function CameraScene(props: SceneProps) {
  const { shutterIdx, apertureIdx, focalIdx,
    onShutterChange, onApertureChange, onFocalChange,
    onFire, disabled, firing, lastAttemptFeedback } = props;

  return (
    <>
      <ambientLight intensity={0.55} color="#f0e8e0" />
      <directionalLight position={[2, 10, 3]} intensity={1.4} castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.001} color="#ffe8d0" />
      <directionalLight position={[-5, 6, -2]} intensity={0.38} color="#d0e4ff" />
      <directionalLight position={[0, 3, 9]} intensity={1.6} color="#fff4e8" />
      <pointLight position={[0, 5, 2]} intensity={0.22} color="#fff8f0" />
      <Environment preset="studio" />

      {/* Camera body */}
      <RoundedBox args={[5.8, 0.36, 3.6]} radius={0.14} smoothness={4}
        position={[0.1, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#181818" metalness={0.50} roughness={0.56} envMapIntensity={0.22} />
      </RoundedBox>

      {/* Rubber grip (left) */}
      <RoundedBox args={[1.0, 0.52, 3.6]} radius={0.14} smoothness={4}
        position={[-2.5, 0.08, 0]} castShadow>
        <meshStandardMaterial color="#111111" metalness={0.12} roughness={0.94} envMapIntensity={0.08} />
      </RoundedBox>

      {/* Top plate — raised right section */}
      <RoundedBox args={[2.8, 0.08, 0.56]} radius={0.04} smoothness={3}
        position={[1.1, 0.22, -1.5]} castShadow>
        <meshStandardMaterial color="#1c1c1c" metalness={0.68} roughness={0.32} envMapIntensity={0.28} />
      </RoundedBox>

      {/* Hot shoe */}
      <RoundedBox args={[0.62, 0.06, 0.28]} radius={0.02} smoothness={2}
        position={[-0.1, 0.25, -1.5]}>
        <meshStandardMaterial color="#383838" metalness={0.92} roughness={0.08} />
      </RoundedBox>

      {/* Lens mount ring */}
      <mesh position={[LENS_X, 0.20, 0]} castShadow>
        <cylinderGeometry args={[1.72, 1.76, 0.055, 64]} />
        <meshStandardMaterial color="#282828" metalness={0.92} roughness={0.10} envMapIntensity={0.75} />
      </mesh>

      {/* Lens barrel inner */}
      <mesh position={[LENS_X, 0.46, 0]} castShadow>
        <cylinderGeometry args={[1.06, 1.09, 0.56, 64]} />
        <meshStandardMaterial color="#141414" metalness={0.78} roughness={0.24} envMapIntensity={0.18} />
      </mesh>

      {/* Focal length ring — FINE knurling */}
      <LensRing
        variant="fine" outerR={1.58} innerR={1.37} height={0.88}
        posY={0.47} lensX={LENS_X}
        values={FOCAL_LENGTHS} currentIndex={focalIdx} onChange={onFocalChange}
        disabled={disabled} feedback={lastAttemptFeedback?.focal}
      />

      {/* Aperture ring — COARSE knurling */}
      <LensRing
        variant="coarse" outerR={1.32} innerR={1.10} height={0.72}
        posY={0.47} lensX={LENS_X}
        values={APERTURES} currentIndex={apertureIdx} onChange={onApertureChange}
        disabled={disabled} feedback={lastAttemptFeedback?.aperture}
      />

      {/* Chrome separator ring between the two rings */}
      <mesh position={[LENS_X, 0.47, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.355, 0.016, 12, 64]} />
        <meshStandardMaterial color="#585858" metalness={0.96} roughness={0.06} envMapIntensity={0.55} />
      </mesh>

      {/* Lens glass — dark recessed */}
      <mesh position={[LENS_X, 0.74, 0]}>
        <cylinderGeometry args={[0.63, 0.63, 0.028, 64]} />
        <meshStandardMaterial color="#03060c" roughness={0.0} metalness={0.18} envMapIntensity={0.45} />
      </mesh>
      {/* Concentric depth rings */}
      {([0.50, 0.36, 0.22] as number[]).map((r, i) => (
        <mesh key={i} position={[LENS_X, 0.754, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.009, 10, 64]} />
          <meshStandardMaterial color="#0a1428" transparent opacity={0.72 - i * 0.16}
            metalness={0.4} roughness={0.4} />
        </mesh>
      ))}

      {/* Shutter speed dial */}
      <ShutterDial
        position={[1.95, 0.26, -1.1]}
        values={SHUTTER_SPEEDS} currentIndex={shutterIdx}
        onChange={onShutterChange} disabled={disabled}
      />

      {/* Shutter release button */}
      <ShutterButton
        position={[2.0, 0.22, 0.44]}
        onFire={onFire} disabled={disabled} firing={firing}
      />

      {/* Decorative left dial (aesthetic only) */}
      <mesh position={[-2.05, 0.24, -1.18]}>
        <cylinderGeometry args={[0.30, 0.30, 0.17, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.72} roughness={0.28} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[-2.05 + Math.cos(a)*0.30, 0.32, -1.18 + Math.sin(a)*0.30]}>
            <cylinderGeometry args={[0.006, 0.006, 0.038, 6]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        );
      })}

      {/* Corner screws */}
      {([ [-2.55,0.20,-1.68],[2.65,0.20,-1.68],[-2.55,0.20,1.68],[2.65,0.20,1.68] ] as [number,number,number][]).map((p, i) => (
        <mesh key={i} position={p}>
          <cylinderGeometry args={[0.068, 0.068, 0.028, 16]} />
          <meshStandardMaterial color="#242424" metalness={0.84} roughness={0.16} />
        </mesh>
      ))}

      <ContactShadows position={[0, -0.20, 0]} opacity={0.48} scale={12} blur={2.6} far={2} />
    </>
  );
}

// ─── Canvas wrapper ──────────────────────────────────────────────────
export default function Camera3D(props: SceneProps) {
  return (
    <div style={{ width: "100%", height: "clamp(280px, 58vw, 380px)", position: "relative" }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.06,
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 7.5, 5.5], fov: 38, near: 0.1, far: 100 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <CameraScene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
