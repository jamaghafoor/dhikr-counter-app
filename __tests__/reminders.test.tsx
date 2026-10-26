import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppState, AppStateStatus, Switch } from 'react-native';
import { DHIKR_REMINDERS } from '../src/constants/reminders';
import { Reminders } from '../src/screens/Reminders';
import {
  notificationsAllowed,
  RemindersProvider,
  useReminders,
} from '../src/services/reminders';
import NativeReminders from '../src/specs/NativeDhikrReminders';

const native = NativeReminders!;
const allIds = DHIKR_REMINDERS.map(reminder => reminder.id);
let controls: ReturnType<typeof useReminders>;
let renderer: ReactTestRenderer.ReactTestRenderer;
let foreground: (status: AppStateStatus) => void;
function Capture() {
  controls = useReminders();
  return <Reminders />;
}
async function render() {
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <RemindersProvider>
        <Capture />
      </RemindersProvider>,
    );
  });
}
beforeEach(() => {
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, callback) => {
      foreground = callback;
      return { remove: jest.fn() };
    });
});
afterEach(async () => {
  if (renderer) {
    await act(async () => renderer.unmount());
  }
  jest.restoreAllMocks();
});

test('registers exactly the supplied local messages and times without prompting on launch', async () => {
  await render();
  expect(native.configure).toHaveBeenCalledWith(DHIKR_REMINDERS);
  expect(DHIKR_REMINDERS.map(({ hour, minute }) => [hour, minute])).toEqual([
    [6, 0],
    [13, 0],
    [18, 0],
    [21, 0],
  ]);
  expect(native.requestPermission).not.toHaveBeenCalled();
  expect(native.setEnabledIds).not.toHaveBeenCalled();
  expect(renderer.root.findAllByType(Switch)).toHaveLength(5);
  expect(controls.settings?.enabledIds).toEqual([]);
});

test('opt-in requests permission once and schedules all four stable IDs', async () => {
  await render();
  await act(async () => controls.setAll(true));
  expect(native.requestPermission).toHaveBeenCalledTimes(1);
  expect(native.setEnabledIds).toHaveBeenLastCalledWith(allIds);
  expect(controls.settings?.enabledIds).toEqual(allIds);
  expect(notificationsAllowed(controls.settings)).toBe(true);
  await act(async () => controls.setAll(true));
  expect(native.requestPermission).toHaveBeenCalledTimes(1);
  expect(new Set(controls.settings?.enabledIds).size).toBe(4);
});

test('denying permission does not schedule reminders and offers phone settings', async () => {
  (native.requestPermission as jest.Mock).mockResolvedValueOnce({
    enabledIds: [],
    authorizationStatus: 'denied',
    precise: true,
  });
  await render();
  await act(async () => controls.setAll(true));
  expect(native.setEnabledIds).not.toHaveBeenCalled();
  expect(controls.settings?.enabledIds).toEqual([]);
  expect(controls.error).toContain('Notifications are off');
  expect(
    renderer.root.findAllByProps({
      accessibilityLabel: 'Open notification settings',
    }).length,
  ).toBeGreaterThan(0);
  await act(async () => controls.setAll(true));
  expect(native.requestPermission).toHaveBeenCalledTimes(1);
});

test('individual choices persist through reopening and disabling all cancels them', async () => {
  await render();
  await act(async () => controls.setOne('morning-dhikr', true));
  await act(async () => controls.setOne('night-dhikr', true));
  await act(async () => controls.setOne('morning-dhikr', false));
  expect(native.setEnabledIds).toHaveBeenLastCalledWith(['night-dhikr']);
  await act(async () => renderer.unmount());
  await render();
  expect(controls.settings?.enabledIds).toEqual(['night-dhikr']);
  await act(async () => controls.setAll(false));
  expect(native.setEnabledIds).toHaveBeenLastCalledWith([]);
  expect(controls.settings?.enabledIds).toEqual([]);
});

test('rapid enable and disable remain in order without orphaned reminders', async () => {
  await render();
  await act(async () => {
    await Promise.all([controls.setAll(true), controls.setAll(false)]);
  });
  expect((native.setEnabledIds as jest.Mock).mock.calls).toEqual([
    [allIds],
    [[]],
  ]);
  expect(controls.settings?.enabledIds).toEqual([]);
  expect(controls.busy).toBe(false);
});

test('returning from system settings refreshes authorization and preserves saved choices', async () => {
  await render();
  await act(async () => controls.setAll(true));
  (native.configure as jest.Mock).mockResolvedValueOnce({
    enabledIds: allIds,
    authorizationStatus: 'denied',
    precise: false,
  });
  await act(async () => foreground('active'));
  expect(controls.settings?.enabledIds).toEqual(allIds);
  expect(notificationsAllowed(controls.settings)).toBe(false);
  await act(async () => controls.openSettings(true));
  expect(native.openSettings).toHaveBeenLastCalledWith(true);
});

test('native scheduling failures are visible and do not mark reminders as enabled', async () => {
  await render();
  (native.setEnabledIds as jest.Mock).mockRejectedValueOnce(
    new Error('OS scheduler unavailable'),
  );
  await act(async () => controls.setAll(true));
  expect(controls.settings?.enabledIds).toEqual([]);
  expect(controls.error).toContain('could not be updated');
  expect(controls.busy).toBe(false);
});

test('failed initialization can be retried and test alerts use only the native scheduler', async () => {
  (native.configure as jest.Mock).mockRejectedValueOnce(
    new Error('OS unavailable'),
  );
  await render();
  expect(controls.settings).toBeNull();
  expect(controls.error).toContain('could not be loaded');
  await act(async () => controls.refresh());
  expect(controls.settings).not.toBeNull();
  await act(async () => controls.setAll(true));
  await act(async () => controls.sendTest());
  expect(native.sendTest).toHaveBeenCalledTimes(1);
  expect(controls.notice).toContain('Test reminder sent');
  expect(controls.error).toBeNull();
});

test('a reminder can be switched off even after system permission is revoked', async () => {
  await render();
  await act(async () => controls.setAll(true));
  const denied = {
    enabledIds: allIds,
    authorizationStatus: 'denied',
    precise: true,
  };
  (native.configure as jest.Mock).mockResolvedValueOnce(denied);
  await act(async () => foreground('active'));
  const remaining = allIds.filter(id => id !== 'morning-dhikr');
  (native.setEnabledIds as jest.Mock).mockResolvedValueOnce({
    ...denied,
    enabledIds: remaining,
  });
  await act(async () => controls.setOne('morning-dhikr', false));
  expect(native.setEnabledIds).toHaveBeenLastCalledWith(remaining);
  expect(native.requestPermission).toHaveBeenCalledTimes(1);
  expect(controls.settings?.enabledIds).toEqual(remaining);
  expect(controls.error).toBeNull();
});
