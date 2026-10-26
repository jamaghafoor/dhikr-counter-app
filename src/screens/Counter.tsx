import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { CounterDial } from '../components/CounterDial';
import { Icon } from '../components/Icon';
import { Pattern } from '../components/Ornament';
import { Button, ModeSwitch } from '../components/UI';
import { AppState, Mode, selectedDhikr } from '../state/model';
import { colors, fonts } from '../theme';

type Props = {
  state: AppState;
  running: boolean;
  onCount: () => void;
  onMode: (mode: Mode) => void;
  onDhikr: () => void;
  onTarget: (target?: number) => void;
  onUndo: () => void;
  onReset: () => void;
  onToggle: () => void;
  onPace: () => void;
};
export function Counter({
  state,
  running,
  onCount,
  onMode,
  onDhikr,
  onTarget,
  onUndo,
  onReset,
  onToggle,
  onPace,
}: Props) {
  const dhikr = selectedDhikr(state);
  const { height, width } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  // Measure the area left after the real banner/navigation, rather than sizing to the whole screen.
  const available = viewportHeight ?? height - 245;
  const dialSize = Math.max(
    184,
    Math.min(
      state.mode === 'auto' ? 254 : 282,
      width - 80,
      available - (state.mode === 'auto' ? 412 : 330),
    ),
  );
  function measure(event: LayoutChangeEvent) {
    const next = event.nativeEvent.layout.height;
    if (next > 0) {
      setViewportHeight(previous =>
        previous !== null && Math.abs(previous - next) < 1 ? previous : next,
      );
    }
  }
  return (
    <ScrollView
      onLayout={measure}
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Change dhikr. Currently ${dhikr.title}`}
        onPress={onDhikr}
        style={({ pressed }) => [s.dhikrCard, pressed && s.pressed]}
      >
        <View style={s.pattern}>
          <Pattern />
        </View>
        <View style={s.dhikrMeta}>
          <Text style={s.currentLabel}>CURRENT DHIKR</Text>
          <Icon name="chevron" size={15} />
        </View>
        {!!dhikr.arabic && <Text style={s.arabic}>{dhikr.arabic}</Text>}
        <Text style={[s.dhikrName, !dhikr.arabic && s.nameOnly]}>
          {dhikr.title}
        </Text>
        {!!dhikr.meaning && <Text style={s.meaning}>{dhikr.meaning}</Text>}
      </Pressable>
      <ModeSwitch mode={state.mode} onChange={onMode} />
      <View style={s.countSection}>
        <CounterDial
          count={state.count}
          target={state.target}
          title={dhikr.title}
          mode={state.mode}
          running={running}
          size={dialSize}
          onCount={onCount}
        />
        {state.mode === 'auto' && (
          <View style={s.autoControls}>
            <Button
              icon={running ? 'pause' : 'play'}
              onPress={onToggle}
              style={s.autoButton}
            >
              {running
                ? 'Pause counting'
                : state.count === state.target
                ? 'Begin again'
                : 'Resume counting'}
            </Button>
            <Pressable
              onPress={onPace}
              accessibilityRole="button"
              accessibilityLabel="Change auto counting pace"
              style={s.pace}
              hitSlop={4}
            >
              <Icon name="auto" size={14} color={colors.muted} />
              <Text style={s.paceText}>
                Every {(state.pace / 1000).toFixed(1)}s
              </Text>
              <Text style={s.changePace}>Adjust</Text>
              <Icon name="chevron" size={11} />
            </Pressable>
          </View>
        )}
      </View>
      <View style={s.targetSection}>
        <View style={s.targetLabel}>
          <Text style={s.targetNote}>Choose a target</Text>
          <View style={s.targetLine} />
        </View>
        <View style={s.targets}>
          {[33, 99, 100].map(target => (
            <Pressable
              key={target}
              onPress={() => onTarget(target)}
              accessibilityRole="radio"
              accessibilityLabel={`Target ${target}`}
              accessibilityState={{ checked: state.target === target }}
              hitSlop={2}
              style={({ pressed }) => [
                s.targetChip,
                state.target === target && s.selectedChip,
                pressed && s.pressed,
              ]}
            >
              <Text
                style={[s.chipText, state.target === target && s.selectedText]}
              >
                {target}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => onTarget()}
            accessibilityRole="button"
            accessibilityLabel="Set custom target"
            hitSlop={2}
            style={({ pressed }) => [
              s.targetChip,
              s.customChip,
              ![33, 99, 100].includes(state.target) && s.selectedChip,
              pressed && s.pressed,
            ]}
          >
            <Text
              style={[
                s.chipText,
                ![33, 99, 100].includes(state.target) && s.selectedText,
              ]}
            >
              {![33, 99, 100].includes(state.target) ? state.target : 'Custom'}
            </Text>
            {[33, 99, 100].includes(state.target) && (
              <Icon name="plus" size={12} color={colors.muted} />
            )}
          </Pressable>
        </View>
      </View>
      <View style={s.tools}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Undo last count"
          disabled={!state.count}
          onPress={onUndo}
          hitSlop={4}
          style={({ pressed }) => [
            s.tool,
            !state.count && s.disabled,
            pressed && s.pressed,
          ]}
        >
          <Icon name="undo" size={17} />
          <Text style={s.toolText}>Undo</Text>
        </Pressable>
        <View style={s.toolDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset current session"
          disabled={!state.count}
          onPress={onReset}
          hitSlop={4}
          style={({ pressed }) => [
            s.tool,
            !state.count && s.disabled,
            pressed && s.pressed,
          ]}
        >
          <Icon name="reset" size={17} />
          <Text style={s.toolText}>Start fresh</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    paddingHorizontal: 25,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
    flexGrow: 1,
  },
  dhikrCard: {
    backgroundColor: colors.mint,
    borderRadius: 21,
    paddingHorizontal: 19,
    paddingTop: 10,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  pattern: { position: 'absolute', right: -33, bottom: -25 },
  dhikrMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 9,
    letterSpacing: 1.7,
    fontWeight: '600',
    color: '#6C8574',
  },
  arabic: {
    fontFamily: fonts.arabic,
    fontSize: 28,
    lineHeight: 42,
    textAlign: 'center',
    color: colors.green,
    writingDirection: 'rtl',
  },
  dhikrName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  nameOnly: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 40,
    marginTop: 5,
  },
  meaning: {
    fontSize: 10,
    color: '#7C897B',
    textAlign: 'center',
    marginTop: 4,
  },
  countSection: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  autoControls: { width: '100%', alignItems: 'center', gap: 3 },
  autoButton: {
    minHeight: 44,
    width: 228,
    borderRadius: 15,
    paddingVertical: 10,
  },
  pace: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 6 },
  paceText: { fontSize: 10, color: colors.muted },
  changePace: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.green,
    marginLeft: 6,
  },
  targetSection: { gap: 9 },
  targetLabel: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  targetNote: { fontSize: 10, fontWeight: '500', color: colors.muted },
  targetLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    flex: 1,
  },
  targets: { flexDirection: 'row', gap: 8 },
  targetChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  customChip: { flex: 1.35 },
  selectedChip: { backgroundColor: colors.paleGold, borderColor: '#CFB67F' },
  chipText: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  selectedText: { color: '#81682E', fontWeight: '700' },
  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 21,
    marginTop: -4,
  },
  tool: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  toolText: { fontSize: 11, color: colors.green },
  toolDivider: { height: 15, width: 1, backgroundColor: colors.line },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
});
