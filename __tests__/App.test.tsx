import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  AppState as NativeAppState,
  TextInput,
  AppStateStatus,
} from 'react-native';
import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { AdsConsent } from 'react-native-google-mobile-ads';
import App from '../App';
import { Calibration } from '../src/screens/Calibration';
import { AppState, initialState } from '../src/state/model';
import { STORAGE_KEY } from '../src/state/useStoredState';

const storage = createAsyncStorage('tasbeeh');
let renderer: ReactTestRenderer.ReactTestRenderer;
let appStateListener: (status: AppStateStatus) => void;
async function render(saved = true, overrides: Partial<AppState> = {}) {
  if (saved) {
    await storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...initialState(),
        onboarded: true,
        haptics: false,
        ...overrides,
      }),
    );
  }
  await act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
}
async function press(label: string) {
  await act(async () => {
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === label &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress();
  });
}
beforeEach(async () => {
  jest.useFakeTimers();
  await storage.clear();
  NativeAppState.currentState = 'active';
  const listeners = new Set<(status: AppStateStatus) => void>();
  appStateListener = status => listeners.forEach(listener => listener(status));
  jest
    .spyOn(NativeAppState, 'addEventListener')
    .mockImplementation((_event, callback) => {
      listeners.add(callback);
      return {
        remove: () => {
          listeners.delete(callback);
        },
      };
    });
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer.unmount());
  }
  jest.restoreAllMocks();
  jest.useRealTimers();
});
test('first launch offers counting methods without requesting ad consent', async () => {
  const consentCalls = (AdsConsent.gatherConsent as jest.Mock).mock.calls
    .length;
  await render(false);
  expect(
    renderer.root.findAllByProps({ accessibilityRole: 'radio' }).length,
  ).toBeGreaterThan(0);
  expect(renderer.root.findAllByProps({ testID: 'count-button' })).toHaveLength(
    0,
  );
  expect((AdsConsent.gatherConsent as jest.Mock).mock.calls.length).toBe(
    consentCalls,
  );
});
test('manual counting, undo and persistence work together', async () => {
  await render();
  for (let i = 0; i < 3; i++) {
    await act(async () =>
      renderer.root.findByProps({ testID: 'count-button' }).props.onPress(),
    );
  }
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(3);
  await press('Undo last count');
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(2);
  const saved = JSON.parse((await storage.getItem(STORAGE_KEY))!);
  expect(saved.count).toBe(2);
  expect(Object.values(saved.daily)).toEqual([2]);
});
test('custom dhikr is saved locally and becomes the active counter', async () => {
  await render();
  await press('Adhkar');
  await press('Add your own dhikr');
  const inputs = renderer.root.findAllByType(TextInput);
  const name = inputs.find(
    node => node.props.accessibilityLabel === 'Dhikr name',
  );
  await act(async () => name!.props.onChangeText('My daily remembrance'));
  await press('Add to my collection');
  const saved = JSON.parse((await storage.getItem(STORAGE_KEY))!);
  expect(saved.customDhikrs[0].title).toBe('My daily remembrance');
  expect(saved.selectedId).toBe(saved.customDhikrs[0].id);
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(0);
});
test('auto mode uses its chosen pace and stays paused after backgrounding', async () => {
  await render();
  await press('Auto count');
  await press('Steady: 1.5 seconds per count');
  await press('Begin auto counting');
  await act(async () => {
    jest.advanceTimersByTime(1500);
  });
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(1);
  await act(async () => appStateListener('background'));
  await act(async () => {
    jest.advanceTimersByTime(10000);
  });
  await act(async () => appStateListener('active'));
  await act(async () => {
    jest.advanceTimersByTime(10000);
  });
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(1);
});

test.each([false, true])(
  'returning to an unfinished auto round reuses its recorded rhythm (reopen: %s)',
  async reopen => {
    await render(true, { count: 19 });
    await press('Auto count');
    for (let tap = 0; tap < 5; tap++) {
      if (tap > 0) {
        await act(async () => jest.advanceTimersByTime(1100));
      }
      await press(
        `Calibration. ${tap} of 5 taps. Tap at your recitation pace.`,
      );
    }
    await press('Begin auto counting');
    await act(async () => jest.advanceTimersByTime(1100));
    expect(
      renderer.root.findByProps({ testID: 'count-value' }).props.children,
    ).toBe(20);

    await press('Manual');
    await act(async () => jest.advanceTimersByTime(10000));
    expect(
      renderer.root.findByProps({ testID: 'count-value' }).props.children,
    ).toBe(20);
    await act(async () =>
      renderer.root.findByProps({ testID: 'count-button' }).props.onPress(),
    );
    if (reopen) {
      await act(async () => renderer.unmount());
      await render(false);
    }

    await press('Auto count');
    expect(renderer.root.findAllByType(Calibration)).toHaveLength(0);
    await act(async () => jest.advanceTimersByTime(10000));
    expect(
      renderer.root.findByProps({ testID: 'count-value' }).props.children,
    ).toBe(21);
    await press('Resume counting');
    await act(async () => jest.advanceTimersByTime(1099));
    expect(
      renderer.root.findByProps({ testID: 'count-value' }).props.children,
    ).toBe(21);
    await act(async () => jest.advanceTimersByTime(1));
    expect(
      renderer.root.findByProps({ testID: 'count-value' }).props.children,
    ).toBe(22);
    await press('Change auto counting pace');
    expect(renderer.root.findAllByType(Calibration)).toHaveLength(1);
  },
);

