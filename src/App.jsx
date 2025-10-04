import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

import Planet from "../components/Planet";
import Asteroid from "../components/Asteroid";
import Sun from "../components/Sun";
import MapOverlay from "../components/MapOverlay";
import ImpactControls from "./ImpactControls";
import Projectile from "../components/Projectile";

// camera follow (unchanged)
function CameraFollow({ planetRef, zoom, setZoom, targetZoom, zoomToEarth }) {
  const { camera } = useThree();
  useFrame(() => {
    if (!planetRef.current) return;
    const worldPos = new THREE.Vector3();
    planetRef.current.getWorldPosition(worldPos);
    const desiredZoom = zoomToEarth ? 0.5 : targetZoom;
    setZoom((z) =>
      Math.abs(z - desiredZoom) < 0.01
        ? desiredZoom
        : z + (desiredZoom - z) * 0.15
    );
    camera.position.set(worldPos.x, worldPos.y + zoom / 2, worldPos.z + zoom);
    camera.lookAt(worldPos);
  });
  return null;
}

export default function App() {
  const planetRef = useRef();
  const asteroidRef = useRef();

  // UI / camera state
  const [zoom, setZoom] = useState(25);
  const [targetZoom, setTargetZoom] = useState(25);
  const [zoomToEarth, setZoomToEarth] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [geojson, setGeojson] = useState(null);
  const [impact, setImpact] = useState(null);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(6);

  useEffect(() => {
    fetch("/assets/r3f_demo/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then(setGeojson)
      .catch(() => setGeojson(null));
  }, []);

  // asteroid defaults (unchanged)
  const asteroidSize = 0.1;
  const asteroidDistance = 20;
  const asteroidSpeed = 1;

  // projectile state (single)
  const [projectileSpec, setProjectileSpec] = useState(null);
  const [projectileKey, setProjectileKey] = useState(0);
  const [projectileActive, setProjectileActive] = useState(false);
  const [message, setMessage] = useState(null);

  // simulate impact handlers
  const handleSimulateGround = () => {
    setImpact({ lat: 55.1694, lng: 23.8813, radius_km: 50 });
    setMapCenter([55.1694, 23.8813]);
    setMapZoom(7);
    setZoomToEarth(true);
    setTimeout(() => setShowMap(true), 1200);
  };
  const handleSimulateSea = () => {
    setImpact({ lat: 30.0, lon: -40.0, radius_km: 200 });
    setMapCenter([30.0, -40.0]);
    setMapZoom(5);
    setZoomToEarth(true);
    setTimeout(() => setShowMap(true), 1200);
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    setZoomToEarth(false);
    setShowMap(false);
    setTargetZoom(25);
  };
  const handleCloseMap = () => {
    setShowMap(false);
    setZoomToEarth(false);
    setTargetZoom(25);
  };

  // Launch projectile: **spawn at planet center** (or optionally offset slightly)
  // opts: { spawnAtCenter: bool, surfaceOffsetFromCenter: number, aimAtAsteroid: bool, azimuthDeg, elevationDeg, speed, lifetime }
  const handleLaunchProjectile = (opts = {}) => {
    if (!planetRef.current) {
      console.warn("Planet not ready");
      return;
    }

    const {
      spawnAtCenter = true, // user requested center spawn
      surfaceOffsetFromCenter = 0, // if you want slightly outside center, set >0
      aimAtAsteroid = false,
      azimuthDeg = 0,
      elevationDeg = -10,
      speed = 0.8, // << much slower
      lifetime = 6000, // ms (longer to allow slow travel)
    } = opts;

    // compute planet center
    const planetCenter = new THREE.Vector3();
    planetRef.current.getWorldPosition(planetCenter);

    // compute direction
    let dirVec = new THREE.Vector3();
    if (aimAtAsteroid && asteroidRef.current) {
      const astPos = new THREE.Vector3();
      asteroidRef.current.getWorldPosition(astPos);
      dirVec.subVectors(astPos, planetCenter).normalize();
    } else {
      const az = (azimuthDeg * Math.PI) / 180;
      const el = (elevationDeg * Math.PI) / 180;
      dirVec
        .set(
          Math.cos(el) * Math.sin(az),
          Math.sin(el),
          Math.cos(el) * Math.cos(az)
        )
        .normalize();
    }

    // start point: if spawnAtCenter true use planetCenter; otherwise offset from center by surfaceOffsetFromCenter along dirVec
    const start = spawnAtCenter
      ? [planetCenter.x, planetCenter.y, planetCenter.z]
      : [
          planetCenter.x + dirVec.x * surfaceOffsetFromCenter,
          planetCenter.y + dirVec.y * surfaceOffsetFromCenter,
          planetCenter.z + dirVec.z * surfaceOffsetFromCenter,
        ];

    console.log("Launching projectile (center spawn):", {
      planetCenter: planetCenter.toArray(),
      start,
      dir: dirVec.toArray(),
      speed,
      lifetime,
    });

    setProjectileSpec({
      start,
      direction: [dirVec.x, dirVec.y, dirVec.z],
      speed,
      lifetime,
    });
    setProjectileKey((k) => k + 1);
    setProjectileActive(true);
    setMessage(null);
  };

  // projectile callbacks
  const onProjectileDespawn = () => {
    setProjectileActive(false);
    setProjectileSpec(null);
    setMessage("Missed — projectile despawned");
  };
  const onProjectileHitAsteroid = () => {
    setProjectileActive(false);
    setProjectileSpec(null);
    setMessage("🎉 Congratulations — asteroid intercepted!");
  };

  // UI styles
  const panelStyle = {
    position: "absolute",
    bottom: 20,
    left: 20,
    zIndex: 4000,
    background: "rgba(0,0,0,0.6)",
    border: "2px solid lime",
    color: "lime",
    padding: 10,
    borderRadius: 6,
    fontFamily: "monospace",
    display: "flex",
    gap: 8,
    alignItems: "center",
  };
  const btnStyle = {
    background: "rgba(0,0,0,0.8)",
    color: "lime",
    border: "2px solid lime",
    borderRadius: 6,
    padding: "8px 12px",
    cursor: "pointer",
    fontFamily: "monospace",
  };

  return (
    <div
      style={{ width: "100vw", height: "100vh", position: "relative" }}
      onContextMenu={handleRightClick}
    >
      <ImpactControls
        mapCenter={mapCenter}
        setMapCenter={setMapCenter}
        mapZoom={mapZoom}
        setMapZoom={setMapZoom}
        showMap={showMap}
        setShowMap={setShowMap}
        geojson={geojson}
        setZoomToEarth={setZoomToEarth}
        setTargetZoom={setTargetZoom}
        impact={impact}
        setImpact={setImpact}
        onLaunchProjectile={() => handleLaunchProjectile()}
      />

      <div style={panelStyle}>
        {/* spawn at center, slower and smaller */}
        <button
          style={btnStyle}
          onClick={() =>
            handleLaunchProjectile({
              spawnAtCenter: true,
              aimAtAsteroid: false,
              speed: 0.8,
              lifetime: 6000,
            })
          }
        >
          Launch (center)
        </button>

        {/* spawn at center and aim at asteroid */}
        <button
          style={btnStyle}
          onClick={() =>
            handleLaunchProjectile({
              spawnAtCenter: true,
              aimAtAsteroid: true,
              speed: 0.8,
              lifetime: 7000,
            })
          }
        >
          Launch → Asteroid (center)
        </button>

        {/* optional: spawn slightly outside center so it's visible immediately */}
        <button
          style={btnStyle}
          onClick={() =>
            handleLaunchProjectile({
              spawnAtCenter: false,
              surfaceOffsetFromCenter: 0.6,
              azimuthDeg: 0,
              elevationDeg: -10,
              speed: 0.8,
              lifetime: 6000,
            })
          }
        >
          Launch (offset 0.6)
        </button>

        <div style={{ marginLeft: 12, fontSize: 14 }}>
          <div>Message: {message || "Ready"}</div>
        </div>
      </div>

      <Canvas camera={{ position: [0, 10, 25] }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 0]} intensity={2} />
        <Stars radius={300} depth={60} count={5000} factor={7} />
        <Sun />
        <Planet ref={planetRef} distance={300} />
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

        {projectileActive && projectileSpec && (
          <Projectile
            key={projectileKey}
            start={projectileSpec.start}
            direction={projectileSpec.direction}
            speed={projectileSpec.speed}
            lifetime={projectileSpec.lifetime}
            asteroidRef={asteroidRef}
            asteroidRadius={asteroidSize}
            onDespawn={onProjectileDespawn}
            onHitAsteroid={onProjectileHitAsteroid}
          />
        )}
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
            onClick={handleCloseMap}
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
