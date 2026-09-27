// The 8 colors users can pick for areas and expense categories.
// They come from a palette validated for color-blind safety and contrast in
// both light and dark mode (run through a validator, not chosen "by eye").
// The database stores the LIGHT hex; on screen we use a CSS variable, so the
// color automatically switches to its dark-mode version.

export const PALETTE = [
  { name: "blue", light: "#2a78d6" },
  { name: "orange", light: "#eb6834" },
  { name: "aqua", light: "#1baf7a" },
  { name: "yellow", light: "#eda100" },
  { name: "magenta", light: "#e87ba4" },
  { name: "green", light: "#008300" },
  { name: "violet", light: "#4a3aa7" },
  { name: "red", light: "#e34948" },
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
