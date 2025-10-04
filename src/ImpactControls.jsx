import React from "react";
import MapOverlay from "../components/MapOverlay";

export default function ImpactControls({
  mapCenter,
  setMapCenter,
  mapZoom,
  setMapZoom,
  showMap,
  setShowMap,
  geojson,
  setZoomToEarth,
  setTargetZoom,
  impact,
  setImpact,
}) {
  // Simulate impact handlers with smooth zoom-in
  const handleSimulateGround = () => {
    setImpact({ lat: 55.1694, lng: 23.8813, radius_km: 50 }); // Lithuania
    setMapCenter([55.1694, 23.8813]);
    setMapZoom(7);
    setZoomToEarth(true);
    setTimeout(() => {
      setShowMap(true);
    }, 1200);
  };

  const handleSimulateSea = () => {
    setImpact({ lat: 30.0, lng: -40.0, radius_km: 200 }); // Atlantic
    setMapCenter([30.0, -40.0]);
    setMapZoom(5);
    setZoomToEarth(true);
    setTimeout(() => {
      setShowMap(true);
    }, 1200);
  };

  // X button handler: smooth zoom out
  const handleCloseMap = () => {
    setZoomToEarth(true); // Start zoom out immediately
    setTimeout(() => {
      setShowMap(false); // Hide overlay after animation
      setZoomToEarth(false);
      setTargetZoom(25);
    }, 1200);
  };

  const onLaunchProjectile = () => {
    // Placeholder for launch projectile logic
    alert("Launch projectile simulated!");
  };

  return (
    <>
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

      {/* Map Overlay */}
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
          {/* X Button */}
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
            <span
              style={{
                display: "inline-block",
                transform: "translateY(-6px)",
              }}
            >
              ×
            </span>
          </button>
          <MapOverlay zoom={mapZoom} center={mapCenter} impact={impact} />
        </div>
      )}
    </>
  );
}
