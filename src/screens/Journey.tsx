import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Pattern } from '../components/Ornament';
import { EmptyState } from '../components/UI';
import { AppState, localDay } from '../state/model';
import { colors, fonts } from '../theme';

export function Journey({ state }: { state: AppState }) {
  const today = localDay();
  const total = Object.values(state.daily).reduce(
    (sum, value) => sum + value,
    0,
  );
  const activeDays = Object.values(state.daily).filter(
    value => value > 0,
  ).length;
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return { date, key: localDay(date) };
  });
  const maximum = Math.max(1, ...week.map(day => state.daily[day.key] || 0));
  return (
    <ScrollView
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
    >
      {/* <View style={s.heading}>
        <Eyebrow>ONE DAY, ONE INTENTION</Eyebrow>
        <Text accessibilityRole="header" style={s.title}>
          A quiet kind of progress.
        </Text>
        <Text style={s.description}>
          Every remembrance is a moment well spent.
        </Text>
      </View> */}
      <View style={s.hero}>
        <View style={s.pattern}>
          <Pattern color="#DFD2A9" />
        </View>
        <View style={s.heroLabel}>
          <Icon name="sun" size={17} color="#D2C18B" />
          <Text style={s.heroEyebrow}>TODAY’S REMEMBRANCE</Text>
        </View>
        <Text style={s.heroCount}>
          {(state.daily[today] || 0).toLocaleString()}
        </Text>
        <Text style={s.heroDescription}>moments of dhikr</Text>
        <View style={s.heroFooter}>
          <View style={s.heroDot} />
          <Text style={s.heroFooterText}>
            A little consistency goes a long way.
          </Text>
        </View>
      </View>
      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={s.statValue}>{total.toLocaleString()}</Text>
          <Text style={s.statLabel}>All-time counts</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statValue}>{activeDays}</Text>
          <Text style={s.statLabel}>Days of remembrance</Text>
        </View>
      </View>
      <View style={s.weekCard}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Your last seven days</Text>
          <Icon name="leaf" size={16} color={colors.gold} />
        </View>
        <View style={s.chart}>
          {week.map(day => {
            const value = state.daily[day.key] || 0;
            return (
              <View
                key={day.key}
                accessibilityLabel={`${day.date.toLocaleDateString(undefined, {
                  weekday: 'long',
                })}: ${value} counts`}
                style={s.day}
              >
                <Text style={s.dayValue}>{value || '·'}</Text>
                <View style={s.barTrack}>
                  <View
                    style={[
                      s.bar,
                      {
                        height: value ? Math.max(7, (value / maximum) * 76) : 4,
                        backgroundColor:
                          day.key === today
                            ? colors.gold
                            : value
                            ? '#94B099'
                            : colors.line,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    s.dayName,
                    day.key === today && {
                      color: colors.green,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {day.date.toLocaleDateString('en', { weekday: 'narrow' })}
                </Text>
                {day.key === today && <View style={s.todayDot} />}
              </View>
            );
          })}
        </View>
      </View>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Your recent sessions</Text>
        <Text style={s.onDevice}>ON THIS DEVICE</Text>
      </View>
      {state.sessions.length ? (
        <View style={s.sessions}>
          {state.sessions.slice(0, 30).map(session => (
            <View key={session.id} style={s.session}>
              <View style={s.sessionIcon}>
                <Icon name={session.completed ? 'check' : 'beads'} size={19} />
              </View>
              <View style={s.sessionInfo}>
                <Text style={s.sessionTitle}>{session.title}</Text>
                <Text style={s.sessionDate}>
                  {new Date(session.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  · {session.mode === 'auto' ? 'Auto' : 'Manual'} ·{' '}
                  {session.completed ? 'Completed' : 'Saved'}
                </Text>
              </View>
              <Text style={s.sessionCount}>
                {session.count}
                <Text style={s.sessionTarget}> / {session.target}</Text>
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="leaf"
          title="Your journey starts gently"
          description="Complete your first tasbeeh, and your moments of remembrance will find a home here."
        />
      )}
      <View style={s.privacy}>
        <Icon name="shield" size={14} color={colors.muted} />
        <Text style={s.privacyText}>
          Private by design. Saved on your device.
        </Text>
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { paddingHorizontal: 25, paddingTop: 15, paddingBottom: 25, gap: 23 },
  heading: { gap: 8 },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.9,
  },
  description: { fontSize: 12, lineHeight: 20, color: colors.muted },
  hero: {
    backgroundColor: colors.green,
    borderRadius: 23,
    padding: 24,
    overflow: 'hidden',
  },
  pattern: {
    position: 'absolute',
    right: -19,
    top: -15,
    transform: [{ scale: 1.9 }],
  },
  heroLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroEyebrow: {
    color: '#CBD9C5',
    letterSpacing: 1.5,
    fontSize: 9,
    fontWeight: '600',
  },
  heroCount: {
    fontFamily: fonts.display,
    color: colors.paper,
    fontSize: 65,
    letterSpacing: -2,
    marginTop: 15,
  },
  heroDescription: { color: '#B9CDB8', fontSize: 12, marginTop: 1 },
  heroFooter: {
    borderTopWidth: 1,
    borderTopColor: '#396655',
    paddingTop: 16,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  heroDot: { height: 4, width: 4, borderRadius: 2, backgroundColor: '#D1BD85' },
  heroFooterText: { fontSize: 10, color: '#C6D4BF' },
  stats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 6 },
  statValue: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  statLabel: { fontSize: 10, color: colors.muted },
  statDivider: { height: 35, width: 1, backgroundColor: colors.line },
  weekCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 19,
    padding: 19,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  sectionTitle: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 21,
  },
  day: { alignItems: 'center', gap: 8, flex: 1 },
  dayValue: { fontSize: 9, color: colors.muted },
  barTrack: { height: 76, width: 17, justifyContent: 'flex-end' },
  bar: { width: 17, borderRadius: 5 },
  dayName: { fontSize: 10, color: colors.muted },
  todayDot: {
    height: 3,
    width: 3,
    backgroundColor: colors.gold,
    borderRadius: 2,
    position: 'absolute',
    bottom: -8,
  },
  onDevice: { fontSize: 8, letterSpacing: 1.4, color: colors.muted },
  sessions: { gap: 0, marginTop: -9 },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sessionIcon: {
    height: 39,
    width: 39,
    borderRadius: 13,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: { flex: 1, gap: 5 },
  sessionTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },
  sessionDate: { fontSize: 10, color: colors.muted },
  sessionCount: { fontSize: 17, fontWeight: '600', color: colors.green },
  sessionTarget: { fontSize: 10, fontWeight: '400', color: colors.muted },
  privacy: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyText: { fontSize: 10, color: colors.muted },
});
