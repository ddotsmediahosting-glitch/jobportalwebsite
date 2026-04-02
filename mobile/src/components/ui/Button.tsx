import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { COLORS } from '../../constants';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : COLORS.brand[600]}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.55 },

  // Sizes
  size_sm: { paddingVertical: 8, paddingHorizontal: 14 },
  size_md: { paddingVertical: 12, paddingHorizontal: 20 },
  size_lg: { paddingVertical: 15, paddingHorizontal: 24 },

  // Variants
  variant_primary:  { backgroundColor: COLORS.brand[600] },
  variant_outline:  { backgroundColor: 'transparent', borderColor: COLORS.brand[600] },
  variant_ghost:    { backgroundColor: 'transparent', borderColor: 'transparent' },
  variant_danger:   { backgroundColor: '#ef4444' },

  // Text
  text: { fontWeight: '600' },
  text_primary: { color: '#fff' },
  text_outline: { color: COLORS.brand[600] },
  text_ghost:   { color: COLORS.brand[600] },
  text_danger:  { color: '#fff' },

  // Text sizes
  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 16 },
});
