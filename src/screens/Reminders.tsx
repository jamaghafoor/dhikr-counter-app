import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Icon } from '../components/Icon';
import { Button } from '../components/UI';
import { DHIKR_REMINDERS, reminderTime } from '../constants/reminders';
import { notificationsAllowed, useReminders } from '../services/reminders';
import { colors, fonts } from '../theme';

export function Reminders() {
  const reminders = useReminders();
  const { settings, busy, error, notice } = reminders;
  const allowed = notificationsAllowed(settings);
  const selected = settings?.enabledIds || [];
  const blocked = settings?.authorizationStatus === 'denied';
  return (
    <View style={s.root}>
      <View style={s.intro}>
        <View style={s.introIcon}>
          <Icon name="bell" size={25} color={colors.gold} />
        </View>
        <Text style={s.title}>A gentle nudge to remember.</Text>
        <Text style={s.description}>
          Four peaceful pauses, every day. Reminders follow your phone’s local
          time and work offline.
        </Text>
      </View>
      {!settings && busy && (
        <ActivityIndicator
          color={colors.green}
          accessibilityLabel="Loading reminder settings"
        />
      )}
      <View style={s.master}>
        <View style={s.masterText}>
          <Text style={s.masterTitle}>Daily dhikr reminders</Text>
          <Text style={s.masterDescription}>
            {selected.length
              ? `${selected.length} of 4 reminders selected`
              : 'Turn on all four, or choose below'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Daily dhikr reminders"
          value={selected.length > 0}
          disabled={busy || !settings}
          onValueChange={reminders.setAll}
          trackColor={{ false: '#D7DCD1', true: colors.green }}
          thumbColor={colors.white}
          ios_backgroundColor="#D7DCD1"
        />
      </View>
      {blocked && (
        <View style={s.notice}>
          <Text style={s.noticeTitle}>
            Notifications are off in your phone settings
          </Text>
          <Text style={s.noticeBody}>
            Your choices are saved. Allow notifications to receive your dhikr
            reminders.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open notification settings"
            onPress={() => reminders.openSettings()}
            disabled={busy}
            style={s.noticeAction}
          >
            <Text style={s.noticeLink}>Open notification settings</Text>
            <Icon name="chevron" size={14} />
          </Pressable>
        </View>
      )}
      {Platform.OS === 'android' &&
        selected.length > 0 &&
        allowed &&
        settings &&
        !settings.precise && (
          <View style={s.notice}>
            <Text style={s.noticeTitle}>Allow precise reminder timing</Text>
            <Text style={s.noticeBody}>
              Your reminders are scheduled. Allow “Alarms & reminders” so
              Android can deliver them at the selected times instead of delaying
              them.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Allow precise reminder timing"
              onPress={() => reminders.openSettings(true)}
              disabled={busy}
              style={s.noticeAction}
            >
              <Text style={s.noticeLink}>Allow precise timing</Text>
              <Icon name="chevron" size={14} />
            </Pressable>
          </View>
        )}
      <View style={s.list}>
        {DHIKR_REMINDERS.map((reminder, index) => (
          <View
            key={reminder.id}
            style={[
              s.reminder,
              index === DHIKR_REMINDERS.length - 1 && s.lastReminder,
            ]}
          >
            <View style={s.reminderHeader}>
              <View style={s.timeRow}>
                <View style={s.timeIcon}>
                  <Icon
                    name={index < 2 ? 'sun' : index === 2 ? 'moon' : 'star'}
                    size={17}
                    color={colors.gold}
                  />
                </View>
                <View>
                  <Text style={s.reminderLabel}>
                    {['Morning', 'Afternoon', 'Evening', 'Night'][index]}
                  </Text>
                  <Text style={s.time}>
                    {reminderTime(reminder.hour, reminder.minute)}
                  </Text>
                </View>
              </View>
              <Switch
                accessibilityLabel={`${
                  ['Morning', 'Afternoon', 'Evening', 'Night'][index]
                } dhikr reminder at ${reminderTime(
                  reminder.hour,
                  reminder.minute,
                )}`}
                value={selected.includes(reminder.id)}
                disabled={busy || !settings}
                onValueChange={value => reminders.setOne(reminder.id, value)}
                trackColor={{ false: '#D7DCD1', true: colors.green }}
                thumbColor={colors.white}
                ios_backgroundColor="#D7DCD1"
              />
            </View>
            <Text style={s.reminderTitle}>{reminder.title}</Text>
            <Text style={s.reminderBody}>{reminder.body}</Text>
          </View>
        ))}
      </View>
      {!!error && (
        <View style={s.errorBox}>
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
          {!settings && (
            <Button secondary onPress={reminders.refresh}>
              Try again
            </Button>
          )}
        </View>
      )}
      {!!notice && (
        <Text accessibilityRole="alert" style={s.success}>
          {notice}
        </Text>
      )}
      <Button
        secondary
        icon="bell"
        disabled={busy || !allowed}
        onPress={reminders.sendTest}
      >
        Send a test reminder
      </Button>
      <View style={s.privacy}>
        <Icon name="shield" size={14} color={colors.muted} />
        <Text style={s.privacyText}>
          Scheduled on your device. No internet needed.
        </Text>
      </View>
      <Text style={s.footnote}>
        Your phone’s Focus, Do Not Disturb, and notification settings control
        how alerts appear.
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: 19 },
  intro: { alignItems: 'center', gap: 11, paddingBottom: 2 },
  introIcon: {
    width: 55,
    height: 55,
    borderRadius: 19,
    backgroundColor: colors.paleGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 290,
  },
  master: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  masterText: { flex: 1, gap: 6 },
  masterTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  masterDescription: { fontSize: 10, lineHeight: 16, color: colors.muted },
  list: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  reminder: {
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 18,
  },
  lastReminder: { borderBottomWidth: 0 },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 3,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  timeIcon: {
    height: 35,
    width: 35,
    borderRadius: 12,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderLabel: { fontSize: 10, color: colors.muted, marginBottom: 4 },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  reminderTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    lineHeight: 20,
  },
  reminderBody: { fontSize: 11, lineHeight: 19, color: colors.muted },
  notice: {
    backgroundColor: colors.paleGold,
    borderRadius: 15,
    padding: 16,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#755D30',
    lineHeight: 19,
  },
  noticeBody: { fontSize: 11, lineHeight: 19, color: '#81714F' },
  noticeAction: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    minHeight: 36,
  },
  noticeLink: { fontSize: 11, fontWeight: '600', color: colors.green },
  errorBox: { gap: 12 },
  error: { fontSize: 12, lineHeight: 20, color: colors.danger },
  success: { fontSize: 12, lineHeight: 20, color: colors.green },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  privacyText: { fontSize: 10, color: colors.muted },
  footnote: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 17,
    textAlign: 'center',
  },
});
