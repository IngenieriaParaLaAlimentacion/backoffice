import L from "leaflet";

/**
 * `leaflet.markercluster` is written against a global `L` and throws a
 * ReferenceError at import time without one. ES imports run in the order they
 * are written, so this module has to be imported *before* the plugin.
 */
(globalThis as { L?: typeof L }).L = L;
