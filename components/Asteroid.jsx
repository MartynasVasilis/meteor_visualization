import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

const DATA_URL = "/assets/r3f_demo/assets/data/asteroid_data.json";

const randomizeGeometry = (geometry, scale = 0.5) => {
  const geom = geometry.clone();
  const pos = geom.attributes.position;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    vertex.fromBufferAttribute(pos, i);
    const factor = 1 + (Math.random() - 0.5) * scale;
    vertex.multiplyScalar(factor);
    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geom.computeVertexNormals();
  return geom;
};

const Asteroid = ({
  scale = 1,
  size = 0.5,
  speed = 1,
  timeScale = 20,
  centerRef = null,
}) => {
  const meshRef = useRef();
  const orbitLineRef = useRef();
  const debugGroupRef = useRef(); // ✅ separate group for stable debug overlay
  const timeRef = useRef(0);

  const [positions, setPositions] = useState([]);
  const [hasCollided, setHasCollided] = useState(false);
  const [distance, setDistance] = useState(null);
  const [near, setNear] = useState(false);

  // 🔹 Load asteroid trajectory
  useEffect(() => {
    fetch(DATA_URL)
      .then((res) => res.json())
      .then((json) => {
        const { x_ast, y_ast, z_ast } = json;
        if (x_ast && y_ast && z_ast) {
          const pts = x_ast.map((x, i) =>
            new THREE.Vector3(x, y_ast[i], z_ast[i]).multiplyScalar(
              scale / 1e11
            )
          );
          setPositions(pts);
          console.log(`✅ Loaded asteroid trajectory: ${pts.length} points`);
        } else console.error("❌ Invalid JSON structure (missing arrays)");
      })
      .catch((err) => console.error("❌ Failed to load asteroid data:", err));
  }, [scale]);

  // 🔹 Geometry
  const geometry = useMemo(() => {
    const base = new THREE.SphereGeometry(size, 32, 32);
    return randomizeGeometry(base, 0.4);
  }, [size]);

  // 🔹 Build orbit line
  useEffect(() => {
    if (!positions.length || !orbitLineRef.current) return;
    const lineGeom = new THREE.BufferGeometry();
    const arr = new Float32Array(positions.length * 3);
    positions.forEach((v, i) => {
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    });
    lineGeom.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    orbitLineRef.current.geometry = lineGeom;
  }, [positions]);

  // 🔹 Animate asteroid + collision check
  useFrame((_, delta) => {
    if (!meshRef.current || !positions.length || hasCollided) return;

    timeRef.current += delta * speed * timeScale;
    const idx = Math.floor(timeRef.current) % positions.length;
    const pos = positions[idx];

    // Earth world position
    const earthCenter = new THREE.Vector3(0, 0, 0);
    if (centerRef?.current?.getWorldPosition) {
      centerRef.current.getWorldPosition(earthCenter);
    }

    // Update asteroid position (relative to Earth)
    const asteroidPos = new THREE.Vector3(
      earthCenter.x + pos.x,
      earthCenter.y + pos.y,
      earthCenter.z + pos.z
    );

    meshRef.current.position.lerp(asteroidPos, 0.8); // ✅ smoothed motion
    if (orbitLineRef.current) orbitLineRef.current.position.copy(earthCenter);

    // Update debug group position (smoother for overlay)
    if (debugGroupRef.current) {
      debugGroupRef.current.position.lerp(
        new THREE.Vector3(asteroidPos.x, asteroidPos.y + 1.5, asteroidPos.z),
        0.2
      );
    }

    // Check distance
    const dist = asteroidPos.distanceTo(earthCenter);
    const earthRadius = 0.8;
    const asteroidRadius = size;
    setDistance(dist);

    if (!near && dist <= earthRadius * 3) {
      setNear(true);
      console.log(`⚠️ Approaching Earth — distance ≈ ${dist.toFixed(3)}`);
    }

    if (dist <= earthRadius + asteroidRadius) {
      console.warn(`💥 COLLISION detected! Distance: ${dist.toFixed(6)} units`);
      setHasCollided(true);
    }
  });

  // 🔹 Color based on state
  let color = "cyan";
  if (hasCollided) color = "red";
  else if (near) color = "yellow";

  // 🔹 Debug overlay style
  const overlayStyle = {
    background: "rgba(0,0,0,0.8)",
    color: hasCollided ? "red" : near ? "yellow" : "#0f0",
    fontSize: "12px",
    fontFamily: "monospace",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #0f0",
    pointerEvents: "none",
    textAlign: "center",
    width: "120px",
  };

  return (
    <group>
      {/* Asteroid body */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial color={color} wireframe opacity={0.9} transparent />
      </mesh>

      {/* Orbit line */}
      <line ref={orbitLineRef}>
        <lineBasicMaterial color="#00ffff" linewidth={1.2} />
      </line>

      {/* ✅ Stable debug overlay, independent of geometry clipping */}
      {distance !== null && (
        <group ref={debugGroupRef}>
          <Html transform distanceFactor={10} occlude={false}>
            <div style={overlayStyle}>
              <b>Asteroid Debug</b>
              <div>Dist: {distance.toFixed(3)}</div>
              <div>
                {hasCollided
                  ? "💥 IMPACT"
                  : near
                  ? "⚠️ Approaching"
                  : "🛰️ Safe orbit"}
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};

export default Asteroid;
