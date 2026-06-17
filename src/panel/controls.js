// Dev-panel UI atoms (web only). Built from RN primitives so they render through
// react-native-web. Not part of the shippable QuoteShot component.
//
// Visual system — warm, editorial, calm (à la Mollie Logo Maker):
//   • cream surfaces separated by 1-shade contrast + a hairline warm border
//   • no drop shadows, generous radius + padding
//   • a single restrained clay accent, used ONLY for active/selected + primary
//   • Inter for UI text, JetBrains Mono for every numeral
import React, { useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, PanResponder, StyleSheet } from 'react-native';

// fonts (loaded in App.js); fall back to system if absent
const F = {
  ui: 'Inter_400Regular',
  med: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'GeistMono_400Regular',
  monoMed: 'GeistMono_500Medium',
};

export const UI = {
  bg: '#F1ECE3', //       app background
  surface: '#FAF7F1', //  card / raised chip / inputs
  inset: '#EBE5DA', //    slider rails / segmented tracks
  text: '#1F1D1A', //     primary
  textSec: '#8C857A', //  muted taupe
  border: '#E0D9CC', //   1px hairline, used everywhere
  accent: '#C2410C', //   selected + primary action only
  codeBg: '#1C1A17', //   JSON block
  codeText: '#EDE7DD', //
  F,
};

