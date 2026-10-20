import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

type Theme = "light" | "dark";

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<
  { theme: Theme; toggleTheme: () => void } | undefined
>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* Keep the theme usable when storage is unavailable. */
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: () =>
          setTheme((current) => (current === "dark" ? "light" : "dark")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) return null;
  const { theme, toggleTheme } = context;
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Dark theme"
      aria-pressed={theme === "dark"}
      className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-white/10 dark:focus-visible:outline-cyan-300"
    >
      {theme === "dark" ? (
        <span>
          <FontAwesomeIcon icon={faSun} className="mr-2" /> Light theme
        </span>
      ) : (
        <span>
          <FontAwesomeIcon icon={faMoon} className="mr-2" /> Dark theme
        </span>
      )}
    </button>
  );
}
