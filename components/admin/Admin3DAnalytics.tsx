"use client";

import {
  Activity,
  FileCheck2,
  FileText,
  WalletCards,
} from "lucide-react";
import type {
  CSSProperties,
} from "react";

type Props = {
  received: number;
  review: number;
  payment: number;
  completed: number;
  total: number;
};

const definitions = [
  {
    key: "received",
    label: "Recebidas",
    icon: FileText,
    accent: "#17d7ff",
    gradient:
      "linear-gradient(180deg,#54efff 0%,#0ccfea 42%,#047b9b 100%)",
    glow: "rgba(23,215,255,.55)",
  },
  {
    key: "review",
    label: "Em análise",
    icon: Activity,
    accent: "#22e59c",
    gradient:
      "linear-gradient(180deg,#66ffc6 0%,#17db91 42%,#08784f 100%)",
    glow: "rgba(34,229,156,.48)",
  },
  {
    key: "payment",
    label: "Pagamento",
    icon: WalletCards,
    accent: "#b36dff",
    gradient:
      "linear-gradient(180deg,#d2a1ff 0%,#9c50f7 42%,#582090 100%)",
    glow: "rgba(179,109,255,.50)",
  },
  {
    key: "completed",
    label: "Concluídas",
    icon: FileCheck2,
    accent: "#278cff",
    gradient:
      "linear-gradient(180deg,#7bb8ff 0%,#268cff 42%,#0d47a1 100%)",
    glow: "rgba(39,140,255,.55)",
  },
] as const;

