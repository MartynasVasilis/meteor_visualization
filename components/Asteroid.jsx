import React, { useRef, useMemo, useState, useEffect, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { DISTANCE_SCALE } from "../constants";

const DATA_URL = "/assets/r3f_demo/assets/data/asteroid_data.json";

const randomizeGeometry = (geometry, scale = 0.5) => {
  const geom = geometry.clone();
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(1 + (Math.random() - 0.5) * scale);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();
  return geom;
};

const Asteroid = forwardRef(
  (
    { size = 0.3, speed = 1, timeScale = 15, centerRef = null, scale = 1 },
    ref
  ) => {
    const meshRef = useRef();
    const orbitRef = useRef();
    const debugRef = useRef();
    const timeRef = useRef(0);

    const [positions, setPositions] = useState([]);
    const [distance, setDistance] = useState(null);
    const [near, setNear] = useState(false);
    const [collided, setCollided] = useState(false);

    // Load asteroid trajectory
    useEffect(() => {
      fetch(DATA_URL)
        .then((r) => r.json())
        .then((json) => {
          const { x_ast, y_ast, z_ast } = json;
          if (!x_ast || !y_ast || !z_ast)
            throw new Error("Invalid asteroid data");
          const pts = x_ast.map((x, i) =>
            new THREE.Vector3(x, y_ast[i], z_ast[i]).multiplyScalar(
              DISTANCE_SCALE * scale
            )
          );
          setPositions(pts);
          console.log(`✅ Loaded asteroid trajectory: ${pts.length} points`);
        })
        .catch(console.error);
    }, [scale]);

    // Geometry
    const geometry = useMemo(() => {
      const g = new THREE.SphereGeometry(size, 24, 24);
      return randomizeGeometry(g, 0.4);
    }, [size]);

    // Build orbit line
    useEffect(() => {
      if (!positions.length || !orbitRef.current) return;
      const arr = new Float32Array(positions.length * 3);
      positions.forEach((v, i) => arr.set([v.x, v.y, v.z], i * 3));
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      orbitRef.current.geometry = g;
    }, [positions]);

    // Animation
    useFrame((_, delta) => {
      if (!meshRef.current || positions.length < 2 || collided) return;

      timeRef.current += delta * speed * timeScale;
      const t = timeRef.current % positions.length;
      const idx = Math.floor(t);
      const nextIdx = (idx + 1) % positions.length;
      const alpha = t - idx;
      const pos = new THREE.Vector3().lerpVectors(
        positions[idx],
        positions[nextIdx],
        alpha
      );

      // Earth center
      const earthCenter = new THREE.Vector3(0, 0, 0);
      if (centerRef?.current?.getWorldPosition)
        centerRef.current.getWorldPosition(earthCenter);

      const asteroidPos = pos.clone().add(earthCenter);
      meshRef.current.position.copy(asteroidPos);

      if (orbitRef.current) orbitRef.current.position.copy(earthCenter);
      if (debugRef.current)
        debugRef.current.position.lerp(
          new THREE.Vector3(asteroidPos.x, asteroidPos.y + 1.5, asteroidPos.z),
          0.2
        );

      const dist = asteroidPos.distanceTo(earthCenter);
      setDistance(dist);

      if (!near && dist < 100) setNear(true);
      if (dist < 30 && !collided) setCollided(true);

      if (ref) ref.current = meshRef.current; // expose mesh to parent
    });

    // Colors
    let color = collided ? "red" : near ? "yellow" : "cyan";
    const overlayStyle = {
      background: "rgba(0,0,0,0.8)",
      color,
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
        <mesh ref={meshRef} geometry={geometry}>
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.8}
          />
        </mesh>
        <line ref={orbitRef}>
          <lineBasicMaterial color="#00ffff" linewidth={1.2} />
        </line>
        {distance !== null && (
          <group ref={debugRef}>
            <Html transform distanceFactor={10} occlude={false}>
              <div style={overlayStyle}>
                <b>Asteroid</b>
                <div>Dist: {distance.toFixed(3)}</div>
                <div>
                  {collided
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
  }
);

export default Asteroid;
