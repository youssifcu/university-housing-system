/**
 * ====================================================================
 * MODERN UI/UX GUIDE FOR REACT NATIVE EXPO APP
 * ====================================================================
 * 
 * This guide covers best practices and implementation for:
 * - Design System & Theming
 * - Reusable Components
 * - Typography
 * - Spacing & Layout
 * - Splash Screens
 * - Custom Fonts
 * - Icons
 * ====================================================================
 */

// ====================================================================
// 1. DESIGN SYSTEM & THEME
// ====================================================================

/**
 * Create a centralized theme file for consistency across your app.
 * Create: mobile/constants/appTheme.ts
 */

type AppTheme = {
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textLight: string;
    textLighter: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  typography: {
    headingLarge: { fontSize: number; fontWeight: string };
    headingMedium: { fontSize: number; fontWeight: string };
    body: { fontSize: number; fontWeight: string };
    label: { fontSize: number; fontWeight: string };
    small: { fontSize: number; fontWeight: string };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
};

export const appTheme: AppTheme = {
  colors: {
    primary: '#6366F1',        // Indigo - Modern, professional
    primaryDark: '#4F46E5',    // Darker indigo
    secondary: '#EC4899',      // Pink - Accent color
    background: '#FFFFFF',     // Clean white
    surface: '#F8FAFC',        // Soft gray
    text: '#1E293B',           // Dark slate
    textLight: '#64748B',      // Medium slate
    textLighter: '#CBD5E1',    // Light slate
    border: '#E2E8F0',         // Border color
    error: '#EF4444',          // Red for errors
    success: '#10B981',        // Green for success
    warning: '#F59E0B',        // Amber for warnings
  },
  typography: {
    headingLarge: { fontSize: 32, fontWeight: '700' },
    headingMedium: { fontSize: 24, fontWeight: '700' },
    body: { fontSize: 16, fontWeight: '400' },
    label: { fontSize: 14, fontWeight: '600' },
    small: { fontSize: 12, fontWeight: '400' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
  },
};

// ====================================================================
// 2. REUSABLE BUTTON COMPONENT
// ====================================================================

/**
 * Create: mobile/components/ui/Button.tsx
 * 
 * This is a flexible button component that can be used everywhere
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { appTheme } from '@/constants/appTheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  onPress: () => void;
  text: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  onPress,
  text,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = {
      borderRadius: appTheme.borderRadius.medium,
      justifyContent: 'center',
      alignItems: 'center',
      ...style,
    };

    // Size variants
    const sizeStyles = {
      small: { height: 40, paddingHorizontal: appTheme.spacing.md },
      medium: { height: 56, paddingHorizontal: appTheme.spacing.lg },
      large: { height: 64, paddingHorizontal: appTheme.spacing.xl },
    };

    // Color variants
    const colorStyles = {
      primary: {
        backgroundColor: appTheme.colors.primary,
        shadowColor: appTheme.colors.primary,
        elevation: 6,
      },
      secondary: {
        backgroundColor: appTheme.colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: appTheme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...colorStyles[variant],
      opacity: disabled || loading ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const colorMap = {
      primary: appTheme.colors.background,
      secondary: appTheme.colors.background,
      outline: appTheme.colors.primary,
      ghost: appTheme.colors.primary,
    };

    const sizeMap = {
      small: 14,
      medium: 16,
      large: 18,
    };

    return {
      color: colorMap[variant],
      fontSize: sizeMap[size],
      fontWeight: '700',
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextStyle().color} size="small" />
      ) : (
        <Text style={getTextStyle()}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;

// ====================================================================
// 3. REUSABLE INPUT COMPONENT
// ====================================================================

/**
 * Create: mobile/components/ui/Input.tsx
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appTheme } from '@/constants/appTheme';

interface InputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: string;
  isPassword?: boolean;
  error?: string;
  disabled?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  style?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  isPassword = false,
  error,
  disabled = false,
  keyboardType = 'default',
  style,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={style}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: focused ? appTheme.colors.primary : appTheme.colors.text,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.container,
          focused && styles.containerFocused,
          error && styles.containerError,
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={
              focused ? appTheme.colors.primary : appTheme.colors.textLight
            }
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={appTheme.colors.textLighter}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          editable={!disabled}
          keyboardType={keyboardType}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={appTheme.colors.textLight}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: appTheme.spacing.sm,
    marginLeft: appTheme.spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    height: 56,
    borderRadius: appTheme.borderRadius.medium,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
  },
  containerFocused: {
    borderColor: appTheme.colors.primary,
    backgroundColor: appTheme.colors.background,
  },
  containerError: {
    borderColor: appTheme.colors.error,
  },
  icon: {
    marginRight: appTheme.spacing.md,
  },
  input: {
    flex: 1,
    color: appTheme.colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  error: {
    color: appTheme.colors.error,
    fontSize: 12,
    marginTop: appTheme.spacing.xs,
    marginLeft: appTheme.spacing.sm,
  },
});

export default Input;

// ====================================================================
// 4. SPLASH SCREEN SETUP
// ====================================================================

/**
 * Expo comes with a built-in splash screen.
 * 
 * To customize:
 * 1. Update app.json with your splash screen config:
 */

{
  "splash": {
    "image": "./assets/images/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#6366F1"  // Your brand color
  }
}

/**
 * 2. In your app/_layout.tsx, hide the splash screen:
 */

import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Hide splash screen once your app is ready
  React.useEffect(() => {
    async function prepare() {
      try {
        // Add any async initialization here (fonts, data, etc.)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  return (
    // Your layout here
  );
}

// ====================================================================
// 5. CUSTOM FONTS SETUP
// ====================================================================

/**
 * To add custom fonts (e.g., Inter, Poppins):
 * 
 * 1. Download fonts from Google Fonts (https://fonts.google.com)
 *    Example: Inter-Bold.ttf, Inter-Regular.ttf
 * 
 * 2. Create folder: mobile/assets/fonts/
 * 3. Add your font files there
 * 
 * 4. Update app.json:
 */

{
  "plugins": [
    [
      "expo-font",
      {
        "fonts": [
          "./assets/fonts/Inter-Regular.ttf",
          "./assets/fonts/Inter-Bold.ttf",
          "./assets/fonts/Inter-SemiBold.ttf"
        ]
      }
    ]
  ]
}

/**
 * 5. Load fonts in your app/_layout.tsx:
 */

import * as Font from 'expo-font';

export default function RootLayout() {
  React.useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
          'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
        });
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    }
    loadFonts();
  }, []);

  return (
    // Your layout
  );
}

