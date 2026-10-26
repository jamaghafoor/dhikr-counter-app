import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Button } from '../components/UI';
import { calibratedPace } from '../state/model';
import { colors, fonts } from '../theme';

export function Calibration({
  onDone,
}: {
  onDone: (pace: number, start: boolean) => void;
}) {
  const [taps, setTaps] = useState<number[]>([]);
  const [error, setError] = useState(false);
  const [pace, setPace] = useState<number | null>(null);
  function tap() {
    if (pace) {
      return;
    }
    setError(false);
    const next = [...taps, Date.now()];
    if (next.length === 5) {
      const measured = calibratedPace(next);
      if (!measured) {
        setTaps([]);
        setError(true);
        return;
      }
      setPace(measured);
    }
    setTaps(next);
  }
  return (
    <View style={s.root}>
      <View style={s.description}>
        {/* <Text style={s.intro}>
          {pace ? 'Your rhythm, found.' : 'Find your natural rhythm.'}
        </Text> */}
        <Text style={s.body}>
          {pace
            ? 'We’ll count at this pace until your target. You can pause at any time.'
            : 'Recite your dhikr and tap once after each recitation, five times. Take your time.'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Calibration. ${taps.length} of 5 taps. Tap at your recitation pace.`}
        onPress={tap}
        disabled={!!pace}
        style={s.tapCircle}
      >
        <Icon name={pace ? 'check' : 'hand'} size={43} />
        <Text style={s.tapTitle}>
          {pace ? `${(pace / 1000).toFixed(1)} sec` : 'Tap with your dhikr'}
        </Text>
        <Text style={s.tapSubtitle}>
          {pace ? 'between each count' : `${taps.length} of 5 taps`}
        </Text>
      </Pressable>
      <View style={s.dots}>
        {Array.from({ length: 5 }, (_, i) => (
          <View key={i} style={[s.dot, i < taps.length && s.dotActive]}>
            {i < taps.length && (
              <Icon name="check" size={12} color={colors.white} />
            )}
          </View>
        ))}
      </View>
      {error && (
        <Text accessibilityRole="alert" style={s.error}>
          Let’s try a steady pace, between 0.3 and 10 seconds per tap.
        </Text>
      )}
      {pace ? (
        <>
          <Button icon="play" onPress={() => onDone(pace, true)}>
            Begin auto counting
          </Button>
          <Button
            secondary
            onPress={() => {
              setPace(null);
              setTaps([]);
            }}
          >
            Find my rhythm again
          </Button>
        </>
      ) : (
        <>
          <View style={s.divider}>
            <View style={s.line} />
            <Text style={s.or}>or choose a pace</Text>
            <View style={s.line} />
          </View>
          <View style={s.presets}>
            {[
              { label: 'Gentle', value: 2500 },
              { label: 'Steady', value: 1500 },
              { label: 'Brisk', value: 800 },
            ].map(preset => (
              <Pressable
                key={preset.value}
                accessibilityRole="button"
                accessibilityLabel={`${preset.label}: ${
                  preset.value / 1000
                } seconds per count`}
                onPress={() => {
                  setPace(preset.value);
                  setTaps([1, 2, 3, 4, 5]);
                }}
                style={s.preset}
              >
                <Text style={s.presetLabel}>{preset.label}</Text>
                <Text style={s.presetValue}>{preset.value / 1000}s</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      <Text style={s.note}>
        {/* Auto mode follows a timer, not your voice.{'\n'}Counting pauses when you
        leave the app. */}
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: 20 },
  description: { gap: 9, alignItems: 'center' },
  intro: {
    fontFamily: fonts.display,
    fontSize: 23,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    fontSize: 13,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  tapCircle: {
    width: 205,
    height: 205,
    borderRadius: 103,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#C9D4BF',
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginVertical: 3,
  },
  tapTitle: { fontSize: 14, fontWeight: '600', color: colors.green },
  tapSubtitle: { fontSize: 12, color: colors.muted, marginTop: -9 },
  dots: { flexDirection: 'row', alignSelf: 'center', gap: 15 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: colors.green, borderColor: colors.green },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  line: { height: 1, backgroundColor: colors.line, flex: 1 },
  or: { fontSize: 10, color: colors.muted },
  presets: { flexDirection: 'row', gap: 9 },
  preset: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    padding: 13,
    gap: 6,
  },
  presetLabel: { fontSize: 12, color: colors.ink, fontWeight: '600' },
  presetValue: { fontSize: 11, color: colors.muted },
  note: {
    fontSize: 10,
    lineHeight: 17,
    color: colors.muted,
    textAlign: 'center',
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
    lineHeight: 19,
  },
});
