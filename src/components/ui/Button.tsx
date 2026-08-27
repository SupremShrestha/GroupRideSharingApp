import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';

interface ButtonProps extends React.TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const baseStyles: ViewStyle = {
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const variantStyles: Record<ButtonProps['variant'], ViewStyle> = {
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#5856D6',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: '#FF3B30',
  },
};

const sizeStyles: Record<ButtonProps['size'], ViewStyle> = {
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  lg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    minHeight: 56,
  },
};

const textStyles: Record<ButtonProps['variant'], TextStyle> = {
  primary: { color: '#fff', fontWeight: '600' },
  secondary: { color: '#fff', fontWeight: '600' },
  outline: { color: '#007AFF', fontWeight: '600' },
  ghost: { color: '#007AFF', fontWeight: '500' },
  danger: { color: '#fff', fontWeight: '600' },
};

const sizeTextStyles: Record<ButtonProps['size'], TextStyle> = {
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
};

export const Button = React.forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      title,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      style,
      children: _children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <TouchableOpacity
        ref={ref}
        style={[
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          { opacity: isDisabled ? 0.6 : 1, width: fullWidth ? '100%' : 'auto' },
          style,
        ]}
        disabled={isDisabled}
        activeOpacity={0.8}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? '#007AFF' : '#fff'}
          />
        ) : (
          <>
            {leftIcon}
            <Text style={[textStyles[variant], sizeTextStyles[size]]}>{title}</Text>
            {rightIcon}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';
