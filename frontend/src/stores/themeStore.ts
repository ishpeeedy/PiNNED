import { create } from 'zustand';

interface ThemeState {
    isDark: boolean;
    toggle: () => void;
    setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
    // Initialize from localStorage or system preference
    const stored = localStorage.getItem('darkMode');
    let initialIsDark = false;

    if (stored !== null) {
        initialIsDark = stored === 'true';
    } else {
        initialIsDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
        ).matches;
    }

    // Apply initial theme
    const root = document.documentElement;
    if (initialIsDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    return {
        isDark: initialIsDark,
        toggle: () =>
            set((state) => {
                const newIsDark = !state.isDark;
                const root = document.documentElement;

                if (newIsDark) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }

                localStorage.setItem('darkMode', newIsDark.toString());

                return { isDark: newIsDark };
            }),
        setTheme: (isDark: boolean) =>
            set(() => {
                const root = document.documentElement;

                if (isDark) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }

                localStorage.setItem('darkMode', isDark.toString());

                return { isDark };
            }),
    };
});
