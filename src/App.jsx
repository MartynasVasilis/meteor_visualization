import React, { useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

import Planet from "../components/Planet";
import Asteroid from "../components/Asteroid";
import Sun from "../components/Sun";
import MapOverlay from "../components/MapOverlay";

// ---------- CameraFollow ----------
function CameraFollow({ planetRef, zoom, setZoom, targetZoom, zoomToEarth }) {
  const { camera } = useThree();

  useFrame(() => {
    if (planetRef.current) {
      const worldPos = new THREE.Vector3();
      planetRef.current.getWorldPosition(worldPos);

      // Smooth zoom interpolation
      let desiredZoom = zoomToEarth ? 0.5 : targetZoom;
      setZoom((z) => {
        if (Math.abs(z - desiredZoom) < 0.01) return desiredZoom;
        return z + (desiredZoom - z) * 0.15;
      });

      camera.position.set(worldPos.x, worldPos.y + zoom / 2, worldPos.z + zoom);
      camera.lookAt(worldPos);
    }
  });

  return null;
}

// ---------- App ----------
export default function App() {
  const planetRef = useRef();
  const [zoom, setZoom] = useState(25);
  const [targetZoom, setTargetZoom] = useState(25);
  const [zoomToEarth, setZoomToEarth] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [desiredZoom, setDesiredZoom] = useState(2);
  const [desiredCenter, setDesiredCenter] = useState([20, 0]);
  const [geojson, setGeojson] = useState(null);

  // Load GeoJSON
  useEffect(() => {
    fetch("/assets/r3f_demo/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then(setGeojson);
  }, []);

  // Simulate impact handlers
  const handleSimulateGround = () => {
    if (!showMap) {
      setDesiredZoom(8);
      setDesiredCenter([55.1694, 23.8813]);
      setZoomToEarth(true);
      setTimeout(() => setShowMap(true), 1200);
    }
  };

  const handleSimulateSea = () => {
    if (!showMap) {
      setDesiredZoom(5);
      setDesiredCenter([30.0, -40.0]);
      setZoomToEarth(true);
      setTimeout(() => setShowMap(true), 1200);
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    setZoomToEarth(false);
    setShowMap(false);
    setTargetZoom(25);
  };

  return (
    <div
      style={{ width: "100vw", height: "100vh", position: "relative" }}
      onContextMenu={handleRightClick}
    >
      {/* Control Buttons */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <button
          style={{
            background: "rgba(0,0,0,0.8)",
            color: "lime",
            border: "2px solid lime",
            borderRadius: "6px",
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
          onClick={handleSimulateGround}
        >
          Simulate impact on ground
        </button>
        <button
          style={{
            background: "rgba(0,0,0,0.8)",
            color: "lime",
            border: "2px solid lime",
            borderRadius: "6px",
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
          onClick={handleSimulateSea}
        >
          Simulate impact on sea
        </button>
      </div>

      {/* Zoom Buttons */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 40,
          zIndex: 2100,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <button
          style={{
            background: "rgba(0,0,0,0.8)",
            color: "lime",
            border: "2px solid lime",
            borderRadius: "6px",
            padding: "6px 16px",
            fontSize: "24px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          onClick={() => setTargetZoom((z) => Math.max(0.5, z - 3))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          style={{
            background: "rgba(0,0,0,0.8)",
            color: "lime",
            border: "2px solid lime",
            borderRadius: "6px",
            padding: "6px 16px",
            fontSize: "24px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          onClick={() => setTargetZoom((z) => Math.min(200, z + 3))}
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 10, 25] }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 0]} intensity={2} />
        <Stars radius={300} depth={60} count={5000} factor={7} />
        <Sun />
        <Planet ref={planetRef} distance={300} />
        <Asteroid centerRef={planetRef} distance={20} size={0.1} speed={1} />
        <CameraFollow
          planetRef={planetRef}
          zoom={zoom}
          setZoom={setZoom}
          targetZoom={targetZoom}
          zoomToEarth={zoomToEarth}
        />
      </Canvas>

      {/* Map Overlay */}
      {showMap && geojson && (
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: "80vw",
            height: "80vh",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
            zIndex: 100,
            border: "2px solid lime",
            overflow: "hidden",
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={() => {
              setShowMap(false);
              setZoomToEarth(false);
              setTargetZoom(25);
            }}
            style={{
              position: "absolute",
              top: 40,
              right: 40,
              background: "rgba(0,0,0,0.8)",
              color: "lime",
              border: "2px solid lime",
              borderRadius: "50%",
              width: 48,
              height: 48,
              fontSize: 64,
              cursor: "pointer",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              lineHeight: 1,
              fontWeight: "bold",
              userSelect: "none",
            }}
            aria-label="Close map"
          >
            ×
          </button>
          <MapOverlay zoom={desiredZoom} center={desiredCenter} />
        </div>
      )}
    </div>
  );
}
