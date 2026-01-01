import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import Planet from "../components/Planet";
import Asteroid from "../components/Asteroid";
import Sun from "../components/Sun";
import MapOverlay from "../components/MapOverlay";
import MathQuiz from "../components/MathQuiz";

function CameraFollow({
  targetRef,
  zoom,
  setZoom,
  targetZoom,
  zoomToEarth,
  controlsRef,
  followEnabled,
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!followEnabled || !targetRef.current) return;

    const worldPos = new THREE.Vector3();
    targetRef.current.getWorldPosition(worldPos);

    const desiredZoom = zoomToEarth ? 1.0 : targetZoom;
    setZoom((z) => z + (desiredZoom - z) * 0.1);

    camera.position.lerp(
      new THREE.Vector3(
        worldPos.x,
        worldPos.y + zoom * 0.8,
        worldPos.z + zoom * 1.5
      ),
      0.05
    );
    camera.lookAt(worldPos);

    if (controlsRef?.current) {
      controlsRef.current.target.lerp(worldPos, 0.1);
      controlsRef.current.update();
    }
  });

  return null;
}

export default function App() {
  const planetRef = useRef();
  const asteroidRef = useRef();
  const controlsRef = useRef();
  const followTimerRef = useRef(null);

  const [zoom, setZoom] = useState(80);
  const [targetZoom, setTargetZoom] = useState(80);
  const [zoomToEarth, setZoomToEarth] = useState(false);

  const [followEnabled, setFollowEnabled] = useState(true);
  const [followTarget, setFollowTarget] = useState("earth");

  const [showMap, setShowMap] = useState(false);
  const [geojson, setGeojson] = useState(null);
  const [impact, setImpact] = useState(null);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(6);

  const TOTAL_QUESTIONS = 7;
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("Answer questions to increase speed.");
  const [minigameActive, setMinigameActive] = useState(false);
  const [minigameComplete, setMinigameComplete] = useState(false);

  const [asteroidSpeed, setAsteroidSpeed] = useState(1);
  const [planetSpeed, setPlanetSpeed] = useState(1);
  const [earthPositions, setEarthPositions] = useState([]);

  useEffect(() => {
    fetch("/assets/r3f_demo/ne_110m_admin_0_countries.geojson")
      .then((r) => r.json())
      .then(setGeojson)
      .catch(() => setGeojson(null));
  }, []);

  const handleSimulateGround = () => {
    setImpact({ lat: 55.1694, lng: 23.8813, radius_km: 50 });
    setMapCenter([55.1694, 23.8813]);
    setMapZoom(7);
    setZoomToEarth(true);
    setTimeout(() => setShowMap(true), 1200);
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    setZoomToEarth(false);
    setShowMap(false);
    setTargetZoom(80);
  };

  const handleCloseMap = () => {
    setShowMap(false);
    setZoomToEarth(false);
    setTargetZoom(80);
  };

  const handleImpact = () => {
    console.warn("💥 Impact detected!");
    setShowMap(true);
  };

  const clearFollowTimer = () => {
    if (followTimerRef.current) {
      clearTimeout(followTimerRef.current);
      followTimerRef.current = null;
    }
  };

  const startFollowTimer = () => {
    clearFollowTimer();
    followTimerRef.current = setTimeout(() => {
      setFollowEnabled(true);
      followTimerRef.current = null;
    }, 3000);
  };

  return (
    <div
      style={{ width: "100vw", height: "100vh", position: "relative" }}
      onContextMenu={handleRightClick}
    >
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
        <button style={btnStyle} onClick={handleSimulateGround}>
          Simulate impact on ground
        </button>
        <button
          style={{ ...btnStyle, color: followEnabled ? "red" : "lime" }}
          onClick={() => setFollowEnabled((f) => !f)}
        >
          {followEnabled ? "Disable Auto-Follow" : "Enable Auto-Follow"}
        </button>
        <button
          style={{
            ...btnStyle,
            color: followTarget === "earth" ? "lime" : "white",
          }}
          onClick={() => setFollowTarget("earth")}
        >
          Follow Earth
        </button>
        <button
          style={{
            ...btnStyle,
            color: followTarget === "asteroid" ? "lime" : "white",
          }}
          onClick={() => setFollowTarget("asteroid")}
        >
          Follow Asteroid
        </button>
      </div>
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
          style={btnStyle}
          onClick={() => setTargetZoom((z) => Math.max(10, z - 10))}
        >
          +
        </button>
        <button
          style={btnStyle}
          onClick={() => setTargetZoom((z) => Math.min(1000, z + 10))}
        >
          −
        </button>
      </div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              Score: {score} / {TOTAL_QUESTIONS}
            </div>
            <div style={{ minWidth: 220, color: "lightgreen" }}>{message}</div>
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
                  } else setMessage("Correct!");
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
        )}
        {minigameComplete && (
          <div style={{ color: "lime", fontWeight: "bold", fontSize: 22 }}>
            🎉 Congratulations! You completed the minigame.
            <br />
            Simulation ended.
          </div>
        )}
      </div>
      <Canvas camera={{ position: [0, 30, 120], near: 0.01, far: 50000 }}>
        <ambientLight intensity={0.6} />
        <pointLight
          position={[0, 0, 0]}
          intensity={3.0}
          distance={10000}
          decay={2}
        />
        <Stars
          radius={8000}
          depth={3000}
          count={8000}
          factor={10}
          fade
          saturation={0}
        />

        <Sun />
        <Planet
          ref={planetRef}
          speed={planetSpeed}
          onDataLoaded={setEarthPositions}
        />
        <Asteroid
          ref={asteroidRef}
          earthPositions={earthPositions}
          scale={1}
          size={0.15}
          speed={asteroidSpeed}
          onImpact={handleImpact}
        />

        <OrbitControls
          ref={controlsRef}
          enableZoom
          enablePan
          enableRotate
          zoomSpeed={0.8}
          rotateSpeed={0.7}
          panSpeed={0.5}
          maxDistance={10000}
          minDistance={1}
          onStart={() => {
            setFollowEnabled(false);
            clearFollowTimer();
          }}
          onEnd={startFollowTimer}
        />

        <CameraFollow
          targetRef={
            zoomToEarth
              ? planetRef
              : followTarget === "asteroid"
              ? asteroidRef
              : planetRef
          }
          zoom={zoom}
          setZoom={setZoom}
          targetZoom={targetZoom}
          zoomToEarth={zoomToEarth}
          controlsRef={controlsRef}
          followEnabled={followEnabled}
        />
      </Canvas>
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
            onClick={(e) => {
              e.stopPropagation();
              handleCloseMap();
            }}
            aria-label="Close map overlay"
            tabIndex={0}
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              background: "lime",
              color: "#000",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              fontSize: 24,
              fontWeight: 700,
              lineHeight: "36px",
              textAlign: "center",
              cursor: "pointer",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
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

const btnStyle = {
  background: "rgba(0,0,0,0.8)",
  color: "lime",
  border: "2px solid lime",
  borderRadius: "6px",
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
};
