// ─────────────────────────────────────────────────────────────────────────────
// Export helpers — WEB ONLY (dev playground concern, not part of QuoteShot).
//
// The web playground rasterizes the live DOM node with `html-to-image`.
// In the production Expo app the SAME QuoteShot node is captured with
// `react-native-view-shot` (captureRef → PNG) at the same pixel ratio — the
// component is identical; only the capture mechanism differs per platform.
//
//   import { captureRef } from 'react-native-view-shot';
//   const uri = await captureRef(quoteShotRef, { format: 'png', quality: 1,
//                                                result: 'tmpfile', pixelRatio: 3 });
// ─────────────────────────────────────────────────────────────────────────────

const SHARE_PIXEL_RATIO = 3; // 345×525 tall → 1035×1575 PNG (share resolution)

function getDomNode(ref) {
  // On react-native-web a View ref resolves to its underlying DOM node.
  const node = ref && ref.current;
  if (!node) return null;
  if (node instanceof HTMLElement) return node;
  // RNW sometimes exposes the node via these:
  if (node._nativeTag && typeof document !== 'undefined') return node;
  return node;
}

export async function savePng(ref, { transparent = false, fileName = 'quoteshot' } = {}) {
  const node = getDomNode(ref);
  if (!node) throw new Error('Nothing to export (no node ref).');
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(node, {
    pixelRatio: SHARE_PIXEL_RATIO,
    cacheBust: true,
    // transparent sticker → no backdrop; otherwise let the card paint its own fill
    backgroundColor: transparent ? undefined : null,
    skipFonts: false,
    style: { margin: '0' },
  });
  triggerDownload(dataUrl, `${fileName}${transparent ? '-transparent' : ''}.png`);
  return dataUrl;
}

function triggerDownload(dataUrl, name) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  // fallback
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
  return true;
}
