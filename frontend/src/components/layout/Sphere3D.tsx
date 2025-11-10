import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

function Particles() {
  const pointsRef = useRef<THREE.Points>(null!);

  // Génération des particules
  const particles = useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      const radius = 2.2;
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const theta = Math.acos(costheta);
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);
      positions.set([x, y, z], i * 3);
    }
    return positions;
  }, []);

  useFrame((state) => {
    pointsRef.current.rotation.y += 0.002; // Rotation douce
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.3;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ff9800"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
}

export default function SphereParticles() {
  return (
    <div className="w-full h-screen bg-transparent">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <Particles />
      </Canvas>
    </div>
  );
}
