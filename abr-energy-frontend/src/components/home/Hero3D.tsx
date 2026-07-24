'use client';
import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 0.5 + 0.5;
  return x - Math.floor(x);
};

/** Cinematic solar sphere */
function SunSphere({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const ref = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.06 + mouse.current.x * 0.1;
    ref.current.rotation.x = Math.sin(t * 0.12) * 0.04 + mouse.current.y * 0.05;
    ref.current.position.y = Math.sin(t * 0.25) * 0.18;
    ref.current.position.x = mouse.current.x * 0.25;
    ref.current.position.z = mouse.current.y * 0.15;

    if (glowRef.current) {
      glowRef.current.position.x = mouse.current.x * 0.4;
      glowRef.current.position.y = mouse.current.y * 0.25;
      glowRef.current.scale.setScalar(4.5 + Math.sin(t * 0.3) * 0.3);
    }
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.06} />
      </mesh>
      <Float speed={0.4} rotationIntensity={0.08} floatIntensity={0.25}>
        <mesh ref={ref}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color="#059669"
            emissive="#34D399"
            emissiveIntensity={1.0}
            roughness={0.1}
            metalness={0.95}
            distort={0.2}
            speed={1.2}
          />
        </mesh>
      </Float>
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial color="#A7F3D0" />
      </mesh>
    </group>
  );
}

/** Energy ring */
function EnergyRing({ radius, y, speed, opacity }: { radius: number; y: number; speed: number; opacity: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed + y) * 0.12;
    ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * speed) * 0.015);
  });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.04, 128]} />
      <meshBasicMaterial color="#34D399" transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Solar panel with cell grid pattern */
function SolarCell({ position, rotation, mouse }: {
  position: [number, number, number];
  rotation: [number, number, number];
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    ref.current.position.x = position[0] + mouse.current.x * 0.12 * (1 + position[2] * 0.1);
    ref.current.position.y = position[1] + mouse.current.y * 0.08 * (1 + position[2] * 0.1);
    ref.current.rotation.z = rotation[2] + Math.sin(Date.now() * 0.00035 + position[0] * 10) * 0.025;
    ref.current.rotation.x = rotation[0] + Math.sin(Date.now() * 0.0002 + position[1] * 8) * 0.015;
  });

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.7, 0.025, 0.35]} />
        <meshPhysicalMaterial color="#0F172A" metalness={0.95} roughness={0.05} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.015, 0]}>
        <planeGeometry args={[0.6, 0.28]} />
        <meshPhysicalMaterial color="#1E40AF" emissive="#3B82F6" emissiveIntensity={0.12} metalness={0.3} roughness={0.6} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Particles */
function Particles({ count = 300 }: { count?: number }) {
  const points = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = (seededRandom(i * 100) - 0.5) * 20;
    return positions;
  }, [count]);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(points, 3));
    return g;
  }, [points]);

  return (
    <points geometry={geom}>
      <pointsMaterial size={0.035} color="#34D399" transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

function Scene({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = mouse.current.y * 0.04 + Math.sin(state.clock.elapsedTime * 0.03) * 0.02;
      groupRef.current.rotation.y = mouse.current.x * 0.08 + Math.sin(state.clock.elapsedTime * 0.02) * 0.03;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.12} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-3, -2, 4]} intensity={0.6} color="#34D399" />
      <pointLight position={[0, 0, 0]} intensity={4} color="#10B981" distance={30} decay={1.2} />
      <pointLight position={[-4, 3, 2]} intensity={0.8} color="#059669" distance={15} />

      <Stars radius={120} depth={60} count={2000} factor={2.5} saturation={0} fade speed={0.4} />

      <SunSphere mouse={mouse} />
      <Particles count={400} />

      <EnergyRing radius={2.8} y={-1.2} speed={0.25} opacity={0.1} />
      <EnergyRing radius={3.3} y={0} speed={0.35} opacity={0.08} />
      <EnergyRing radius={3.8} y={1.2} speed={0.45} opacity={0.06} />

      <SolarCell position={[-4.2, 1.8, -3]} rotation={[0.15, 0.4, 0.08]} mouse={mouse} />
      <SolarCell position={[4, -1.5, -2]} rotation={[-0.1, -0.35, -0.05]} mouse={mouse} />
      <SolarCell position={[-3.2, -2.5, -4]} rotation={[0.25, -0.2, 0.12]} mouse={mouse} />
      <SolarCell position={[4.8, 2.2, -3.5]} rotation={[-0.2, 0.5, -0.1]} mouse={mouse} />
      <SolarCell position={[2.2, -0.5, -5]} rotation={[0.1, 0.2, 0.05]} mouse={mouse} />
      <SolarCell position={[-2.8, 0.8, -4.5]} rotation={[-0.15, -0.3, -0.08]} mouse={mouse} />
    </group>
  );
}

export function Hero3D() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0 z-0"
      onMouseMove={(e) => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene mouse={mouse} />
        </Suspense>
      </Canvas>
    </div>
  );
}
