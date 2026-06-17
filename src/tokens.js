// ─────────────────────────────────────────────────────────────────────────────
// QuoteShot design tokens — the single source of truth for the component.
//
// These are the values the dev panel writes into the `tokens` prop. When a design
// is locked, copy the JSON readout straight into the production token set.
// Palettes and base type scale come from the Figma "Quoteshot design" board:
//   https://www.figma.com/design/baEiPJCK8nJU76L7Kuoj88/?node-id=31476-127154
// ─────────────────────────────────────────────────────────────────────────────

export const STYLES = ['minimal', 'bookshot', 'highlighter'];
export const STYLE_LABELS = { minimal: 'Minimal', bookshot: 'Bookshot', highlighter: 'Highlighter' };

export const RATIOS = ['narrow', 'square', 'tall'];
export const RATIO_LABELS = { narrow: 'Narrow', square: 'Square', tall: 'Tall' };

// Intrinsic card geometry per ratio. Width is constant (the Figma artboard width);
// ratio drives the HEIGHT. The cover is bottom-anchored, so added height opens as
// space between the quote (top) and the footer/cover (bottom).
export const CARD_W = 345;
export const RATIO_SIZE = {
  narrow: { w: CARD_W, h: 170 }, //  ~2:1 landscape
  square: { w: CARD_W, h: 345 }, //   1:1
  tall: { w: CARD_W, h: 525 }, //    ~2:3 portrait (share image)
};

// ─── Palettes — set depends on style (swatches swap with the style) ───────────
// Each entry: { name, value } where `value` is the card field color (minimal,
// bookshot) or the marker color (highlighter, drawn over a white card).
export const PALETTES = {
  minimal: [
    { name: 'White', value: '#ffffff' },
    { name: 'Orange', value: '#e16a17' },
    { name: 'Green', value: '#368b6c' },
    { name: 'Blue', value: '#264c94' },
    { name: 'Yellow', value: '#9c7d11' },
    { name: 'Dark', value: '#292e38' },
  ],
  bookshot: [
    { name: 'Dark', value: '#292e38' },
    { name: 'Purple', value: '#443cad' },
    { name: 'Teal', value: '#1579a3' },
    { name: 'Brown', value: '#75161a' },
    { name: 'White', value: '#ffffff' },
  ],
  highlighter: [
    { name: 'Yellow', value: '#f4e07d' },
    { name: 'Purple', value: '#e1c3ed' },
    { name: 'Blue', value: '#c3dbef' },
    { name: 'Pink', value: '#f4c4d8' },
    { name: 'Orange', value: '#f6d2a6' },
    { name: 'Green', value: '#c8e6b6' },
  ],
};

// First swatch of each palette — used to reset color on style change.
export const DEFAULT_COLOR = {
  minimal: PALETTES.minimal[0].value,
  bookshot: PALETTES.bookshot[0].value,
  highlighter: PALETTES.highlighter[0].value,
};

// ─── Token defaults (the "design knobs") ──────────────────────────────────────
// Every knob in the dev panel writes one of these. The component reads tokens and
// nothing else, so these defaults == the component's out-of-the-box look.
export const DEFAULT_TOKENS = {
  padding: 16, //        card inset
  cornerRadius: 12, //   card corner radius
  fontScale: 1, //       multiplies the filled quote size
  quoteMarkScale: 1, //  multiplies the quote-mark glyph (minimal)
  coverScale: 0.8, //    multiplies the cover/cover-chip size (per-style default below)
  highlightOpacity: 0.55, // marker opacity (highlighter only)
  textColor: 'auto', //  'auto' (by field luminance) | 'dark' | 'light' — set for sticker output
};

// Cover size depends on the style: a small chip for minimal/highlighter, a small
// flat cover for bookshot. Selecting a style resets coverScale to its default.
export const STYLE_COVER_SCALE = {
  minimal: 0.8,
  bookshot: 0.4,
  highlighter: 0.8,
};

// Which knobs are relevant per style (the panel hides the rest).
export const STYLE_KNOBS = {
  minimal: ['padding', 'cornerRadius', 'fontScale', 'quoteMarkScale', 'coverScale'],
  bookshot: ['padding', 'cornerRadius', 'fontScale', 'coverScale'],
  highlighter: ['padding', 'cornerRadius', 'fontScale', 'coverScale', 'highlightOpacity'],
};

export const KNOB_RANGES = {
  padding: { min: 0, max: 40, step: 1, unit: 'px' },
  cornerRadius: { min: 0, max: 40, step: 1, unit: 'px' },
  fontScale: { min: 0.6, max: 1.8, step: 0.05, unit: '×' },
  quoteMarkScale: { min: 0, max: 2.5, step: 0.05, unit: '×' },
  coverScale: { min: 0.4, max: 2, step: 0.05, unit: '×' },
  highlightOpacity: { min: 0, max: 1, step: 0.01, unit: '' },
};

