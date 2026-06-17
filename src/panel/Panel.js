// The dev panel — web only. Drives QuoteShot props + tokens. Not shipped.
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Section, Segmented, Swatches, Chips, Field, Slider, UI } from './controls';
import {
  STYLES,
  STYLE_LABELS,
  RATIOS,
  RATIO_LABELS,
  PALETTES,
  STYLE_KNOBS,
  KNOB_RANGES,
  QUOTE_PRESETS,
  COVER_PRESETS,
} from '../tokens';

const styleOpts = STYLES.map((v) => ({ value: v, label: STYLE_LABELS[v] }));
const ratioOpts = RATIOS.map((v) => ({ value: v, label: RATIO_LABELS[v] }));
const quoteOpts = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
];
const KNOB_LABELS = {
  padding: 'Padding',
  cornerRadius: 'Corner radius',
  fontScale: 'Font scale',
  quoteMarkScale: 'Quote-mark size',
  coverScale: 'Cover size',
  highlightOpacity: 'Highlight opacity',
};

function uploadCover(onCover) {
  if (typeof document === 'undefined') return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onCover(String(reader.result));
    reader.readAsDataURL(file);
  };
  input.click();
}

export default function Panel(props) {
  const {
    style,
    ratio,
    color,
    content,
    quotePreset,
    coverPreset,
    tokens,
    transparentBg,
    stickerScheme,
    setStyle,
    setRatio,
    setColor,
    setContent,
    setQuotePreset,
    setCover,
    setCoverPreset,
    setToken,
    onNone,
    onResetTokens,
  } = props;

  const palette = PALETTES[style];
  const knobs = STYLE_KNOBS[style];

  return (
    <View style={s.panel}>
      <View style={s.brandRow}>
        <View style={s.brandDot} />
        <Text style={s.brand}>QuoteShot</Text>
        <Text style={s.brandSub}>design playground</Text>
      </View>

      {/* ── Core ── */}
      <Section title="Style">
        <Segmented options={styleOpts} value={style} onChange={setStyle} />
      </Section>

      <Section title="Ratio">
        <Segmented options={ratioOpts} value={ratio} onChange={setRatio} />
      </Section>

      <Section title="Color">
        <Swatches
          palette={palette}
          value={color}
          onChange={setColor}
          transparentOn={transparentBg}
          onNone={onNone}
          stickerScheme={stickerScheme}
        />
      </Section>

      {/* ── Content ── */}
      <Section title="Quote">
        <Chips options={quoteOpts} value={quotePreset} onChange={setQuotePreset} />
        <View style={{ height: 8 }} />
        <Field
          value={content.quote}
          onChange={(v) => setContent('quote', v)}
          multiline
          placeholder="Quote text…"
        />
      </Section>

      <Section title="Attribution">
        <Field label="Book title" value={content.bookTitle} onChange={(v) => setContent('bookTitle', v)} />
        <Field label="Author" value={content.author} onChange={(v) => setContent('author', v)} />
        <Field label="Handle" value={content.handle} onChange={(v) => setContent('handle', v)} />
      </Section>

      <Section title="Cover" right={<Pressable onPress={() => uploadCover((uri) => { setCover(uri); setCoverPreset('custom'); })}><Text style={s.link}>Upload…</Text></Pressable>}>
        <Chips
          options={COVER_PRESETS.map((c) => ({ value: c.name.toLowerCase(), label: c.name }))}
          value={coverPreset}
          onChange={(v) => {
            const c = COVER_PRESETS.find((p) => p.name.toLowerCase() === v);
            if (c) {
              setCover(c.uri);
              setCoverPreset(v);
            }
          }}
        />
      </Section>

      {/* ── Design knobs ── */}
      <Section
        title="Design knobs"
        right={<Pressable onPress={onResetTokens}><Text style={s.link}>Reset</Text></Pressable>}
      >
        {knobs.map((k) => (
          <Slider
            key={k}
            label={KNOB_LABELS[k]}
            value={tokens[k]}
            min={KNOB_RANGES[k].min}
            max={KNOB_RANGES[k].max}
            step={KNOB_RANGES[k].step}
            unit={KNOB_RANGES[k].unit}
            onChange={(v) => setToken(k, v)}
          />
        ))}
      </Section>
    </View>
  );
}

const s = StyleSheet.create({
  panel: { padding: 22, paddingTop: 24, paddingBottom: 48 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 28 },
  brandDot: { width: 14, height: 14, borderRadius: 5, backgroundColor: UI.accent },
  brand: { fontFamily: UI.F.semi, fontSize: 15, color: UI.text, letterSpacing: 0.1 },
  brandSub: { fontFamily: UI.F.ui, fontSize: 12, color: UI.textSec },
  link: { fontFamily: UI.F.med, fontSize: 12, color: UI.textSec },
});
