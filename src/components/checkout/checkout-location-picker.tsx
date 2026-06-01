"use client";

import { LocateFixed, MapPin, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CENTER = { latitude: 13.6929, longitude: -89.2182 };
const TILE_SIZE = 256;

type MapSize = {
  height: number;
  width: number;
};

type Tile = {
  left: number;
  top: number;
  url: string;
};

export type LocationInfo = {
  road: string;
  suburb: string;
  city: string;
  state: string;
};

type Props = {
  onLocationFound?: (info: LocationInfo) => void;
};

export function CheckoutLocationPicker({ onLocationFound }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [zoom, setZoom] = useState(14);
  const [mapSize, setMapSize] = useState<MapSize>({ height: 280, width: 640 });
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const selectedLocation = getSelectedLocation(latitude, longitude);
  const center = selectedLocation ?? DEFAULT_CENTER;
  const tiles = useMemo(() => buildTiles(center, zoom, mapSize), [center, mapSize, zoom]);

  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setMapSize({
        height: Math.round(entry.contentRect.height),
        width: Math.round(entry.contentRect.width),
      });
    });

    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
        { headers: { "Accept-Language": "es" } },
      );
      if (!res.ok) return;
      const data = await res.json();
      const addr = data.address ?? {};

      const road = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(", ");
      const city =
        addr.municipality ?? addr.city ?? addr.town ?? addr.village ?? addr.county ?? "";
      const rawState: string = addr.state ?? addr.region ?? "";
      const state = rawState.replace(/^Departamento de\s+/i, "");

      onLocationFound?.({ road, suburb: addr.suburb ?? "", city, state });
      setGeoStatus("ok");
    } catch {
      setGeoStatus("error");
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }

    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        updateLocation(lat, lng);
        if (onLocationFound) reverseGeocode(lat, lng);
        else setGeoStatus("ok");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
    );
  }

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerPoint = latLngToPoint(center.latitude, center.longitude, zoom);
    const clickedPoint = {
      x: centerPoint.x + event.clientX - rect.left - rect.width / 2,
      y: centerPoint.y + event.clientY - rect.top - rect.height / 2,
    };
    const nextLocation = pointToLatLng(clickedPoint.x, clickedPoint.y, zoom);

    updateLocation(nextLocation.latitude, nextLocation.longitude);
    if (onLocationFound) reverseGeocode(nextLocation.latitude, nextLocation.longitude);
  }

  function updateLocation(nextLatitude: number, nextLongitude: number) {
    setLatitude(formatCoordinate(nextLatitude));
    setLongitude(formatCoordinate(nextLongitude));
  }

  const statusText =
    geoStatus === "loading"
      ? "Obteniendo tu ubicación..."
      : geoStatus === "ok"
        ? "Ubicación capturada. Revisa los campos y ajusta si es necesario."
        : geoStatus === "error"
          ? "No pudimos obtener la ubicación. Puedes mover el pin manualmente."
          : "Haz clic en el mapa o usa el botón para marcar el punto de entrega.";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{statusText}</p>
        <button
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={geoStatus === "loading"}
          onClick={handleUseCurrentLocation}
          type="button"
        >
          <LocateFixed className="h-4 w-4" />
          Usar mi ubicación
        </button>
      </div>

      <div
        className="relative h-72 overflow-hidden rounded-md border border-border bg-muted"
        onClick={handleMapClick}
        ref={mapRef}
        role="button"
        tabIndex={0}
      >
        {tiles.map((tile) => (
          <div
            className="absolute h-64 w-64 select-none bg-cover"
            key={tile.url}
            style={{ backgroundImage: `url(${tile.url})`, left: tile.left, top: tile.top }}
          />
        ))}
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
          <MapPin className="h-9 w-9 fill-primary text-primary drop-shadow-md" />
          <span className="h-2 w-2 rounded-full bg-primary shadow" />
        </div>
        <div className="absolute right-3 top-3 grid gap-2">
          <button
            aria-label="Acercar mapa"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-primary shadow"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.min(z + 1, 18));
            }}
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            aria-label="Alejar mapa"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-primary shadow"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.max(z - 1, 11));
            }}
            type="button"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
        <p className="absolute bottom-2 right-2 rounded bg-card/90 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
          © OpenStreetMap
        </p>
      </div>

      {/* Coordenadas guardadas como hidden — el backend las usa para validar zona */}
      <input name="latitude" type="hidden" value={latitude} />
      <input name="longitude" type="hidden" value={longitude} />
      <input name="formattedAddress" type="hidden" value="" />
      <input name="placeId" type="hidden" value="" />
    </div>
  );
}

// ─── helpers de proyección de mapa ───────────────────────────────────────────

function buildTiles(center: { latitude: number; longitude: number }, zoom: number, size: MapSize) {
  const centerPoint = latLngToPoint(center.latitude, center.longitude, zoom);
  const startTileX = Math.floor((centerPoint.x - size.width / 2) / TILE_SIZE);
  const endTileX = Math.floor((centerPoint.x + size.width / 2) / TILE_SIZE);
  const startTileY = Math.floor((centerPoint.y - size.height / 2) / TILE_SIZE);
  const endTileY = Math.floor((centerPoint.y + size.height / 2) / TILE_SIZE);
  const maxTile = 2 ** zoom;
  const tiles: Tile[] = [];

  for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
    for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
      if (tileY < 0 || tileY >= maxTile) continue;
      const wrappedTileX = ((tileX % maxTile) + maxTile) % maxTile;
      tiles.push({
        left: tileX * TILE_SIZE - centerPoint.x + size.width / 2,
        top: tileY * TILE_SIZE - centerPoint.y + size.height / 2,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedTileX}/${tileY}.png`,
      });
    }
  }

  return tiles;
}

function latLngToPoint(latitude: number, longitude: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale,
  };
}

function pointToLatLng(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const mercator = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(Math.sinh(mercator));
  return { latitude, longitude };
}

function getSelectedLocation(latitude: string, longitude: string) {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) return null;
  return { latitude: parsedLatitude, longitude: parsedLongitude };
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}
