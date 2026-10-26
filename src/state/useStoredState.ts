import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { AppState, initialState, reducer, restoreState } from './model';

const AsyncStorage = createAsyncStorage('tasbeeh');
export const STORAGE_KEY = '@tasbeeh/state/v1';
let writeQueue: Promise<void> = Promise.resolve();
export function useStoredState() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [readError, setReadError] = useState(false);
  const mounted = useRef(true);
  const load = useCallback(async () => {
    setReadError(false);
    setStorageError(null);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!mounted.current) {
        return;
      }
      if (raw) {
        dispatch({ type: 'hydrate', state: restoreState(raw) });
      }
      setReady(true);
    } catch {
      if (mounted.current) {
        setReadError(true);
        setStorageError(
          'Your saved tasbeeh could not be opened. Please try again.',
        );
      }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);
  const save = useCallback((value: AppState) => {
    const serialized = JSON.stringify(value);
    writeQueue = writeQueue
      .catch(() => {})
      .then(() => AsyncStorage.setItem(STORAGE_KEY, serialized));
    writeQueue
      .then(() => {
        if (mounted.current) {
          setStorageError(null);
        }
      })
      .catch(() => {
        if (mounted.current) {
          setStorageError(
            'Progress could not be saved. Keep the app open and tap to retry.',
          );
        }
      });
  }, []);
  useEffect(() => {
    if (ready) {
      save(state);
    }
  }, [ready, state, save]);
  return {
    state,
    dispatch,
    ready,
    storageError,
    readError,
    retry: () => (readError ? load() : save(state)),
  };
}
