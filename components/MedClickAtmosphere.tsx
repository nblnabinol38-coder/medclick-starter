"use client";

import { BadgeCheck, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MedClickAtmosphere() {
  const pathname = usePathname();
  const subtle = pathname?.startsWith("/admin");

  return (
    <div
      aria-hidden="true"
      className={`mc-global-atmosphere ${subtle ? "mc-global-atmosphere-admin" : ""}`}
    >
      <div className="mc-global-grid" />
      <div className="mc-global-orb mc-global-orb-a" />
      <div className="mc-global-orb mc-global-orb-b" />

      <div className="mc-global-doc">
        <span className="mc-global-doc-gloss" />
        <div className="mc-global-doc-head">
          <span className="mc-global-doc-seal"><BadgeCheck size={16} /></span>
          <div>
            <strong>MedClick</strong>
            <span>Ambiente seguro</span>
          </div>
        </div>
        <div className="mc-global-doc-line mc-global-doc-line-a" />
        <div className="mc-global-doc-line mc-global-doc-line-b" />
        <div className="mc-global-doc-line mc-global-doc-line-c" />
        <div className="mc-global-doc-footer">
          <ShieldCheck size={14} />
          <FileCheck2 size={14} />
          <Sparkles size={13} />
        </div>
      </div>
    </div>
  );
}