export function Section({ title, right, children }) {
  return (
    <View style={s.section}>
      {title ? (
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.segItem, sel && s.segItemSel]}>
            <Text style={[s.segText, sel && s.segTextSel]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Swatches({ palette, value, onChange, transparentOn, onNone, stickerScheme }) {
  const lightText = stickerScheme === 'light';
  return (
    <View style={s.swatchRow}>
      {palette.map((c) => {
        const sel = !transparentOn && c.value === value;
        return (
          <Pressable key={c.name} onPress={() => onChange(c.value)} style={s.swatchWrap} title={c.name}>
            {/* offset clay ring with a gap when selected */}
            <View style={[s.swatchOuter, sel && s.swatchOuterSel]}>
              <View
                style={[
                  s.swatchInner,
                  {
                    backgroundColor: c.value,
                    borderColor: c.value.toLowerCase() === '#ffffff' ? UI.border : 'transparent',
                  },
                ]}
              />
            </View>
            <Text style={[s.swatchName, sel && s.swatchNameSel]}>{c.name}</Text>
          </Pressable>
        );
      })}
      {onNone ? (
        <Pressable
          onPress={onNone}
          style={s.swatchWrap}
          title={transparentOn ? 'Transparent — click to flip text color' : 'Transparent background (sticker)'}
        >
          <View style={[s.swatchOuter, transparentOn && s.swatchOuterSel]}>
            {transparentOn ? (
              <View style={[s.swatchInner, { backgroundColor: lightText ? '#ffffff' : UI.text, borderColor: UI.border, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontFamily: F.bold, fontSize: 11, color: lightText ? UI.text : '#ffffff' }}>A</Text>
              </View>
            ) : (
              <View style={[s.swatchInner, s.swatchNone]}>
                <View style={[s.checkCell, { top: 0, left: 0, backgroundColor: UI.border }]} />
                <View style={[s.checkCell, { top: 0, right: 0, backgroundColor: '#ffffff' }]} />
                <View style={[s.checkCell, { bottom: 0, left: 0, backgroundColor: '#ffffff' }]} />
                <View style={[s.checkCell, { bottom: 0, right: 0, backgroundColor: UI.border }]} />
              </View>
            )}
          </View>
          <Text style={[s.swatchName, transparentOn && s.swatchNameSel]}>
            {transparentOn ? (lightText ? 'White' : 'Black') : 'None'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chips({ options, value, onChange }) {
  return (
    <View style={s.chipRow}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.chip, sel && s.chipSel]}>
            <Text style={[s.chipText, sel && s.chipTextSel]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, value, onChange, multiline, placeholder }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={UI.textSec}
        multiline={multiline}
        style={[s.input, multiline && { minHeight: 84, textAlignVertical: 'top', paddingTop: 10 }]}
      />
    </View>
  );
}

export function Toggle({ label, value, onChange }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={s.toggleRow}>
      <View style={[s.toggleTrack, value && { backgroundColor: UI.accent }]}>
        <View style={[s.toggleKnob, value && { transform: [{ translateX: 16 }] }]} />
      </View>
      <Text style={s.toggleLabel}>{label}</Text>
    </Pressable>
  );
}

export function Slider({ label, value, min, max, step = 1, unit = '', onChange }) {
  const wRef = useRef(0);
  const clampToStep = useCallback(
    (raw) => {
      const v = Math.min(max, Math.max(min, raw));
      const snapped = Math.round((v - min) / step) * step + min;
      return Math.round(snapped * 1000) / 1000;
    },
    [min, max, step]
  );
  const fromX = useCallback(
    (x) => {
      const width = wRef.current || 1;
      const ratio = Math.min(1, Math.max(0, x / width));
      return clampToStep(min + ratio * (max - min));
    },
    [clampToStep, min, max]
  );
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => onChange(fromX(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => onChange(fromX(e.nativeEvent.locationX)),
    })
  ).current;
  const pct = ((value - min) / (max - min)) * 100;
  const display = unit === '×' || step < 1 ? value.toFixed(2).replace(/\.?0+$/, '') : String(value);
  return (
    <View style={s.knobRow}>
      <View style={s.knobHead}>
        <Text style={s.knobLabel}>{label}</Text>
        <Text style={s.knobVal}>
          {display}
          {unit && unit !== '×' ? unit : ''}
          {unit === '×' ? '×' : ''}
        </Text>
      </View>
      <View
        {...pan.panHandlers}
        onLayout={(e) => {
          wRef.current = e.nativeEvent.layout.width;
        }}
        style={s.sliderTrack}
      >
        <View style={s.sliderRail} />
        <View style={[s.sliderFill, { width: `${pct}%` }]} />
        <View style={[s.sliderThumb, { left: `${pct}%` }]} />
      </View>
    </View>
  );
}

export function Button({ label, onPress, variant = 'default', disabled }) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[s.btn, isPrimary && s.btnPrimary, isGhost && s.btnGhost, disabled && { opacity: 0.45 }]}
    >
      <Text style={[s.btnText, isPrimary && s.btnTextPrimary, isGhost && s.btnTextGhost]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 26 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: {
    fontFamily: F.med,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: UI.textSec,
  },

  // segmented: inset track, active = raised cream chip with a hairline border
  seg: { flexDirection: 'row', backgroundColor: UI.inset, borderRadius: 12, padding: 4, gap: 4, borderWidth: 1, borderColor: UI.border },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  segItemSel: { backgroundColor: UI.surface, borderColor: UI.border },
  segText: { fontFamily: F.med, fontSize: 13, color: UI.textSec },
  segTextSel: { fontFamily: F.semi, color: UI.text },

  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, rowGap: 16 },
  swatchWrap: { alignItems: 'center', width: 44 },
  swatchOuter: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  swatchOuterSel: { borderColor: UI.accent },
  swatchInner: { width: 22, height: 22, borderRadius: 11, borderWidth: 1 },
  swatchNone: { borderColor: UI.border, overflow: 'hidden', position: 'relative' },
  checkCell: { position: 'absolute', width: 11, height: 11 },
  swatchName: { fontFamily: F.ui, fontSize: 10.5, color: UI.textSec, marginTop: 6 },
  swatchNameSel: { fontFamily: F.med, color: UI.text },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: UI.border, backgroundColor: UI.surface },
  chipSel: { borderColor: UI.accent, backgroundColor: 'transparent' },
  chipText: { fontFamily: F.med, fontSize: 12, color: UI.textSec },
  chipTextSel: { color: UI.accent },

  fieldLabel: { fontFamily: F.med, fontSize: 12, color: UI.textSec, marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: F.ui,
    fontSize: 13,
    color: UI.text,
    backgroundColor: UI.surface,
  },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleTrack: { width: 38, height: 22, borderRadius: 11, backgroundColor: UI.border, padding: 3, justifyContent: 'center' },
  toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: UI.surface },
  toggleLabel: { fontFamily: F.med, fontSize: 13, color: UI.text },

  // control row — one rounded pill: label-left / value-right, thin track beneath
  knobRow: {
    backgroundColor: UI.surface,
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 8,
  },
  knobHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  knobLabel: { fontFamily: F.med, fontSize: 13, color: UI.textSec },
  knobVal: { fontFamily: F.monoMed, fontSize: 12.5, color: UI.text },
  sliderTrack: { height: 10, justifyContent: 'center', marginTop: 9 },
  sliderRail: { position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: UI.inset, top: 3 },
  sliderFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: UI.accent, top: 3 },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: UI.surface,
    borderWidth: 1,
    borderColor: UI.border,
    top: -3,
    marginLeft: -8,
  },

  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: UI.border,
    backgroundColor: UI.surface,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: UI.accent, borderColor: UI.accent },
  btnGhost: { borderColor: 'transparent', backgroundColor: 'transparent', paddingHorizontal: 8 },
  btnText: { fontFamily: F.med, fontSize: 13, color: UI.text },
  btnTextPrimary: { fontFamily: F.semi, color: '#FBF9F5' },
  btnTextGhost: { color: UI.textSec },
});

export { s as controlStyles };
