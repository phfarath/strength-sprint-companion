import React, { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

function hexToHsl(hex: string): string | null {
  const m = hex.replace('#', '');
  if (!(m.length === 3 || m.length === 6)) return null;
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  const r = parseInt(full.substring(0, 2), 16) / 255;
  const g = parseInt(full.substring(2, 4), 16) / 255;
  const b = parseInt(full.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  const hh = Math.round(h * 360);
  const ss = Math.round(s * 100);
  const ll = Math.round(l * 100);
  return `${hh} ${ss}% ${ll}%`;
}

const SettingsApplier: React.FC = () => {
  const { settings } = useAppContext();

  useEffect(() => {
    const root = document.documentElement;

    // Theme: light | dark | system
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveDark = settings.appearance.theme === 'system' ? prefersDark : settings.appearance.theme === 'dark';
    root.classList.toggle('dark', effectiveDark);

    // Primary color → Tailwind CSS vars (expects HSL)
    const hsl = hexToHsl(settings.appearance.primaryColor);
    if (hsl) {
      root.style.setProperty('--primary', hsl);
      root.style.setProperty('--ring', hsl);
      root.style.setProperty('--sidebar-primary', hsl);
    }

    // Density and language flags (for future use)
    root.setAttribute('data-density', settings.appearance.density);
    root.setAttribute('lang', settings.appearance.language);

    // Accessibility
    root.style.setProperty('--font-size-multiplier', String(settings.a11y.fontScale || 1));
    root.classList.toggle('high-contrast', !!settings.a11y.highContrast);
    root.classList.toggle('reduced-motion', !!settings.a11y.reducedMotion);
    root.classList.toggle('large-cursor', !!settings.a11y.largeCursor);
    // screenReader flag is stored for features that need it explicitly

    // Quiet hours marker for potential use
    if (settings.notifications.quietHours) {
      root.setAttribute('data-quiet-hours', `${settings.notifications.quietHours.start}-${settings.notifications.quietHours.end}`);
    } else {
      root.removeAttribute('data-quiet-hours');
    }
  }, [settings]);

  return null;
};

export default SettingsApplier;

