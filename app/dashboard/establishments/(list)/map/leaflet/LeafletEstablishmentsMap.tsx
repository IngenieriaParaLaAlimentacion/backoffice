"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "./leaflet-overrides.css";
import { MapContainer, TileLayer } from "react-leaflet";
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_BOUNDS,
  MAP_MIN_ZOOM,
  MAP_TILE_LAYER,
} from "@/constants/map";
import ClusterLayer from "./ClusterLayer";
import type { EstablishmentsMapProps } from "../types";

/** The one place the map is assembled from Leaflet. */
export default function LeafletEstablishmentsMap({
  pins,
  onPinClick,
}: EstablishmentsMapProps) {
  return (
    <MapContainer
      center={MAP_DEFAULT_CENTER}
      zoom={MAP_DEFAULT_ZOOM}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_TILE_LAYER.maxZoom}
      maxBounds={MAP_MAX_BOUNDS}
      maxBoundsViscosity={1}
      className="establishments-map h-full w-full"
    >
      <TileLayer
        url={MAP_TILE_LAYER.url}
        attribution={MAP_TILE_LAYER.attribution}
        maxZoom={MAP_TILE_LAYER.maxZoom}
      />
      <ClusterLayer pins={pins} onPinClick={onPinClick} />
    </MapContainer>
  );
}
