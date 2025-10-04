import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import Planet from "../components/Planet";
import Asteroid from "../components/Asteroid";
import Sun from "../components/Sun";
import MapOverlay from "../components/MapOverlay";
import Projectile from "../components/Projectile";
import ImpactControls from "./ImpactControls";

// ---------- CameraFollow ----------
function CameraFollow({
  planetRef,
  zoom,
  setZoom,
  targetZoom,
  zoomToEarth,
  controlsRef,
  followEnabled,
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!followEnabled || !planetRef.current) return;

    const worldPos = new THREE.Vector3();
    planetRef.current.getWorldPosition(worldPos);

    const desiredZoom = zoomToEarth ? 0.5 : targetZoom;
    setZoom((z) =>
      Math.abs(z - desiredZoom) < 0.01
        ? desiredZoom
        : z + (desiredZoom - z) * 0.15
    );

    camera.position.lerp(
      new THREE.Vector3(worldPos.x, worldPos.y + zoom / 2, worldPos.z + zoom),
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

// ---------- App ----------
export default function App() {
  const planetRef = useRef();
  const asteroidRef = useRef();
  const controlsRef = useRef();

  const [zoom, setZoom] = useState(25);
  const [targetZoom, setTargetZoom] = useState(25);
  const [zoomToEarth, setZoomToEarth] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [geojson, setGeojson] = useState(null);
  const [impact, setImpact] = useState(null);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(6);

  const [followEnabled, setFollowEnabled] = useState(true);
  const followTimerRef = useRef(null);

  // Projectile state
  const [projectileSpec, setProjectileSpec] = useState(null);
  const [projectileKey, setProjectileKey] = useState(0);
  const [projectileActive, setProjectileActive] = useState(false);
  const [message, setMessage] = useState(null);

  // Load map data
  useEffect(() => {
    fetch("/assets/r3f_demo/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then(setGeojson)
      .catch(() => setGeojson(null));
  }, []);

  // ---------- Impact simulation ----------
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

  // ---------- Camera reset / follow ----------
  const handleRightClick = (e) => {
    e.preventDefault();
    setZoomToEarth(false);
    setShowMap(false);
    setTargetZoom(25);
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

  const handleCloseMap = () => {
    setShowMap(false);
    setZoomToEarth(false);
    setTargetZoom(25);
  };

  // ---------- Launch projectile ----------
  const handleLaunchProjectile = (opts = {}) => {
    if (!planetRef.current) return;

    const {
      spawnAtCenter = true,
      surfaceOffsetFromCenter = 0,
      aimAtAsteroid = false,
      azimuthDeg = 0,
      elevationDeg = -10,
      speed = 0.4, // slower
      lifetime = 8000, // lasts longer
    } = opts;

    const planetCenter = new THREE.Vector3();
    planetRef.current.getWorldPosition(planetCenter);

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

    const start = spawnAtCenter
      ? [planetCenter.x, planetCenter.y, planetCenter.z]
      : [
          planetCenter.x + dirVec.x * surfaceOffsetFromCenter,
          planetCenter.y + dirVec.y * surfaceOffsetFromCenter,
          planetCenter.z + dirVec.z * surfaceOffsetFromCenter,
        ];

    setProjectileSpec({
      start,
      direction: [dirVec.x, dirVec.y, dirVec.z],
      speed,
      lifetime,
    });
    setProjectileKey((k) => k + 1);
    setProjectileActive(true);
    setMessage("Projectile launched");
  };

  // Projectile callbacks
  const onProjectileDespawn = () => {
    setProjectileActive(false);
    setProjectileSpec(null);
    setMessage("Missed — projectile despawned");
  };

  const onProjectileHitAsteroid = () => {
    setProjectileActive(false);
    setProjectileSpec(null);
    setMessage("🎯 Asteroid intercepted!");
  };

  // ---------- UI styles ----------
  const btnStyle = {
    background: "rgba(0,0,0,0.8)",
    color: "lime",
    border: "2px solid lime",
    borderRadius: 6,
    padding: "8px 12px",
    cursor: "pointer",
    fontFamily: "monospace",
  };

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

  return (
    <div
      style={{ width: "100vw", height: "100vh", position: "relative" }}
      onContextMenu={handleRightClick}
    >
      {/* ---------- Launch Controls ---------- */}
      <div style={panelStyle}>
        <button
          style={btnStyle}
          onClick={() =>
            handleLaunchProjectile({
              spawnAtCenter: true,
              aimAtAsteroid: false,
            })
          }
        >
          Launch (center)
        </button>
        <button
          style={btnStyle}
          onClick={() =>
            handleLaunchProjectile({ spawnAtCenter: true, aimAtAsteroid: true })
          }
        >
          Launch → Asteroid
        </button>
        <div style={{ marginLeft: 12, fontSize: 14 }}>
          <div>Message: {message || "Ready"}</div>
        </div>
      </div>

      {/* ---------- Impact Control Overlay ---------- */}
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

      {/* ---------- 3D Scene ---------- */}
      <Canvas camera={{ position: [0, 10, 25] }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 0]} intensity={2} />
        <Stars radius={300} depth={60} count={5000} factor={7} />
        <Sun />
        <Planet ref={planetRef} distance={300} />
        <Asteroid
          ref={asteroidRef}
          centerRef={planetRef}
          distance={20}
          size={0.1}
          speed={1}
        />
        <OrbitControls
          ref={controlsRef}
          enableZoom
          enablePan
          enableRotate
          zoomSpeed={0.8}
          rotateSpeed={0.7}
          panSpeed={0.5}
          maxDistance={800}
          minDistance={1}
          onStart={() => {
            setFollowEnabled(false);
            clearFollowTimer();
          }}
          onEnd={() => startFollowTimer()}
        />
        <CameraFollow
          planetRef={planetRef}
          zoom={zoom}
          setZoom={setZoom}
          targetZoom={targetZoom}
          zoomToEarth={zoomToEarth}
          controlsRef={controlsRef}
          followEnabled={followEnabled}
        />

        {/* Projectile */}
        {projectileActive && projectileSpec && (
          <Projectile
            key={projectileKey}
            start={projectileSpec.start}
            direction={projectileSpec.direction}
            speed={projectileSpec.speed}
            lifetime={projectileSpec.lifetime}
            asteroidRef={asteroidRef}
            asteroidRadius={0.1}
            onDespawn={onProjectileDespawn}
            onHitAsteroid={onProjectileHitAsteroid}
          />
        )}
      </Canvas>

      {/* ---------- Map Overlay ---------- */}
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