test.each([
  { count: 20, calibratedSessionId: null },
  { count: 33, calibratedSessionId: 'current-round' },
  { count: 0, calibratedSessionId: 'previous-round' },
])(
  'entering auto still offers calibration when needed: %o',
  async overrides => {
    await render(true, { sessionId: 'current-round', ...overrides });
    await press('Auto count');
    expect(renderer.root.findAllByType(Calibration)).toHaveLength(1);
  },
);

test('a round begun with the saved pace can also switch modes without recalibration', async () => {
  await render(true, { mode: 'auto', count: 33, pace: 800 });
  await press('Begin again');
  await act(async () => jest.advanceTimersByTime(800));
  await press('Manual');
  await press('Auto count');
  expect(renderer.root.findAllByType(Calibration)).toHaveLength(0);
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(1);
  await press('Resume counting');
  await act(async () => jest.advanceTimersByTime(800));
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(2);
});

test('reopening restores the last count and selected target', async () => {
  await render(true, { target: 99 });
  await act(async () =>
    renderer.root.findByProps({ testID: 'count-button' }).props.onPress(),
  );
  await act(async () => renderer.unmount());
  await render(false);
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(1);
  const saved = JSON.parse((await storage.getItem(STORAGE_KEY))!);
  expect(saved.target).toBe(99);
});

test('auto counting stops at the goal and records one completion', async () => {
  await render(true, { target: 2, mode: 'auto', pace: 300 });
  await press('Resume counting');
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(2);
  expect(
    renderer.root.findAllByProps({ accessibilityLabel: 'View my journey' })
      .length,
  ).toBeGreaterThan(0);
  await act(async () => {
    jest.advanceTimersByTime(10000);
  });
  const saved = JSON.parse((await storage.getItem(STORAGE_KEY))!);
  expect(saved.count).toBe(2);
  expect(saved.sessions).toHaveLength(1);
});

test('corrupt saved data stays intact and offers recovery instead of overwriting', async () => {
  await storage.setItem(STORAGE_KEY, 'unreadable-saved-data');
  await render(false);
  expect(
    renderer.root.findAllByProps({ accessibilityLabel: 'Try again' }).length,
  ).toBeGreaterThan(0);
  expect(await storage.getItem(STORAGE_KEY)).toBe('unreadable-saved-data');
  expect(renderer.root.findAllByProps({ testID: 'count-button' })).toHaveLength(
    0,
  );
});

test('first-launch manual onboarding saves the choice and opens the counter', async () => {
  await render(false);
  await press('Begin my dhikr');
  expect(
    renderer.root.findAllByProps({ testID: 'onboarding-screen' }),
  ).toHaveLength(0);
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(0);
  const saved = JSON.parse((await storage.getItem(STORAGE_KEY))!);
  expect(saved.onboarded).toBe(true);
  expect(saved.mode).toBe('manual');
});

test('first-launch auto onboarding opens calibration before counting', async () => {
  await render(false);
  await press('Auto count. Set your pace with five taps.');
  await press('Begin my dhikr');
  expect(
    renderer.root.findAllByProps({
      accessibilityLabel:
        'Calibration. 0 of 5 taps. Tap at your recitation pace.',
    }).length,
  ).toBeGreaterThan(0);
  const saved = JSON.parse((await storage.getItem(STORAGE_KEY))!);
  expect(saved.onboarded).toBe(true);
  expect(saved.mode).toBe('auto');
  expect(saved.count).toBe(0);
});

test('completed onboarding stays dismissed when reopening saved progress', async () => {
  await render(true, { count: 4, target: 99, mode: 'auto' });
  expect(
    renderer.root.findAllByProps({ testID: 'onboarding-screen' }),
  ).toHaveLength(0);
  await act(async () => renderer.unmount());
  await render(false);
  expect(
    renderer.root.findAllByProps({ testID: 'onboarding-screen' }),
  ).toHaveLength(0);
  expect(
    renderer.root.findByProps({ testID: 'count-value' }).props.children,
  ).toBe(4);
  const saved = JSON.parse((await storage.getItem(STORAGE_KEY))!);
  expect(saved.mode).toBe('auto');
  expect(saved.target).toBe(99);
  expect(saved.count).toBe(4);
});
