import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import Planet from "../components/Planet";

function ControlsFollow({ planetRef, controlsRef }) {
  useFrame(() => {
    if (planetRef.current && controlsRef.current) {
      const pos = planetRef.current.position;
      controlsRef.current.target.set(pos.x, pos.y, pos.z);
      controlsRef.current.update();
    }
  });
  return null;
}

export default function App() {
  const planetRef = useRef();
  const controlsRef = useRef();

  return (
    <Canvas camera={{ position: [0, 10, 25] }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={2} />
      <Stars />
      <Planet ref={planetRef} />
      <OrbitControls ref={controlsRef} enablePan={false} enableRotate={false} />
      <ControlsFollow planetRef={planetRef} controlsRef={controlsRef} />
    </Canvas>
  );
}
