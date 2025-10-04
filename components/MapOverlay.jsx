import React, { useEffect } from "react";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Smoothly updates map view
function UpdateView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// MapOverlay with optional impact circle
export default function MapOverlay({ zoom = 2, center = [20, 0], impact }) {
  // Do not render if impact data is invalid
  const validImpact =
    impact &&
    typeof impact.lat === "number" &&
    typeof impact.lng === "number" &&
    typeof impact.radius_km === "number";

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: "100%", height: "100%", borderRadius: "8px" }}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
      attributionControl={false}
    >
      <UpdateView center={center} zoom={zoom} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {validImpact && (
        <Circle
          center={[impact.lat, impact.lng]}
          radius={impact.radius_km * 1000} // radius in meters
          pathOptions={{
            color: "lime",
            fillColor: "lime",
            fillOpacity: 0.2,
            weight: 2,
          }}
        />
      )}
    </MapContainer>
  );
}
