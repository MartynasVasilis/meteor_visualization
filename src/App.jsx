import React, { useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import Planet from "../components/Planet";
import Sun from "../components/Sun";

function CameraFollow({ planetRef, zoom }) {
  const { camera } = useThree();
  useFrame(() => {
    if (planetRef.current) {
      const worldPos = new THREE.Vector3();
      planetRef.current.getWorldPosition(worldPos);
      camera.position.set(worldPos.x, worldPos.y + zoom / 2, worldPos.z + zoom);
      camera.lookAt(worldPos);
    }
  });
  return null;
}

export default function App() {
  const planetRef = useRef();
  const [zoom, setZoom] = useState(25);

  // Handles both mouse wheel and touchpad scroll
  const handleWheel = useCallback((e) => {
    e.preventDefault(); // prevent page scroll
    setZoom((z) => Math.max(5, Math.min(200, z + e.deltaY * 0.1)));
  }, []);

  // Attach listener globally for better touchpad support
  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 10, 25] }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 0]} intensity={2} />
        <Stars radius={100} depth={500} count={10000} factor={10} />
        <Sun />
        <Planet ref={planetRef} distance={300} />
        <CameraFollow planetRef={planetRef} zoom={zoom} />
      </Canvas>
    </div>
  );
}
