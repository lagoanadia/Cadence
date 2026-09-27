// Money is stored as whole cents (Int). These helpers convert between what the
// user types ("12,50") and what we store (1250), and back for display.

/**
 * Parses what a person types into cents. Accepts the Spanish style ("12,50",
 * "1.234,56") and the English style ("12.50", "1,234.56"). Returns null if it
 * isn't a valid positive amount.
 *
 * Rule: if the text has a separator followed by exactly 1 or 2 digits at the
 * end, that's the decimal separator. Any other "." or "," is a thousands separator.
 */
export function parseEuroInput(input: string): number | null {
  const text = input.replace(/[€\s]/g, "");
  if (!/^\d[\d.,]*$/.test(text)) return null;

  const decimalMatch = text.match(/[.,](\d{1,2})$/);
  const integerPart = decimalMatch ? text.slice(0, -decimalMatch[0].length) : text;
  const decimals = decimalMatch ? decimalMatch[1].padEnd(2, "0") : "00";
  const digits = integerPart.replace(/[.,]/g, "");
  if (digits === "") return null;

  const cents = Number(digits) * 100 + Number(decimals);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

/**
 * 123456 → "1.234,56 €". Written by hand instead of using Intl.NumberFormat on
 * purpose: Node and browsers can format currencies slightly differently
 * (for example the kind of space before "€"), which breaks React hydration.
 */
export function formatEuros(cents: number, options: { decimals?: boolean } = {}): string {
  const showDecimals = options.decimals ?? true;
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(Math.round(cents));
  const whole = Math.floor(absolute / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "."); // add a dot every 3 digits
  const decimals = (absolute % 100).toString().padStart(2, "0");
  return showDecimals ? `${sign}${whole},${decimals} €` : `${sign}${whole} €`;
}

/** 1250 → "12,50" — for pre-filling an input when editing. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
