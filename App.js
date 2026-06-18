// ─────────────────────────────────────────────────────────────────────────────
// QuoteShot design playground — web app (Expo + react-native-web).
//
// Left: stage (single preview or grid, light/dark app backdrop, export bar,
//       copyable token JSON readout). Right: the dev panel.
// The ONLY thing that ships to production is <QuoteShot/> (src/QuoteShot.js).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useFonts, SourceSerif4_600SemiBold } from '@expo-google-fonts/source-serif-4';
import {
  AlbertSans_500Medium,
  AlbertSans_600SemiBold,
  AlbertSans_700Bold,
} from '@expo-google-fonts/albert-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { DialRoot, useDialKit, DialStore } from 'dialkit';
import 'dialkit/dist/styles.css';

import QuoteShot from './src/QuoteShot';
import { UI, Button } from './src/panel/controls';
import { savePng, copyText } from './src/exporter';
import {
  PALETTES,
  RATIOS,
  RATIO_LABELS,
  RATIO_SIZE,
  QUOTE_PRESETS,
  COVER_PRESETS,
  STYLE_LABELS,
} from './src/tokens';

const APP_BG = { light: UI.bg, dark: '#1C1B19' };
const GRID_SCALE = 0.42;

// ── DialKit schema — the single source of truth for the control panel ──────────
const DIAL_CONFIG = {
  style: { type: 'select', options: ['minimal', 'bookshot', 'highlighter'], default: 'bookshot' },
  ratio: { type: 'select', options: ['narrow', 'square', 'tall'], default: 'square' },
  color: '#292e38', // color picker
  transparentBg: false, // toggle

  quote: {
    length: { type: 'select', options: ['short', 'medium', 'long'], default: 'medium' },
    text: { type: 'text', default: '', placeholder: 'Quote text...' },
  },

  attribution: {
    bookTitle: 'The Beginning of Infinity',
    author: 'David Deutsch',
    handle: '@danreads on Bookwise',
  },

  cover: { type: 'select', options: ['light', 'dark', 'busy'], default: 'busy' },

  // maps to the QuoteShot "Design Knobs": [default, min, max, step]
  tokens: {
    padding: [16, 0, 64, 1],
    cornerRadius: [12, 0, 48, 1],
    fontScale: [1, 0.5, 2, 0.05],
    quoteMarkScale: [1, 0, 3, 0.1],
    coverScale: [0.4, 0, 1, 0.05],
    highlightOpacity: [0.55, 0, 1, 0.05],
  },

  savePNG: { type: 'action', label: 'Save PNG' },
  copyJSON: { type: 'action', label: 'Copy JSON' },
  reset: { type: 'action', label: 'Reset' },
};

// reset the token sliders (+ transparency) back to their schema defaults
const TOKEN_DEFAULTS = { padding: 16, cornerRadius: 12, fontScale: 1, quoteMarkScale: 1, coverScale: 0.4, highlightOpacity: 0.55 };
function resetDialTokens() {
  const panel = DialStore.getPanels().find((p) => p.name === 'QuoteShot');
  if (!panel) return;
  Object.entries(TOKEN_DEFAULTS).forEach(([k, v]) => DialStore.updateValue(panel.id, `tokens.${k}`, v));
  DialStore.updateValue(panel.id, 'transparentBg', false);
}

const coverUriFor = (name) => (COVER_PRESETS.find((c) => c.name.toLowerCase() === name) || COVER_PRESETS[2]).uri;