// ─── Base type scale per style (pre-fontScale), from Figma ────────────────────
export const STYLE_TYPE = {
  minimal: { quote: 22, line: 28, title: 13, meta: 10 },
  bookshot: { quote: 22, line: 28, title: 15, meta: 10 },
  highlighter: { quote: 24, line: 31, title: 13, meta: 10 },
};

// ─── Content presets (stress-test the layout) ─────────────────────────────────
export const QUOTE_PRESETS = {
  short: 'The unexamined life is not worth living.',
  medium:
    'Such a small change is barely noticeable at takeoff—the nose of the airplane moves just a few feet—but when magnified across the entire United States, you end up hundreds of miles apart.',
  long:
    'Giving yourself a high-five each morning, before the anxiety of the day creeps in, is a simple way to start feeling better about yourself.\n\n' +
    'It sounds trivial, almost embarrassing. But the brain does not distinguish between the encouragement you give others and the encouragement you give yourself.\n\n' +
    'Over weeks, the small ritual compounds—just like the airplane nudged a few degrees at takeoff—until you land somewhere entirely new.',
};

export const DEFAULT_CONTENT = {
  quote: QUOTE_PRESETS.medium,
  bookTitle: 'The Beginning of Infinity',
  author: 'David Deutsch',
  handle: '@danreads on Bookwise',
};

// ─── Cover presets — light / dark / busy, to test contrast + anchoring ────────
const svgUri = (svg) => 'data:image/svg+xml,' + encodeURIComponent(svg);

const lightCover = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="85" viewBox="0 0 56 85">
  <rect width="56" height="85" fill="#f1e9da"/>
  <rect x="3" y="3" width="50" height="79" fill="none" stroke="#c9bda0" stroke-width="0.8"/>
  <text x="28" y="34" text-anchor="middle" font-family="Georgia, serif" font-size="8" fill="#3a3530">The</text>
  <text x="28" y="46" text-anchor="middle" font-family="Georgia, serif" font-size="9" font-weight="bold" fill="#2b2620">QUIET</text>
  <text x="28" y="57" text-anchor="middle" font-family="Georgia, serif" font-size="9" font-weight="bold" fill="#2b2620">SHORE</text>
  <line x1="18" y1="66" x2="38" y2="66" stroke="#9a8f78" stroke-width="0.8"/>
  <text x="28" y="74" text-anchor="middle" font-family="Georgia, serif" font-size="4.5" fill="#6b6253">A. MORLAND</text>
</svg>`;

const darkCover = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="85" viewBox="0 0 56 85">
  <rect width="56" height="85" fill="#14171c"/>
  <rect x="0" y="0" width="56" height="85" fill="url(#g)"/>
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1d222b"/><stop offset="1" stop-color="#0c0e12"/></linearGradient></defs>
  <text x="28" y="32" text-anchor="middle" font-family="Georgia, serif" font-size="9" font-weight="bold" fill="#e9c46a">DEEP</text>
  <text x="28" y="43" text-anchor="middle" font-family="Georgia, serif" font-size="9" font-weight="bold" fill="#e9c46a">FIELD</text>
  <line x1="16" y1="50" x2="40" y2="50" stroke="#e9c46a" stroke-width="0.6"/>
  <text x="28" y="74" text-anchor="middle" font-family="Georgia, serif" font-size="4.5" fill="#9aa3b2">R. OKONKWO</text>
</svg>`;

const busyCover = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="85" viewBox="0 0 56 85">
  <defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ff5f6d"/><stop offset="0.5" stop-color="#ffc371"/><stop offset="1" stop-color="#3a1c71"/></linearGradient></defs>
  <rect width="56" height="85" fill="url(#b)"/>
  <circle cx="14" cy="20" r="16" fill="#ffffff" opacity="0.18"/>
  <circle cx="46" cy="58" r="22" fill="#000000" opacity="0.16"/>
  <path d="M0 60 Q28 40 56 64 L56 85 L0 85 Z" fill="#1b2a4a" opacity="0.55"/>
  <text x="28" y="40" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="bold" fill="#ffffff">NEON</text>
  <text x="28" y="52" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="bold" fill="#ffffff">CITY</text>
  <text x="28" y="76" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="4.5" fill="#ffe8d6">J. VEGA</text>
</svg>`;

export const COVER_PRESETS = [
  { name: 'Light', uri: svgUri(lightCover) },
  { name: 'Dark', uri: svgUri(darkCover) },
  { name: 'Busy', uri: svgUri(busyCover) },
];

export const DEFAULT_COVER = COVER_PRESETS[2].uri; // busy — exercises contrast by default
