import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  AppState,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  BannerAd,
  BannerAdSize,
  MaxAdContentRating,
  TestIds,
  useInterstitialAd,
} from 'react-native-google-mobile-ads';
import { colors } from '../theme';

// Deliberately use Google's demo units in every build until publisher IDs are supplied.
export const adConfig = {
  banner: TestIds.BANNER,
  interstitial: TestIds.INTERSTITIAL,
};
const requestOptions = { requestNonPersonalizedAdsOnly: true };
const AdsContext = createContext({
  ready: false,
  privacyRequired: false,
  openPrivacy: async () => {},
  sessionBoundary: (_sessionId: string) => {},
  cancelBoundary: () => {},
});
let initialization: Promise<boolean> | null = null;
async function initialize() {
  if (!initialization) {
    initialization = (async () => {
      try {
        await AdsConsent.gatherConsent();
      } catch {
        /* A previous consent choice may still be valid offline. */
      }
      const consent = await AdsConsent.getConsentInfo();
      if (!consent.canRequestAds) {
        return false;
      }
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
      });
      await mobileAds().initialize();
      return true;
    })().catch(() => false);
  }
  return initialization;
}
export function AdsProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const boundaryCount = useRef(0);
  const seenSessions = useRef(new Set<string>());
  const lastShown = useRef(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { status, show, load, destroy } = useInterstitialAd({
    adUnitId: adConfig.interstitial,
    autoLoad: ready,
    requestOptions,
  });
  const adState = useRef({ status, show });
  adState.current = { status, show };
  const cancelBoundary = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  useEffect(() => {
    let alive = true;
    if (!enabled) {
      return;
    }
    initialize().then(async available => {
      if (!alive) {
        return;
      }
      setReady(available);
      try {
        const info = await AdsConsent.getConsentInfo();
        if (alive) {
          setPrivacyRequired(
            info.privacyOptionsRequirementStatus ===
              AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
          );
        }
      } catch {
        /* Settings remain usable offline. */
      }
    });
    return () => {
      alive = false;
      cancelBoundary();
    };
  }, [cancelBoundary, enabled]);
  useEffect(() => {
    if (ready && status === 'closed') {
      load();
    }
  }, [load, ready, status]);
  const openPrivacy = useCallback(async () => {
    try {
      cancelBoundary();
      // Retire inventory before changing the consent that authorized its request.
      setReady(false);
      destroy();
      await AdsConsent.showPrivacyOptionsForm();
      const info = await AdsConsent.getConsentInfo();
      setReady(info.canRequestAds);
      setPrivacyRequired(
        info.privacyOptionsRequirementStatus ===
          AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      );
      initialization = null;
    } catch {
      Alert.alert(
        'Privacy choices unavailable',
        'Please check your connection and try again.',
      );
    }
  }, [destroy, cancelBoundary]);
  const sessionBoundary = useCallback(
    (sessionId: string) => {
      cancelBoundary();
      if (seenSessions.current.has(sessionId)) {
        return;
      }
      seenSessions.current.add(sessionId);
      boundaryCount.current += 1;
      if (
        boundaryCount.current % 3 !== 0 ||
        Date.now() - lastShown.current < 120000
      ) {
        return;
      }
      // Allow the completion sheet to dismiss before presenting an interstitial.
      timer.current = setTimeout(() => {
        timer.current = null;
        if (
          AppState.currentState === 'active' &&
          adState.current.status === 'loaded'
        ) {
          lastShown.current = Date.now();
          adState.current.show();
        }
      }, 650);
    },
    [cancelBoundary],
  );
  return (
    <AdsContext.Provider
      value={{
        ready,
        privacyRequired,
        openPrivacy,
        sessionBoundary,
        cancelBoundary,
      }}
    >
      {children}
    </AdsContext.Provider>
  );
}
export const useAds = () => useContext(AdsContext);
export function AdBanner() {
  const { ready } = useAds();
  const [failed, setFailed] = useState(false);
  return (
    <View style={s.region}>
      <Text style={s.label}>ADVERTISEMENT</Text>
      <View style={s.slot}>
        {ready && !failed ? (
          <BannerAd
            unitId={adConfig.banner}
            size={
              Platform.OS === 'android'
                ? BannerAdSize.BANNER
                : BannerAdSize.ANCHORED_ADAPTIVE_BANNER
            }
            requestOptions={requestOptions}
            onAdFailedToLoad={() => setFailed(true)}
          />
        ) : (
          <View style={s.placeholder}>
            <View style={s.line} />
            <Text style={s.placeholderText}>
              A little support for a peaceful space
            </Text>
            <View style={s.line} />
          </View>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  region: {
    paddingTop: Platform.OS === 'android' ? 3 : 6,
    backgroundColor: colors.paper,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 7,
    letterSpacing: 1.7,
    color: '#8B9388',
    textAlign: 'center',
    marginBottom: Platform.OS === 'android' ? 2 : 4,
  },
  slot: {
    minHeight: 50,
    height: Platform.OS === 'android' ? 50 : undefined,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeholderText: { fontSize: 9, color: colors.muted },
  line: { width: 20, height: 1, backgroundColor: colors.line },
});
