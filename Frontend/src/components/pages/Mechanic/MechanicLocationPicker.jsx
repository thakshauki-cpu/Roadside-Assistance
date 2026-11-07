
import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMapEvents,
} from "react-leaflet";

import { MapPin, LocateFixed } from "lucide-react";

import "leaflet/dist/leaflet.css";
import "../../styles/Mechanic/MechanicLocationPicker.css";

// Handles map click events
function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function MechanicLocationPicker({ value, onChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Same initial map location as Get Help Location.jsx
  const defaultCenter = [7.7102, 81.6924];

  // Reverse Geocoding using Nominatim
  const reverseGeocode = async (latitude, longitude) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        throw new Error("Unable to find the address.");
      }

      const data = await response.json();

      if (!data.display_name) {
        throw new Error(
          "Address not found. Please try another location."
        );
      }

      onChange({
        address: data.display_name,
        coordinates: [longitude, latitude],
      });
    } catch (err) {
      setError(err.message || "Unable to find the address.");

      onChange({
        address: "",
        coordinates: [longitude, latitude],
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle map location selection
  const handleMapLocationSelect = ({ latitude, longitude }) => {
    reverseGeocode(latitude, longitude);
  };

  // Handle current GPS location
  const handleUseCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        reverseGeocode(latitude, longitude);
      },
      (geoError) => {
        setLoading(false);

        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(
            "Location permission denied. Please allow location access."
          );
        } else if (geoError.code === geoError.TIMEOUT) {
          setError(
            "Location request timed out. Please try again."
          );
        } else {
          setError("Unable to get your current location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Check whether valid coordinates are selected
  const coordinates = value?.coordinates;

  const hasSelectedLocation =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1]);

  // Leaflet uses [latitude, longitude]
  const mapCenter = hasSelectedLocation
    ? [coordinates[1], coordinates[0]]
    : defaultCenter;

  return (
    <div className="mechanic-location-picker">

      <button
        type="button"
        className="mechanic-current-location-btn"
        onClick={handleUseCurrentLocation}
        disabled={loading}
      >
        <LocateFixed size={17} />

        {loading
          ? "Getting location..."
          : "Use My Current Location"}
      </button>

      <p className="mechanic-map-instruction">
        Or click on the map to select your workshop location.
      </p>

      <div className="mechanic-location-map">
        <MapContainer
          center={mapCenter}
          zoom={hasSelectedLocation ? 15 : 15}
          scrollWheelZoom={true}
          className="leaflet-map"
          key={
            hasSelectedLocation
              ? `${coordinates[0]}-${coordinates[1]}`
              : "default-map"
          }
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            onSelect={handleMapLocationSelect}
          />

          {hasSelectedLocation && (
            <CircleMarker
              center={[
                coordinates[1],
                coordinates[0],
              ]}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#285cff",
                fillOpacity: 1,
                weight: 3,
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="mechanic-selected-address">
        <label>
          <MapPin size={16} />
          Selected Workshop Address
        </label>

        <textarea
          value={value?.address || ""}
          onChange={(event) =>
            onChange({
              ...value,
              address: event.target.value,
            })
          }
          placeholder="Select your location on the map to get the address"
          rows={3}
        />
      </div>

      {loading && (
        <p className="mechanic-location-loading">
          Finding the address...
        </p>
      )}

      {error && (
        <p className="mechanic-location-error">
          {error}
        </p>
      )}

      {hasSelectedLocation && (
        <p className="mechanic-location-success">
          Workshop coordinates selected successfully.
        </p>
      )}

    </div>
  );
}

export default MechanicLocationPicker;
