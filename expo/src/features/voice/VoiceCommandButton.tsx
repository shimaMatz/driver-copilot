import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  isListening: boolean;
  onPress: () => void;
  error?: string | null;
}

export function VoiceCommandButton({ isListening, onPress, error }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.btn, isListening && styles.btnActive]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={isListening ? '音声認識中。もう一度押すと停止' : '音声コマンドを話す'}
      >
        <Text style={styles.icon}>{isListening ? '🎙️' : '🎤'}</Text>
        <Text style={[styles.label, isListening && styles.labelActive]}>
          {isListening ? '聞いています…' : '音声コマンド'}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && (
        <Text style={styles.hint}>
          「出発」「停止」「休憩」「運転」または行き先を話してください
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingBottom: 6 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#374151',
  },
  btnActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#3b82f6',
  },
  icon: { fontSize: 24 },
  label: { color: '#e5e7eb', fontSize: 16, fontWeight: '800' },
  labelActive: { color: '#93c5fd' },
  hint: { color: '#4b5563', fontSize: 11, textAlign: 'center', marginTop: 6 },
  error: { color: '#fca5a5', fontSize: 12, textAlign: 'center', marginTop: 4 },
});
