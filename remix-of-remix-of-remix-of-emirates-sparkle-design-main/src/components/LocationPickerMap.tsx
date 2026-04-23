import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLngExpression, LatLngLiteral, LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type LocationPayload = {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
};

type LocationPickerMapProps = {
  defaultPosition: LatLngExpression;
  onConfirmLocation: (location: LocationPayload) => void;
  disabled?: boolean;
};

const mapStyle = { height: "320px", width: "100%" };

const getMarkerPosition = (position: LatLngExpression): LatLngTuple => {
  if (Array.isArray(position)) {
    return position as LatLngTuple;
  }

  return [position.lat, position.lng];
};

const MapClickHandler = ({ onPick }: { onPick: (position: LatLngLiteral) => void }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng);
    },
  });

  return null;
};

const MapViewUpdater = ({ position }: { position: LatLngTuple }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(position);
  }, [map, position]);

  return null;
};

const DraggableMarker = ({
  position,
  onChange,
}: {
  position: LatLngTuple;
  onChange: (position: LatLngLiteral) => void;
}) => {
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend(event) {
          const marker = event.target;
          onChange(marker.getLatLng());
        },
      }}
    >
      <Popup>
        Drag the marker or click on the map, then confirm this location.
      </Popup>
    </Marker>
  );
};

const LocationPickerMap = ({ defaultPosition, onConfirmLocation, disabled = false }: LocationPickerMapProps) => {
  const [position, setPosition] = useState<LatLngTuple>(getMarkerPosition(defaultPosition));
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [geolocationLoading, setGeolocationLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setPosition(getMarkerPosition(defaultPosition));
  }, [defaultPosition]);

  const reverseGeocode = async (pickedPosition: LatLngTuple) => {
    const [lat, lon] = pickedPosition;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch address from OpenStreetMap");
    }

    const data = await response.json();
    const address = data?.address ?? {};
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet ||
      address.suburb ||
      address.county ||
      "";
    const state = address.state || address.state_district || "";
    const zipCode = address.postcode || "";
    const country = address.country || "";

    onConfirmLocation({
      address: data?.display_name || "",
      city,
      state,
      zipCode,
      country,
      latitude: lat,
      longitude: lon,
    });
  };

  const handleConfirmLocation = async () => {
    setConfirmLoading(true);
    setStatusMessage(null);

    try {
      await reverseGeocode(position);
      setStatusMessage("Location confirmed and address fields updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to confirm location right now.";
      setStatusMessage(message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatusMessage("Your browser does not support location access.");
      return;
    }

    setGeolocationLoading(true);
    setStatusMessage(null);

    navigator.geolocation.getCurrentPosition(
      (positionData) => {
        const currentPosition: LatLngTuple = [positionData.coords.latitude, positionData.coords.longitude];
        setPosition(currentPosition);
        setGeolocationLoading(false);
        setStatusMessage("Current location selected. Confirm it to autofill the address.");
      },
      (error) => {
        setGeolocationLoading(false);
        setPosition(getMarkerPosition(defaultPosition));
        if (error.code === error.PERMISSION_DENIED) {
          setStatusMessage("Location permission was denied. The map has been reset to the default location.");
          return;
        }

        setStatusMessage("Unable to access your location. The map has been reset to the default location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3 rounded-xl border bg-background/60 p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Choose from map</p>
          <p className="text-xs text-muted-foreground">Drag the marker or click on the map, then confirm the location.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={disabled || geolocationLoading || confirmLoading}
          className="gap-2"
        >
          {geolocationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          Use Current Location
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <MapContainer center={position} zoom={16} scrollWheelZoom style={mapStyle}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewUpdater position={position} />
          <MapClickHandler onPick={setPosition} />
          <DraggableMarker position={position} onChange={setPosition} />
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={handleConfirmLocation} disabled={disabled || confirmLoading} className="gap-2">
          {confirmLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          Confirm Location
        </Button>
        <p className="text-xs text-muted-foreground">
          Selected coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </p>
      </div>

      {statusMessage && <p className="text-xs text-muted-foreground">{statusMessage}</p>}
    </div>
  );
};

export default LocationPickerMap;