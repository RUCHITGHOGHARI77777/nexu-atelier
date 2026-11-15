"use client";

import React from "react";
import { Sparkles, Headphones, Home, Shirt, Grid3X3 } from "lucide-react";

interface DepartmentPill {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const DEPARTMENTS: DepartmentPill[] = [
  { id: "sarees-handlooms", label: "Heirloom Sarees", icon: Sparkles, badge: "Master Looms" },
  { id: "audio-electronics", label: "Acoustic Audio", icon: Headphones, badge: "Studio Grade" },
  { id: "furniture-home", label: "Artisan Living", icon: Home, badge: "Foundry" },
  { id: "heritage-fashion", label: "Fine Apparel", icon: Shirt, badge: "Tailored" },
  { id: "marketplace-catalog", label: "All Collections", icon: Grid3X3 },
];

export const DepartmentQuickJumpBar: React.FC = () => {
  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      aria-label="Department Quick Navigation"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2"
    >
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 border-b border-zinc-200/80">
        <span className="text-xs font-semibold text-zinc-500 shrink-0 mr-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
          Departments:
        </span>

        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => handleScrollTo(dept.id)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-700 bg-zinc-50 hover:bg-zinc-950 hover:text-white border border-zinc-200 hover:border-zinc-950 transition-all duration-200 shrink-0 cursor-pointer shadow-2xs group motion-reduce:transition-none"
            >
              <Icon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
              <span>{dept.label}</span>
              {dept.badge && (
                <span className="text-[10px] px-1.5 py-0.2 bg-zinc-200/80 group-hover:bg-zinc-800 text-zinc-700 group-hover:text-zinc-200 rounded font-medium transition-colors">
                  {dept.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

