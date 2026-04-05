export const theme = {
  colors: {
    background: '#0F0F13',
    surface: '#1C1C22',
    primary: '#6C48FA',
    primaryLight: '#8B6BFF',
    text: '#FFFFFF',
    textSecondary: '#A1A1A8',
    border: '#2C2C35',
    danger: '#FF4D4D',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' as const, color: '#FFFFFF' },
    h2: { fontSize: 24, fontWeight: 'bold' as const, color: '#FFFFFF' },
    h3: { fontSize: 18, fontWeight: '700' as const, color: '#FFFFFF' },
    body: { fontSize: 16, color: '#A1A1A8' },
    caption: { fontSize: 14, color: '#888891' },
  }
};
