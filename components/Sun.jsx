import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const EARTH_RADIUS = 0.8;
const SUN_RADIUS = EARTH_RADIUS * 10;

const Sun = React.forwardRef(({ size = SUN_RADIUS }, ref) => {
  const wire1 = useRef();
  const wire2 = useRef();

  useFrame(({ clock }) => {
    if (wire1.current) {
      wire1.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
    if (wire2.current) {
      wire2.current.rotation.x = clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group ref={ref} position={[0, 0, 0]}>
      <mesh>
        <sphereGeometry args={[size * 0.97, 32, 32]} />
        <meshBasicMaterial color="black" />
      </mesh>
      <mesh ref={wire1}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color="#39ff14"
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh ref={wire2}>
        <sphereGeometry args={[size * 1.03, 32, 32]} />
        <meshBasicMaterial
          color="#39ff14"
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
});

export default Sun;
