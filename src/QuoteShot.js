// ─────────────────────────────────────────────────────────────────────────────
// QuoteShot — the ONLY thing that ships to the production Expo app.
//
// A pure React Native component (react-native + react-native-svg +
// expo-linear-gradient). No web-only APIs, no dev-panel imports — drop it into
// the app unchanged. The dev panel feeds it props; `tokens` carries every visual
// knob so the component stays the single source of truth for a locked design.
//
// Layout contract (all three styles):
//   • The card is a column with the quote pinned to the TOP and the footer/cover
//     pinned to the BOTTOM. Changing `ratio` changes the card HEIGHT; the extra
//     height opens as empty space between quote and cover. The cover never leaves
//     the bottom edge.
//
// Styles:
//   • minimal      — solid color field, quote mark, footer cover chip + attribution
//   • bookshot     — full flat cover (no 3D tilt) bottom-anchored, quote on a solid field
//   • highlighter  — white card, marker highlight behind the quote, footer chip + attribution
//
// Fonts expected to be loaded by the host app (Expo Google Fonts):
//   SourceSerif4_600SemiBold, AlbertSans_500Medium, AlbertSans_600SemiBold
// (Falls back to system serif/sans if absent.)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G } from 'react-native-svg';

import { RATIO_SIZE, STYLE_TYPE, DEFAULT_TOKENS } from './tokens';

const COVER_ASPECT = 84.578 / 56; // book cover height / width (≈1.51)
const CHIP_BASE = 24; //  footer cover-chip width (minimal / highlighter)
const COVER_BASE = 112; // bookshot full-cover width at coverScale = 1

const FONT_SERIF = 'SourceSerif4_600SemiBold';
const FONT_SANS_MED = 'AlbertSans_500Medium';
const FONT_SANS_SEMI = 'AlbertSans_600SemiBold';

// ─── color helpers ────────────────────────────────────────────────────────────
function isLightColor(hex) {
  const h = String(hex).replace('#', '');
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}
function hexToRgba(hex, a) {
  const h = String(hex).replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ─── quote-mark glyph (minimal) ───────────────────────────────────────────────
const QUOTE_GLYPH =
  'M7.397 1.66356L6.56522 2.21867C5.13802 3.17114 3.60796 4.19601 2.76429 5.73931C3.30142 5.51237 3.89186 5.38689 4.5117 5.38689C6.99594 5.38689 9.00801 7.4026 9.00801 9.88688C9.00801 12.3712 6.99594 14.3869 4.5117 14.3869C2.03661 14.3869 0.0302155 12.386 0.0154659 9.91432C-0.207385 5.54004 1.99619 2.86342 5.45501 0.555105L6.28679 0L7.397 1.66356Z';
function QuoteMark({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G>
        <Path d={QUOTE_GLYPH} fill={color} transform="translate(2.2,4.6)" />
        <Path d={QUOTE_GLYPH} fill={color} transform="translate(12.9,4.6)" />
      </G>
    </Svg>
  );
}

// ─── flat book cover (no 3D tilt) — used as chip and as bookshot full cover ───
function BookCover({ uri, width, radius = 2 }) {
  const height = Math.round(width * COVER_ASPECT);
  const spineW = Math.max(2, width * 0.13);
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: '#e9e3d6',
        ...shadow(width >= 60 ? 6 : 2),
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      {/* spine shading on the binding edge */}
      <LinearGradient
        colors={['rgba(0,0,0,0.30)', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: spineW }}
        pointerEvents="none"
      />
      {/* faint page sheen on the outer edge */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.10)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: spineW }}
        pointerEvents="none"
      />
    </View>
  );
}

function shadow(level) {
  // cross-platform soft elevation; web maps to boxShadow
  if (Platform.OS === 'web') {
    return {
      boxShadow:
        level >= 6
          ? '0 6px 14px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)'
          : '0 2px 5px rgba(0,0,0,0.18)',
    };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: level >= 6 ? 6 : 2 },
    shadowOpacity: 0.18,
    shadowRadius: level >= 6 ? 12 : 4,
    elevation: level,
  };
}

