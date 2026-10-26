import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState as NativeAppState,
  BackHandler,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Icon } from './src/components/Icon';
import { Pattern } from './src/components/Ornament';
import {
  BrandHeader,
  Button,
  Navigation,
  Sheet,
  Tab,
} from './src/components/UI';
import { Counter } from './src/screens/Counter';
import { Onboarding } from './src/screens/Onboarding';
import { Library } from './src/screens/Library';
import { Journey } from './src/screens/Journey';
import { Calibration } from './src/screens/Calibration';
import { CustomDhikrForm, TargetForm } from './src/screens/Forms';
import { Privacy, Settings } from './src/screens/Settings';
import { Reminders } from './src/screens/Reminders';
import { RemindersProvider } from './src/services/reminders';
import { AdBanner, AdsProvider, useAds } from './src/services/ads';
import { Dhikr, Mode, selectedDhikr } from './src/state/model';
import { useStoredState } from './src/state/useStoredState';
import { colors, fonts } from './src/theme';

type SheetName =
  | 'settings'
  | 'calibration'
  | 'target'
  | 'custom'
  | 'complete'
  | 'privacy'
  | 'reminders'
  | null;
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AppRoot />
    </SafeAreaProvider>
  );
}
function AppRoot() {
  const store = useStoredState();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[s.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <View style={s.app}>
        {store.ready ? (
          <RemindersProvider>
            <AdsProvider enabled={store.state.onboarded}>
              <Experience {...store} />
            </AdsProvider>
          </RemindersProvider>
        ) : (
          <View style={s.loading}>
            <Icon name="beads" size={43} />
            <Text style={s.loadingTitle}>tasbeeh.</Text>
            {store.readError ? (
              <>
                <Text style={s.errorText}>{store.storageError}</Text>
                <Button onPress={store.retry}>Try again</Button>
              </>
            ) : (
              <ActivityIndicator
                color={colors.green}
                style={{ marginTop: 15 }}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}
function Experience({
  state,
  dispatch,
  storageError,
  retry,
}: ReturnType<typeof useStoredState>) {
  const [tab, setTab] = useState<Tab>('counter');
  const [sheet, setSheet] = useState<SheetName>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [running, setRunning] = useState(false);
  const foreground = useRef(NativeAppState.currentState === 'active');
  const stateRef = useRef(state);
  stateRef.current = state;
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ads = useAds();
  const { cancelBoundary } = ads;
  const stop = useCallback(() => {
    setRunning(false);
    if (autoTimer.current) {
      clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
  }, []);
  useEffect(() => {
    const subscription = NativeAppState.addEventListener('change', next => {
      foreground.current = next === 'active';
      if (next !== 'active') {
        stop();
        cancelBoundary();
      }
    });
    return () => subscription.remove();
  }, [stop, cancelBoundary]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (showWelcome && state.onboarded) {
          setShowWelcome(false);
          return true;
        }
        if (sheet) {
          setSheet(null);
          stop();
          return true;
        }
        if (tab !== 'counter') {
          setTab('counter');
          stop();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [sheet, tab, stop, showWelcome, state.onboarded]);
  const count = useCallback(() => {
    if (!foreground.current) {
      return;
    }
    const current = stateRef.current;
    if (current.count >= current.target) {
      stop();
      setSheet('complete');
      return;
    }
    dispatch({ type: 'increment' });
    if (current.haptics) {
      Vibration.vibrate(
        current.count + 1 === current.target ? [0, 50, 60, 50] : 8,
      );
    }
    if (current.count + 1 === current.target) {
      stop();
      setSheet('complete');
    }
  }, [dispatch, stop]);
  useEffect(() => {
    if (
      running &&
      foreground.current &&
      state.mode === 'auto' &&
      state.count < state.target &&
      tab === 'counter' &&
      !sheet
    ) {
      autoTimer.current = setTimeout(count, state.pace);
    }
    return () => {
      if (autoTimer.current) {
        clearTimeout(autoTimer.current);
        autoTimer.current = null;
      }
    };
  }, [
    running,
    state.count,
    state.pace,
    state.target,
    state.mode,
    tab,
    sheet,
    count,
  ]);
  function navigate(next: Tab) {
    stop();
    ads.cancelBoundary();
    setTab(next);
  }
  function open(next: SheetName) {
    stop();
    ads.cancelBoundary();
    setSheet(next);
  }
  function changeMode(mode: Mode) {
    if (mode === state.mode) {
      return;
    }
    stop();
    dispatch({ type: 'mode', mode });
    if (
      mode === 'auto' &&
      (state.calibratedSessionId !== state.sessionId ||
        state.count >= state.target)
    ) {
      setSheet('calibration');
    }
  }
  function changeTarget(target?: number) {
    stop();
    if (!target) {
      setSheet('target');
      return;
    }
    if (target === state.target) {
      return;
    }
    if (state.count && state.count < state.target) {
      Alert.alert(
        'A new intention?',
        'Your current counts will be saved as a session. The new target starts from zero.',
        [
          { text: 'Keep counting', style: 'cancel' },
          {
            text: 'Set target',
            onPress: () => dispatch({ type: 'target', target }),
          },
        ],
      );
    } else {
      dispatch({ type: 'target', target });
    }
  }
  function reset() {
    stop();
    Alert.alert(
      'Begin with a fresh intention?',
      'Your counts stay in your journey. This counter will start again from zero.',
      [
        { text: 'Keep counting', style: 'cancel' },
        { text: 'Start fresh', onPress: () => dispatch({ type: 'reset' }) },
      ],
    );
  }
  function choose(dhikr: Dhikr) {
    stop();
    const select = () => {
      if (dhikr.id !== state.selectedId) {
        dispatch({ type: 'select', dhikr });
      }
      setTab('counter');
    };
    if (
      dhikr.id !== state.selectedId &&
      state.count > 0 &&
      state.count < state.target
    ) {
      Alert.alert(
        'Change your dhikr?',
        'Your current counts will be saved as a session. Your new dhikr starts from zero.',
        [
          { text: 'Stay here', style: 'cancel' },
          { text: 'Change dhikr', onPress: select },
        ],
      );
    } else {
      select();
    }
  }
  function addDhikr(dhikr: Dhikr) {
    dispatch({ type: 'add', dhikr });
    dispatch({ type: 'select', dhikr });
    setSheet(null);
    setTab('counter');
  }
  function removeDhikr(dhikr: Dhikr) {
    Alert.alert(
      'Remove this dhikr?',
      `${dhikr.title} will be removed from your collection. Your past counts will stay in your journey.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (state.selectedId === dhikr.id) {
              dispatch({
                type: 'select',
                dhikr: {
                  id: 'subhanallah',
                  title: 'SubhanAllah',
                  arabic: '',
                  meaning: '',
                  target: 33,
                },
              });
            }
            dispatch({ type: 'delete', id: dhikr.id });
          },
        },
      ],
    );
  }
  const dhikr = selectedDhikr(state);
  const sheetTitles: Record<NonNullable<SheetName>, string> = {
    settings: 'Tasbeeh Settings',
    calibration: 'At your own pace',
    target: 'Set your intention',
    custom: 'A remembrance of your own',
    complete: 'An intention, fulfilled.',
    privacy: 'Your privacy matters',
    reminders: 'Dhikr reminders',
  };
  if (!state.onboarded || showWelcome) {
    return (
      <Onboarding
        initialMode={state.mode}
        onClose={state.onboarded ? () => setShowWelcome(false) : undefined}
        onContinue={mode => {
          setShowWelcome(false);
          setTab('counter');
          dispatch({ type: 'onboard', mode });
          if (mode === 'auto') {
            setSheet('calibration');
          }
        }}
      />
    );
  }
  return (
    <>
      <BrandHeader onSettings={() => open('settings')} />
      {storageError && (
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          style={s.errorBanner}
        >
          <Text accessibilityRole="alert" style={s.errorBannerText}>
            {storageError}
          </Text>
        </Pressable>
      )}
      <View style={s.content}>
        {tab === 'counter' ? (
          <Counter
            state={state}
            running={running}
            onCount={count}
            onMode={changeMode}
            onDhikr={() => navigate('library')}
            onTarget={changeTarget}
            onUndo={() => {
              stop();
              dispatch({ type: 'undo' });
            }}
            onReset={reset}
            onToggle={() => {
              ads.cancelBoundary();
              if (state.count >= state.target) {
                dispatch({ type: 'reset' });
              }
              if (!running) {
                dispatch({ type: 'pace', pace: state.pace });
              }
              setRunning(!running);
            }}
            onPace={() => open('calibration')}
          />
        ) : tab === 'library' ? (
          <Library
            state={state}
            onSelect={choose}
            onAdd={() => open('custom')}
            onDelete={removeDhikr}
          />
        ) : (
          <Journey state={state} />
        )}
      </View>
      {tab === 'counter' && <AdBanner />}
      <Navigation tab={tab} onChange={navigate} />
      <Sheet
        visible={sheet !== null}
        title={sheet ? sheetTitles[sheet] : ''}
        onClose={() => {
          stop();
          setSheet(null);
        }}
      >
        {sheet === 'settings' && (
          <Settings
            state={state}
            onHaptics={value => dispatch({ type: 'haptics', value })}
            onPace={() => open('calibration')}
            onPrivacy={() => open('privacy')}
            onReminders={() => open('reminders')}
            onWelcome={() => {
              stop();
              cancelBoundary();
              setSheet(null);
              setShowWelcome(true);
            }}
          />
        )}
        {sheet === 'privacy' && <Privacy />}
        {sheet === 'reminders' && <Reminders />}
        {sheet === 'target' && (
          <TargetForm
            initial={state.target}
            onSave={target => {
              if (target !== state.target) {
                dispatch({ type: 'target', target });
              }
              setSheet(null);
            }}
          />
        )}
        {sheet === 'custom' && <CustomDhikrForm onSave={addDhikr} />}
        {sheet === 'calibration' && (
          <Calibration
            onDone={(pace, start) => {
              dispatch({ type: 'pace', pace });
              dispatch({ type: 'mode', mode: 'auto' });
              setTab('counter');
              setSheet(null);
              setRunning(start);
            }}
          />
        )}
        {sheet === 'complete' && (
          <View style={s.completion}>
            <View style={s.completeArt}>
              <View style={s.completePattern}>
                <Pattern />
              </View>
              <View style={s.completeIcon}>
                <Icon name="check" size={34} color={colors.gold} />
              </View>
              <Text style={s.completeArabic}>الْحَمْدُ لِلَّهِ</Text>
              <Text style={s.completeCount}>
                {state.count} moments of remembrance
              </Text>
            </View>

            <View style={s.sessionSummary}>
              <Text style={s.summaryName}>{dhikr.title}</Text>
              <View style={s.summarySaved}>
                <Icon name="check" size={13} />
                <Text style={s.savedText}>Saved to your journey</Text>
              </View>
            </View>
            <Button
              onPress={() => {
                dispatch({ type: 'reset' });
                setSheet(null);
              }}
            >
              Begin another round
            </Button>
            <Button
              secondary
              onPress={() => {
                setSheet(null);
                setTab('journey');
                ads.sessionBoundary(state.sessionId);
              }}
            >
              View my journey
            </Button>
          </View>
        )}
      </Sheet>
    </>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  app: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  content: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    padding: 28,
  },
  loadingTitle: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.green,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: colors.paleGold,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  errorBannerText: { color: '#755C30', fontSize: 11, lineHeight: 18 },
  completion: { gap: 17 },
  completeArt: {
    backgroundColor: colors.mint,
    borderRadius: 22,
    padding: 27,
    alignItems: 'center',
    overflow: 'hidden',
    gap: 15,
  },
  completePattern: { position: 'absolute', right: -35, top: -25 },
  completeIcon: {
    width: 69,
    height: 69,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#C9B887',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeArabic: {
    fontFamily: fonts.arabic,
    fontSize: 30,
    lineHeight: 44,
    color: colors.green,
  },
  completeCount: { fontSize: 12, color: colors.green },
  completeBody: {
    fontSize: 13,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  sessionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  summaryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    flexShrink: 1,
  },
  summarySaved: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  savedText: { fontSize: 10, color: colors.muted },
});
