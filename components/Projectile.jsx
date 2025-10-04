import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 Props:
  - start: [x,y,z]        // world coords to spawn at (can be planet center)
  - direction: [dx,dy,dz] // normalized direction vector
  - speed: number         // units per second (slower by default)
  - lifetime: ms
  - asteroidRef           // optional
  - asteroidRadius        // optional
  - onDespawn(), onHitAsteroid()
*/

export default function Projectile({
  start = [0, 0, 0],
  direction = [0, 0, -1],
  speed = 1, // << slower default
  lifetime = 3000, // longer lifetime so slow projectile has time to travel
  asteroidRef = null,
  asteroidRadius = 0.1,
  onDespawn,
  onHitAsteroid,
}) {
  const mesh = useRef();
  const pos = useRef([...(start || [0, 0, 0])]);
  const dirVec = useRef(new THREE.Vector3(...direction).normalize());
  const alive = useRef(true);
  const despawnTimer = useRef(null);

  // initialize on mount / when start/direction/lifetime change
  useEffect(() => {
    pos.current = [...start];
    dirVec.current = new THREE.Vector3(...direction).normalize();
    if (mesh.current) mesh.current.position.set(...pos.current);

    clearTimeout(despawnTimer.current);
    alive.current = true;
    despawnTimer.current = setTimeout(() => {
      if (!alive.current) return;
      alive.current = false;
      onDespawn?.();
    }, Math.max(100, lifetime));

    return () => clearTimeout(despawnTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, direction, lifetime]);

  const OUTER_BOUND = 5000;

  useFrame((_, delta) => {
    if (!alive.current) return;

    // frame-rate independent movement (slow)
    pos.current[0] += dirVec.current.x * speed * delta;
    pos.current[1] += dirVec.current.y * speed * delta;
    pos.current[2] += dirVec.current.z * speed * delta;

    if (mesh.current) mesh.current.position.set(...pos.current);

    // out-of-bounds -> despawn
    if (
      Math.abs(pos.current[0]) > OUTER_BOUND ||
      Math.abs(pos.current[1]) > OUTER_BOUND ||
      Math.abs(pos.current[2]) > OUTER_BOUND
    ) {
      alive.current = false;
      clearTimeout(despawnTimer.current);
      onDespawn?.();
      return;
    }

    // asteroid collision (if provided)
    if (asteroidRef?.current && asteroidRadius > 0) {
      const astPos = new THREE.Vector3();
      asteroidRef.current.getWorldPosition(astPos);
      const dx = pos.current[0] - astPos.x;
      const dy = pos.current[1] - astPos.y;
      const dz = pos.current[2] - astPos.z;
      const distToAst = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distToAst <= asteroidRadius + 0.22) {
        // smaller margin (since projectile is smaller)
        alive.current = false;
        clearTimeout(despawnTimer.current);
        onHitAsteroid?.();
        return;
      }
    }
  });

  return (
    <mesh ref={mesh} position={start}>
      {/* smaller size */}
      <sphereGeometry args={[0.12, 16, 12]} />
      <meshStandardMaterial
        color="red"
        emissive="red"
        emissiveIntensity={2}
        metalness={0.1}
        roughness={0.4}
      />
    </mesh>
  );
}
