import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { AppState } from '../state/model';
import { useAds } from '../services/ads';
import { notificationsAllowed, useReminders } from '../services/reminders';
import { colors, fonts } from '../theme';

export function Settings({
  state,
  onHaptics,
  onPace,
  onPrivacy,
  onReminders,
}: {
  state: AppState;
  onHaptics: (value: boolean) => void;
  onPace: () => void;
  onPrivacy: () => void;
  onWelcome: () => void;
  onReminders: () => void;
}) {
  const ads = useAds();
  const reminders = useReminders();
  const reminderCount = reminders.settings?.enabledIds.length || 0;
  return (
    <View style={s.root}>
      {/* <View style={s.intention}>
        <View style={s.pattern}>
          <Pattern />
        </View>
        <Icon name="leaf" size={24} color={colors.gold} />
        <Text style={s.intentionTitle}>Made for mindful moments.</Text>
        <Text style={s.intentionBody}>
          A simple companion for your remembrance,{'\n'}wherever your day takes
          you.
        </Text>
      </View> */}
      <Text style={s.section}>MAKE IT YOURS</Text>
      <View style={s.rows}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Daily dhikr reminders"
          onPress={onReminders}
          style={s.row}
        >
          <View style={s.rowIcon}>
            <Icon name="bell" size={20} />
          </View>
          <View style={s.rowBody}>
            <Text style={s.rowTitle}>Daily dhikr reminders</Text>
            <Text style={s.rowDescription}>
              {reminderCount
                ? notificationsAllowed(reminders.settings)
                  ? `${reminderCount} daily reminders · On this device`
                  : 'Paused · Allow notifications in phone settings'
                : '6:00 AM · 1:00 PM · 6:00 PM · 9:00 PM'}
            </Text>
          </View>
          <Icon name="chevron" size={16} />
        </Pressable>
        {/* <Pressable
          accessibilityRole="button"
          accessibilityLabel="Welcome & counting guide"
          onPress={onWelcome}
          style={s.row}
        >
          <View style={s.rowIcon}>
            <Icon name="beads" size={20} />
          </View>
          <View style={s.rowBody}>
            <Text style={s.rowTitle}>Welcome & counting guide</Text>
            <Text style={s.rowDescription}>
              Revisit your first moment of calm
            </Text>
          </View>
          <Icon name="chevron" size={16} />
        </Pressable> */}
        <View style={s.row}>
          <View style={s.rowIcon}>
            <Icon name="vibration" size={20} />
          </View>
          <View style={s.rowBody}>
            <Text style={s.rowTitle}>Gentle vibration</Text>
            <Text style={s.rowDescription}>
              Feel each count and completed target
            </Text>
          </View>
          <Switch
            accessibilityLabel="Gentle vibration"
            value={state.haptics}
            onValueChange={onHaptics}
            trackColor={{ false: '#D7DCD1', true: colors.green }}
            thumbColor={colors.white}
            ios_backgroundColor="#D7DCD1"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adjust auto counting pace"
          onPress={onPace}
          style={s.row}
        >
          <View style={s.rowIcon}>
            <Icon name="auto" size={20} />
          </View>
          <View style={s.rowBody}>
            <Text style={s.rowTitle}>Your counting rhythm</Text>
            <Text style={s.rowDescription}>
              One count every {(state.pace / 1000).toFixed(1)} seconds
            </Text>
          </View>
          <Icon name="chevron" size={16} />
        </Pressable>
      </View>
      <Text style={s.section}>YOUR SPACE, YOUR PRIVACY</Text>
      <View style={s.rows}>
        <Pressable accessibilityRole="button" onPress={onPrivacy} style={s.row}>
          <View style={s.rowIcon}>
            <Icon name="shield" size={20} />
          </View>
          <View style={s.rowBody}>
            <Text style={s.rowTitle}>Privacy & local storage</Text>
            <Text style={s.rowDescription}>
              Understand what stays on your device
            </Text>
          </View>
          <Icon name="chevron" size={16} />
        </Pressable>
        {ads.privacyRequired && (
          <Pressable
            accessibilityRole="button"
            onPress={ads.openPrivacy}
            style={s.row}
          >
            <View style={s.rowIcon}>
              <Icon name="settings" size={20} />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Ad privacy choices</Text>
              <Text style={s.rowDescription}>
                Review or change your consent
              </Text>
            </View>
            <Icon name="chevron" size={16} />
          </Pressable>
        )}
      </View>
      <View style={s.footer}>
        <Text style={s.wordmark}>tasbeeh.</Text>
        <Text style={s.version}>A little remembrance, every day · v1.0</Text>
      </View>
    </View>
  );
}
export function Privacy() {
  return (
    <View style={s.root}>
      {[
        [
          'Your dhikr stays with you',
          'Counts, targets, preferences, custom adhkar, and session history are stored locally on this device. There is no account and no app backend. We don’t upload your remembrance history.',
        ],
        [
          'A companion, even offline',
          'Manual counting, auto counting, and your saved collection work without internet. Auto mode is a timer, not voice recognition. It pauses when the app goes into the background.',
        ],
        [
          'Reminders without a server',
          'Daily dhikr reminders are scheduled by your phone, using its local time. Notification permission is requested only when you enable a reminder. Your choices are stored on this device; Firebase, push tokens, and a backend are not used.',
        ],
        [
          'Ads support the app',
          'Banner ads and occasional interstitials are provided by Google AdMob when connectivity and your consent allow. Google may process device and advertising data to serve and measure ads. Your dhikr entries are never included in ad requests.',
        ],
        [
          'Your choices matter',
          'Where required, Google’s consent form appears before ads are requested. If ad privacy choices apply in your region, you can reopen them from Settings. Ads are never required to finish a count.',
        ],
        [
          'About your saved progress',
          'Storage is local, not a cloud backup. Uninstalling the app or clearing its data can permanently remove progress. The app retains up to 300 recent sessions; daily totals are kept separately.',
        ],
      ].map(([title, body]) => (
        <View key={title} style={s.paragraph}>
          <Text style={s.rowTitle}>{title}</Text>
          <Text style={s.privacyBody}>{body}</Text>
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: 22 },
  intention: {
    backgroundColor: colors.mint,
    padding: 22,
    borderRadius: 19,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  pattern: { position: 'absolute', left: -35, top: -35 },
  intentionTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.ink,
    textAlign: 'center',
  },
  intentionBody: {
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.muted,
  },
  section: {
    fontSize: 9,
    letterSpacing: 1.6,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: -12,
  },
  rows: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    minHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  rowBody: { flex: 1, gap: 5 },
  rowTitle: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  rowDescription: { fontSize: 10, lineHeight: 16, color: colors.muted },
  footer: { alignItems: 'center', gap: 7, marginVertical: 10 },
  wordmark: { fontFamily: fonts.display, fontSize: 26, color: colors.green },
  version: { fontSize: 10, color: colors.muted },
  paragraph: { gap: 10 },
  privacyBody: { fontSize: 13, lineHeight: 23, color: colors.muted },
});
