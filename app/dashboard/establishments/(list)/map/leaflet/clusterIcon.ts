import L from "leaflet";
import { ESTABLISHMENTS_MAP_PAGE } from "@/constants/establishments";
import { MAP_CLUSTER_SIZES } from "@/constants/map";
import { CLUSTER_PIN_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";

export function clusterSizeFor(count: number) {
  // The last tier is unbounded, so a match always exists.
  return MAP_CLUSTER_SIZES.find((tier) => count <= tier.upTo)!;
}

/**
 * A cluster is only a count. It deliberately carries no severity: each pin
 * keeps its own color and the cluster opens to show them.
 */
export function createClusterIcon(count: number): L.DivIcon {
  const tier = clusterSizeFor(count);

  const disc = document.createElement("span");
  disc.className = cn(CLUSTER_PIN_CLASS, tier.sizeClass, tier.textClass);
  disc.textContent = String(count);
  disc.setAttribute("role", "img");
  disc.setAttribute("aria-label", ESTABLISHMENTS_MAP_PAGE.clusterAria(count));

  return L.divIcon({
    html: disc,
    className: "",
    iconSize: [tier.px, tier.px],
  });
}
