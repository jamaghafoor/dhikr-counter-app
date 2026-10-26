import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { DHIKR_REMINDERS } from '../constants/reminders';
import NativeReminders, {
  ReminderSettings,
} from '../specs/NativeDhikrReminders';

const ALL_IDS = DHIKR_REMINDERS.map(reminder => reminder.id);
export const notificationsAllowed = (settings: ReminderSettings | null) =>
  settings?.authorizationStatus === 'authorized' ||
  settings?.authorizationStatus === 'provisional';

type RemindersContextValue = {
  settings: ReminderSettings | null;
  busy: boolean;
  error: string | null;
  notice: string | null;
  refresh: () => Promise<void>;
  setAll: (enabled: boolean) => Promise<void>;
  setOne: (id: string, enabled: boolean) => Promise<void>;
  openSettings: (precise?: boolean) => Promise<void>;
  sendTest: () => Promise<void>;
};
const RemindersContext = createContext<RemindersContextValue | null>(null);
function native() {
  if (!NativeReminders) {
    throw new Error('Local notification module unavailable');
  }
  return NativeReminders;
}
export function RemindersProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const current = useRef<ReminderSettings | null>(null);
  const mounted = useRef(true);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const update = useCallback((snapshot: ReminderSettings) => {
    const value = {
      ...snapshot,
      enabledIds: ALL_IDS.filter(id => snapshot.enabledIds.includes(id)),
    };
    current.current = value;
    if (mounted.current) {
      setSettings(value);
    }
    return value;
  }, []);
  const enqueue = useCallback(
    (operation: () => Promise<void>, message: string) => {
      if (mounted.current) {
        setPending(count => count + 1);
        setError(null);
        setNotice(null);
      }
      const task = queue.current
        .catch(() => {})
        .then(operation)
        .catch(() => {
          if (mounted.current) {
            setError(message);
          }
        })
        .finally(() => {
          if (mounted.current) {
            setPending(count => count - 1);
          }
        });
      queue.current = task;
      return task;
    },
    [],
  );
  const refresh = useCallback(
    () =>
      enqueue(async () => {
        // Idempotent native scheduling replaces stable IDs and never prompts for permission.
        update(await native().configure(DHIKR_REMINDERS));
      }, 'Your reminder settings could not be loaded. Please try again.'),
    [enqueue, update],
  );
  useEffect(() => {
    mounted.current = true;
    refresh();
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') {
        refresh();
      }
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [refresh]);
  const change = useCallback(
    (getIds: (ids: string[]) => string[]) =>
      enqueue(async () => {
        let snapshot =
          current.current || update(await native().configure(DHIKR_REMINDERS));
        const ids = [...new Set(getIds(snapshot.enabledIds))].filter(id =>
          ALL_IDS.includes(id),
        );
        const enabling = ids.some(id => !snapshot.enabledIds.includes(id));
        if (enabling && !notificationsAllowed(snapshot)) {
          if (snapshot.authorizationStatus === 'notDetermined') {
            snapshot = update(await native().requestPermission());
          }
          if (!notificationsAllowed(snapshot)) {
            if (mounted.current) {
              setError(
                'Notifications are off. Allow them in your phone’s notification settings, then enable your reminders.',
              );
            }
            return;
          }
        }
        update(await native().setEnabledIds(ids));
      }, 'Your reminders could not be updated. Please try again.'),
    [enqueue, update],
  );
  const setAll = useCallback(
    (enabled: boolean) => change(() => (enabled ? ALL_IDS : [])),
    [change],
  );
  const setOne = useCallback(
    (id: string, enabled: boolean) =>
      change(ids =>
        enabled ? [...ids, id] : ids.filter(value => value !== id),
      ),
    [change],
  );
  const openSettings = useCallback(
    (precise = false) =>
      enqueue(
        () => native().openSettings(precise),
        'Your phone’s notification settings could not be opened.',
      ),
    [enqueue],
  );
  const sendTest = useCallback(
    () =>
      enqueue(async () => {
        await native().sendTest();
        if (mounted.current) {
          setNotice('Test reminder sent. Check your notifications.');
        }
      }, 'The test reminder could not be sent. Check your notification permission and try again.'),
    [enqueue],
  );
  return (
    <RemindersContext.Provider
      value={{
        settings,
        busy: pending > 0,
        error,
        notice,
        refresh,
        setAll,
        setOne,
        openSettings,
        sendTest,
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
}
export function useReminders() {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error('RemindersProvider is required');
  }
  return context;
}
