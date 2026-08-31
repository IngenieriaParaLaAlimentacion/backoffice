import { cn } from "@/lib/utils";

/**
 * The "Raíz" mark — a node-graph tree in the palette's greens with a single
 * mustard node. Traced from the design's raster so it scales, stays crisp on
 * any surface and costs no network request.
 *
 * It is drawn with dark-earth branches, which disappear on the sidebar's
 * dark-earth surface. Rather than recolor the artwork per surface (and end up
 * with two marks that drift), place it on a paper chip when the surface is
 * dark — see `BrandLockup`.
 */
export default function BrandMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="213 59 669 849"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
    >
      <g stroke="#26362A" strokeWidth="34" strokeLinecap="round">
        <line x1="547.5" y1="126" x2="699" y2="296" />
        <line x1="547.5" y1="126" x2="396" y2="296" />
        <line x1="547.5" y1="126" x2="280" y2="355" />
        <line x1="547.5" y1="126" x2="815" y2="355" />
        <line x1="547.5" y1="126" x2="547.5" y2="410" />
        <line x1="699" y1="296" x2="815" y2="355" />
        <line x1="699" y1="296" x2="547.5" y2="410" />
        <line x1="396" y1="296" x2="280" y2="355" />
        <line x1="396" y1="296" x2="547.5" y2="410" />
        <line x1="280" y1="355" x2="415" y2="496" />
        <line x1="280" y1="355" x2="289.5" y2="596" />
        <line x1="815" y1="355" x2="680" y2="496" />
        <line x1="815" y1="355" x2="805.5" y2="596" />
        <line x1="547.5" y1="410" x2="547.5" y2="631" />
        <line x1="680" y1="496" x2="547.5" y2="631" />
        <line x1="415" y1="496" x2="547.5" y2="631" />
        <line x1="805.5" y1="596" x2="547.5" y2="631" />
        <line x1="805.5" y1="596" x2="547.5" y2="841" />
        <line x1="289.5" y1="596" x2="547.5" y2="631" />
        <line x1="289.5" y1="596" x2="547.5" y2="841" />
        <line x1="547.5" y1="631" x2="547.5" y2="841" />
      </g>
      <g fill="#7A8F5C">
        <circle cx="547.5" cy="126" r="53" />
        <circle cx="396" cy="296" r="53" />
        <circle cx="280" cy="355" r="53" />
        <circle cx="815" cy="355" r="53" />
        <circle cx="547.5" cy="410" r="53" />
        <circle cx="680" cy="496" r="53" />
        <circle cx="805.5" cy="596" r="53" />
        <circle cx="289.5" cy="596" r="53" />
      </g>
      <g fill="#4E6339">
        <circle cx="547.5" cy="631" r="53" />
        <circle cx="547.5" cy="841" r="53" />
      </g>
      <g fill="#26362A">
        <circle cx="415" cy="496" r="53" />
      </g>
      <g fill="#C99A2E">
        <circle cx="699" cy="296" r="53" />
      </g>
    </svg>
  );
}
