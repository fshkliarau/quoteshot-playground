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
