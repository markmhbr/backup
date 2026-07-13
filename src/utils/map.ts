export interface MapPickerOptions {
  containerId: string;
  initialLat: number;
  initialLng: number;
  onCoordsChange: (coords: { lat: string; lng: string }) => void;
}

export const loadMapScripts = (callback: () => void) => {
  // Load Leaflet CSS
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  // Load Geosearch CSS
  if (!document.getElementById("geosearch-css")) {
    const link = document.createElement("link");
    link.id = "geosearch-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet-geosearch@3.11.0/dist/geosearch.css";
    document.head.appendChild(link);
  }

  const loadGeosearch = () => {
    if (!(window as any).GeoSearch) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet-geosearch@3.11.0/dist/bundle.min.js";
      script.onload = callback;
      document.head.appendChild(script);
    } else {
      callback();
    }
  };

  if (!(window as any).L) {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = loadGeosearch;
    document.head.appendChild(script);
  } else {
    loadGeosearch();
  }
};

export const initGoogleMapPicker = (options: MapPickerOptions) => {
  const L = (window as any).L;
  const GeoSearch = (window as any).GeoSearch;
  if (!L || !GeoSearch) return null;

  const container = document.getElementById(options.containerId);
  if (!container) return null;

  // Clear existing map instance if any
  // @ts-ignore
  if (container._leaflet_map) {
    try {
      // @ts-ignore
      container._leaflet_map.remove();
    } catch (e) {
      console.warn("Error removing old Leaflet map:", e);
    }
  }
  // @ts-ignore
  container._leaflet_id = null;
  container.innerHTML = "";

  // Fix default marker icon path issue in React/SPAs & change standard color to Red
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png",
    iconUrl: "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  const map = L.map(options.containerId).setView([options.initialLat, options.initialLng], 15);

  // Fix Leaflet rendering/dragging issues in React modals
  setTimeout(() => {
    map.invalidateSize();
  }, 300);

  // Google Maps Tile Layers
  const hybridLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
    attribution: "&copy; Google Maps",
    maxNativeZoom: 20,
    maxZoom: 22
  });

  const roadmapLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    attribution: "&copy; Google Maps",
    maxNativeZoom: 20,
    maxZoom: 22
  });

  const satelliteLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    attribution: "&copy; Google Maps",
    maxNativeZoom: 20,
    maxZoom: 22
  });

  // Default layer is Hybrid (Satelit + Jalan)
  hybridLayer.addTo(map);

  const baseMaps = {
    "🌐 Google Maps - Hybrid (Satelit & Jalan)": hybridLayer,
    "🛣️ Google Maps - Peta Jalan": roadmapLayer,
    "🛰️ Google Maps - Satelit Murni": satelliteLayer
  };

  L.control.layers(baseMaps, null, { position: "topright" }).addTo(map);

  // Search Control
  const searchControl = new (GeoSearch.GeoSearchControl)({
    provider: new GeoSearch.OpenStreetMapProvider(),
    style: "bar",
    showMarker: false,
    autoClose: true,
    searchLabel: "Cari alamat atau tempat...",
  });
  map.addControl(searchControl);

  // Marker
  const marker = L.marker([options.initialLat, options.initialLng], { draggable: true }).addTo(map);
  
  // Set initial coordinates
  options.onCoordsChange({
    lat: options.initialLat.toFixed(6),
    lng: options.initialLng.toFixed(6)
  });

  // Events
  map.on("click", (e: any) => {
    const { lat, lng } = e.latlng;
    marker.setLatLng([lat, lng]);
    options.onCoordsChange({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
  });

  marker.on("dragend", (e: any) => {
    const { lat, lng } = e.target.getLatLng();
    options.onCoordsChange({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
  });

  map.on("geosearch/showlocation", (result: any) => {
    const { x, y } = result.location;
    marker.setLatLng([y, x]);
    options.onCoordsChange({ lat: y.toFixed(6), lng: x.toFixed(6) });
  });

  // Geolocation detection logic
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 17);
          marker.setLatLng([latitude, longitude]);
          options.onCoordsChange({
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6)
          });
        },
        (error) => {
          console.warn("Geolocation error: " + error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert("Browser Anda tidak mendukung fitur deteksi lokasi (Geolocation).");
    }
  };

  // Add custom Locate Me button control
  const LocationControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd: function () {
      const container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-custom-control");
      container.style.backgroundColor = "white";
      container.style.width = "34px";
      container.style.height = "34px";
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.style.cursor = "pointer";
      container.style.borderRadius = "4px";
      container.style.border = "none";
      container.style.boxShadow = "0 1px 5px rgba(0,0,0,0.4)";
      container.title = "Temukan Lokasi Saya";
      container.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px; color: #374151;">
          <path d="M12 8a4 4 0 1 1-4 4 4 4 0 0 1 4-4m0-2a6 6 0 1 0 6 6 6 6 0 0 0-6-6m0-3a1 1 0 0 1 1 1v1.07a8 8 0 0 1 6.93 6.93H21a1 1 0 0 1 0 2h-1.07A8 8 0 0 1 13 19.93V21a1 1 0 0 1-2 0v-1.07A8 8 0 0 1 4.07 13H3a1 1 0 0 1 0-2h1.07A8 8 0 0 1 11 4.07V3a1 1 0 0 1 1-1Z"/>
        </svg>
      `;
      container.onclick = function (e: any) {
        e.stopPropagation();
        getLocation();
      };
      return container;
    }
  });
  map.addControl(new LocationControl());

  // Expose triggerGPS function and map instance on container DOM node so parent can call/clean them
  // @ts-ignore
  container.triggerGPS = getLocation;
  // @ts-ignore
  container._leaflet_map = map;

  return map;
};
