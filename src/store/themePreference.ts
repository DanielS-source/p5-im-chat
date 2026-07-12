export interface ThemePreference {
  accentColor: string;
  noir: boolean;
}

const STORAGE_KEY = 'phantom-chat:theme';
export const DEFAULT_ACCENT_COLOR = '#d40015';

export function loadThemePreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accentColor: DEFAULT_ACCENT_COLOR, noir: false };
    const parsed = JSON.parse(raw);
    return {
      accentColor: typeof parsed.accentColor === 'string' ? parsed.accentColor : DEFAULT_ACCENT_COLOR,
      noir: Boolean(parsed.noir),
    };
  } catch {
    return { accentColor: DEFAULT_ACCENT_COLOR, noir: false };
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
}

// Scales a #rrggbb color's channels by `factor` (e.g. 0.5 to darken,
// 1.5+ to lighten), clamped to a valid byte range — used to derive
// --main-dark/--main-light from whatever accent color is active, so
// every preset (and any future custom color) gets consistent lighter/
// darker companions instead of needing a hand-picked shade per preset.
export function adjustBrightness(hex: string, factor: number): string {
  const parsed = hex.replace('#', '');
  const channel = (start: number) => {
    const value = Math.round(parseInt(parsed.substring(start, start + 2), 16) * factor);
    return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}
