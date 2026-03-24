import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Color = 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'violet';

interface BadgeProps {
  children: React.ReactNode;
  color?: Color;
}

const PALETTE: Record<Color, { bg: string; text: string }> = {
  blue:   { bg: '#dbeafe', text: '#1e40af' },
  green:  { bg: '#dcfce7', text: '#166534' },
  amber:  { bg: '#fef9c3', text: '#854d0e' },
  red:    { bg: '#fee2e2', text: '#991b1b' },
  gray:   { bg: '#f3f4f6', text: '#374151' },
  violet: { bg: '#ede9fe', text: '#5b21b6' },
};

export function Badge({ children, color = 'blue' }: BadgeProps) {
  const p = PALETTE[color];
  return (
    <View style={[styles.base, { backgroundColor: p.bg }]}>
      <Text style={[styles.text, { color: p.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
});
