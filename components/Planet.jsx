import React, { useEffect, useState, useRef, forwardRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const RADIUS = 0.8;
const DATA_URL = "/assets/r3f_demo/assets/data/asteroid_data.json";

function latLonToVec3(lat, lon, radius = RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function CountryBorders({ geojson }) {
  if (!geojson) return null;

  const lines = [];
  geojson.features.forEach((feature) => {
    const coords = feature.geometry.coordinates;
    if (feature.geometry.type === "Polygon") {
      coords.forEach((ring) => {
        for (let i = 0; i < ring.length - 1; i++) {
          const a = latLonToVec3(ring[i][1], ring[i][0]);
          const b = latLonToVec3(ring[i + 1][1], ring[i + 1][0]);
          lines.push(a, b);
        }
      });
    } else if (feature.geometry.type === "MultiPolygon") {
      coords.forEach((poly) =>
        poly.forEach((ring) => {
          for (let i = 0; i < ring.length - 1; i++) {
            const a = latLonToVec3(ring[i][1], ring[i][0]);
            const b = latLonToVec3(ring[i + 1][1], ring[i + 1][0]);
            lines.push(a, b);
          }
        })
      );
    }
  });

  const positions = new Float32Array(lines.length * 3);
  lines.forEach((vec, i) => {
    positions[i * 3] = vec.x;
    positions[i * 3 + 1] = vec.y;
    positions[i * 3 + 2] = vec.z;
  });

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="lime" linewidth={1} />
    </lineSegments>
  );
}

const Planet = forwardRef(
  ({ size = RADIUS, speed = 1, timeScale = 10 }, ref) => {
    const [geojson, setGeojson] = useState(null);
    const [positions, setPositions] = useState([]);

    const groupRef = useRef();
    const orbitLineRef = useRef();
    const timeRef = useRef(0);

    useEffect(() => {
      fetch(DATA_URL)
        .then((res) => res.json())
        .then((json) => {
          const { x_earth, y_earth, z_earth } = json;
          if (x_earth && y_earth && z_earth) {
            const pts = x_earth.map((x, i) =>
              new THREE.Vector3(x, y_earth[i], z_earth[i]).multiplyScalar(
                200 / 1e11
              )
            );
            setPositions(pts);
          } else console.error("❌ Earth arrays not found in JSON!");
        })
        .catch((err) => console.error("Failed to load Earth JSON:", err));
    }, []);

    useEffect(() => {
      fetch("/assets/r3f_demo/ne_110m_admin_0_countries.geojson")
        .then((res) => res.json())
        .then(setGeojson)
        .catch((err) => console.error("Failed to load GeoJSON:", err));
    }, []);

    useEffect(() => {
      if (!positions.length || !orbitLineRef.current) return;
      const arr = new Float32Array(positions.length * 3);
      positions.forEach((v, i) => {
        arr[i * 3] = v.x;
        arr[i * 3 + 1] = v.y;
        arr[i * 3 + 2] = v.z;
      });
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      orbitLineRef.current.geometry = geom;
    }, [positions]);

    useFrame((_, delta) => {
      if (!positions.length || !groupRef.current) return;
      timeRef.current += delta * speed * timeScale;
      const idx = Math.floor(timeRef.current) % positions.length;
      const pos = positions[idx];
      groupRef.current.position.set(pos.x, pos.y, pos.z);
      groupRef.current.rotation.y += 0.01;
    });

    return (
      <>
        <line ref={orbitLineRef}>
          <lineBasicMaterial color="#00ff00" linewidth={1.2} />
        </line>
        <group
          ref={(node) => {
            groupRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
        >
          <mesh>
            <sphereGeometry args={[size, 32, 32]} />
            <meshBasicMaterial
              color="green"
              wireframe
              opacity={0.4}
              transparent
            />
          </mesh>
          <CountryBorders geojson={geojson} />
        </group>
      </>
    );
  }
);

export default Planet;
