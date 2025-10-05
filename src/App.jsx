import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

import Planet from "../components/Planet";
import Asteroid from "../components/Asteroid";
import Sun from "../components/Sun";
import MapOverlay from "../components/MapOverlay";
import MathQuiz from "../components/MathQuiz";

/* CameraFollow: lock camera to planet center (unchanged behavior) */
function CameraFollow({ planetRef, zoom, setZoom, targetZoom, zoomToEarth }) {
  const { camera } = useThree();
  useFrame(() => {
    if (!planetRef.current) return;
    const worldPos = new THREE.Vector3();
    planetRef.current.getWorldPosition(worldPos);

    const desiredZoom = zoomToEarth ? 0.5 : targetZoom;
    setZoom((z) => {
      if (Math.abs(z - desiredZoom) < 0.01) return desiredZoom;
      return z + (desiredZoom - z) * 0.15;
    });

    camera.position.set(worldPos.x, worldPos.y + zoom / 2, worldPos.z + zoom);
    camera.lookAt(worldPos);
  });
  return null;
}

const TOTAL_QUESTIONS = 7;

export default function App() {
  const planetRef = useRef();
  const asteroidRef = useRef();

  // camera / UI
  const [zoom, setZoom] = useState(25);
  const [targetZoom, setTargetZoom] = useState(25);
  const [zoomToEarth, setZoomToEarth] = useState(false);

  // map overlay + geojson
  const [showMap, setShowMap] = useState(false);
  const [geojson, setGeojson] = useState(null);
  const [impact, setImpact] = useState(null);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(6);

  useEffect(() => {
    fetch("/assets/r3f_demo/ne_110m_admin_0_countries.geojson")
      .then((r) => r.json())
      .then(setGeojson)
      .catch(() => setGeojson(null));
  }, []);

  // asteroid defaults
  const asteroidSize = 0.1;
  const asteroidDistance = 20;
  const [asteroidSpeed, setAsteroidSpeed] = useState(1);
  const [planetSpeed, setPlanetSpeed] = useState(1);

  // homing / quiz state
  const [homingStrength, setHomingStrength] = useState(0.2);
  const HOMING_PER_CORRECT = 0.33;
  const MAX_HOMING = 1.0;
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("Answer questions to increase speed.");
  const [minigameActive, setMinigameActive] = useState(false);
  const [minigameComplete, setMinigameComplete] = useState(false);

  // load asteroid-data-based orbit dir (unused here but safe)
  useEffect(() => {
    fetch("/assets/r3f_demo/assets/data/asteroid_data.json")
      .then((res) => res.json())
      .catch(() => {});
  }, []);

  /* Simulate impact handlers (same as your ground button behavior) */
  const handleSimulateGround = () => {
    setImpact({ lat: 55.1694, lng: 23.8813, radius_km: 50 });
    setMapCenter([55.1694, 23.8813]);
    setMapZoom(7);
    setZoomToEarth(true);
    setTimeout(() => setShowMap(true), 1200);
  };
  const handleSimulateSea = () => {
    setImpact({ lat: 30.0, lng: -40.0, radius_km: 200 });
    setMapCenter([30.0, -40.0]);
    setMapZoom(5);
    setZoomToEarth(true);
    setTimeout(() => setShowMap(true), 1200);
  };

  // right-click to close map / reset zoom
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
      {/* Top-left simulate buttons */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 2000 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            style={btnStyle}
            onClick={() => {
              handleSimulateGround();
            }}
          >
            Simulate impact on ground
          </button>
          <button style={btnStyle} onClick={handleSimulateSea}>
            Simulate impact on sea
          </button>
        </div>
      </div>

      {/* Top-right zoom (kept) */}
      <div style={{ position: "absolute", top: 20, right: 40, zIndex: 2100 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            style={{ ...btnStyle, padding: "6px 16px", fontSize: 24 }}
            onClick={() => setTargetZoom((z) => Math.max(0.5, z - 3))}
          >
            +
          </button>
          <button
            style={{ ...btnStyle, padding: "6px 16px", fontSize: 24 }}
            onClick={() => setTargetZoom((z) => Math.min(200, z + 3))}
          >
            −
          </button>
        </div>
      </div>

      {/* Bottom-left: math quiz + info */}
      {/* Bottom-left: minigame trigger and quiz */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          zIndex: 4000,
          background: "rgba(0,0,0,0.6)",
          border: "2px solid lime",
          color: "lime",
          padding: 12,
          borderRadius: 6,
          fontFamily: "monospace",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        {!minigameActive && !minigameComplete && (
          <button
            style={{ ...btnStyle, fontSize: 20, padding: "10px 30px" }}
            onClick={() => {
              setScore(0);
              setMessage("");
              setMinigameActive(true);
              setMinigameComplete(false);
            }}
          >
            Start Math Minigame
          </button>
        )}
        {minigameActive && !minigameComplete && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                Score: {score} / {TOTAL_QUESTIONS}
              </div>
              <div style={{ minWidth: 220, color: "lightgreen" }}>
                {message}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <MathQuiz
                numQuestions={TOTAL_QUESTIONS}
                onCorrect={() => {
                  setScore((s) => {
                    const next = s + 1;
                    if (next >= TOTAL_QUESTIONS) {
                      setMessage(
                        "🎉 Congratulations! You completed the minigame."
                      );
                      setMinigameActive(false);
                      setMinigameComplete(true);
                    } else {
                      setMessage("Correct!");
                    }
                    return next;
                  });
                }}
                onWrong={() => setMessage("Wrong — try again.")}
                onTimeout={() => {
                  setMessage("⏰ Out of time! Impact triggered.");
                  setMinigameActive(false);
                  handleSimulateGround();
                }}
                timePerQuestion={30}
              />
            </div>
          </>
        )}
        {minigameComplete && (
          <div style={{ color: "lime", fontWeight: "bold", fontSize: 22 }}>
            🎉 Congratulations! You completed the minigame.
            <br />
            Simulation ended.
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 10, 25] }}>
        <ambientLight intensity={0.35} />
        <pointLight position={[0, 0, 0]} intensity={2} />
        <Stars radius={300} depth={60} count={5000} factor={7} />

        <Sun />
        <Planet ref={planetRef} distance={300} speed={planetSpeed} />
        <Asteroid
          ref={asteroidRef}
          centerRef={planetRef}
          distance={asteroidDistance}
          size={asteroidSize}
          speed={asteroidSpeed}
        />

        <CameraFollow
          planetRef={planetRef}
          zoom={zoom}
          setZoom={setZoom}
          targetZoom={targetZoom}
          zoomToEarth={zoomToEarth}
        />
      </Canvas>

      {/* Map overlay (unchanged) */}
      {showMap && geojson && (
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: "80vw",
            height: "80vh",
            background: "rgba(0,0,0,0.2)",
            color: "white",
            border: "2px solid lime",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => {
              setZoomToEarth(true);
              setShowMap(false);
              setTimeout(() => {
                setZoomToEarth(false);
                setTargetZoom(25);
              }, 100);
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
              fontSize: 48,
              cursor: "pointer",
              zIndex: 2000,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <MapOverlay zoom={mapZoom} center={mapCenter} impact={impact} />
        </div>
      )}
    </div>
  );
}

// small helpers used in App.jsx
const btnStyle = {
  background: "rgba(0,0,0,0.8)",
  color: "lime",
  border: "2px solid lime",
  borderRadius: "6px",
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
};
