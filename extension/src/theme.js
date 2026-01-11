
export const themes = {
  'glass-morphism': {
    name: '毛玻璃 (Glass)',
    type: 'glass',
    properties: {
      '--radius-card': '16px',
      '--radius-btn': '8px',
      '--radius-input': '8px',
      '--spacing-unit': '1.5rem',
      '--glass-opacity': '0.8',
      '--glass-blur': '12px',
      '--border-width': '1px',
      '--border-opacity': '0.4',
      '--shadow-strength': '0.1'
    },
    colors: {
      primary: '#0066CC',
      background: '#FFFFFF',
    }
  },
  'modern-minimal': {
    name: '现代极简 (Modern)',
    type: 'flat',
    properties: {
      '--radius-card': '4px',
      '--radius-btn': '4px',
      '--radius-input': '4px',
      '--spacing-unit': '1rem',
      '--glass-opacity': '0.95',
      '--glass-blur': '0px',
      '--border-width': '0px',
      '--border-opacity': '0',
      '--shadow-strength': '0.05'
    },
    colors: {
      primary: '#111827',
      background: '#F3F4F6',
    }
  },
  'classic-system': {
    name: '经典系统 (Classic)',
    type: 'classic',
    properties: {
      '--radius-card': '6px',
      '--radius-btn': '4px',
      '--radius-input': '2px',
      '--spacing-unit': '0.75rem',
      '--glass-opacity': '1',
      '--glass-blur': '0px',
      '--border-width': '1px',
      '--border-opacity': '1',
      '--shadow-strength': '0.2'
    },
    colors: {
      primary: '#00509E',
      background: '#E0E0E0',
    }
  }
};

export const applyColorMode = (mode) => {
  const root = document.documentElement;
  const resolved = mode === 'night' ? 'night' : 'day';
  root.classList.toggle('dark', resolved === 'night');
  localStorage.setItem('colorMode', resolved);
  return resolved;
};

export const applyTheme = (themeId) => {
  const theme = themes[themeId] || themes['glass-morphism'];
  const root = document.documentElement;
  
  // Apply CSS Variables
  Object.entries(theme.properties).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // Save preference
  localStorage.setItem('appTheme', themeId);
  return theme;
};
