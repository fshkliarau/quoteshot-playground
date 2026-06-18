# QuoteShot design playground

A web app for iterating the **QuoteShot** share-image design in code, and locking
decisions before they land in the production Bookwise app.

The QuoteShot component is a **real React Native component** (Expo + react-native-web)
— the exact file the playground renders, `src/QuoteShot.js`, drops into the
production Expo app unchanged. The playground around it (dev panel, grid, export) is
web-only and never ships.

```
┌─────────────────────────────────────────┬──────────────────┐
│  Stage                                   │  Dev panel       │
│   • single preview (light / dark bg)     │   Style          │
│   • grid: all colors × all ratios        │   Ratio          │
│   • copyable token JSON readout          │   Color          │
│   • Save PNG / transparent PNG / copy    │   Content        │
│                                          │   Design knobs   │
└─────────────────────────────────────────┴──────────────────┘
```

## Run it

```bash
npm install
npm run web        # http://localhost:8081
```

## Controls — DialKit

The right sidebar is driven by [DialKit](https://github.com/joshpuckett/dialkit).
A `useDialKit('QuoteShot', schema, { onAction })` call in `App.js` declares quote
length+text, attribution, cover, the token sliders, and `savePNG` / `copyJSON` /
`reset` actions; the returned `params` feed `<QuoteShot/>` and the "Locked values"
JSON readout. `<DialRoot mode="inline" theme="light" />` renders that panel inline.

Some controls are rendered outside the schema for layout/styling control, but still
use DialKit's components so everything matches:

- **Style / Ratio / Color** sit *above* `DialRoot` (so Color can be a swatch grid
  directly under Ratio). Style/Ratio use DialKit's exported `SelectControl`; Color is
  the custom per-style `Swatches` grid (with a checkerboard **None** swatch that
  replaces a separate transparent toggle — DialKit has no swatch-palette control and
  the palette depends on the style). They live in React state. `DialRoot`'s own panel
  header is hidden (`src/dialkit-overrides.css`) so the two read as one panel.
- **Header** (Single/Grid, Light/Dark bg, Copy text, Save PNG) is hand-laid-out from
  DialKit's exported `SegmentedControl` + `dialkit-button`s, wrapped in a
  `.dialkit-root` so its CSS variables resolve.

Two non-obvious things were needed to run DialKit inside Expo + Metro:

- **`import.meta` shim.** DialKit's prebuilt bundle uses `import.meta`, which Metro
  emits into a classic (non-module) script → a parse-time `SyntaxError` that silently
  kills the whole bundle. `babel.config.js` includes a tiny plugin that rewrites every
  `import.meta` to `{}` (the dialkit guards stay correct). Applies to dev and export.
- **CSS path.** Import the stylesheet as `import 'dialkit/dist/styles.css'` (the
  package-`exports` subpath `dialkit/styles.css` doesn't resolve through Metro). It is
  bundled into the static web export automatically.
- **Segmented selects.** DialKit renders `select` controls as dropdowns with no
  config flag to change it. `patches/dialkit+1.2.1.patch` (applied by `patch-package`
  via the `postinstall` script) rewrites its `SelectControl` to render the built-in
  `SegmentedControl` instead (so Style/Ratio/Length/Cover are segmented pills), and
  also adds `SegmentedControl` to the package exports so the header can reuse it.

## The component — `src/QuoteShot.js`

The only thing that ships. Pure RN (`react-native` + `react-native-svg` +
`expo-linear-gradient`). No web-only APIs, no dev-panel imports.

### Props

| prop            | type                                        | notes |
|-----------------|---------------------------------------------|-------|
| `style`         | `'minimal' \| 'bookshot' \| 'highlighter'`  | variant names match production |
| `ratio`         | `'narrow' \| 'square' \| 'tall'`            | drives card **height** (345×170 / 345×345 / 345×525) |
| `color`         | palette token (hex)                         | set depends on `style` — see `src/tokens.js` `PALETTES` |
| `quote`         | `string`                                    | supports `\n\n` paragraphs |
| `bookTitle`     | `string`                                    | |
| `author`        | `string`                                    | |
| `handle`        | `string`                                    | |
| `coverUri`      | `string`                                    | any image URI; bottom-anchored |
| `transparentBg` | `boolean`                                   | sticker output — no background fill |
| `tokens`        | partial token overrides                     | every visual knob; see below |

### Layout contract

The card is a column with the quote pinned to the **top** and the footer/cover
pinned to the **bottom**. Changing `ratio` changes the height; the extra height opens
as empty space between quote and cover. **The cover never leaves the bottom edge.**

- **minimal** — solid color field, quote mark, footer cover chip + attribution
- **bookshot** — full flat cover (no 3D tilt) bottom-anchored, quote on the solid field
- **highlighter** — white card, marker highlight behind the quote, footer chip + attribution

Text color follows the field's luminance (dark text on light fields, white on dark).
`transparentBg` keeps those same text rules so a sticker stays legible.

### Tokens (the design knobs)

Defaults live in `src/tokens.js` (`DEFAULT_TOKENS`):

```js
{ padding: 16, cornerRadius: 12, fontScale: 1,
  quoteMarkScale: 1, coverScale: 1, highlightOpacity: 0.55 }
```

The dev panel writes each slider straight into the `tokens` prop, so the component
stays the single source of truth. **Copy JSON** in the stage emits
`{ style, ratio, color, transparentBg, tokens }` — paste it into the production token
set to lock a design.

### Palettes (from Figma)

`src/tokens.js` → `PALETTES`. Source:
[Figma · Quoteshot design board](https://www.figma.com/design/baEiPJCK8nJU76L7Kuoj88/?node-id=31476-127154).

- **minimal** — White, Orange, Green, Blue, Yellow, Dark (solid field)
- **bookshot** — Dark `#292e38`, Purple `#443cad`, Teal `#1579a3`, Brown `#75161a`, White (solid field)
- **highlighter** — Yellow, Purple, Blue, Pink, Orange, Green (marker over a white card)

### Fonts

The host app must load these Expo Google Fonts (the playground loads them in `App.js`):
`SourceSerif4_600SemiBold`, `AlbertSans_500Medium`, `AlbertSans_600SemiBold`.
Falls back to system serif/sans if absent.

## Export

The web playground rasterizes the live DOM node with **`html-to-image`** at 3×
(345×525 → 1035×1575 PNG). In the production app the **same** QuoteShot node is
captured with **`react-native-view-shot`** at the same pixel ratio:

```js
import { captureRef } from 'react-native-view-shot';
const uri = await captureRef(quoteShotRef, { format: 'png', quality: 1, pixelRatio: 3 });
```

`transparentBg` produces a transparent sticker PNG; **Copy text** copies the raw quote.

## Deploy (static export)

```bash
npm run build          # → dist/  (serves from "/", e.g. Vercel)
npm run build:pages    # → dist/  with EXPO_BASE_URL=/quoteshot-playground (GitHub Pages project site)
```

- **Vercel** — `vercel.json` is included; build command `npm run build`, output `dist`.
- **GitHub Pages** — `.github/workflows/deploy.yml` builds with `EXPO_BASE_URL=/<repo>`
  and publishes `dist/`. Enable Pages → Source: GitHub Actions.

## Scope

In: the QuoteShot component, the dev panel, export.
Out: the Share Highlight sheet chrome, the reader screen, navigation.
