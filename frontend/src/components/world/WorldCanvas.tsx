import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The persistent 3D world rendered behind the whole page.
 * The camera flies along a path as the user scrolls; the mouse adds parallax.
 */

const scrollState = { progress: 0, mouseX: 0, mouseY: 0 };

if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollState.progress = max > 0 ? window.scrollY / max : 0;
    },
    { passive: true },
  );
  window.addEventListener(
    "pointermove",
    (e) => {
      scrollState.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );
}

/* ------------------------------------------------------------------ */
/* Star / dust particle field                                          */
/* ------------------------------------------------------------------ */
function ParticleField({ count = 1600 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const palette = [new THREE.Color("#8A7BEF"), new THREE.Color("#0891CF"), new THREE.Color("#e6e9f2")];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 90 - 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 12;
      const c = palette[i % 3];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = Math.random();
    }
    return { positions, colors, sizes };
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.008;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = 0.55 + Math.sin(clock.elapsedTime * 0.6) * 0.12;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Neural constellation: nodes, edges, and pulses travelling on edges  */
/* ------------------------------------------------------------------ */
function NeuralNet() {
  const group = useRef<THREE.Group>(null);
  const pulsesRef = useRef<THREE.Points>(null);

  const { nodes, edges, linePositions } = useMemo(() => {
    const rng = (min: number, max: number) => min + Math.random() * (max - min);
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < 56; i++) {
      nodes.push(new THREE.Vector3(rng(-16, 16), rng(-30, 4), rng(-14, -4)));
    }
    const edges: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      const dists = nodes
        .map((n, j) => ({ j, d: nodes[i].distanceTo(n) }))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      for (const { j } of dists) {
        if (!edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) {
          edges.push([i, j]);
        }
      }
    }
    const linePositions = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], k) => {
      linePositions.set([nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z], k * 6);
    });
    return { nodes, edges, linePositions };
  }, []);

  const pulseData = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        edge: Math.floor(Math.random() * edges.length),
        t: Math.random(),
        speed: 0.15 + Math.random() * 0.35,
      })),
    [edges.length],
  );
  const pulsePositions = useMemo(() => new Float32Array(pulseData.length * 3), [pulseData.length]);

  useFrame(({ clock }, delta) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.15;
    }
    if (pulsesRef.current) {
      pulseData.forEach((p, i) => {
        p.t += delta * p.speed;
        if (p.t > 1) {
          p.t = 0;
          p.edge = Math.floor(Math.random() * edges.length);
        }
        const [a, b] = edges[p.edge];
        pulsePositions[i * 3] = THREE.MathUtils.lerp(nodes[a].x, nodes[b].x, p.t);
        pulsePositions[i * 3 + 1] = THREE.MathUtils.lerp(nodes[a].y, nodes[b].y, p.t);
        pulsePositions[i * 3 + 2] = THREE.MathUtils.lerp(nodes[a].z, nodes[b].z, p.t);
      });
      pulsesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#6C5CE7" transparent opacity={0.14} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points ref={pulsesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#A395F4"
          size={0.16}
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {nodes.map((n, i) => (
        <mesh key={i} position={n}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshBasicMaterial color={i % 4 === 0 ? "#0891CF" : "#8A7BEF"} transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Floating wireframe geometry: cubes, icosahedra, glass platforms     */
/* ------------------------------------------------------------------ */
function FloatingShape({
  position,
  kind,
  color,
  scale = 1,
  speed = 1,
}: {
  position: [number, number, number];
  kind: "cube" | "ico" | "torus" | "platform";
  color: string;
  scale?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random() * 100, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + seed;
    ref.current.position.y = position[1] + Math.sin(t * 0.5) * 0.6;
    ref.current.rotation.x = Math.sin(t * 0.2) * 0.5;
    ref.current.rotation.y = t * 0.15;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      {kind === "cube" && <boxGeometry args={[1, 1, 1]} />}
      {kind === "ico" && <icosahedronGeometry args={[0.8, 0]} />}
      {kind === "torus" && <torusGeometry args={[0.7, 0.18, 12, 40]} />}
      {kind === "platform" && <cylinderGeometry args={[1.4, 1.4, 0.08, 6]} />}
      {kind === "platform" ? (
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.25}
          roughness={0.1}
          metalness={0.4}
          transmission={0.5}
          emissive={color}
          emissiveIntensity={0.25}
        />
      ) : (
        <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
      )}
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Volumetric light beams: tall additive gradient planes               */
/* ------------------------------------------------------------------ */
function LightBeam({ position, color, width = 1.6 }: { position: [number, number, number]; color: string; width?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.6)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
    const v = ctx.createLinearGradient(0, 0, 0, 256);
    v.addColorStop(0, "rgba(0,0,0,1)");
    v.addColorStop(0.4, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 64, 256);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.35 + Math.sin(clock.elapsedTime * 0.7 + position[0]) * 0.15;
  });

  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[width, 26]} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Camera rig: flies down through the world as the page scrolls        */
/* ------------------------------------------------------------------ */
function CameraRig() {
  const target = useRef(new THREE.Vector3());

  useFrame(({ camera }, delta) => {
    const p = scrollState.progress;
    // Path: start high, descend through the scene, drift sideways, gentle roll.
    const destY = 2 - p * 34;
    const destX = Math.sin(p * Math.PI * 2) * 3;
    const destZ = 10 - Math.sin(p * Math.PI) * 3;
    const k = 1 - Math.pow(0.001, delta); // framerate-independent smoothing
    camera.position.x += (destX + scrollState.mouseX * 1.1 - camera.position.x) * k;
    camera.position.y += (destY - scrollState.mouseY * 0.8 - camera.position.y) * k;
    camera.position.z += (destZ - camera.position.z) * k;
    target.current.set(destX * 0.4, destY - 1.5, -6);
    camera.lookAt(target.current);
    camera.rotation.z += Math.sin(p * Math.PI * 2) * 0.02;
  });
  return null;
}

/* ------------------------------------------------------------------ */

function Scene() {
  return (
    <>
      <fog attach="fog" args={["#05060C", 14, 46]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[8, 4, 6]} intensity={30} color="#8A7BEF" />
      <pointLight position={[-8, -16, 4]} intensity={26} color="#0891CF" />

      <ParticleField />
      <NeuralNet />

      {/* orbiting / floating geometry scattered along the camera path */}
      <FloatingShape position={[-7, 1, -4]} kind="ico" color="#8A7BEF" scale={1.2} />
      <FloatingShape position={[7.5, -2, -6]} kind="cube" color="#0891CF" scale={0.9} speed={0.7} />
      <FloatingShape position={[-6, -9, -5]} kind="torus" color="#EC4899" scale={1.1} speed={0.8} />
      <FloatingShape position={[6, -13, -7]} kind="ico" color="#059669" scale={0.8} />
      <FloatingShape position={[-8, -18, -6]} kind="cube" color="#8A7BEF" scale={1.3} speed={0.5} />
      <FloatingShape position={[8, -22, -5]} kind="torus" color="#0891CF" scale={0.9} />
      <FloatingShape position={[-5, -27, -7]} kind="ico" color="#D97706" scale={1} speed={0.6} />
      <FloatingShape position={[6.5, -31, -6]} kind="cube" color="#EC4899" scale={0.8} />

      {/* glass platforms — floating islands */}
      <FloatingShape position={[-9, -4, -9]} kind="platform" color="#6C5CE7" scale={1.6} speed={0.4} />
      <FloatingShape position={[9, -11, -10]} kind="platform" color="#0891CF" scale={1.3} speed={0.35} />
      <FloatingShape position={[-8, -24, -9]} kind="platform" color="#EC4899" scale={1.4} speed={0.45} />

      {/* volumetric beams */}
      <LightBeam position={[-11, -6, -12]} color="#6C5CE7" width={2.4} />
      <LightBeam position={[11, -14, -13]} color="#0891CF" width={1.8} />
      <LightBeam position={[0, -26, -14]} color="#EC4899" width={2} />

      <CameraRig />
    </>
  );
}

export function WorldCanvas() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 2, 10], fov: 52 }}
      >
        <Scene />
      </Canvas>
      {/* vertical vignette so text always sits on a readable surface */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,6,12,0.55)_100%)]" />
    </div>
  );
}
