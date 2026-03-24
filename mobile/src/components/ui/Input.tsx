import React, { useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity,
  StyleSheet, TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function Input({
  label, error, leftIcon, rightIcon, onRightIconPress,
  style, secureTextEntry, ...props
}: InputProps) {
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, error ? styles.rowError : null]}>
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={COLORS.gray[400]} style={styles.leftIcon} />
        ) : null}
        <TextInput
          {...props}
          secureTextEntry={hidden}
          placeholderTextColor={COLORS.gray[400]}
          style={[styles.input, leftIcon && styles.inputWithLeft, style]}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} style={styles.rightBtn}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={COLORS.gray[400]}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightBtn}>
            <Ionicons name={rightIcon} size={18} color={COLORS.gray[400]} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
  },
  rowError: { borderColor: '#ef4444' },
  leftIcon: { paddingLeft: 12 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray[900],
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  inputWithLeft: { paddingLeft: 8 },
  rightBtn: { paddingHorizontal: 12 },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4 },
});