export default function App() {
  const [fontsLoaded] = useFonts({
    SourceSerif4_600SemiBold,
    AlbertSans_500Medium,
    AlbertSans_600SemiBold,
    AlbertSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  const [view, setView] = useState('single'); // single | grid
  const [appBg, setAppBg] = useState('light');
  const [toast, setToast] = useState('');

  const captureRef = useRef(null);
  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  // actions fire from DialKit; route them through a ref so they always see the
  // latest derived values (lockedJson, transparentBg) without re-subscribing.
  const actionRef = useRef(() => {});
  const onAction = useCallback((a) => actionRef.current(a), []);

  // ── the entire control panel: one DialKit call drives every value ──
  const params = useDialKit('QuoteShot', DIAL_CONFIG, { onAction });

  // map DialKit params → QuoteShot props
  const style = params.style;
  const ratio = params.ratio;
  const color = params.color;
  const transparentBg = params.transparentBg;
  const tokens = params.tokens; // { padding, cornerRadius, fontScale, quoteMarkScale, coverScale, highlightOpacity }
  const quoteText =
    params.quote.text && params.quote.text.trim() ? params.quote.text : QUOTE_PRESETS[params.quote.length];
  const coverUri = coverUriFor(params.cover);

  const quoteProps = {
    style,
    ratio,
    color,
    quote: quoteText,
    bookTitle: params.attribution.bookTitle,
    author: params.attribution.author,
    handle: params.attribution.handle,
    coverUri,
    transparentBg,
    tokens,
  };

  const colorName = (() => {
    const found = PALETTES[style].find((c) => c.value.toLowerCase() === String(color).toLowerCase());
    return found ? found.name : color;
  })();

  const lockedJson = JSON.stringify({ style, ratio, color, transparentBg, tokens }, null, 2);

  const doExport = useCallback(
    async (transparent, fileName) => {
      try {
        await savePng(captureRef, { transparent, fileName });
        flash(transparent ? 'Saved transparent PNG' : 'Saved PNG');
      } catch (e) {
        flash('Export failed: ' + (e && e.message ? e.message : e));
      }
    },
    [flash]
  );

  // keep the action handler pointed at the latest values every render
  actionRef.current = (a) => {
    if (a === 'savePNG') doExport(transparentBg, `quoteshot-${style}-${ratio}-${String(colorName).toLowerCase()}`);
    else if (a === 'copyJSON') copyText(lockedJson).then(() => flash('JSON copied'));
    else if (a === 'reset') resetDialTokens();
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.loading]}>
        <Text style={{ color: UI.textSec, fontFamily: UI.F.med, fontSize: 13, letterSpacing: 0.3 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Stage ── */}
      <View style={styles.stage}>
        <View style={styles.toolbar}>
          <Tabs value={view} onChange={setView} options={[{ value: 'single', label: 'Single' }, { value: 'grid', label: 'Grid' }]} />
          <Tabs value={appBg} onChange={setAppBg} options={[{ value: 'light', label: 'Light bg' }, { value: 'dark', label: 'Dark bg' }]} />
          <View style={{ flex: 1 }} />
          <View style={styles.exportRow}>
            <Button label="Copy text" variant="ghost" onPress={async () => { await copyText(quoteText); flash('Quote copied'); }} />
            {transparentBg ? (
              <Button label="Save transparent PNG" variant="primary" onPress={() => doExport(true, `quoteshot-${style}-${ratio}-${String(colorName).toLowerCase()}`)} />
            ) : (
              <Button label="Save PNG" variant="primary" onPress={() => doExport(false, `quoteshot-${style}-${ratio}-${String(colorName).toLowerCase()}`)} />
            )}
          </View>
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: UI.bg }}
          contentContainerStyle={styles.stageScroll}
        >
          {view === 'single' ? (
            <SingleStage appBg={appBg} quoteProps={quoteProps} />
          ) : (
            <GridStage style={style} quoteProps={quoteProps} />
          )}

          {/* ── Inspector / token readout ── */}
          <View style={styles.inspector}>
            <View style={styles.inspectorHead}>
              <Text style={styles.inspectorTitle}>Locked values</Text>
              <Text style={styles.inspectorMeta}>
                {STYLE_LABELS[style]} · {RATIO_LABELS[ratio]} · {colorName}
              </Text>
              <View style={{ flex: 1 }} />
              <Button label="Copy JSON" variant="ghost" onPress={async () => { await copyText(lockedJson); flash('JSON copied'); }} />
            </View>
            <View style={styles.code}>
              <Text selectable style={styles.codeText}>{lockedJson}</Text>
            </View>
            <Text style={styles.inspectorHint}>
              Paste straight into the production token set to lock this design.
            </Text>
          </View>
        </ScrollView>

        {/* hidden, full-resolution capture node (works in both Single and Grid) */}
        <View style={styles.offscreen} pointerEvents="none">
          <View ref={captureRef} collapsable={false}>
            <QuoteShot {...quoteProps} />
          </View>
        </View>

        {toast ? (
          <View style={styles.toast} pointerEvents="none">
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Control panel: DialKit inline, in the right sidebar ── */}
      <aside style={{ width: 340, height: '100vh', overflow: 'auto', flexShrink: 0, borderLeft: `1px solid ${UI.border}`, background: UI.surface }}>
        <DialRoot mode="inline" theme="light" />
      </aside>
    </View>
  );
}

