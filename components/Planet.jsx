import React, { useEffect, useRef } from "react";
import * as THREE from "three";
//import { drawThreeGeo } from "./src/threeGeoJSON.js";
/*
const GlobeComponent = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);

    // Append renderer to the ref'd DOM element
    mountRef.current.appendChild(renderer.domElement);

    // 5. Globe Outline (Edges)
    const geometry = new THREE.SphereGeometry(2);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
    });
    const edges = new THREE.EdgesGeometry(geometry, 1);
    const line = new THREE.LineSegments(edges, lineMat);
    scene.add(line);

    // 7. Load GeoJSON Data (Countries)
    // Make sure './geojson/ne_110m_land.json' is accessible from the client
    /*
    fetch("./geojson/ne_110m_land.json")
      .then((response) => response.text())
      .then((text) => {
        try {
          const data = JSON.parse(text);
          const countries = drawThreeGeo({
            json: data,
            radius: 2,
            materialOptions: {
              color: 0x80ff80,
            },
          });
          scene.add(countries);
        } catch (e) {
          console.error("Error parsing GeoJSON or drawing globe:", e);
        }
      })
      .catch((error) => console.error("Error fetching GeoJSON:", error));
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
      controls.update(); // Required if controls.enableDamping or controls.autoRotate are set
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.remove();
      window.removeEventListener("resize", resizeListener);
      geometry.dispose();
      lineMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
};
*/
const Planet = React.forwardRef(
  ({ color = "blue", distance = 8, size = 0.8 }, ref) => {
    return (
      <mesh ref={ref} position={[distance, 0, 0]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial color="green" wireframe opacity={0.3} transparent />
      </mesh>
    );
  }
);

export default Planet;