export default function Admin3DAnalytics({
  received,
  review,
  payment,
  completed,
  total,
}: Props) {
  const values = {
    received,
    review,
    payment,
    completed,
  };

  const maxValue = Math.max(
    1,
    ...Object.values(values),
  );

  return (
    <section className="flow-card relative overflow-hidden rounded-[15px] border border-cyan-400/10 bg-[#06111f]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,.30)]">
      <div className="flow-haze flow-haze-a" />
      <div className="flow-haze flow-haze-b" />
      <div className="flow-grid absolute inset-x-0 bottom-0 h-[72%]" />
      <div className="flow-scan absolute inset-y-0 left-0 w-12" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h3 className="text-[14px] font-black text-white">
            Fluxo em tempo real
          </h3>
        </div>

        <span className="live-pill inline-flex items-center gap-1.5 rounded-md border border-cyan-300/25 bg-cyan-400/[0.06] px-2 py-1 text-[8px] font-black text-cyan-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
          LIVE
        </span>
      </div>

      <div className="relative z-10 mt-2 grid min-h-[220px] grid-cols-4 items-end gap-3 px-2 pb-1">
        {definitions.map(
          (definition, index) => {
            const value =
              values[definition.key];
            const height =
              58 +
              Math.round(
                (value / maxValue) * 92,
              );
            const Icon =
              definition.icon;

            return (
              <div
                key={definition.key}
                className="flow-column flex flex-col items-center justify-end"
                style={
                  {
                    "--height": `${height}px`,
                    "--delay": `${index * -0.55}s`,
                    "--accent":
                      definition.accent,
                    "--glow":
                      definition.glow,
                    "--gradient":
                      definition.gradient,
                  } as CSSProperties
                }
              >
                <strong className="flow-number relative z-20 mb-2 text-[16px] font-black text-white">
                  {value}
                </strong>

                <div className="flow-cylinder relative flex w-[52px] justify-center">
                  <span className="flow-energy flow-energy-a" />
                  <span className="flow-energy flow-energy-b" />

                  <div className="flow-bar relative w-[38px]">
                    <div className="flow-bar-top" />
                    <div className="flow-bar-face">
                      <span className="flow-shine" />
                      <span className="flow-data flow-data-a" />
                      <span className="flow-data flow-data-b" />
                    </div>
                    <div className="flow-bar-side" />
                  </div>

                  <div className="flow-ring absolute -bottom-2 left-1/2 h-4 w-[54px] -translate-x-1/2 rounded-full border" />
                </div>

                <span className="mt-4 flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-[#071626] text-slate-400 shadow-[0_0_20px_rgba(23,215,255,.03)]">
                  <Icon size={12} />
                </span>
                <span className="mt-1 text-center text-[8px] font-black text-slate-400">
                  {definition.label}
                </span>
              </div>
            );
          },
        )}
      </div>

      <style jsx global>{`
        @keyframes flowFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes flowBreath {
          0%,100% {
            filter: brightness(1) saturate(1);
          }
          50% {
            filter: brightness(1.15) saturate(1.25);
          }
        }

        @keyframes flowRing {
          0%,100% {
            transform: translateX(-50%) scale(.78);
            opacity: .25;
          }
          50% {
            transform: translateX(-50%) scale(1.18);
            opacity: .8;
          }
        }

        @keyframes flowData {
          0% {
            transform: translateY(32px);
            opacity: 0;
          }
          30% { opacity: .85; }
          100% {
            transform: translateY(-90px);
            opacity: 0;
          }
        }

        @keyframes flowEnergy {
          0% {
            transform: translateY(38px) scaleY(.4);
            opacity: 0;
          }
          35% { opacity: .8; }
          100% {
            transform: translateY(-82px) scaleY(1.35);
            opacity: 0;
          }
        }

        @keyframes flowScan {
          0% { transform: translateX(-100px) skewX(-12deg); opacity: 0; }
          35% { opacity: .35; }
          100% { transform: translateX(450px) skewX(-12deg); opacity: 0; }
        }

        @keyframes flowGrid {
          0%,100% { opacity: .22; filter: brightness(1); }
          50% { opacity: .42; filter: brightness(1.4); }
        }

        @keyframes flowHaze {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(16px,-12px,0) scale(1.12); }
        }

        .flow-card {
          isolation: isolate;
        }

        .flow-column {
          animation:
            flowFloat 3.6s ease-in-out var(--delay)
            infinite;
        }

        .flow-number {
          text-shadow:
            0 0 18px var(--glow);
        }

        .flow-bar {
          height: var(--height);
          transform-style: preserve-3d;
          animation:
            flowBreath 2.8s ease-in-out var(--delay)
            infinite;
          filter:
            drop-shadow(0 0 16px var(--glow));
        }

        .flow-bar-face {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: 7px 7px 4px 4px;
          background: var(--gradient);
          box-shadow:
            inset 6px 0 10px rgba(255,255,255,.17),
            inset -8px 0 13px rgba(0,0,0,.18);
        }

        .flow-bar-side {
          position: absolute;
          right: -7px;
          top: 5px;
          width: 7px;
          height: calc(100% - 5px);
          transform: skewY(-38deg);
          transform-origin: left top;
          border-radius: 0 3px 3px 0;
          background: color-mix(
            in srgb,
            var(--accent) 56%,
            #020710
          );
        }

        .flow-bar-top {
          position: absolute;
          z-index: 3;
          left: 4px;
          right: -3px;
          top: -6px;
          height: 12px;
          transform: skewX(-38deg);
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              white 0%,
              var(--accent) 20%,
              rgba(255,255,255,.16) 60%,
              transparent 72%
            );
          box-shadow:
            0 0 20px var(--glow);
        }

        .flow-shine {
          position: absolute;
          inset: 0 auto 0 -10px;
          width: 14px;
          transform: skewX(-12deg);
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.65),
              transparent
            );
          animation:
            flowScan 3.9s ease-in-out
            infinite;
        }

        .flow-data {
          position: absolute;
          left: 5px;
          right: 5px;
          height: 2px;
          border-radius: 999px;
          background: rgba(255,255,255,.72);
          box-shadow:
            0 0 8px rgba(255,255,255,.55);
          animation:
            flowData 2.3s linear infinite;
        }

        .flow-data-a {
          bottom: 15%;
        }

        .flow-data-b {
          bottom: 27%;
          animation-delay: -1.1s;
          opacity: .55;
        }

        .flow-ring {
          border-color: var(--accent);
          box-shadow:
            0 0 18px var(--glow);
          animation:
            flowRing 2.1s ease-in-out
            infinite;
        }

        .flow-energy {
          position: absolute;
          z-index: 1;
          bottom: 10px;
          width: 2px;
          height: 35px;
          border-radius: 999px;
          background:
            linear-gradient(
              180deg,
              transparent,
              var(--accent),
              transparent
            );
          animation:
            flowEnergy 2s ease-out infinite;
        }

        .flow-energy-a {
          left: 4px;
        }

        .flow-energy-b {
          right: 3px;
          animation-delay: -1s;
        }

        .flow-grid {
          background:
            linear-gradient(
              rgba(38,140,255,.12) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(38,140,255,.12) 1px,
              transparent 1px
            );
          background-size: 23px 23px;
          transform:
            perspective(250px)
            rotateX(58deg)
            scale(1.25);
          transform-origin: center bottom;
          mask-image:
            linear-gradient(
              to top,
              black,
              transparent 93%
            );
          animation:
            flowGrid 3.8s ease-in-out
            infinite;
        }

        .flow-scan {
          z-index: 5;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(23,215,255,.17),
              rgba(255,255,255,.08),
              transparent
            );
          animation:
            flowScan 5.4s ease-in-out
            infinite;
        }

        .flow-haze {
          pointer-events: none;
          position: absolute;
          border-radius: 999px;
          filter: blur(36px);
          animation:
            flowHaze 7s ease-in-out infinite;
        }

        .flow-haze-a {
          right: -40px;
          top: 40px;
          width: 120px;
          height: 120px;
          background: rgba(38,140,255,.12);
        }

        .flow-haze-b {
          left: -30px;
          bottom: -25px;
          width: 110px;
          height: 110px;
          background: rgba(145,92,255,.08);
          animation-delay: -2.5s;
        }

        .live-pill {
          animation:
            flowBreath 1.8s ease-in-out
            infinite;
        }
      `}</style>
    </section>
  );
}
