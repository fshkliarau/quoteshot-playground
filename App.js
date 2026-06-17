// ─────────────────────────────────────────────────────────────────────────────
// QuoteShot design playground — web app (Expo + react-native-web).
//
// Left: stage (single preview or grid, light/dark app backdrop, export bar,
//       copyable token JSON readout). Right: the dev panel.
// The ONLY thing that ships to production is <QuoteShot/> (src/QuoteShot.js).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useMemo, useCallback } from 'react';
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

import QuoteShot from './src/QuoteShot';
import Panel from './src/panel/Panel';
import { UI, Button } from './src/panel/controls';
import { savePng, copyText } from './src/exporter';
import {
  PALETTES,
  RATIOS,
  RATIO_LABELS,
  RATIO_SIZE,
  DEFAULT_TOKENS,
  STYLE_COVER_SCALE,
  DEFAULT_COLOR,
  DEFAULT_CONTENT,
  DEFAULT_COVER,
  QUOTE_PRESETS,
  STYLE_LABELS,
} from './src/tokens';

const APP_BG = { light: UI.bg, dark: '#1C1B19' };
const GRID_SCALE = 0.42;

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

  const [style, setStyleRaw] = useState('minimal');
  const [ratio, setRatio] = useState('square');
  const [color, setColorRaw] = useState(DEFAULT_COLOR.minimal);
  const [content, setContentState] = useState(DEFAULT_CONTENT);
  const [quotePreset, setQuotePreset] = useState('medium');
  const [coverUri, setCover] = useState(DEFAULT_COVER);
  const [coverPreset, setCoverPreset] = useState('busy');
  const [tokens, setTokens] = useState({ ...DEFAULT_TOKENS, coverScale: STYLE_COVER_SCALE.minimal });
  const [transparentBg, setTransparentBg] = useState(false);

  const [view, setView] = useState('single'); // single | grid
  const [appBg, setAppBg] = useState('light');
  const [toast, setToast] = useState('');

  const captureRef = useRef(null);

  // picking a color turns transparent OFF and clears any sticker text override
  const setColor = useCallback((value) => {
    setColorRaw(value);
    setTransparentBg(false);
    setTokens((t) => (t.textColor === 'auto' ? t : { ...t, textColor: 'auto' }));
  }, []);

  // None swatch: first click → transparent (black text); each further click flips B/W
  const toggleNone = useCallback(() => {
    setTransparentBg((on) => {
      if (!on) {
        setTokens((t) => ({ ...t, textColor: 'dark' }));
        return true;
      }
      setTokens((t) => ({ ...t, textColor: t.textColor === 'light' ? 'dark' : 'light' }));
      return true;
    });
  }, []);

  // style change → swap palette (reset color), reset cover size to the style default
  const setStyle = useCallback((next) => {
    setStyleRaw(next);
    setColorRaw(DEFAULT_COLOR[next]);
    setTokens((t) => ({ ...t, coverScale: STYLE_COVER_SCALE[next] }));
  }, []);

  const setContent = useCallback((key, value) => {
    setContentState((c) => ({ ...c, [key]: value }));
    if (key === 'quote') setQuotePreset('custom');
  }, []);

  const applyQuotePreset = useCallback((preset) => {
    setQuotePreset(preset);
    if (QUOTE_PRESETS[preset]) setContentState((c) => ({ ...c, quote: QUOTE_PRESETS[preset] }));
  }, []);

  const setToken = useCallback((key, value) => setTokens((t) => ({ ...t, [key]: value })), []);
  const resetTokens = useCallback(() => {
    setTokens({ ...DEFAULT_TOKENS, coverScale: STYLE_COVER_SCALE[style] });
    setTransparentBg(false);
  }, [style]);

  const stickerScheme = tokens.textColor === 'light' ? 'light' : 'dark';

  const colorName = useMemo(() => {
    const found = PALETTES[style].find((c) => c.value === color);
    return found ? found.name : color;
  }, [style, color]);

  const lockedJson = useMemo(
    () => JSON.stringify({ style, ratio, color, transparentBg, tokens }, null, 2),
    [style, ratio, color, transparentBg, tokens]
  );

  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  }, []);

  const quoteProps = { style, ratio, color, ...content, coverUri, transparentBg, tokens };

  const doExport = useCallback(
    async (transparent) => {
      try {
        await savePng(captureRef, {
          transparent,
          fileName: `quoteshot-${style}-${ratio}-${colorName.toLowerCase()}`,
        });
        flash(transparent ? 'Saved transparent PNG' : 'Saved PNG');
      } catch (e) {
        flash('Export failed: ' + (e && e.message ? e.message : e));
      }
    },
    [style, ratio, colorName, flash]
  );

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
            <Button label="Copy text" variant="ghost" onPress={async () => { await copyText(content.quote); flash('Quote copied'); }} />
            {transparentBg ? (
              <Button label="Save transparent PNG" variant="primary" onPress={() => doExport(true)} />
            ) : (
              <Button label="Save PNG" variant="primary" onPress={() => doExport(false)} />
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

      {/* ── Panel ── */}
      <ScrollView style={styles.panelScroll} contentContainerStyle={{ flexGrow: 1 }}>
        <Panel
          style={style}
          ratio={ratio}
          color={color}
          content={content}
          quotePreset={quotePreset}
          coverPreset={coverPreset}
          tokens={tokens}
          transparentBg={transparentBg}
          stickerScheme={stickerScheme}
          setStyle={setStyle}
          setRatio={setRatio}
          setColor={setColor}
          setContent={setContent}
          setQuotePreset={applyQuotePreset}
          setCover={setCover}
          setCoverPreset={setCoverPreset}
          setToken={setToken}
          onNone={toggleNone}
          onResetTokens={resetTokens}
        />
      </ScrollView>
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

  panelScroll: {
    width: 372,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 372,
    borderLeftWidth: 1,
    borderColor: UI.border,
    backgroundColor: UI.surface,
    ...web({ height: '100vh' }),
  },

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
