/**
 * Syke World Hotel Theme Colors
 * 
 * This file contains all color definitions for both dark and light themes.
 * The current website uses a custom dark theme.
 */

export const darkTheme = {
  // Background Colors
  background: "#212326", // Main dark background
  backgroundSecondary: "#1a1c1e", // Slightly darker for sections
  
  // Text Colors
  textPrimary: "#ffffff", // White for main text
  textSecondary: "#d4d4d8", // stone-300
  textTertiary: "#a8a29e", // stone-400
  textMuted: "#78716c", // stone-500
  
  // Accent Colors (Amber/Orange)
  accent: "#d97706", // amber-600
  accentHover: "#b45309", // amber-700
  accentLight: "#f59e0b", // amber-500
  
  // Border Colors
  border: "rgba(255, 255, 255, 0.2)", // white/20
  borderLight: "rgba(255, 255, 255, 0.5)", // white/50
  borderMedium: "rgba(255, 255, 255, 0.7)", // white/70
  borderDark: "rgba(120, 113, 108, 0.5)", // stone-700/50
  
  // Card/Overlay Colors
  cardBackground: "rgba(255, 255, 255, 0.05)", // bg-white/5
  cardBackgroundHover: "rgba(255, 255, 255, 0.1)", // bg-white/10
  overlayDark: "rgba(0, 0, 0, 0.7)", // bg-black/70
  
  // Decorative Elements
  decorativeLine: "rgba(255, 255, 255, 0.5)", // white/50 for decorative lines
  labelText: "rgba(255, 255, 255, 0.7)", // white/70 for labels
  
  // Form Elements
  inputBorder: "rgba(156, 163, 175, 0.5)", // gray-400/50
  inputFocus: "#d97706", // amber-600
  placeholder: "#a8a29e", // stone-400
};

export const lightTheme = {
  // Background Colors
  background: "#fafafa", // Very light gray/off-white
  backgroundSecondary: "#ffffff", // Pure white for sections
  
  // Text Colors
  textPrimary: "#1a1c1e", // Dark gray for main text (inverse of dark bg)
  textSecondary: "#525252", // gray-600
  textTertiary: "#737373", // gray-500
  textMuted: "#a3a3a3", // gray-400
  
  // Accent Colors (Amber/Orange) - same as dark
  accent: "#d97706", // amber-600
  accentHover: "#b45309", // amber-700
  accentLight: "#f59e0b", // amber-500
  
  // Border Colors
  border: "rgba(0, 0, 0, 0.1)", // black/10 (inverse of white/20)
  borderLight: "rgba(0, 0, 0, 0.2)", // black/20
  borderMedium: "rgba(0, 0, 0, 0.3)", // black/30
  borderDark: "rgba(0, 0, 0, 0.4)", // black/40
  
  // Card/Overlay Colors
  cardBackground: "rgba(0, 0, 0, 0.02)", // bg-black/2 (subtle shadow effect)
  cardBackgroundHover: "rgba(0, 0, 0, 0.05)", // bg-black/5
  overlayDark: "rgba(255, 255, 255, 0.9)", // white overlay for contrast
  
  // Decorative Elements
  decorativeLine: "rgba(0, 0, 0, 0.2)", // black/20 for decorative lines
  labelText: "rgba(0, 0, 0, 0.6)", // black/60 for labels
  
  // Form Elements
  inputBorder: "rgba(0, 0, 0, 0.2)", // black/20
  inputFocus: "#d97706", // amber-600 (same as dark)
  placeholder: "#737373", // gray-500
};

/**
 * Get theme colors based on theme mode
 */
export function getThemeColors(theme: "dark" | "light" = "dark") {
  return theme === "dark" ? darkTheme : lightTheme;
}

/**
 * Convert theme colors to Tailwind CSS classes
 * This is a helper for dynamic theming
 */
export const themeToTailwind = {
  dark: {
    bg: "bg-[#212326]",
    bgSecondary: "bg-[#1a1c1e]",
    text: "text-white",
    textSecondary: "text-stone-300",
    textTertiary: "text-stone-400",
    textMuted: "text-stone-500",
    accent: "bg-amber-600",
    accentHover: "hover:bg-amber-700",
    border: "border-white/20",
    borderLight: "border-white/50",
    borderMedium: "border-white/70",
    card: "bg-white/5",
    cardHover: "hover:bg-white/10",
  },
  light: {
    bg: "bg-[#fafafa]",
    bgSecondary: "bg-white",
    text: "text-[#1a1c1e]",
    textSecondary: "text-gray-600",
    textTertiary: "text-gray-500",
    textMuted: "text-gray-400",
    accent: "bg-amber-600",
    accentHover: "hover:bg-amber-700",
    border: "border-black/10",
    borderLight: "border-black/20",
    borderMedium: "border-black/30",
    card: "bg-black/2",
    cardHover: "hover:bg-black/5",
  },
};