// ── single preview, centered on the app backdrop ──
function SingleStage({ appBg, quoteProps }) {
  return (
    <View style={styles.singleWrap}>
      <View style={[styles.checker, { backgroundColor: APP_BG[appBg] }]}>
        <QuoteShot {...quoteProps} />
      </View>
    </View>
  );
}

// ── grid: current style across all colors × all ratios (Figma board) ──
function GridStage({ style, quoteProps }) {
  const palette = PALETTES[style];
  return (
    <View style={styles.grid}>
      <View style={styles.gridHeadRow}>
        <View style={{ width: 64 }} />
        {RATIOS.map((r) => (
          <View key={r} style={[styles.gridCol, { width: RATIO_SIZE[r].w * GRID_SCALE }]}>
            <Text style={styles.gridColLabel}>{RATIO_LABELS[r]}</Text>
          </View>
        ))}
      </View>
      {palette.map((c) => (
        <View key={c.name} style={styles.gridRow}>
          <View style={styles.gridRowLabelWrap}>
            <View style={[styles.gridDot, { backgroundColor: c.value, borderColor: c.value.toLowerCase() === '#ffffff' ? UI.border : 'transparent' }]} />
            <Text style={styles.gridRowLabel}>{c.name}</Text>
          </View>
          {RATIOS.map((r) => (
            <View key={r} style={[styles.gridCell, { width: RATIO_SIZE[r].w * GRID_SCALE }]}>
              <Scaled scale={GRID_SCALE} w={RATIO_SIZE[r].w} h={RATIO_SIZE[r].h}>
                <QuoteShot {...quoteProps} ratio={r} color={c.value} />
              </Scaled>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// scale a full-size card down without re-layout (transform-origin top-left)
function Scaled({ scale, w, h, children }) {
  return (
    <View style={{ width: w * scale, height: h * scale }}>
      <View
        style={{
          width: w,
          height: h,
          transform: [{ scale }],
          ...(Platform.OS === 'web' ? { transformOrigin: 'top left' } : {}),
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Tabs({ value, onChange, options }) {
  return (
    <View style={styles.tabs}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.tab, sel && styles.tabSel]}>
            <Text style={[styles.tabText, sel && styles.tabTextSel]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const web = (o) => (Platform.OS === 'web' ? o : {});

const F = UI.F;

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: UI.bg, ...web({ height: '100vh', overflow: 'hidden' }) },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.bg, ...web({ height: '100vh' }) },

  stage: { flex: 1, minWidth: 0 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: UI.border,
    backgroundColor: UI.surface,
  },
  exportRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stageScroll: { padding: 36, alignItems: 'center', minHeight: '100%' },

  singleWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, alignSelf: 'stretch' },
  checker: {
    padding: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: UI.border,
  },

  grid: { alignSelf: 'center' },
  gridHeadRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 16 },
  gridCol: { alignItems: 'center' },
  gridColLabel: { fontFamily: F.med, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: UI.textSec },
  gridRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginBottom: 20 },
  gridRowLabelWrap: { width: 64, alignItems: 'flex-start', gap: 6 },
  gridDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1 },
  gridRowLabel: { fontFamily: F.med, fontSize: 12, color: UI.text },
  gridCell: { alignItems: 'center', justifyContent: 'flex-end' },

  inspector: { alignSelf: 'stretch', marginTop: 16, maxWidth: 780, width: '100%' },
  inspectorHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  inspectorTitle: { fontFamily: F.semi, fontSize: 12.5, color: UI.text },
  inspectorMeta: { fontFamily: F.med, fontSize: 12, color: UI.textSec },
  code: {
    backgroundColor: UI.codeBg,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: UI.border,
  },
  codeText: {
    color: UI.codeText,
    fontFamily: F.mono,
    fontSize: 12.5,
    lineHeight: 21,
  },
  inspectorHint: { fontFamily: F.ui, fontSize: 11.5, color: UI.textSec, marginTop: 10 },

  offscreen: { position: 'absolute', left: -10000, top: 0, opacity: 1 },

  // toolbar segmented tabs — same language as panel Segmented
  tabs: { flexDirection: 'row', backgroundColor: UI.inset, borderRadius: 12, padding: 4, gap: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, borderWidth: 1, borderColor: 'transparent' },
  tabSel: { backgroundColor: UI.surface, borderColor: UI.border },
  tabText: { fontFamily: F.med, fontSize: 12.5, color: UI.textSec },
  tabTextSel: { fontFamily: F.semi, color: UI.text },

  toast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toastText: {
    backgroundColor: UI.codeBg,
    color: UI.codeText,
    fontFamily: F.med,
    fontSize: 13,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
