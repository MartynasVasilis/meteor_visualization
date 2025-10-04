import React, { useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import Planet from "../components/Planet";
import Asteroid from "../components/Asteroid";
import Sun from "../components/Sun";


function CameraFollow({ planetRef, zoom, rotationSpeed = 0.2 }) {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    if (planetRef.current) {
      const worldPos = new THREE.Vector3();
      planetRef.current.getWorldPosition(worldPos);

      const t = clock.getElapsedTime() * rotationSpeed;

      // Circular orbit around the planet
      const radius = zoom;
      const x = worldPos.x + Math.cos(t) * radius;
      const z = worldPos.z + Math.sin(t) * radius;
      const y = worldPos.y + zoom * 0.4; // slightly above planet

      camera.position.set(x, y, z);
      camera.lookAt(worldPos);
    }
  });
  return null;
}


export default function App() {
  const planetRef = useRef();
  const [zoom, setZoom] = useState(50);

  // Mouse wheel zoom in/out
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => Math.max(10, Math.min(200, z + e.deltaY * 0.1)));
  }, []);

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 50, 150], fov: 60 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 0, 0]} intensity={2} />

        {/* Background */}
        <Stars radius={300} depth={60} count={5000} factor={7} />

        {/* Sun */}
        <Sun />

        {/* Earth */}
        <Planet ref={planetRef} distance={200} />

        {/* Asteroid (huge + following Earth) */}
        <Asteroid centerRef={planetRef} distance={20} size={0.1} speed={1} />

        {/* Camera follows Earth */}
        <CameraFollow planetRef={planetRef} zoom={zoom} />
      </Canvas>
    </div>
  );
}
