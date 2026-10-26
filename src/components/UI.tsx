import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { Icon, IconName } from './Icon';

export function Button({
  children,
  onPress,
  secondary,
  disabled,
  icon,
  style,
  testID,
}: {
  children: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityLabel={children}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        secondary && ui.secondaryButton,
        disabled && { opacity: 0.45 },
        pressed && { opacity: 0.78, transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          color={secondary ? colors.green : colors.white}
          size={19}
        />
      )}
      <Text style={[ui.buttonText, secondary && { color: colors.green }]}>
        {children}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  name,
  onPress,
  label,
  disabled,
  light = false,
}: {
  name: IconName;
  onPress: () => void;
  label: string;
  disabled?: boolean;
  light?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        ui.iconButton,
        light && { backgroundColor: colors.white },
        disabled && { opacity: 0.3 },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Icon name={name} size={21} />
    </Pressable>
  );
}
export function BrandHeader({ onSettings }: { onSettings: () => void }) {
  return (
    <View style={ui.header}>
      <View style={ui.brand}>
        <View style={ui.brandMark}>
          <Icon name="beads" size={23} color={colors.paper} />
        </View>
        <Text style={ui.wordmark}>
          tasbeeh<Text style={{ color: colors.gold }}>.</Text>
        </Text>
      </View>
      <IconButton name="settings" onPress={onSettings} label="Open settings" />
    </View>
  );
}
export function Eyebrow({
  children,
  center = false,
}: {
  children: string;
  center?: boolean;
}) {
  return (
    <Text style={[ui.eyebrow, center && { textAlign: 'center' }]}>
      {children}
    </Text>
  );
}
export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: 'manual' | 'auto';
  onChange: (mode: 'manual' | 'auto') => void;
}) {
  return (
    <View style={ui.segment}>
      {(['manual', 'auto'] as const).map(value => (
        <Pressable
          key={value}
          onPress={() => onChange(value)}
          accessibilityRole="tab"
          accessibilityLabel={value === 'manual' ? 'Manual' : 'Auto count'}
          accessibilityState={{ selected: mode === value }}
          style={[ui.segmentItem, mode === value && ui.segmentActive]}
        >
          <Icon
            name={value === 'manual' ? 'hand' : 'auto'}
            size={17}
            color={mode === value ? colors.white : colors.muted}
          />
          <Text
            style={[ui.segmentText, mode === value && { color: colors.white }]}
          >
            {value === 'manual' ? 'Manual' : 'Auto count'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export type Tab = 'counter' | 'library' | 'journey';
export function Navigation({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <View style={ui.navigation}>
      {(
        [
          { id: 'counter', name: 'beads', title: 'Tasbeeh' },
          { id: 'library', name: 'book', title: 'Adhkar' },
          { id: 'journey', name: 'journey', title: 'My journey' },
        ] as const
      ).map(item => (
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel={item.title}
          accessibilityState={{ selected: item.id === tab }}
          onPress={() => onChange(item.id)}
          key={item.id}
          style={ui.navItem}
        >
          <View
            style={[
              ui.navIcon,
              item.id === tab && { backgroundColor: colors.mint },
            ]}
          >
            <Icon
              name={item.name}
              size={21}
              color={item.id === tab ? colors.green : colors.muted}
            />
          </View>
          <Text
            style={[
              ui.navText,
              item.id === tab && { color: colors.green, fontWeight: '700' },
            ]}
          >
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={ui.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[ui.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          <View style={ui.sheetHandle} />
          <View style={ui.sheetHeader}>
            <Text accessibilityRole="header" style={ui.sheetTitle}>
              {title}
            </Text>
            <IconButton name="close" label="Close dialog" onPress={onClose} />
          </View>
          {subtitle && <Text style={ui.sheetSubtitle}>{subtitle}</Text>}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={ui.sheetContent}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <View style={ui.empty}>
      <View style={ui.emptyIcon}>
        <Icon name={icon} size={32} />
      </View>
      <Text style={ui.emptyTitle}>{title}</Text>
      <Text style={ui.emptyDescription}>{description}</Text>
    </View>
  );
}
export const ui = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 17,
    paddingHorizontal: 22,
    paddingVertical: 14,
    backgroundColor: colors.green,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: { backgroundColor: colors.mint },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  header: {
    height: 56,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: {
    width: 32,
    height: 35,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    color: colors.muted,
  },
  segment: {
    backgroundColor: colors.soft,
    borderRadius: 15,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    marginVertical: 10,
  },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.green },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  navigation: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: colors.paper,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    minHeight: 54,
  },
  navIcon: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { fontSize: 10, color: colors.muted },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#102D2466',
  },
  sheet: {
    backgroundColor: colors.paper,
    maxHeight: '92%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 10,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  sheetHandle: {
    height: 4,
    width: 34,
    backgroundColor: '#D4DACF',
    alignSelf: 'center',
    borderRadius: 4,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: 27,
    color: colors.ink,
    flex: 1,
  },
  sheetSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    marginTop: 4,
  },
  sheetContent: {
    paddingTop: 24,
    paddingBottom: Platform.OS === 'android' ? 8 : 0,
    gap: 16,
  },
  empty: {
    paddingVertical: 35,
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 12,
  },
  emptyIcon: {
    height: 76,
    width: 76,
    borderRadius: 38,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 23,
    color: colors.ink,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 23,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 270,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: colors.ink,
    fontSize: 15,
    minHeight: 52,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 8,
  },
});
