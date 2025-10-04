import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const defaultAsteroid = {
  id: "extreme-1",
  samples: 256,
  orbitalElements: {
    a: 2,
    e: 0.2,
    i: 45,
    Omega: 120,
    omega: 60,
    M0: 0,
    epoch: 0,
    period: 30
  }
};

// Solve eccentric anomaly (same as before)
function solveEccentricAnomaly(M, e, iters = 20) {
  let E = M < Math.PI ? M + e / 2 : M - e / 2;
  for (let i = 0; i < iters; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    E = E - f / fp;
  }
  return E;
}

function orbitalPosition(ke, t) {
  const { a, e, i = 0, Omega = 0, omega = 0, M0 = 0, epoch = 0, period = 1 } = ke;
  const n = (2 * Math.PI) / period;
  const M = M0 + n * (t - epoch);
  const E = solveEccentricAnomaly(((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const sqrtOneMinusESq = Math.sqrt(1 - e * e);
  const nu = Math.atan2(sqrtOneMinusESq * sinE, cosE - e);
  const r = a * (1 - e * cosE);

  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);
  const zOrb = 0;

  const deg2rad = (d) => d * (Math.PI / 180);
  const cosO = Math.cos(deg2rad(Omega));
  const sinO = Math.sin(deg2rad(Omega));
  const cosw = Math.cos(deg2rad(omega));
  const sinw = Math.sin(deg2rad(omega));
  const cosi = Math.cos(deg2rad(i));
  const sini = Math.sin(deg2rad(i));

  const R11 = cosO * cosw - sinO * sinw * cosi;
  const R12 = -cosO * sinw - sinO * cosw * cosi;
  const R13 = sinO * sini;
  const R21 = sinO * cosw + cosO * sinw * cosi;
  const R22 = -sinO * sinw + cosO * cosw * cosi;
  const R23 = -cosO * sini;
  const R31 = sinw * sini;
  const R32 = cosw * sini;
  const R33 = cosi;

  const x = R11 * xOrb + R12 * yOrb + R13 * zOrb;
  const y = R21 * xOrb + R22 * yOrb + R23 * zOrb;
  const z = R31 * xOrb + R32 * yOrb + R33 * zOrb;

  return new THREE.Vector3(x, y, z);
};

// Randomize geometry for rocky look
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

const Asteroid = ({ data, scale = 1, size = 0.5, speed = 0.5, centerRef = null }) => {
  const meshRef = useRef();
  const lineRef = useRef();
  const materialRef = useRef();

  const [renderData, setRenderData] = useState(data || defaultAsteroid);
  const [path, setPath] = useState([]);
  const lineGeom = useMemo(() => new THREE.BufferGeometry(), []);

  // Tron-style geometry
  const geometry = useMemo(() => {
    const base = new THREE.SphereGeometry(size, 32, 32);
    return randomizeGeometry(base, 0.4);
  }, [size]);

  // Precompute orbit path
  useEffect(() => {
    const orbital = renderData.orbitalElements;
    const pts = [];
    for (let i = 0; i < renderData.samples; i++) {
      const t = (i / renderData.samples) * (orbital.period || 1);
      pts.push(orbitalPosition(orbital, t).multiplyScalar(scale));
    }
    pts.push(pts[0].clone());
    setPath(pts);

    const positions = new Float32Array(pts.length * 3);
    pts.forEach((v, i) => {
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
    });
    lineGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    lineGeom.computeBoundingSphere();
  }, [renderData, scale, lineGeom]);

  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;
    requestAnimationFrame(() => {
      line.computeLineDistances();
      if (materialRef.current) {
        materialRef.current.dashSize = 1;
        materialRef.current.gapSize = 0.5;
        materialRef.current.needsUpdate = true;
      }
    });
  }, [path]);

  // Animate orbit
  useFrame(({ clock }) => {
    if (!meshRef.current || path.length === 0) return;
    const period = renderData.orbitalElements?.period || 100;
    const t = (clock.getElapsedTime() * speed) % period;
    const idx = Math.floor((t / period) * (path.length - 1));

    const center = new THREE.Vector3(0, 0, 0);
    if (centerRef?.current && typeof centerRef.current.getWorldPosition === "function") {
      centerRef.current.getWorldPosition(center);
    }

    meshRef.current.position.set(
      center.x + path[idx].x,
      center.y + path[idx].y,
      center.z + path[idx].z
    );

    if (lineRef.current) lineRef.current.position.set(center.x, center.y, center.z);
  });

  return (
    <group>
      {/* Tron-like asteroid */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial color="cyan" wireframe opacity={0.8} transparent />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="cyan" wireframe opacity={1} transparent />
      </mesh>

      {/* Orbit path */}
      <line ref={lineRef} geometry={lineGeom}>
        <lineDashedMaterial
          ref={materialRef}
          color="#00ffff"
          dashSize={0.5}
          gapSize={0.25}
          linewidth={1.5}
        />
      </line>
    </group>
  );
};

export default Asteroid;
