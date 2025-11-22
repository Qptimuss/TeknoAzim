import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

// This component creates the individual stars and their rotation logic
function Stars() {
  const groupRef = useRef<THREE.Group>(null);

  // Create 50 stars in a circular pattern
  const stars = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const radius = 1.1; // How far the stars are from the center
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 0.2; // Slight depth variation
      temp.push({ id: i, position: new THREE.Vector3(x, y, z) });
    }
    return temp;
  }, []);

  // Rotate the group of stars on every frame
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z -= delta * 0.3; // Rotation speed
    }
  });

  return (
    <group ref={groupRef}>
      {stars.map(star => (
        <mesh key={star.id} position={star.position}>
          <sphereGeometry args={[0.015, 8, 8]} /> {/* Small star size */}
          <meshStandardMaterial
            color="white"
            emissive="white"
            emissiveIntensity={2}
            roughness={0.5}
            metalness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// This is the main component that wraps the Avatar
interface NovaFrameProps {
  children: React.ReactNode;
  animated?: boolean;
}

export default function NovaFrame({ children, animated = true }: NovaFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This ensures the component has mounted on the client, and the ref is available.
    setIsMounted(true);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* The gradient background and shape from the original CSS */}
      <div className="absolute inset-0 p-1 bg-gradient-to-tr from-purple-500 via-indigo-700 to-fuchsia-500 rounded-full shadow-[0_0_20px_theme(colors.purple.400)] animate-pulse" />
      
      {/* The 3D canvas for the stars, layered on top */}
      <div className="absolute inset-[-10%] pointer-events-none">
        {animated && isMounted && containerRef.current && (
          <Canvas 
            camera={{ position: [0, 0, 2], fov: 75 }}
            eventSource={containerRef} // Explicitly set the event source
            className="pointer-events-none" // Ensure canvas itself doesn't capture events
          >
            <ambientLight intensity={0.5} />
            <Stars />
          </Canvas>
        )}
      </div>

      {/* The actual content (Avatar) */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}