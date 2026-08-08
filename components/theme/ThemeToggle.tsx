"use client";

import {
  MoonStar,
  SunMedium,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

const STORAGE_KEY =
  "medclick-theme";

export default function ThemeToggle() {
  const [dark, setDark] =
    useState(false);
  const [ready, setReady] =
    useState(false);

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    const nextDark =
      saved === "black";

    setDark(nextDark);
    applyTheme(nextDark);
    setReady(true);
  }, []);

  function applyTheme(
    isDark: boolean,
  ) {
    const root =
      document.documentElement;

    root.dataset.theme =
      isDark ? "black" : "light";

    root.classList.toggle(
      "dark",
      isDark,
    );
  }

  function toggleTheme() {
    const next = !dark;

    setDark(next);
    applyTheme(next);

    window.localStorage.setItem(
      STORAGE_KEY,
      next ? "black" : "light",
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={
          dark
            ? "Ativar tema claro"
            : "Ativar tema black"
        }
        title={
          dark
            ? "Tema claro"
            : "Tema black"
        }
        className="theme-toggle-v31 group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(34,211,238,.16), transparent 68%)",
          }}
        />

        <span
          className={`relative z-10 transition duration-500 ${
            ready
              ? "scale-100 opacity-100"
              : "scale-75 opacity-0"
          }`}
        >
          {dark ? (
            <SunMedium
              size={18}
              className="theme-icon-spin text-amber-400"
            />
          ) : (
            <MoonStar
              size={18}
              className="theme-icon-float"
            />
          )}
        </span>

        <span className="theme-pulse absolute inset-0 rounded-xl border border-cyan-300/0" />
      </button>

      <style jsx global>{`
        html[data-theme="black"] {
          color-scheme: dark;
          background: #08090b;
        }

        html[data-theme="black"] body {
          background:
            radial-gradient(
              circle at 18% 4%,
              rgba(34,211,238,.07),
              transparent 28%
            ),
            radial-gradient(
              circle at 82% 8%,
              rgba(45,212,191,.06),
              transparent 24%
            ),
            #08090b !important;
          color: #f8fafc;
        }

        html[data-theme="black"] .bg-white {
          background-color:
            #111216 !important;
        }

        html[data-theme="black"] .bg-slate-50,
        html[data-theme="black"] .bg-slate-100,
        html[data-theme="black"] .bg-\\[\\#f5f8fc\\] {
          background-color:
            #0c0d10 !important;
        }

        html[data-theme="black"] .text-slate-950,
        html[data-theme="black"] .text-slate-900,
        html[data-theme="black"] .text-slate-800,
        html[data-theme="black"] .text-slate-700 {
          color: #f4f4f5 !important;
        }

        html[data-theme="black"] .text-slate-600,
        html[data-theme="black"] .text-slate-500,
        html[data-theme="black"] .text-slate-400 {
          color: #a1a1aa !important;
        }

        html[data-theme="black"] .border-slate-100,
        html[data-theme="black"] .border-slate-200,
        html[data-theme="black"] .border-slate-300 {
          border-color:
            #29292f !important;
        }

        html[data-theme="black"] input,
        html[data-theme="black"] select,
        html[data-theme="black"] textarea {
          background:
            #0e0f12 !important;
          color: #f4f4f5 !important;
          border-color:
            #2b2c31 !important;
        }

        html[data-theme="black"] .shadow-sm,
        html[data-theme="black"] .shadow-md,
        html[data-theme="black"] .shadow-lg,
        html[data-theme="black"] .shadow-xl,
        html[data-theme="black"] .shadow-2xl {
          box-shadow:
            0 18px 46px rgba(0,0,0,.38) !important;
        }

        html[data-theme="black"]
          .theme-toggle-v31 {
          box-shadow:
            0 0 0 1px rgba(34,211,238,.08),
            0 10px 30px rgba(0,0,0,.35);
        }

        @keyframes themeIconFloat {
          0%,
          100% {
            transform:
              translateY(0)
              rotate(-8deg);
          }
          50% {
            transform:
              translateY(-2px)
              rotate(6deg);
          }
        }

        @keyframes themeIconSpin {
          0%,
          100% {
            transform:
              rotate(0deg)
              scale(1);
          }
          50% {
            transform:
              rotate(18deg)
              scale(1.08);
          }
        }

        @keyframes themePulse {
          0% {
            border-color:
              rgba(34,211,238,0);
            transform: scale(.9);
          }
          55% {
            border-color:
              rgba(34,211,238,.30);
          }
          100% {
            border-color:
              rgba(34,211,238,0);
            transform: scale(1.22);
          }
        }

        .theme-icon-float {
          animation:
            themeIconFloat 2.8s
            ease-in-out infinite;
        }

        .theme-icon-spin {
          animation:
            themeIconSpin 3.1s
            ease-in-out infinite;
        }

        .theme-toggle-v31:hover
          .theme-pulse {
          animation:
            themePulse 1.1s
            ease-out infinite;
        }
      `}</style>
    </>
  );
}