// ─── attribution block (title + author/handle) ────────────────────────────────
function Attribution({ title, author, handle, type, titleColor, metaColor, stacked }) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text
        numberOfLines={2}
        style={{
          fontFamily: FONT_SANS_SEMI,
          fontWeight: '600',
          fontSize: type.title,
          lineHeight: type.title + 5,
          color: titleColor,
        }}
      >
        {title}
      </Text>
      <View
        style={
          stacked
            ? { marginTop: 2 }
            : { flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 }
        }
      >
        <Text
          numberOfLines={1}
          style={{ fontFamily: FONT_SANS_MED, fontWeight: '500', fontSize: type.meta, lineHeight: type.meta + 3, color: metaColor }}
        >
          {author}
        </Text>
        {handle ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: FONT_SANS_MED,
              fontWeight: '500',
              fontSize: type.meta,
              lineHeight: type.meta + 3,
              color: metaColor,
              marginTop: stacked ? 3 : 0,
            }}
          >
            {handle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── quote that FILLS its area ────────────────────────────────────────────────
// Sits in a flex:1 slot (the space left after the footer) and auto-sizes its font
// to fill that slot — largest size whose wrapped text still fits the measured box,
// so the quote never overlaps the attribution below it. `fontScale` is a multiplier
// on the filled size (1 = fill exactly, <1 smaller, >1 intentionally larger/clipped).
const LINE_RATIO = 1.34;
const MIN_FONT = 9;
const MAX_FONT = 60;
const seedFont = (h, w) =>
  Math.max(MIN_FONT, Math.min(MAX_FONT, Math.round(Math.sqrt((h * w) / 110))));

function FillQuote({ text, fontScale, color, marker, fontFamily = FONT_SERIF }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  // binary-search the largest font whose wrapped text fits the slot height.
  // lo = largest size known to fit, hi = upper bound, fs = size being measured.
  const [fit, setFit] = useState({ lo: MIN_FONT, hi: MAX_FONT, fs: 18, done: false });

  // restart the search whenever the slot or text changes (ratio/style/quote)
  useEffect(() => {
    if (box.w > 0 && box.h > 0) {
      setFit({ lo: MIN_FONT, hi: MAX_FONT, fs: seedFont(box.h, box.w), done: false });
    }
  }, [text, box.w, box.h]);

  const onMeasure = useCallback(
    (e) => {
      const ch = e.nativeEvent.layout.height;
      setFit((st) => {
        if (st.done || box.h <= 0) return st;
        let { lo, hi } = st;
        const fs = st.fs;
        if (ch <= box.h) lo = fs; // fits → raise the floor
        else hi = fs - 1; //         overflows → lower the ceiling
        if (lo >= hi) return { lo, hi: lo, fs: lo, done: true };
        const next = Math.ceil((lo + hi) / 2);
        return { lo, hi, fs: next, done: next === fs };
      });
    },
    [box.h]
  );

  const fs = fit.fs;
  const displayFs = Math.max(MIN_FONT, Math.round(fs * (fontScale || 1)));
  const displayLh = Math.round(displayFs * LINE_RATIO);
  const measLh = Math.round(fs * LINE_RATIO);
  const measW = box.w || '100%';

  return (
    <View
      style={styles.fillSlot}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (Math.abs(width - box.w) > 0.5 || Math.abs(height - box.h) > 0.5) {
          setBox({ w: width, h: height });
        }
      }}
    >
      {/* hidden measurer — reports the wrapped height at the fill-candidate size */}
      <Text
        onLayout={onMeasure}
        style={{ position: 'absolute', opacity: 0, left: 0, top: 0, width: measW, fontFamily, fontSize: fs, lineHeight: measLh }}
      >
        {text}
      </Text>
      {marker ? (
        <Text style={{ fontFamily, fontSize: displayFs, lineHeight: displayLh }} selectable={false}>
          <Text style={{ backgroundColor: marker, color }}>{text}</Text>
        </Text>
      ) : (
        <Text style={{ fontFamily, fontSize: displayFs, lineHeight: displayLh, color }} selectable={false}>
          {text}
        </Text>
      )}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  QuoteShot
// ═════════════════════════════════════════════════════════════════════════════
export default function QuoteShot(props) {
  const {
    style = 'minimal',
    ratio = 'square',
    color,
    quote = '',
    bookTitle = '',
    author = '',
    handle = '',
    coverUri,
    transparentBg = false,
    tokens: tokenOverrides,
  } = props;

  const t = { ...DEFAULT_TOKENS, ...(tokenOverrides || {}) };
  const size = RATIO_SIZE[ratio] || RATIO_SIZE.square;
  const type = STYLE_TYPE[style] || STYLE_TYPE.minimal;

  // ── resolve colors per style ──
  const highlighter = style === 'highlighter';
  const cardColor = highlighter ? '#ffffff' : color || '#ffffff';
  // text scheme: 'auto' follows the field luminance; 'dark'/'light' force it
  // (used for transparent stickers, where there is no field to read).
  const autoDark = highlighter ? true : isLightColor(cardColor); // light field → dark text
  const darkText =
    t.textColor === 'dark' ? true : t.textColor === 'light' ? false : autoDark;
  const fg = darkText ? '#333333' : '#ffffff';
  const fgSec = darkText ? '#7b7a79' : 'rgba(255,255,255,0.72)';
  const markGlyph = darkText ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.32)';
  const marker = highlighter ? hexToRgba(color || '#f4e07d', t.highlightOpacity) : null;

  const bg = transparentBg ? 'transparent' : cardColor;

  const card = [
    styles.card,
    {
      width: size.w,
      height: size.h,
      borderRadius: t.cornerRadius,
      padding: t.padding,
      backgroundColor: bg,
    },
    !transparentBg && shadow(6),
  ];

  const quoteFg = fg;

  // ── BOOKSHOT ──
  if (style === 'bookshot') {
    const coverW = Math.min(size.w * 0.5, Math.round(COVER_BASE * t.coverScale));
    return (
      <View style={card}>
        <FillQuote text={quote} fontScale={t.fontScale} color={quoteFg} />
        <View style={styles.bookshotFooter}>
          <Attribution
            title={bookTitle}
            author={author}
            handle={handle}
            type={type}
            titleColor={fg}
            metaColor={fgSec}
            stacked
          />
          <BookCover uri={coverUri} width={coverW} radius={3} />
        </View>
      </View>
    );
  }

  // ── HIGHLIGHTER ──
  if (style === 'highlighter') {
    const chipW = Math.round(CHIP_BASE * t.coverScale);
    return (
      <View style={card}>
        <FillQuote text={quote} fontScale={t.fontScale} color={quoteFg} marker={marker} />
        <View style={styles.chipFooter}>
          <BookCover uri={coverUri} width={chipW} radius={2} />
          <Attribution
            title={bookTitle}
            author={author}
            handle={handle}
            type={type}
            titleColor={fg}
            metaColor={fgSec}
          />
        </View>
      </View>
    );
  }

  // ── MINIMAL ──
  const chipW = Math.round(CHIP_BASE * t.coverScale);
  const markSize = Math.round(24 * t.quoteMarkScale);
  return (
    <View style={card}>
      <View style={styles.minimalQuote}>
        {t.quoteMarkScale > 0 ? (
          <View style={{ marginBottom: 4 }}>
            <QuoteMark color={markGlyph} size={markSize} />
          </View>
        ) : null}
        <FillQuote text={quote} fontScale={t.fontScale} color={quoteFg} />
      </View>
      <View style={styles.chipFooter}>
        <BookCover uri={coverUri} width={chipW} radius={2} />
        <Attribution
          title={bookTitle}
          author={author}
          handle={handle}
          type={type}
          titleColor={fg}
          metaColor={fgSec}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // column: the quote area (flex:1) fills all space above the footer, so the
  // footer is always pinned to the bottom and the two never overlap.
  card: { overflow: 'hidden' },
  // the measured fill slot — takes the leftover height, clips nothing it sizes to
  fillSlot: { flex: 1, width: '100%', overflow: 'hidden' },
  // minimal wraps the quote mark above the fill slot
  minimalQuote: { flex: 1, width: '100%' },
  // footers pinned to the bottom (with a gap from the quote above)
  chipFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  bookshotFooter: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: 12 },
});
