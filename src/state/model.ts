export type Mode = 'manual' | 'auto';
export type Dhikr = {
  id: string;
  arabic: string;
  title: string;
  meaning: string;
  target: number;
  custom?: boolean;
};
export type Session = {
  id: string;
  dhikrId: string;
  title: string;
  arabic: string;
  count: number;
  target: number;
  mode: Mode;
  date: string;
  completed: boolean;
};
export type AppState = {
  version: 1;
  onboarded: boolean;
  selectedId: string;
  count: number;
  target: number;
  mode: Mode;
  pace: number;
  calibratedSessionId: string | null;
  haptics: boolean;
  customDhikrs: Dhikr[];
  sessions: Session[];
  daily: Record<string, number>;
  activeDays: Record<string, number>;
  sessionId: string;
};
export const DHIKRS: Dhikr[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    title: 'SubhanAllah',
    meaning: 'Glory be to Allah',
    target: 33,
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    title: 'Alhamdulillah',
    meaning: 'All praise is for Allah',
    target: 33,
  },
  {
    id: 'allahuakbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    title: 'Allahu Akbar',
    meaning: 'Allah is the Greatest',
    target: 34,
  },
  {
    id: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    title: 'Astaghfirullah',
    meaning: 'I seek forgiveness from Allah',
    target: 100,
  },
  {
    id: 'tawhid',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    title: 'La ilaha illallah',
    meaning: 'There is no god but Allah',
    target: 100,
  },
  {
    id: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    title: 'Salawat',
    meaning: 'O Allah, send blessings upon Muhammad',
    target: 100,
  },
];
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}
export function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
export function initialState(): AppState {
  return {
    version: 1,
    onboarded: false,
    selectedId: DHIKRS[0].id,
    count: 0,
    target: 33,
    mode: 'manual',
    pace: 1500,
    calibratedSessionId: null,
    haptics: true,
    customDhikrs: [],
    sessions: [],
    daily: {},
    activeDays: {},
    sessionId: newId(),
  };
}
export function selectedDhikr(state: AppState) {
  return (
    [...DHIKRS, ...state.customDhikrs].find(d => d.id === state.selectedId) ||
    DHIKRS[0]
  );
}
function savePartial(state: AppState): Session[] {
  if (!state.count || state.sessions.some(s => s.id === state.sessionId)) {
    return state.sessions;
  }
  const dhikr = selectedDhikr(state);
  return [
    {
      id: state.sessionId,
      dhikrId: dhikr.id,
      title: dhikr.title,
      arabic: dhikr.arabic,
      count: state.count,
      target: state.target,
      mode: state.mode,
      date: new Date().toISOString(),
      completed: false,
    },
    ...state.sessions,
  ].slice(0, 300);
}
export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'onboard'; mode: Mode }
  | { type: 'increment'; date?: string; timestamp?: string }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'select'; dhikr: Dhikr }
  | { type: 'target'; target: number }
  | { type: 'mode'; mode: Mode }
  | { type: 'pace'; pace: number }
  | { type: 'haptics'; value: boolean }
  | { type: 'add'; dhikr: Dhikr }
  | { type: 'delete'; id: string };
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'onboard':
      return { ...state, onboarded: true, mode: action.mode };
    case 'increment': {
      if (state.count >= state.target) {
        return state;
      }
      const day = action.date || localDay();
      const count = state.count + 1;
      const dhikr = selectedDhikr(state);
      const session: Session = {
        id: state.sessionId,
        dhikrId: dhikr.id,
        title: dhikr.title,
        arabic: dhikr.arabic,
        count,
        target: state.target,
        mode: state.mode,
        date: action.timestamp || new Date().toISOString(),
        completed: true,
      };
      return {
        ...state,
        count,
        daily: { ...state.daily, [day]: (state.daily[day] || 0) + 1 },
        activeDays: {
          ...state.activeDays,
          [day]: (state.activeDays[day] || 0) + 1,
        },
        sessions:
          count === state.target
            ? [session, ...state.sessions].slice(0, 300)
            : state.sessions,
      };
    }
    case 'undo': {
      if (!state.count) {
        return state;
      }
      const day = Object.keys(state.activeDays)
        .sort()
        .reverse()
        .find(key => state.activeDays[key] > 0);
      return {
        ...state,
        count: state.count - 1,
        daily: day
          ? { ...state.daily, [day]: Math.max(0, (state.daily[day] || 0) - 1) }
          : state.daily,
        activeDays: day
          ? { ...state.activeDays, [day]: state.activeDays[day] - 1 }
          : state.activeDays,
        sessions: state.sessions.filter(s => s.id !== state.sessionId),
      };
    }
    case 'reset':
      return {
        ...state,
        sessions: savePartial(state),
        count: 0,
        activeDays: {},
        sessionId: newId(),
      };
    case 'select':
      return {
        ...state,
        sessions: savePartial(state),
        selectedId: action.dhikr.id,
        target: action.dhikr.target,
        count: 0,
        activeDays: {},
        sessionId: newId(),
      };
    case 'target':
      return {
        ...state,
        sessions: savePartial(state),
        target: Math.max(1, Math.min(9999, Math.round(action.target))),
        count: 0,
        activeDays: {},
        sessionId: newId(),
      };
    case 'mode':
      return { ...state, mode: action.mode };
    case 'pace':
      return {
        ...state,
        pace: Math.max(300, Math.min(10000, action.pace)),
        calibratedSessionId: state.sessionId,
      };
    case 'haptics':
      return { ...state, haptics: action.value };
    case 'add':
      return { ...state, customDhikrs: [...state.customDhikrs, action.dhikr] };
    case 'delete':
      return {
        ...state,
        customDhikrs: state.customDhikrs.filter(d => d.id !== action.id),
      };
    default:
      return state;
  }
}
export function restoreState(raw: string): AppState {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object' || (data as AppState).version !== 1) {
    throw new Error('Unrecognized saved data');
  }
  const saved = data as AppState;
  const int = (n: unknown, max = Number.MAX_SAFE_INTEGER): n is number =>
    typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= max;
  if (
    !int(saved.count, 9999) ||
    !int(saved.target, 9999) ||
    saved.target < 1 ||
    saved.count > saved.target ||
    !Array.isArray(saved.customDhikrs) ||
    !Array.isArray(saved.sessions) ||
    !saved.daily ||
    !saved.activeDays ||
    typeof saved.sessionId !== 'string'
  ) {
    throw new Error('Invalid saved data');
  }
  const validDhikr = (d: Dhikr) =>
    d &&
    typeof d.id === 'string' &&
    typeof d.title === 'string' &&
    typeof d.arabic === 'string' &&
    typeof d.meaning === 'string' &&
    int(d.target, 9999) &&
    d.target > 0;
  const customDhikrs = saved.customDhikrs.filter(validDhikr);
  const allDhikrs = [...DHIKRS, ...customDhikrs];
  const validDays = (days: Record<string, number>) =>
    Object.fromEntries(
      Object.entries(days).filter(
        ([key, value]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && int(value),
      ),
    );
  return {
    ...initialState(),
    ...saved,
    onboarded: saved.onboarded === true,
    haptics: saved.haptics !== false,
    selectedId: allDhikrs.some(d => d.id === saved.selectedId)
      ? saved.selectedId
      : DHIKRS[0].id,
    mode: saved.mode === 'auto' ? 'auto' : 'manual',
    calibratedSessionId:
      saved.calibratedSessionId === saved.sessionId ||
      (saved.calibratedSessionId === undefined && saved.mode === 'auto')
        ? saved.sessionId
        : null,
    pace:
      typeof saved.pace === 'number' && Number.isFinite(saved.pace)
        ? Math.max(300, Math.min(10000, saved.pace))
        : 1500,
    customDhikrs,
    sessions: saved.sessions
      .filter(
        s =>
          s &&
          typeof s.id === 'string' &&
          typeof s.title === 'string' &&
          typeof s.arabic === 'string' &&
          int(s.count) &&
          int(s.target) &&
          typeof s.date === 'string' &&
          !Number.isNaN(Date.parse(s.date)),
      )
      .slice(0, 300),
    daily: validDays(saved.daily),
    activeDays: validDays(saved.activeDays),
  };
}
export function calibratedPace(taps: number[]): number | null {
  if (taps.length !== 5) {
    return null;
  }
  const intervals = taps.slice(1).map((tap, i) => tap - taps[i]);
  if (intervals.some(interval => interval < 300 || interval > 10000)) {
    return null;
  }
  return Math.round(intervals.reduce((sum, interval) => sum + interval, 0) / 4);
}
