"use client";

import {
  Laptop,
  MoonStar,
  Sun,
} from "lucide-react";

import {
  useTheme,
} from "@/components/theme/ThemeProvider";

export default function ThemeSwitcher() {
  const {
    theme,
    setTheme,
  } = useTheme();

  const options = [
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
    },
    {
      value: "black" as const,
      label: "Black",
      icon: MoonStar,
    },
    {
      value: "system" as const,
      label: "Sistema",
      icon: Laptop,
    },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      {options.map((option) => {
        const Icon =
          option.icon;

        const active =
          theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              setTheme(
                option.value,
              )
            }
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-black transition ${
              active
                ? "bg-slate-950 text-white shadow-md dark:bg-white dark:text-black"
                : "text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
