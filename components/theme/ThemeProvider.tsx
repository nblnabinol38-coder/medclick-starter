"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeMode =
  | "light"
  | "black"
  | "system";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: "light" | "black";
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext =
  createContext<ThemeContextValue | null>(
    null,
  );

const STORAGE_KEY =
  "medclick-theme";

function resolveTheme(
  theme: ThemeMode,
): "light" | "black" {
  if (theme === "light") return "light";
  if (theme === "black") return "black";

  if (
    typeof window !== "undefined" &&
    window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches
  ) {
    return "black";
  }

  return "light";
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] =
    useState<ThemeMode>("system");
  const [
    resolvedTheme,
    setResolvedTheme,
  ] = useState<"light" | "black">(
    "light",
  );

  useEffect(() => {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY,
      ) as ThemeMode | null;

    const initial: ThemeMode =
      stored === "light" ||
      stored === "black" ||
      stored === "system"
        ? stored
        : "system";

    setThemeState(initial);
    setResolvedTheme(
      resolveTheme(initial),
    );
  }, []);

  useEffect(() => {
    const media =
      window.matchMedia(
        "(prefers-color-scheme: dark)",
      );

    const apply = () => {
      const next =
        resolveTheme(theme);

      setResolvedTheme(next);

      document.documentElement.dataset.theme =
        next;
      document.documentElement.classList.toggle(
        "dark",
        next === "black",
      );
    };

    apply();

    if (theme === "system") {
      media.addEventListener(
        "change",
        apply,
      );
    }

    return () => {
      media.removeEventListener(
        "change",
        apply,
      );
    };
  }, [theme]);

  const setTheme = (
    next: ThemeMode,
  ) => {
    setThemeState(next);
    window.localStorage.setItem(
      STORAGE_KEY,
      next,
    );
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(
    ThemeContext,
  );

  if (!value) {
    throw new Error(
      "useTheme must be used inside ThemeProvider.",
    );
  }

  return value;
}
