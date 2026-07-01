import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon paths broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** Custom pulsing SVG person marker */
const createPersonIcon = () =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
        <!-- Outer pulse ring -->
        <div style="
          position:absolute;
          width:48px;height:48px;border-radius:50%;
          background:rgba(99,102,241,0.15);
          animation:mapPulse 2s ease-out infinite;
        "></div>
        <!-- Mid ring -->
        <div style="
          position:absolute;
          width:32px;height:32px;border-radius:50%;
          background:rgba(99,102,241,0.25);
          animation:mapPulse 2s ease-out infinite 0.3s;
        "></div>
        <!-- Inner dot -->
        <div style="
          position:relative;
          width:18px;height:18px;border-radius:50%;
          background:linear-gradient(135deg,#6366f1,#06b6d4);
          border:2px solid white;
          box-shadow:0 2px 12px rgba(99,102,241,0.6);
          z-index:1;
        "></div>
      </div>
      <style>
        @keyframes mapPulse {
          0%   { transform:scale(0.8); opacity:0.9; }
          70%  { transform:scale(1.4); opacity:0; }
          100% { transform:scale(0.8); opacity:0; }
        }
      </style>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

/**
 * Leaflet map component.
 * Renders OpenStreetMap and updates marker position in real time.
 *
 * @param {Object} props
 * @param {number} props.lat            Current latitude
 * @param {number} props.lng            Current longitude
 * @param {boolean} props.followMarker  If true, map auto-pans to keep marker visible
 * @param {string}  props.height        CSS height string (default: '100%')
 */
export default function Map({ lat, lng, followMarker = true, height = '100%' }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const firstUpdateRef = useRef(true);

  // Initialize map once on mount
  useEffect(() => {
    if (mapRef.current) return; // Already initialized

    mapRef.current = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // India center as default
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker position whenever lat/lng changes
  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return;

    const latLng = L.latLng(lat, lng);

    if (!markerRef.current) {
      // Create marker on first position
      markerRef.current = L.marker(latLng, { icon: createPersonIcon() })
        .addTo(mapRef.current);
    } else {
      // Smooth move
      markerRef.current.setLatLng(latLng);
    }

    if (followMarker) {
      if (firstUpdateRef.current) {
        // First update: fly to position with zoom
        mapRef.current.flyTo(latLng, 16, { duration: 1.5 });
        firstUpdateRef.current = false;
      } else {
        // Subsequent updates: pan smoothly
        mapRef.current.panTo(latLng, { animate: true, duration: 0.5 });
      }
    }
  }, [lat, lng, followMarker]);

  return (
    <div
      ref={mapContainerRef}
      className="map-container"
      style={{ height }}
      id="live-map"
    />
  );
}
