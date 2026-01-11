// Material Design 3 Color Palette Generator
// In a real app we might use @material/material-color-utilities
// For now, we define our Railway Themes manually

export const themes = {
  'high-speed': {
    name: '高铁时代',
    colors: {
      primary: '#E60012', // CR Red (Fuxing)
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFDAD6',
      onPrimaryContainer: '#410002',
      secondary: '#765652',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#FFDDAE', // Warm Gold accent
      surface: '#F8FDFF', // Very light cool grey
      surfaceVariant: '#F2F2F2',
      background: '#FFFFFF',
      outline: '#857371',
    },
    bgGradient: 'linear-gradient(135deg, #F8FDFF 0%, #F0F7FF 100%)',
    logoColor: '#E60012'
  },
  'iron-spirit': {
    name: '铁轨坚守',
    colors: {
      primary: '#003366', // Railway Blue
      onPrimary: '#FFFFFF',
      primaryContainer: '#D7E2FF',
      onPrimaryContainer: '#001A41',
      secondary: '#565E71',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#DAE2F9',
      surface: '#FDFBFF',
      surfaceVariant: '#E0E2EC',
      background: '#FDFBFF',
      outline: '#74777F',
    },
    bgGradient: 'linear-gradient(135deg, #FDFBFF 0%, #EDF2FA 100%)',
    logoColor: '#003366'
  },
  'history': {
    name: '历史长河',
    colors: {
      primary: '#7C5800', // Bronze/Brass
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFDEA5',
      onPrimaryContainer: '#271900',
      secondary: '#6D5C3F',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#F7DFBB',
      surface: '#FFF8F1', // Paper-like
      surfaceVariant: '#EFE0CF',
      background: '#FFF8F1',
      outline: '#817567',
    },
    bgGradient: 'linear-gradient(135deg, #FFF8F1 0%, #F5EBD0 100%)', // Old paper feel
    logoColor: '#7C5800'
  }
};

export const applyTheme = (themeName) => {
  const theme = themes[themeName] || themes['high-speed'];
  const root = document.documentElement;
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    // We map these to CSS variables that Tailwind can use if we configure it right,
    // or just use them directly in style props.
    // For Tailwind config compatibility, we might need to rely on style attributes or a wrapper.
    root.style.setProperty(`--color-${key}`, value);
  });
  
  root.style.setProperty('--bg-gradient', theme.bgGradient);
  
  // Save preference
  localStorage.setItem('appTheme', themeName);
  return theme;
};
