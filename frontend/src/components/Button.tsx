import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = ({ onPress, title, style, textStyle, variant = 'primary' }: ButtonProps) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      style={[
        styles.button, 
        isPrimary && styles.primary,
        isOutline && styles.outline,
        style
      ]}
    >
      <Text style={[
        styles.text, 
        isOutline && { color: theme.colors.primaryLight },
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  outline: {
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    backgroundColor: 'transparent',
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
