import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * MapView component
 * Props:
 * - bins: Array of bin objects; map will use bin.location.lat and bin.location.lng if present
 */
export default function MapView({ bins = [], className = "" }) {
  const mapRef = useRef(null);
  const mapElRef = useRef(null);

  const markers = useMemo(() => {
    return (bins || [])
      .map((b) => {
        const lat = b?.location?.lat ?? b?.location?.latitude;
        const lng = b?.location?.lng ?? b?.location?.longitude;
        if (typeof lat === "number" && typeof lng === "number") {
          return { lat, lng, code: b.code, type: b.type, status: b.status };
        }
        return null;
      })
      .filter(Boolean);
  }, [bins]);

  useEffect(() => {
    if (!mapElRef.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(mapElRef.current, {
        center: [0, 0],
        zoom: 2,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }
    const map = mapRef.current;

    // Clear existing markers
    const layerGroup = L.layerGroup().addTo(map);

    if (markers.length > 0) {
      const bounds = L.latLngBounds([]);
      markers.forEach((m) => {
        const marker = L.marker([m.lat, m.lng]);
        marker.bindPopup(
          `<div style="min-width:160px"><strong>${m.code}</strong><br/>Type: ${m.type}<br/>Status: ${m.status}</div>`
        );
        marker.addTo(layerGroup);
        bounds.extend([m.lat, m.lng]);
      });
      map.fitBounds(bounds.pad(0.2));
    } else {
      map.setView([0, 0], 2);
    }

    return () => {
      map.removeLayer(layerGroup);
    };
  }, [markers]);

  return (
    <div className={className}>
      <div ref={mapElRef} className="w-full h-64 rounded-lg overflow-hidden border border-gray-200" />
      {markers.length === 0 && (
        <div className="text-sm text-gray-600 mt-2">
          No coordinates available for these bins. Add lat/lng to bin.location to see markers.
        </div>
      )}
    </div>
  );
}
