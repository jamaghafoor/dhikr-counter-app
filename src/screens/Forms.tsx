import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, ui } from '../components/UI';
import { Dhikr, newId } from '../state/model';
import { colors } from '../theme';

export function CustomDhikrForm({
  onSave,
}: {
  onSave: (dhikr: Dhikr) => void;
}) {
  const [title, setTitle] = useState('');
  const [arabic, setArabic] = useState('');
  const [meaning, setMeaning] = useState('');
  const [target, setTarget] = useState('33');
  const [error, setError] = useState('');
  function save() {
    const goal = Number(target);
    if (!title.trim()) {
      setError('Give your dhikr a name.');
      return;
    }
    if (!/^\d{1,4}$/.test(target) || goal < 1) {
      setError('Choose a target from 1 to 9,999.');
      return;
    }
    onSave({
      id: `custom-${newId()}`,
      title: title.trim(),
      arabic: arabic.trim(),
      meaning: meaning.trim(),
      target: goal,
      custom: true,
    });
  }
  return (
    <View style={s.form}>
      <View>
        <Text style={ui.label}>Dhikr name</Text>
        <TextInput
          accessibilityLabel="Dhikr name"
          style={ui.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. My daily salawat"
          placeholderTextColor={colors.muted}
          maxLength={60}
        />
      </View>
      <View>
        <Text style={ui.label}>
          Arabic text <Text style={s.optional}>(optional)</Text>
        </Text>
        <TextInput
          accessibilityLabel="Arabic text, optional"
          style={[
            ui.input,
            { textAlign: 'right', writingDirection: 'rtl', fontSize: 23 },
          ]}
          value={arabic}
          onChangeText={setArabic}
          placeholder="اكتب الذكر هنا"
          placeholderTextColor={colors.muted}
          maxLength={250}
          multiline
        />
      </View>
      <View>
        <Text style={ui.label}>
          Meaning or a personal note <Text style={s.optional}>(optional)</Text>
        </Text>
        <TextInput
          accessibilityLabel="Meaning or personal note"
          style={ui.input}
          value={meaning}
          onChangeText={setMeaning}
          placeholder="A reminder for your heart"
          placeholderTextColor={colors.muted}
          maxLength={160}
        />
      </View>
      <View>
        <Text style={ui.label}>Target count</Text>
        <TextInput
          accessibilityLabel="Custom dhikr target count"
          style={ui.input}
          value={target}
          onChangeText={setTarget}
          keyboardType="number-pad"
          maxLength={4}
        />
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button onPress={save} icon="plus">
        Add to my collection
      </Button>
      <Text style={s.note}>
        Saved only on this device. You can remove it anytime.
      </Text>
    </View>
  );
}
export function TargetForm({
  initial,
  onSave,
}: {
  initial: number;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState(String(initial));
  const valid = /^\d{1,4}$/.test(value) && Number(value) >= 1;
  return (
    <View style={s.form}>
      <Text style={ui.label}>How many moments of remembrance?</Text>
      <TextInput
        accessibilityLabel="Custom target"
        style={[ui.input, s.target]}
        value={value}
        onChangeText={setValue}
        keyboardType="number-pad"
        maxLength={4}
        selectTextOnFocus
      />
      <Text style={s.note}>
        Choose any number from 1 to 9,999.{'\n'}Your current progress will be
        saved as a session.
      </Text>
      <Button disabled={!valid} onPress={() => onSave(Number(value))}>
        Set my intention
      </Button>
    </View>
  );
}
const s = StyleSheet.create({
  form: { gap: 18 },
  optional: { fontWeight: '400', color: colors.muted, fontSize: 11 },
  error: { fontSize: 12, color: colors.danger, lineHeight: 18 },
  note: {
    fontSize: 11,
    lineHeight: 19,
    color: colors.muted,
    textAlign: 'center',
  },
  target: { fontSize: 36, textAlign: 'center', paddingVertical: 23 },
});
