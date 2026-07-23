'use client';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stars } from '@react-three/drei';

function SunSphere() {
  const ref = useRef<import('three').Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.1;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={ref} scale={2.5}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#059669"
          emissive="#10B981"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

function FloatingPanel({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const ref = useRef<import('three').Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.z = rotation[2] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.05;
  });

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <boxGeometry args={[0.8, 0.05, 0.4]} />
      <meshPhysicalMaterial color="#1E293B" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
    </mesh>
  );
}

function EnergyRings() {
  const ref = useRef<import('three').Group>(null!);
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.05;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <group ref={ref}>
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, (i - 1) * 1.5, 0]}>
          <ringGeometry args={[3 + i * 0.5, 3.2 + i * 0.5, 64]} />
          <meshBasicMaterial color="#059669" transparent opacity={0.15 - i * 0.04} side={2} />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#10B981" distance={20} />
      
      <SunSphere />
      <EnergyRings />
      
      {/* Floating panels */}
      <FloatingPanel position={[-3.5, 1.5, -2]} rotation={[0.2, 0.3, 0.1]} />
      <FloatingPanel position={[3.5, -1, -1.5]} rotation={[-0.1, -0.3, -0.1]} />
      <FloatingPanel position={[-2.5, -2, -3]} rotation={[0.3, -0.2, 0.2]} />
      <FloatingPanel position={[4, 2, -2.5]} rotation={[-0.2, 0.4, -0.15]} />
    </>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
