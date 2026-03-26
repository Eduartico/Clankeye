/**
 * Price normalization utility
 *
 * Scrapers return prices in wildly varying formats:
 *   "17.9 EUR", "45 € Negociável", "80 zł", "R$ 150", "$25.00",
 *   "€ 12.50", "1 200,50 €", "Free", "Grátis", etc.
 *
 * This module extracts the numeric value and maps the currency to its symbol.
 */

// ─── Currency maps ──────────────────────────────────────────────

/** Code → symbol */
const CODE_TO_SYMBOL: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  PLN: "zł",
  BRL: "R$",
  CZK: "Kč",
  SEK: "kr",
  DKK: "kr",
  NOK: "kr",
  CHF: "CHF",
  JPY: "¥",
  CNY: "¥",
  TRY: "₺",
  HUF: "Ft",
  RON: "lei",
  BGN: "лв",
  HRK: "kn",
  MXN: "$",
  ARS: "$",
  CLP: "$",
  COP: "$",
};

/** Symbols / abbreviations that appear in raw price strings */
const SYMBOL_TO_CANONICAL: Record<string, string> = {
  "€": "€",
  "$": "$",
  "£": "£",
  "zł": "zł",
  "zloty": "zł",
  "pln": "zł",
  "r$": "R$",
  "brl": "R$",
  "kč": "Kč",
  "czk": "Kč",
  "kr": "kr",
  "sek": "kr",
  "dkk": "kr",
  "nok": "kr",
  "chf": "CHF",
  "¥": "¥",
  "₺": "₺",
  "try": "₺",
  "ft": "Ft",
  "huf": "Ft",
  "lei": "lei",
  "ron": "lei",
  "лв": "лв",
  "bgn": "лв",
  "eur": "€",
  "usd": "$",
  "gbp": "£",
};

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Words that should be stripped from a price string (any language).
 * These are common "noise" words that sometimes end up in the price field.
 */
const NOISE_WORDS =
  /negoci[aá]vel|negotiable|envio|shipping|free|grátis|gratuit|kostenlos|gratis|livraison|frete|porto|incluído|included|inclus/gi;

/**
 * Try to detect and return the canonical currency symbol from a raw string.
 */
function detectCurrency(raw: string): string {
  const lower = raw.toLowerCase();

  // 1. Exact currency-code match (3-letter ISO at word boundary)
  for (const [code, sym] of Object.entries(CODE_TO_SYMBOL)) {
    if (new RegExp(`\\b${code}\\b`, "i").test(raw)) return sym;
  }

  // 2. Symbol / abbreviation match
  for (const [token, canonical] of Object.entries(SYMBOL_TO_CANONICAL)) {
    if (lower.includes(token)) return canonical;
  }

  // 3. Fallback — no currency detected
  return "";
}

/**
 * Extract the first numeric value from a string.
 * Handles "1 200,50" (European) and "1,200.50" (US) formats.
 */
function extractNumber(raw: string): string {
  // Remove everything except digits, dots, commas, and spaces between digits
  let cleaned = raw
    .replace(NOISE_WORDS, "")
    .replace(/[^\d.,\s]/g, " ")
    .trim();

  // Collapse inner spaces used as thousands separator ("1 200" → "1200")
  cleaned = cleaned.replace(/(\d)\s+(\d)/g, "$1$2");

  // Now figure out the decimal convention:
  //   "1.200,50" → European (comma decimal)
  //   "1,200.50" → US (dot decimal)
  //   "1200.50"  → US
  //   "1200,50"  → European

  // Match the last separator to decide convention
  const match = cleaned.match(
    /(\d[\d.,]*\d)/ // at least two digits with optional separators
  );
  if (!match) {
    // Maybe a single/two-digit number like "5" or "25"
    const simple = cleaned.match(/(\d+)/);
    return simple ? simple[1] : "";
  }

  let numStr = match[1];

  // If it has both comma and dot, the LAST one is the decimal separator
  const lastComma = numStr.lastIndexOf(",");
  const lastDot = numStr.lastIndexOf(".");

  if (lastComma > lastDot) {
    // European: dots are thousands, comma is decimal
    numStr = numStr.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    if (lastComma < 0) {
      // Only dots, no commas — check if 3 digits after the last dot
      // (thousands separator, e.g. "2.500" = 2500, not 2.5)
      const afterDot = numStr.length - lastDot - 1;
      if (afterDot === 3) {
        numStr = numStr.replace(/\./g, "");
      }
      // else it's a decimal dot (e.g. "2.50"), leave as-is
    } else {
      // US: commas are thousands, dot is decimal
      numStr = numStr.replace(/,/g, "");
    }
  } else {
    // Only one type of separator — if exactly 3 digits after, it's thousands
    if (lastComma >= 0) {
      const afterComma = numStr.length - lastComma - 1;
      numStr =
        afterComma === 3
          ? numStr.replace(/,/g, "")
          : numStr.replace(",", ".");
    }
    // dots — if exactly 3 digits after, it's thousands
    if (lastDot >= 0 && lastComma < 0) {
      const afterDot = numStr.length - lastDot - 1;
      if (afterDot === 3) {
        numStr = numStr.replace(/\./g, "");
      }
      // else leave as-is (it's a decimal)
    }
  }

  const n = parseFloat(numStr);
  if (isNaN(n)) return "";

  // Remove unnecessary trailing zeros but keep .X0 style
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

// ─── Public API ─────────────────────────────────────────────────

export interface NormalizedPrice {
  /** Display-ready string, e.g. "€ 17.90" or "80 zł" */
  display: string;
  /** Numeric value (NaN if unparseable) */
  value: number;
  /** Canonical currency symbol */
  symbol: string;
}

/**
 * Normalise a raw price string into a clean display value.
 *
 * Examples:
 *   normalizePrice("17.9 EUR")       → { display: "€ 17.90", value: 17.9, symbol: "€" }
 *   normalizePrice("45 € Negociável")→ { display: "€ 45",    value: 45,  symbol: "€" }
 *   normalizePrice("80 zł")          → { display: "80 zł",   value: 80,  symbol: "zł" }
 *   normalizePrice("R$ 150")         → { display: "R$ 150",  value: 150, symbol: "R$" }
 *   normalizePrice("Free")           → { display: "Free",    value: 0,   symbol: "" }
 */
export function normalizePrice(raw: unknown): NormalizedPrice {
  if (raw === null || raw === undefined || raw === "") {
    return { display: "–", value: NaN, symbol: "" };
  }

  const str = String(raw).trim();

  // Check for "Free" / "Grátis" etc.
  if (/^(free|grátis|gratuit|kostenlos|gratis|0)$/i.test(str)) {
    return { display: "Free", value: 0, symbol: "" };
  }

  const symbol = detectCurrency(str);
  const numStr = extractNumber(str);
  const value = numStr ? parseFloat(numStr) : NaN;

  if (isNaN(value)) {
    // Couldn't parse — return cleaned-up raw string
    return { display: str.replace(NOISE_WORDS, "").trim(), value: NaN, symbol };
  }

  // Format the display string
  // Prefix symbols: €, $, £, R$
  const PREFIX_SYMBOLS = ["€", "$", "£", "R$", "¥"];
  const formatted = value % 1 === 0 ? String(value) : value.toFixed(2);

  let display: string;
  if (PREFIX_SYMBOLS.includes(symbol)) {
    display = `${symbol} ${formatted}`;
  } else if (symbol) {
    display = `${formatted} ${symbol}`;
  } else {
    display = formatted;
  }

  return { display, value, symbol };
}
