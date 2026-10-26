/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Svg: 'Svg',
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  Path: 'Path',
  Rect: 'Rect',
  Line: 'Line',
  G: 'G',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  Stop: 'Stop',
}));
jest.mock('react-native-google-mobile-ads', () => {
  const consentInfo = {
    canRequestAds: false,
    privacyOptionsRequirementStatus: 'NOT_REQUIRED',
  };
  const sdk = {
    initialize: jest.fn().mockResolvedValue([]),
    setRequestConfiguration: jest.fn().mockResolvedValue(undefined),
  };
  const interstitial = {
    status: 'idle',
    show: jest.fn(),
    load: jest.fn(),
    destroy: jest.fn(),
  };
  return {
    __esModule: true,
    default: () => sdk,
    AdsConsent: {
      gatherConsent: jest.fn().mockResolvedValue(consentInfo),
      getConsentInfo: jest.fn().mockResolvedValue(consentInfo),
      showPrivacyOptionsForm: jest.fn().mockResolvedValue(consentInfo),
    },
    AdsConsentPrivacyOptionsRequirementStatus: { REQUIRED: 'REQUIRED' },
    MaxAdContentRating: { G: 'G' },
    BannerAd: 'BannerAd',
    BannerAdSize: { BANNER: 'BANNER', ANCHORED_ADAPTIVE_BANNER: 'ADAPTIVE' },
    TestIds: { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial' },
    useInterstitialAd: () => interstitial,
  };
});

jest.mock('./src/specs/NativeDhikrReminders', () => {
  let settings;
  const snapshot = () => ({
    ...settings,
    enabledIds: [...settings.enabledIds],
  });
  const module = {
    configure: jest.fn(async () => snapshot()),
    setEnabledIds: jest.fn(async ids => {
      settings.enabledIds = [...ids];
      return snapshot();
    }),
    requestPermission: jest.fn(async () => {
      settings.authorizationStatus = 'authorized';
      return snapshot();
    }),
    openSettings: jest.fn(async () => {}),
    sendTest: jest.fn(async () => {}),
  };
  return {
    __esModule: true,
    default: module,
    resetMock: () => {
      settings = {
        enabledIds: [],
        authorizationStatus: 'notDetermined',
        precise: true,
      };
      Object.values(module).forEach(method => method.mockClear());
      module.configure.mockImplementation(async () => snapshot());
      module.setEnabledIds.mockImplementation(async ids => {
        settings.enabledIds = [...ids];
        return snapshot();
      });
      module.requestPermission.mockImplementation(async () => {
        settings.authorizationStatus = 'authorized';
        return snapshot();
      });
    },
  };
});
beforeEach(() => require('./src/specs/NativeDhikrReminders').resetMock());
