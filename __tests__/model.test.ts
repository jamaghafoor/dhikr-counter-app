import {
  AppState,
  calibratedPace,
  DHIKRS,
  initialState,
  reducer,
  restoreState,
} from '../src/state/model';

describe('local tasbeeh state', () => {
  test('stops at target and records a completed session exactly once', () => {
    let state = { ...initialState(), target: 3 };
    for (let i = 0; i < 10; i++) {
      state = reducer(state, { type: 'increment', date: '2026-10-26' });
    }
    expect(state.count).toBe(3);
    expect(state.daily['2026-10-26']).toBe(3);
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]).toMatchObject({
      completed: true,
      count: 3,
      target: 3,
    });
  });
  test('undo removes a completed session and recounting records it once', () => {
    let state = { ...initialState(), target: 1 };
    state = reducer(state, { type: 'increment', date: '2026-10-26' });
    state = reducer(state, { type: 'undo' });
    expect(state.count).toBe(0);
    expect(state.daily['2026-10-26']).toBe(0);
    expect(state.sessions).toHaveLength(0);
    state = reducer(state, { type: 'increment', date: '2026-10-26' });
    expect(state.sessions).toHaveLength(1);
  });
  test('undo handles counts that span midnight without changing unrelated totals', () => {
    let state: AppState = { ...initialState(), daily: { '2026-10-24': 50 } };
    state = reducer(state, { type: 'increment', date: '2026-10-25' });
    state = reducer(state, { type: 'increment', date: '2026-10-26' });
    state = reducer(state, { type: 'undo' });
    expect(state.daily).toEqual({
      '2026-10-24': 50,
      '2026-10-25': 1,
      '2026-10-26': 0,
    });
    state = reducer(state, { type: 'undo' });
    expect(state.daily['2026-10-25']).toBe(0);
    expect(reducer(state, { type: 'undo' })).toBe(state);
  });
  test('switching dhikr saves a partial session, preserving lifetime counts', () => {
    let state = reducer(initialState(), {
      type: 'increment',
      date: '2026-10-26',
    });
    state = reducer(state, { type: 'select', dhikr: DHIKRS[2] });
    expect(state).toMatchObject({
      count: 0,
      target: 34,
      selectedId: DHIKRS[2].id,
      activeDays: {},
    });
    expect(state.sessions[0]).toMatchObject({
      count: 1,
      completed: false,
      title: 'SubhanAllah',
    });
    expect(state.daily['2026-10-26']).toBe(1);
    state = reducer(state, { type: 'undo' });
    expect(state.daily['2026-10-26']).toBe(1);
  });
  test('reset does not duplicate a completed session', () => {
    let state = { ...initialState(), target: 1 };
    state = reducer(state, { type: 'increment' });
    const completedId = state.sessionId;
    state = reducer(state, { type: 'reset' });
    expect(state.sessions).toHaveLength(1);
    expect(state.sessionId).not.toBe(completedId);
    expect(state.count).toBe(0);
  });
  test('restores custom dhikr, current counts, preferences and history', () => {
    let state = initialState();
    const dhikr = {
      id: 'custom-1',
      title: 'My dhikr',
      arabic: '',
      meaning: '',
      target: 25,
      custom: true,
    };
    state = reducer(state, { type: 'add', dhikr });
    state = reducer(state, { type: 'select', dhikr });
    state = reducer(state, { type: 'increment' });
    state = reducer(state, { type: 'haptics', value: false });
    expect(restoreState(JSON.stringify(state))).toEqual(state);
  });
  test('rejects corrupt storage instead of silently overwriting it', () => {
    expect(() => restoreState('{')).toThrow();
    expect(() =>
      restoreState(JSON.stringify({ ...initialState(), count: -1 })),
    ).toThrow();
    expect(() =>
      restoreState(JSON.stringify({ ...initialState(), target: 0 })),
    ).toThrow();
    expect(() =>
      restoreState(JSON.stringify({ ...initialState(), count: 34 })),
    ).toThrow();
  });
  test('changing targets saves the existing session and starts from zero', () => {
    let state = reducer(initialState(), { type: 'increment' });
    state = reducer(state, { type: 'target', target: 100 });
    expect(state.count).toBe(0);
    expect(state.target).toBe(100);
    expect(state.sessions).toHaveLength(1);
  });
});
describe('pace calibration', () => {
  test('remembers calibration for the current round across mode changes and restoration', () => {
    let state = reducer(initialState(), { type: 'pace', pace: 1100 });
    state = reducer(state, { type: 'mode', mode: 'manual' });
    state = restoreState(JSON.stringify(state));
    expect(state.calibratedSessionId).toBe(state.sessionId);
    expect(state.pace).toBe(1100);
    for (const action of [
      { type: 'reset' } as const,
      { type: 'target', target: 99 } as const,
      { type: 'select', dhikr: DHIKRS[1] } as const,
    ]) {
      const next = reducer(state, action);
      expect(next.calibratedSessionId).not.toBe(next.sessionId);
    }
  });
  test('restores existing auto rounds saved before calibration tracking was added', () => {
    const saved = { ...initialState(), calibratedSessionId: undefined };
    expect(
      restoreState(JSON.stringify({ ...saved, mode: 'auto', count: 20 }))
        .calibratedSessionId,
    ).toBe(saved.sessionId);
    expect(restoreState(JSON.stringify(saved)).calibratedSessionId).toBeNull();
  });
  test('averages the four intervals between five recitations', () => {
    expect(calibratedPace([100, 1100, 2300, 3300, 4500])).toBe(1100);
  });
  test('rejects accidental taps, very long pauses and incomplete calibration', () => {
    expect(calibratedPace([0, 5, 8, 11, 16])).toBeNull();
    expect(calibratedPace([0, 1000, 2000, 3000, 20000])).toBeNull();
    expect(calibratedPace([0, 1000])).toBeNull();
  });
});
