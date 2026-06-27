import React, { useEffect, useRef } from 'react';

export default function VenueMap({ lat, lng, venueName, address, isDraggable = false, onChange }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapContainerRef.current) return;

    
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    const initialLat = lat || 23.0225;
    const initialLng = lng || 72.5714;

    
    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);
    mapRef.current = map;

    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    
    const marker = L.marker([initialLat, initialLng], {
      draggable: isDraggable
    }).addTo(map);
    markerRef.current = marker;

    
    if (!isDraggable && venueName) {
      marker.bindPopup(`
        <div style="font-family: Outfit, sans-serif; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #7f1d1d;">${venueName}</h4>
          <p style="margin: 0; font-size: 10px; font-weight: 600; color: #4b5563; line-height: 1.3;">${address || ''}</p>
          <a href="https://www.google.com/maps/search/?api=1&query=${initialLat},${initialLng}" target="_blank" rel="noopener noreferrer" style="display: block; margin-top: 6px; font-size: 9px; font-weight: 800; color: #d97706; text-decoration: none; text-transform: uppercase; tracking-wider: 1px;">Open in Google Maps &rarr;</a>
        </div>
      `).openPopup();
    }

    
    if (isDraggable && onChange) {
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onChange(position.lat, position.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        onChange(e.latlng.lat, e.latlng.lng);
      });
    }

    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current || !markerRef.current) return;

    const currentLat = lat || 23.0225;
    const currentLng = lng || 72.5714;
    const currentLatLng = markerRef.current.getLatLng();

    
    if (Math.abs(currentLatLng.lat - currentLat) > 0.0001 || Math.abs(currentLatLng.lng - currentLng) > 0.0001) {
      markerRef.current.setLatLng([currentLat, currentLng]);
      mapRef.current.panTo([currentLat, currentLng]);
      
      if (!isDraggable && venueName) {
        markerRef.current.getPopup().setContent(`
          <div style="font-family: Outfit, sans-serif; padding: 4px;">
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #7f1d1d;">${venueName}</h4>
            <p style="margin: 0; font-size: 10px; font-weight: 600; color: #4b5563; line-height: 1.3;">${address || ''}</p>
            <a href="https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}" target="_blank" rel="noopener noreferrer" style="display: block; margin-top: 6px; font-size: 9px; font-weight: 800; color: #d97706; text-decoration: none; text-transform: uppercase; tracking-wider: 1px;">Open in Google Maps &rarr;</a>
          </div>
        `).openPopup();
      }
    }
  }, [lat, lng, address, venueName]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-10">
      <div ref={mapContainerRef} className="w-full h-full min-h-[250px]" />
    </div>
  );
}
