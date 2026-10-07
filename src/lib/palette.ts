// The 8 colors users can pick for areas and expense categories.
// By product choice the app is monochrome amber now (no rainbow palette): all
// 8 are shades of yellow/amber, not distinct hues. That means they are NOT
// reliably colorblind-distinguishable from each other by color alone — every
// place that shows one of these also shows the area/category's name or icon
// right next to it, which is what actually identifies it.
// The `name` keys are historical (they used to match a hue, e.g. "blue" was
// blue, then briefly green); they're kept as stable ids so existing data and
// code don't need to change, they just no longer describe the color.
// The database stores the LIGHT hex; on screen we use a CSS variable, so the
// color automatically switches to its dark-mode version.

export const PALETTE = [
  { name: "blue", light: "#c17800" },
  { name: "orange", light: "#f2b705" },
  { name: "aqua", light: "#d98f1f" },
  { name: "yellow", light: "#eda100" },
  { name: "magenta", light: "#a8651a" },
  { name: "green", light: "#8f5d00" },
  { name: "violet", light: "#6b4a00" },
  { name: "red", light: "#4a2e00" },
] as const;

export type PaletteName = (typeof PALETTE)[number]["name"];

export const PALETTE_HEXES: string[] = PALETTE.map((color) => color.light);

export function paletteHex(name: PaletteName): string {
  return PALETTE.find((color) => color.name === name)?.light ?? PALETTE[0].light;
}

/** Stored hex → CSS value that adapts to dark mode. Unknown colors are used as they are. */
export function cssColor(hex: string): string {
  const match = PALETTE.find((color) => color.light.toLowerCase() === hex.toLowerCase());
  return match ? `var(--c-${match.name})` : hex;
}

/** A soft tinted background for icons, like iOS Settings icons but lighter. */
export function softBackground(hex: string): string {
  return `color-mix(in srgb, ${cssColor(hex)} 16%, transparent)`;
}
