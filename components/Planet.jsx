import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const RADIUS = 0.8;

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

  geojson.features.forEach((feature, idx) => {
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
      <lineBasicMaterial color="lime" linewidth={2} />
    </lineSegments>
  );
}

const Planet = React.forwardRef(
  ({ distance = 105, size = RADIUS, orbitSpeed = 0.1 }, ref) => {
    const [geojson, setGeojson] = useState(null);
    const groupRef = useRef();

    useEffect(() => {
      fetch("/assets/r3f_demo/ne_110m_admin_0_countries.geojson")
        .then((res) => res.json())
        .then(setGeojson);
    }, []);

    useFrame(({ clock }) => {
      const t = clock.getElapsedTime() * orbitSpeed;
      const x = Math.cos(t) * distance;
      const z = Math.sin(t) * distance;
      if (groupRef.current) {
        groupRef.current.position.set(x, 0, z);
        groupRef.current.rotation.y += 0.01;
      }
    });

    return (
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
            opacity={0.3}
            transparent
          />
        </mesh>
        <CountryBorders geojson={geojson} />
      </group>
    );
  }
);

export default Planet;
