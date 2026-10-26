import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Stop,
} from 'react-native-svg';
import { Mode } from '../state/model';
import { colors } from '../theme';
import { Icon } from './Icon';

const ProgressCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 123;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICKS = Array.from({ length: 33 }, (_, index) => {
  const angle = (((index / 33) * 360 - 90) * Math.PI) / 180;
  return {
    x1: 132 + Math.cos(angle) * 113,
    y1: 132 + Math.sin(angle) * 113,
    x2: 132 + Math.cos(angle) * 116,
    y2: 132 + Math.sin(angle) * 116,
  };
});

export function CounterDial({
  count,
  target,
  title,
  mode,
  running,
  size,
  onCount,
}: {
  count: number;
  target: number;
  title: string;
  mode: Mode;
  running: boolean;
  size: number;
  onCount: () => void;
}) {
  const fraction = Math.max(0, Math.min(1, count / target));
  const progress = useRef(new Animated.Value(fraction)).current;
  const touch = useRef(new Animated.Value(1)).current;
  const digit = useRef(new Animated.Value(1)).current;
  const ripple = useRef(new Animated.Value(1)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const previousCount = useRef(count);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const faceSize = size * 0.785;
  const completed = count >= target;

  useEffect(() => {
    let mounted = true;
    let changed = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (mounted && !changed) {
          setReduceMotion(value);
        }
      })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => {
        changed = true;
        setReduceMotion(value);
      },
    );
    const app = AppState.addEventListener('change', value =>
      setActive(value === 'active'),
    );
    return () => {
      mounted = false;
      motion.remove();
      app.remove();
    };
  }, []);

  useEffect(() => {
    progress.stopAnimation();
    if (reduceMotion || !active) {
      progress.setValue(fraction);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: fraction,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [fraction, progress, reduceMotion, active]);

  useEffect(() => {
    const previous = previousCount.current;
    previousCount.current = count;
    digit.stopAnimation();
    ripple.stopAnimation();
    if (count === previous || reduceMotion || !active) {
      digit.setValue(1);
      ripple.setValue(1);
      return;
    }
    digit.setValue(0);
    const digitAnimation = Animated.timing(digit, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    digitAnimation.start();
    let rippleAnimation: Animated.CompositeAnimation | undefined;
    if (count > previous) {
      ripple.setValue(0);
      rippleAnimation = Animated.timing(ripple, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        isInteraction: false,
      });
      rippleAnimation.start();
    } else {
      ripple.setValue(1);
    }
    return () => {
      digitAnimation.stop();
      rippleAnimation?.stop();
    };
  }, [count, digit, ripple, reduceMotion, active]);

  useEffect(() => {
    breath.setValue(0);
    if (!running || mode !== 'auto' || completed || reduceMotion || !active) {
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      breath.setValue(0);
    };
  }, [breath, running, mode, completed, reduceMotion, active]);

  useEffect(() => {
    if (reduceMotion || mode === 'auto') {
      touch.stopAnimation();
      touch.setValue(1);
    }
    return () => touch.stopAnimation();
  }, [reduceMotion, mode, touch]);

  function press(down: boolean) {
    if (reduceMotion) {
      return;
    }
    touch.stopAnimation();
    Animated.spring(touch, {
      toValue: down ? 0.965 : 1,
      speed: down ? 45 : 22,
      bounciness: down ? 0 : 7,
      useNativeDriver: true,
    }).start();
  }

  return (
    <View testID="counter-dial" style={[s.dial, { width: size, height: size }]}>
      <View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.View
          style={[
            s.halo,
            {
              opacity: breath.interpolate({
                inputRange: [0, 1],
                outputRange: [0.07, 0.22],
              }),
              transform: [
                {
                  scale: breath.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1.035],
                  }),
                },
              ],
            },
          ]}
        />
        <Svg width={size} height={size} viewBox="0 0 264 264" fill="none">
          <Defs>
            <LinearGradient
              id="counter-progress"
              x1="30"
              y1="10"
              x2="230"
              y2="245"
              gradientUnits="userSpaceOnUse"
            >
              <Stop stopColor="#D9C18C" />
              <Stop offset="1" stopColor="#A98746" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={132}
            cy={132}
            r={RADIUS}
            stroke="#E1E6D8"
            strokeWidth={4}
          />
          <ProgressCircle
            cx={132}
            cy={132}
            r={RADIUS}
            stroke="url(#counter-progress)"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={progress.interpolate({
              inputRange: [0, 1],
              outputRange: [CIRCUMFERENCE, 0],
            })}
            transform="rotate(-90 132 132)"
          />
          {TICKS.map((tick, index) => (
            <Line
              key={index}
              {...tick}
              stroke={index / 33 < fraction ? '#B89A5E' : '#C6D0BD'}
              strokeWidth={index % 3 === 0 ? 2 : 1.3}
              strokeLinecap="round"
            />
          ))}
        </Svg>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              s.progressBead,
              { left: size / 2 - 4, top: (size * 9) / 264 - 4 },
            ]}
          />
        </Animated.View>
        <Animated.View
          style={[
            s.ripple,
            {
              opacity: ripple.interpolate({
                inputRange: [0, 0.2, 1],
                outputRange: [0, 0.34, 0],
              }),
              transform: [
                {
                  scale: ripple.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.78, 1.045],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
      <Animated.View
        style={[
          s.face,
          {
            width: faceSize,
            height: faceSize,
            borderRadius: faceSize / 2,
            transform: [{ scale: touch }],
          },
        ]}
      >
        <Pressable
          testID="count-button"
          accessibilityRole="button"
          accessibilityLabel={
            mode === 'manual'
              ? `Count ${title}. ${count} of ${target}. Tap to add one.`
              : `Auto count. ${count} of ${target}.`
          }
          accessibilityState={{ disabled: mode === 'auto' }}
          disabled={mode === 'auto'}
          onPress={mode === 'manual' ? onCount : undefined}
          onPressIn={() => press(true)}
          onPressOut={() => press(false)}
          style={s.pressable}
        >
          <Svg
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            width={faceSize}
            height={faceSize}
            viewBox="0 0 208 208"
            fill="none"
            accessible={false}
          >
            <Defs>
              <LinearGradient
                id="counter-jade"
                x1="39"
                y1="3"
                x2="166"
                y2="213"
                gradientUnits="userSpaceOnUse"
              >
                <Stop stopColor="#397E62" />
                <Stop offset="0.42" stopColor="#205B48" />
                <Stop offset="1" stopColor="#103A30" />
              </LinearGradient>
              <LinearGradient
                id="counter-light"
                x1="20"
                y1="15"
                x2="163"
                y2="190"
                gradientUnits="userSpaceOnUse"
              >
                <Stop stopColor="#C8E2BB" stopOpacity={0.3} />
                <Stop offset="1" stopColor="#B8D4AA" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={104}
              cy={104}
              r={103}
              fill="url(#counter-jade)"
              stroke="#164A3B"
              strokeWidth={2}
            />
            <Circle
              cx={104}
              cy={104}
              r={97}
              stroke="url(#counter-light)"
              strokeWidth={1}
            />
            <Path
              d="M26 64A87 87 0 01163 29"
              stroke="#DCE9CA"
              strokeOpacity={0.18}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Path
              d="M51 184A87 87 0 00188 125"
              stroke="#061F19"
              strokeOpacity={0.2}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </Svg>
          <View pointerEvents="none" style={s.content}>
            <View style={s.mark}>
              <Icon
                name={completed ? 'check' : 'beads'}
                size={Math.round(size * 0.082)}
                color="#DAC692"
              />
            </View>
            <Animated.Text
              testID="count-value"
              maxFontSizeMultiplier={1.2}
              style={[
                s.count,
                {
                  fontSize:
                    size * (count > 999 ? 0.23 : count > 99 ? 0.28 : 0.33),
                  lineHeight: size * 0.36,
                  opacity: digit.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.65, 1],
                  }),
                  transform: [
                    {
                      translateY: digit.interpolate({
                        inputRange: [0, 1],
                        outputRange: [5, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {count}
            </Animated.Text>
            <View style={s.targetPill}>
              <Animated.Text style={s.targetText}>of {target}</Animated.Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
const s = StyleSheet.create({
  dial: { alignItems: 'center', justifyContent: 'center' },
  face: {
    backgroundColor: colors.green,
    shadowColor: '#123D33',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 13,
    elevation: 7,
  },
  pressable: {
    flex: 1,
    borderRadius: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center', justifyContent: 'center', gap: 1 },
  mark: { marginBottom: 1, opacity: 0.9 },
  count: {
    color: '#FFFEF6',
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -3,
    includeFontPadding: false,
    textAlign: 'center',
  },
  targetPill: {
    backgroundColor: '#071F1930',
    borderWidth: 1,
    borderColor: '#CFE0B71A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 4,
  },
  targetText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.7,
    color: '#D8DFC3',
  },
  progressBead: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9AD70',
    borderColor: colors.paper,
    borderWidth: 1.5,
  },
  halo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    margin: 2,
    borderRadius: 180,
    backgroundColor: '#9CB48B',
  },
  ripple: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1.5,
    borderColor: '#A8BA8F',
    borderRadius: 180,
  },
});
