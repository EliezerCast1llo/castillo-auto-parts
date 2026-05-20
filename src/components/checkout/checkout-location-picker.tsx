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

export function CheckoutLocationPicker() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [zoom, setZoom] = useState(14);
  const [mapSize, setMapSize] = useState<MapSize>({ height: 280, width: 640 });
  const [geoStatus, setGeoStatus] = useState("");
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

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("Tu navegador no permite geolocalización.");
      return;
    }

    setGeoStatus("Solicitando ubicación...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
        setGeoStatus("Ubicación capturada.");
      },
      () => setGeoStatus("No pudimos tomar tu ubicación. Puedes mover el pin en el mapa."),
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
  }

  function updateLocation(nextLatitude: number, nextLongitude: number) {
    setLatitude(formatCoordinate(nextLatitude));
    setLongitude(formatCoordinate(nextLongitude));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-primary">Ubicación exacta</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Usa tu ubicación actual o marca el punto de entrega en el mapa.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white"
          onClick={useCurrentLocation}
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
            onClick={(event) => {
              event.stopPropagation();
              setZoom((currentZoom) => Math.min(currentZoom + 1, 18));
            }}
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            aria-label="Alejar mapa"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-primary shadow"
            onClick={(event) => {
              event.stopPropagation();
              setZoom((currentZoom) => Math.max(currentZoom - 1, 11));
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

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Latitud
          <input
            className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
            inputMode="decimal"
            name="latitude"
            onChange={(event) => setLatitude(event.target.value)}
            placeholder="13.692900"
            required
            type="text"
            value={latitude}
          />
        </label>
        <label className="block text-sm font-semibold">
          Longitud
          <input
            className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
            inputMode="decimal"
            name="longitude"
            onChange={(event) => setLongitude(event.target.value)}
            placeholder="-89.218200"
            required
            type="text"
            value={longitude}
          />
        </label>
      </div>

      <input name="formattedAddress" type="hidden" value="" />
      <input name="placeId" type="hidden" value="" />
      {geoStatus ? <p className="text-sm font-semibold text-muted-foreground">{geoStatus}</p> : null}
    </div>
  );
}

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