/**
 * 6. Use custom fonts in StyleSheet:
 */

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
});

// ====================================================================
// 6. ICON GUIDANCE
// ====================================================================

/**
 * You already have @expo/vector-icons installed!
 * 
 * Available icon libraries:
 * - MaterialCommunityIcons (most comprehensive - 6000+ icons)
 * - FontAwesome
 * - Ionicons
 * - AntDesign
 * - Feather
 * 
 * Usage:
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';

// In your JSX:
<MaterialCommunityIcons name="email-outline" size={24} color="#6366F1" />

// Find icons at: https://pictogrammers.com/library/mdi/

// ====================================================================
// 7. SPACING & LAYOUT BEST PRACTICES
// ====================================================================

/**
 * Use consistent spacing for visual harmony:
 * 
 * xs:  4px  - Tight spacing, gaps between elements
 * sm:  8px  - Small padding/margin
 * md:  16px - Standard padding/margin
 * lg:  24px - Large padding/margin
 * xl:  32px - Extra large padding/margin
 * 
 * Example:
 */

const styles = StyleSheet.create({
  container: {
    padding: appTheme.spacing.lg,  // 24px
    marginBottom: appTheme.spacing.md,  // 16px
  },
  input: {
    marginBottom: appTheme.spacing.md,  // 16px
  },
  button: {
    marginTop: appTheme.spacing.lg,  // 24px
  },
});

// ====================================================================
// 8. BEST PRACTICES CHECKLIST
// ====================================================================

/**
 * ✅ DO:
 * - Use a centralized theme for colors
 * - Create reusable components (Button, Input, Card, etc.)
 * - Use consistent spacing values
 * - Add shadow/elevation for depth (iOS/Android)
 * - Test on both iOS and Android simulators
 * - Use proper typography hierarchy
 * - Add loading states to buttons
 * - Show validation errors clearly
 * - Use Material Design 3 principles
 * - Ensure accessibility (WCAG 2.1 AA)
 * 
 * ❌ DON'T:
 * - Hardcode colors in components
 * - Mix different spacing values
 * - Use inconsistent typography sizes
 * - Forget to handle loading/error states
 * - Make buttons too small (min 48x48pt for touch)
 * - Use too many different fonts
 * - Ignore keyboard overlap (KeyboardAvoidingView)
 */

// ====================================================================
// 9. COLOR PSYCHOLOGY & BRAND GUIDELINES
// ====================================================================

/**
 * Current Brand Colors:
 * Primary: #6366F1 (Indigo)
 *   - Professional, trustworthy, calming
 *   - Perfect for educational apps
 *   - CTA buttons, links, highlights
 * 
 * Secondary: #EC4899 (Pink)
 *   - Friendly, energetic accent
 *   - Use sparingly for highlights/badges
 * 
 * Success: #10B981 (Green)
 *   - Confirmations, success messages
 * 
 * Error: #EF4444 (Red)
 *   - Errors, delete actions, warnings
 * 
 * Text: #1E293B (Dark Slate)
 *   - Main text, high contrast
 *   - 16-18px for body text
 *   - 24-32px for headings
 */

// ====================================================================
// 10. GETTING STARTED CHECKLIST
// ====================================================================

/**
 * To implement modern UI in your app:
 * 
 * [ ] 1. Create mobile/constants/appTheme.ts with color palette
 * [ ] 2. Create mobile/components/ui/Button.tsx reusable button
 * [ ] 3. Create mobile/components/ui/Input.tsx reusable input
 * [ ] 4. Update your screens to use these components
 * [ ] 5. Add custom fonts to assets/fonts/
 * [ ] 6. Update app.json with splash screen config
 * [ ] 7. Create a global theme context for darkMode support (optional)
 * [ ] 8. Test on iOS and Android simulators
 * [ ] 9. Use provided ModernLoginScreen.tsx and ModernRegisterScreen.tsx as templates
 * [ ] 10. Export reusable components from components/ui/index.ts
 */
