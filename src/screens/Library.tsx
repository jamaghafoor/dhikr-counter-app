import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '../components/Icon';
import { Button, EmptyState, Eyebrow } from '../components/UI';
import { AppState, DHIKRS, Dhikr } from '../state/model';
import { colors, fonts } from '../theme';

export function Library({
  state,
  onSelect,
  onAdd,
  onDelete,
}: {
  state: AppState;
  onSelect: (dhikr: Dhikr) => void;
  onAdd: () => void;
  onDelete: (dhikr: Dhikr) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'custom'>('all');
  const [query, setQuery] = useState('');
  const items = useMemo(
    () =>
      (filter === 'custom'
        ? state.customDhikrs
        : [...DHIKRS, ...state.customDhikrs]
      ).filter(d =>
        `${d.title} ${d.arabic} ${d.meaning}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
      ),
    [filter, query, state.customDhikrs],
  );
  return (
    <ScrollView
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={s.heading}>
        <Eyebrow>YOUR DHIKR COLLECTION</Eyebrow>
        {/* <Text accessibilityRole="header" style={s.title}>
          Your dhikr collection
        </Text> */}
        {/* <Text style={s.description}>
          A familiar remembrance. A fresh intention.
        </Text> */}
      </View>
      <View style={s.search}>
        <Icon name="search" size={18} color={colors.muted} />
        <TextInput
          accessibilityLabel="Search dhikr"
          placeholder="Find a dhikr…"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          style={s.searchInput}
          autoCorrect={false}
        />
        {!!query && (
          <Pressable
            onPress={() => setQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={10}
          >
            <Icon name="close" size={17} />
          </Pressable>
        )}
      </View>
      <View style={s.filters}>
        {(['all', 'custom'] as const).map(id => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: id === filter }}
            key={id}
            onPress={() => setFilter(id)}
            style={[s.filter, id === filter && s.filterSelected]}
          >
            <Text style={[s.filterText, id === filter && s.filterTextSelected]}>
              {id === 'all' ? 'All adhkar' : 'My own'}
            </Text>
            <View
              style={[s.badge, id === filter && { backgroundColor: '#DDE7DA' }]}
            >
              <Text style={s.badgeText}>
                {id === 'all'
                  ? DHIKRS.length + state.customDhikrs.length
                  : state.customDhikrs.length}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View style={s.items}>
        {items.map(dhikr => {
          const selected = state.selectedId === dhikr.id;
          return (
            <View key={dhikr.id} style={[s.item, selected && s.itemSelected]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Select ${dhikr.title}. ${dhikr.meaning}. Target ${dhikr.target}`}
                onPress={() => onSelect(dhikr)}
                style={s.selectArea}
              >
                <View style={s.itemTop}>
                  <Text style={s.arabic}>{dhikr.arabic}</Text>
                  <View style={[s.radio, selected && s.radioSelected]}>
                    {selected && (
                      <Icon name="check" size={12} color={colors.white} />
                    )}
                  </View>
                </View>
                <View style={s.itemBottom}>
                  <Text style={s.itemTitle}>{dhikr.title}</Text>
                  <Text style={s.target}>{dhikr.target} counts</Text>
                </View>
                <Text style={s.meaning}>{dhikr.meaning}</Text>
              </Pressable>
              {dhikr.custom && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${dhikr.title}`}
                  hitSlop={5}
                  onPress={() => onDelete(dhikr)}
                  style={s.deleteButton}
                >
                  <Text style={s.deleteText}>Remove</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
      {!items.length && (
        <EmptyState
          icon="book"
          title={query ? 'A little more searching' : 'Make it personal'}
          description={
            query
              ? 'Try another spelling, or add this dhikr to your own collection.'
              : 'Add a remembrance that is close to your heart. It stays here on your device.'
          }
        />
      )}
      <Button icon="plus" onPress={onAdd} secondary>
        Add your own dhikr
      </Button>
      <Text style={s.footnote}>Choose what speaks to your heart today.</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { paddingHorizontal: 25, paddingTop: 15, paddingBottom: 28, gap: 21 },
  heading: { gap: 8 },
  title: {
    fontFamily: fonts.display,
    fontSize: 29,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  description: { fontSize: 12, lineHeight: 20, color: colors.muted },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 15,
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    minHeight: 48,
    color: colors.ink,
    fontSize: 13,
  },
  filters: { flexDirection: 'row', gap: 10, marginTop: -4 },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  filterSelected: { backgroundColor: colors.mint },
  filterText: { fontSize: 12, color: colors.muted },
  filterTextSelected: { color: colors.green, fontWeight: '600' },
  badge: {
    backgroundColor: colors.soft,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, color: colors.green },
  items: { gap: 11, marginTop: -7 },
  item: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
  },
  itemSelected: { borderColor: '#9CAF99', backgroundColor: '#F0F4EC' },
  selectArea: { padding: 17, gap: 7 },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  arabic: {
    fontFamily: fonts.arabic,
    fontSize: 25,
    lineHeight: 38,
    color: colors.green,
    textAlign: 'left',
    flex: 1,
  },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C4CEBE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { backgroundColor: colors.green, borderColor: colors.green },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    flexShrink: 1,
  },
  target: { fontSize: 10, color: colors.muted },
  meaning: { fontSize: 11, lineHeight: 17, color: colors.muted },
  deleteButton: {
    paddingHorizontal: 17,
    paddingBottom: 14,
    alignSelf: 'flex-end',
  },
  deleteText: { fontSize: 11, color: colors.danger },
  footnote: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});
