import { Sun, Moon, SunDim, Sparkles, Contrast, Terminal, Flower2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const themes = [
  { value: 'rose', label: 'Rose', icon: Flower2 },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'dim', label: 'Dim', icon: SunDim },
  { value: 'purple', label: 'Purple', icon: Sparkles },
  { value: 'contrast', label: 'Contrast', icon: Contrast },
  { value: 'terminal', label: 'Terminal', icon: Terminal },
] as const;

type ThemeValue = typeof themes[number]['value'];

const DEFAULT_THEME: ThemeValue = 'rose';

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeValue>(DEFAULT_THEME);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as ThemeValue | null;
    const initialTheme = savedTheme || DEFAULT_THEME;
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: ThemeValue) => {
    // Remove all theme classes
    themes.forEach(t => document.documentElement.classList.remove(t.value));
    // Add the new theme class
    document.documentElement.classList.add(newTheme);
  };

  const handleThemeChange = (newTheme: ThemeValue) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    setIsOpen(false);
  };

  const currentTheme = themes.find(t => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Palette;

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50"
      >
        <Palette className="h-5 w-5 text-foreground" />
      </Button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <CurrentIcon className="h-5 w-5 text-foreground" />
        <span className="sr-only">Change theme</span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-card shadow-lg z-50 py-1 overflow-hidden">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.value;

              return (
                <button
                  key={themeOption.value}
                  onClick={() => handleThemeChange(themeOption.value)}
                  className={`
                    relative flex w-full items-center px-3 py-2 text-sm transition-colors
                    hover:bg-accent hover:text-accent-foreground
                    ${isActive ? 'bg-accent/50 text-foreground font-medium' : 'text-foreground/80'}
                  `}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {themeOption.label}
                  {isActive && (
                    <span className="absolute right-3 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
