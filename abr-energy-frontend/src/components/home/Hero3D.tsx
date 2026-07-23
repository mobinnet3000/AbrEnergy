'use client';
import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Seeded random for stable particle positions
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 0.5 + 0.5;
  return x - Math.floor(x);
};

/** Cinematic 3D solar energy scene with mouse parallax */
function SunSphere({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const ref = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    // Rotate slowly
    ref.current.rotation.y = state.clock.elapsedTime * 0.08;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.05;
    // Float up/down
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    // Mouse parallax (subtle)
    ref.current.position.x = mouse.current.x * 0.3;
    ref.current.position.z = mouse.current.y * 0.2;

    // Glow follow
    if (glowRef.current) {
      glowRef.current.position.x = mouse.current.x * 0.5;
      glowRef.current.position.y = mouse.current.y * 0.3;
    }
  });

  return (
    <group>
      {/* Outer glow aura */}
      <mesh ref={glowRef} scale={5}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.08} />
      </mesh>
      {/* Core sun */}
      <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh ref={ref}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color="#059669"
            emissive="#34D399"
            emissiveIntensity={0.8}
            roughness={0.15}
            metalness={0.9}
            distort={0.25}
            speed={1.5}
          />
        </mesh>
      </Float>
      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#A7F3D0" />
      </mesh>
    </group>
  );
}

/** Energy wave ring */
function EnergyRing({ radius, y, speed, opacity }: { radius: number; y: number; speed: number; opacity: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed + y) * 0.15;
    ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * speed) * 0.02);
  });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.05, 128]} />
      <meshBasicMaterial color="#34D399" transparent opacity={opacity} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Floating solar panel cell */
function SolarCell({ position, rotation, mouse }: {
  position: [number, number, number];
  rotation: [number, number, number];
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    // Mouse parallax per panel
    ref.current.position.x = position[0] + mouse.current.x * 0.15 * (1 + position[2] * 0.1);
    ref.current.position.y = position[1] + mouse.current.y * 0.1 * (1 + position[2] * 0.1);
    // Gentle sway using Date.now() instead of state
    ref.current.rotation.z = rotation[2] + Math.sin(Date.now() * 0.0004 + position[0] * 10) * 0.03;
  });

  return (
    <group ref={ref} position={position} rotation={rotation}>
      {/* Panel body */}
      <mesh>
        <boxGeometry args={[0.7, 0.03, 0.35]} />
        <meshPhysicalMaterial color="#0F172A" metalness={0.95} roughness={0.05} transparent opacity={0.6} />
      </mesh>
      {/* Blue shimmer surface */}
      <mesh position={[0, 0.02, 0]}>
        <planeGeometry args={[0.6, 0.28]} />
        <meshPhysicalMaterial
          color="#1E40AF"
          emissive="#3B82F6"
          emissiveIntensity={0.15}
          metalness={0.3}
          roughness={0.6}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Floating energy particles */
function Particles({ count = 200 }: { count?: number }) {
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
      <pointsMaterial size={0.04} color="#34D399" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function Scene({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    // Rotate the whole scene group based on mouse instead of moving camera
    if (groupRef.current) {
      groupRef.current.rotation.x = mouse.current.y * 0.05;
      groupRef.current.rotation.y = mouse.current.x * 0.1;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Ambient + cinematic lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-3, -2, 4]} intensity={0.5} color="#34D399" />
      <pointLight position={[0, 0, 0]} intensity={3} color="#10B981" distance={25} decay={1.5} />
      <pointLight position={[-4, 3, 2]} intensity={1} color="#059669" distance={15} />

      {/* Starfield */}
      <Stars radius={120} depth={60} count={1500} factor={3} saturation={0} fade speed={0.5} />

      {/* Core scene */}
      <SunSphere mouse={mouse} />
      <Particles count={300} />

      {/* Energy rings at different heights */}
      <EnergyRing radius={2.8} y={-1.2} speed={0.3} opacity={0.12} />
      <EnergyRing radius={3.2} y={0} speed={0.4} opacity={0.1} />
      <EnergyRing radius={3.6} y={1.2} speed={0.5} opacity={0.08} />

      {/* Solar panels with depth */}
      <SolarCell position={[-4, 1.8, -3]} rotation={[0.15, 0.4, 0.08]} mouse={mouse} />
      <SolarCell position={[3.8, -1.5, -2]} rotation={[-0.1, -0.35, -0.05]} mouse={mouse} />
      <SolarCell position={[-3, -2.5, -4]} rotation={[0.25, -0.2, 0.12]} mouse={mouse} />
      <SolarCell position={[4.5, 2.2, -3.5]} rotation={[-0.2, 0.5, -0.1]} mouse={mouse} />
      <SolarCell position={[2, -0.5, -5]} rotation={[0.1, 0.2, 0.05]} mouse={mouse} />
      <SolarCell position={[-2.5, 0.8, -4.5]} rotation={[-0.15, -0.3, -0.08]} mouse={mouse} />
    </group>
  );
}

export function Hero3D() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0 z-0"
      onMouseMove={(e) => {
        // Normalize mouse to [-1, 1] range
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
