// Decorative SVG echoing the PruittHealth logo's tree-canopy motif.
// Used as a low-opacity background ornament on empty / idle states so they
// don't feel barren and so the brand identity is reinforced subtly.
//
// Render at any size; opacity is intentionally low (~0.06) so it never
// competes with foreground content. Color follows currentColor.

export function CanopyOrnament({
  className,
  ariaHidden = true,
}: {
  className?: string;
  ariaHidden?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden={ariaHidden}
      fill="currentColor"
    >
      {/* Canopy: rounded square "leaves" arranged like the PruittHealth logo */}
      <rect x="84" y="22" width="32" height="32" rx="6" />
      <rect x="50" y="38" width="28" height="28" rx="6" />
      <rect x="120" y="36" width="30" height="30" rx="6" />
      <rect x="34" y="68" width="28" height="28" rx="6" />
      <rect x="68" y="60" width="26" height="26" rx="6" />
      <rect x="100" y="60" width="28" height="28" rx="6" />
      <rect x="138" y="68" width="28" height="28" rx="6" />
      <rect x="56" y="92" width="26" height="26" rx="6" />
      <rect x="88" y="92" width="28" height="28" rx="6" />
      <rect x="124" y="94" width="26" height="26" rx="6" />
      {/* Trunk + figure */}
      <path d="M98 122 L98 150 L86 178 L92 180 L100 158 L108 180 L114 178 L102 150 L102 122 Z" />
      <circle cx="100" cy="116" r="6" />
    </svg>
  );
}
