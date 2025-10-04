import React from "react";

const EARTH_RADIUS = 0.8;
const SUN_RADIUS = EARTH_RADIUS * 109;

const Sun = React.forwardRef(({ size = SUN_RADIUS }, ref) => (
  <group ref={ref} position={[0, 0, 0]}>
    {/* Sun sphere with wireframe */}
    <mesh>
      <sphereGeometry args={[size, 64, 64]} />
      <meshBasicMaterial color="yellow" wireframe opacity={0.5} transparent />
    </mesh>
    <mesh>
      <sphereGeometry args={[size + 0.01, 64, 64]} />
      <meshBasicMaterial color="yellow" wireframe opacity={1} transparent />
    </mesh>
  </group>
));

export default Sun;
