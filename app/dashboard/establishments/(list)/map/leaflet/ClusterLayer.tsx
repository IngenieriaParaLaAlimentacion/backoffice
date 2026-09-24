"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
// Order matters: the plugin needs the global `L` in place when it loads.
import "./exposeLeaflet";
import "leaflet.markercluster";
import { useMap } from "react-leaflet";
import {
  MAP_CLUSTER_RADIUS,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_FIT_MAX_ZOOM,
  MAP_FIT_PADDING,
} from "@/constants/map";
import { createClusterIcon } from "./clusterIcon";
import { createPinMarker } from "./pinMarker";
import type { EstablishmentsMapProps } from "../types";

/**
 * Draws the pins, folded into clusters where they overlap, and frames the map
 * on them. Pins that share exact coordinates can't be told apart by zooming;
 * the plugin spreads them out ("spiderfies") at the deepest zoom instead.
 */
export default function ClusterLayer({
  pins,
  onPinClick,
}: EstablishmentsMapProps) {
  const map = useMap();

  // Markers are rebuilt only when the pins change, not whenever the parent
  // hands over a new callback.
  const onPinClickRef = useRef(onPinClick);
  useEffect(() => {
    onPinClickRef.current = onPinClick;
  }, [onPinClick]);

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: MAP_CLUSTER_RADIUS,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) =>
        createClusterIcon(cluster.getChildCount()),
    });
    group.addLayers(
      pins.map((pin) =>
        createPinMarker(pin, (id) => onPinClickRef.current(id)),
      ),
    );
    map.addLayer(group);

    if (pins.length > 0) {
      map.fitBounds(group.getBounds(), {
        padding: [MAP_FIT_PADDING, MAP_FIT_PADDING],
        maxZoom: MAP_FIT_MAX_ZOOM,
      });
    } else {
      map.setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);
    }

    return () => {
      map.removeLayer(group);
    };
  }, [map, pins]);

  return null;
}
