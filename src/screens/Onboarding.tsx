import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Icon } from '../components/Icon';
import { WelcomeArt } from '../components/WelcomeArt';
import { Mode } from '../state/model';
import { colors, fonts } from '../theme';

export function Onboarding({
  onContinue,
  initialMode = 'manual',
  onClose,
}: {
  onContinue: (mode: Mode) => void;
  initialMode?: Mode;
  onClose?: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const { width, height } = useWindowDimensions();
  const compact = height < 750;
  const artWidth = Math.min(width - 95, compact ? 230 : 290);
  return (
    <ScrollView
      testID="onboarding-screen"
      contentContainerStyle={s.page}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.hero, compact && s.compactHero]}>
        <View style={s.heroHeader}>
          <View style={s.brand}>
            <Icon name="beads" size={23} color="#E6EBDD" />
            <Text style={s.brandName}>
              tasbeeh<Text style={s.brandDot}>.</Text>
            </Text>
          </View>
          {onClose ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close welcome screen"
              onPress={onClose}
              hitSlop={8}
              style={s.close}
            >
              <Icon name="close" size={19} color="#E6EBDD" />
            </Pressable>
          ) : (
            <Text style={s.bismillah}>بِسْمِ اللَّهِ</Text>
          )}
        </View>
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={s.art}
        >
          <WelcomeArt width={artWidth} />
        </View>
        <View style={s.heroIntro}>
          <View style={s.heroEyebrow}>
            <View style={s.goldLine} />
            <Text style={s.eyebrow}>A LITTLE REMEMBRANCE, EVERY DAY</Text>
            <View style={s.goldLine} />
          </View>
          <Text
            accessibilityRole="header"
            style={[s.title, compact && s.compactTitle]}
          >
            A moment of dhikr.{'\n'}A heart at peace.
          </Text>
          <Text style={s.heroDescription}>
            A quiet space to remember Allah.
          </Text>
        </View>
      </View>
      <View style={s.choices}>
        <View style={s.chooseIntro}>
          <Text style={s.chooseTitle}>Find your way to count</Text>
          <Text style={s.chooseDescription}>
            Start with what feels natural. Switch anytime.
          </Text>
        </View>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Choose your counting method"
          style={s.methods}
        >
          {(['manual', 'auto'] as const).map(value => {
            const selected = mode === value;
            return (
              <Pressable
                key={value}
                testID={`onboarding-${value}`}
                accessibilityRole="radio"
                accessibilityLabel={
                  value === 'manual'
                    ? 'Manual count. Tap once with each dhikr.'
                    : 'Auto count. Set your pace with five taps.'
                }
                accessibilityState={{ checked: selected }}
                onPress={() => setMode(value)}
                style={({ pressed }) => [
                  s.method,
                  selected && s.methodSelected,
                  pressed && s.pressed,
                ]}
              >
                <View style={s.methodTop}>
                  <View
                    style={[s.methodIcon, selected && s.methodIconSelected]}
                  >
                    <Icon
                      name={value === 'manual' ? 'hand' : 'auto'}
                      size={23}
                    />
                  </View>
                  <View style={[s.radio, selected && s.radioSelected]}>
                    {selected && (
                      <Icon name="check" size={11} color={colors.white} />
                    )}
                  </View>
                </View>
                <Text style={s.methodTitle}>
                  {value === 'manual' ? 'Manual count' : 'Auto count'}
                </Text>
                <Text style={s.methodDescription}>
                  {value === 'manual'
                    ? 'One touch, one dhikr'
                    : 'Gently follow your pace'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={s.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Begin my dhikr"
          onPress={() => onContinue(mode)}
          style={({ pressed }) => [s.begin, pressed && s.pressed]}
        >
          <Text style={s.beginText}>Begin my dhikr</Text>
          <View style={s.arrow}>
            <Icon name="back" size={20} color={colors.white} />
          </View>
        </Pressable>
        <View style={s.privacy}>
          <Icon name="shield" size={13} color={colors.muted} />
          <Text style={s.privacyText}>
            No account. Your progress stays on your device.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 17,
    gap: 23,
  },
  hero: {
    flexGrow: 1,
    maxHeight: 445,
    backgroundColor: colors.green,
    borderRadius: 29,
    paddingHorizontal: 21,
    paddingTop: 21,
    paddingBottom: 27,
    overflow: 'hidden',
  },
  compactHero: { paddingTop: 17, paddingBottom: 21 },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandName: {
    fontFamily: fonts.display,
    color: colors.paper,
    fontSize: 27,
    letterSpacing: -1,
  },
  brandDot: { color: '#D4C08B' },
  bismillah: {
    fontFamily: fonts.arabic,
    fontSize: 20,
    lineHeight: 33,
    color: '#D7CEAA',
    writingDirection: 'rtl',
  },
  close: {
    height: 34,
    width: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  art: {
    flexGrow: 1,
    minHeight: 135,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  heroIntro: { alignItems: 'center', gap: 11 },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  goldLine: { width: 12, height: 1, backgroundColor: '#AAAC79', opacity: 0.6 },
  eyebrow: {
    fontSize: 8,
    fontWeight: '500',
    color: '#C6D0B5',
    letterSpacing: 1.65,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.paper,
    fontSize: 31,
    lineHeight: 39,
    letterSpacing: -0.9,
    textAlign: 'center',
  },
  compactTitle: { fontSize: 28, lineHeight: 35 },
  heroDescription: {
    fontSize: 11,
    lineHeight: 18,
    color: '#CBD7C5',
    textAlign: 'center',
  },
  choices: { gap: 17, paddingHorizontal: 9 },
  chooseIntro: { alignItems: 'center', gap: 7 },
  chooseTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  chooseDescription: {
    fontSize: 11,
    lineHeight: 18,
    color: colors.muted,
    textAlign: 'center',
  },
  methods: { flexDirection: 'row', gap: 11 },
  method: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 14,
    gap: 6,
    minHeight: 121,
  },
  methodSelected: { backgroundColor: colors.mint, borderColor: '#8EA58D' },
  methodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  methodIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  methodIconSelected: { backgroundColor: '#DDE8DA' },
  radio: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#C6CDBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: colors.green, borderColor: colors.green },
  methodTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },
  methodDescription: { fontSize: 10, lineHeight: 16, color: '#74806F' },
  footer: { gap: 14, paddingHorizontal: 9 },
  begin: {
    minHeight: 55,
    borderRadius: 16,
    paddingHorizontal: 21,
    paddingVertical: 16,
    backgroundColor: colors.green,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  beginText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  privacyText: {
    fontSize: 9,
    lineHeight: 15,
    color: colors.muted,
    flexShrink: 1,
  },
  arrow: { transform: [{ rotate: '180deg' }] },
  pressed: { opacity: 0.8 },
});
