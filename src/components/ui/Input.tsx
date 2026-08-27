import React from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle } from 'react-native';

interface InputProps extends React.TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerStyle,
      style,
      secureTextEntry = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(!secureTextEntry);
    const isSecure = secureTextEntry && !showPassword;

    const handleTogglePassword = () => {
      if (secureTextEntry) {
        setShowPassword(!showPassword);
      }
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.inputWrapper}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              isSecure && styles.inputWithIconRight,
              error && styles.inputError,
              style,
            ]}
            secureTextEntry={isSecure}
            {...props}
          />
          {(rightIcon || secureTextEntry) && (
            <View style={styles.iconRight}>
              {secureTextEntry ? (
                <TouchableOpacity onPress={handleTogglePassword} style={styles.eyeButton}>
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              ) : (
                rightIcon
              )}
            </View>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
      </View>
    );
  }
);

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    gap: 6,
    width: '100%',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginLeft: 4,
  },
  eyeButton: {
    padding: 4,
  },
  eyeText: {
    fontSize: 18,
  },
  helperText: {
    color: '#8E8E93',
    fontSize: 12,
    marginLeft: 4,
  },
  iconLeft: {
    marginRight: 12,
  },
  iconRight: {
    marginLeft: 8,
  },
  input: {
    color: '#1C1C1E',
    flex: 1,
    fontSize: 16,
    height: 48,
    paddingVertical: 0,
  },
  inputError: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
  },
  inputWithIconRight: {
    paddingRight: 8,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  label: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '500',
  },
});

Input.displayName = 'Input';
