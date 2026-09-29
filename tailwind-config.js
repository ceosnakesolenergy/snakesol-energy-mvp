window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B0F19',
          card: 'rgba(255, 255, 255, 0.03)',
          accent: '#10B981',
          secondary: '#F59E0B',
          purple: '#9945FF'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  }
};
