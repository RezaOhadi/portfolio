"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { InstancedMesh, Object3D, type Group } from "three";
import { universeConfig } from "@/config/home-universe";
import { CameraRig, type JourneyMotion } from "./CameraRig";

interface Props {
  motion: RefObject<JourneyMotion>;
  mobile: boolean;
  active: boolean;
  selected: number;
  workCount: number;
  onReady: () => void;
  onFailure: () => void;
}

function Strings({ count }: { count: number }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const object = new Object3D();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 4.5 + (i % 5) * 0.14;
      object.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72, -19);
      object.rotation.set(Math.PI / 2, 0, Math.sin(angle) * 0.12);
      object.updateMatrix();
      mesh.current.setMatrixAt(i, object.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [count]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
    <cylinderGeometry args={[0.012, 0.012, 78, 5]} />
    <meshStandardMaterial color="#b49470" metalness={0.75} roughness={0.38} />
  </instancedMesh>;
}

function Dust({ count }: { count: number }) {
  const points = useMemo(() => {
    const positions = new Float32Array(count * 3);
    // Seeded positions remain stable across remounts and quality changes.
    let seed = 29;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 15;
      positions[i * 3 + 1] = (random() - 0.5) * 9;
      positions[i * 3 + 2] = 8 - random() * 64;
    }
    return positions;
  }, [count]);
  return <points>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry>
    <pointsMaterial color="#cfb799" size={0.018} transparent opacity={0.45} depthWrite={false} />
  </points>;
}

function Resonance({ index, selected }: { index: number; selected: boolean }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const scale = selected ? 1.08 : 0.85;
    const next = group.current.scale.x + (scale - group.current.scale.x) * (1 - Math.exp(-6 * delta));
    group.current.scale.setScalar(next);
  });
  return <group ref={group} position={[2.3 + index * 0.55, 0.25 - index * 0.2, -31 - index * 3]} rotation={[0.35, -0.6, 0.3 + index * 0.4]}>
    {Array.from({ length: 7 }, (_, ring) => <mesh key={ring} rotation={[ring * 0.13, ring * 0.19, 0]}>
      <torusGeometry args={[1.1 + ring * 0.045, 0.012, 5, 96]} />
      <meshStandardMaterial color={selected ? "#dfc8a3" : "#786651"} metalness={0.65} roughness={0.4} />
    </mesh>)}
  </group>;
}

function Ready({ onReady }: { onReady: () => void }) {
  const sent = useRef(false);
  useFrame(() => { if (!sent.current) { sent.current = true; onReady(); } });
  return null;
}

export default function UniverseCanvas(props: Props) {
  const { motion, mobile, active, selected, workCount, onReady, onFailure } = props;
  const quality = mobile ? universeConfig.mobile : universeConfig.desktop;
  const element = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = element.current;
    if (!canvas) return;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [onFailure]);
  return <Canvas
    ref={element}
    frameloop={active ? "always" : "never"}
    dpr={[1, quality.dpr]}
    camera={{ position: [0, 0, 12], fov: universeConfig.camera.fov, near: 0.1, far: 100 }}
    gl={{ alpha: false, antialias: !mobile, powerPreference: "default" }}
    fallback={null}
  >
    <color attach="background" args={["#060608"]} />
    <fog attach="fog" args={["#060608", 7, 40]} />
    <ambientLight intensity={0.5} />
    <pointLight position={[1, 3, 6]} color="#e8c6a0" intensity={45} distance={35} />
    <pointLight position={[-3, 2, -16]} color="#d5ae88" intensity={65} distance={35} />
    <pointLight position={[2, 3, -33]} color="#f2eee6" intensity={55} distance={25} />
    <Strings count={quality.strings} />
    <Dust count={quality.particles} />
    {[0, 1, 2, 3, 4].map((index) => <mesh key={index} position={[0, -1.3, -index * 12]} rotation={[0.15, 0, 0.12]}>
      <torusGeometry args={[5.7, 0.14, 8, 80, Math.PI * 1.35]} />
      <meshStandardMaterial color="#322b23" metalness={0.4} roughness={0.6} />
    </mesh>)}
    {Array.from({ length: workCount }, (_, index) => <Resonance key={index} index={index} selected={selected === index} />)}
    <CameraRig motion={motion} />
    <Ready onReady={onReady} />
  </Canvas>;
}
