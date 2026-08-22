import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { COLORS } from '@/lib/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * App-level error boundary that catches unhandled JS errors
 * and provides a user-friendly recovery UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: COLORS.background,
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontFamily: 'Poppins_700Bold',
              color: COLORS.textPrimary,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Inter_400Regular',
              color: COLORS.textSecondary,
              marginBottom: 24,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            An unexpected error occurred. Please try again.
          </Text>
          <Pressable
            onPress={this.resetErrorBoundary}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
              minWidth: 160,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Inter_600SemiBold',
                color: '#fff',
              }}
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
