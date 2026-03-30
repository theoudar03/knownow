import React from 'react';

const FONTS = [
  { id: 'impact',     label: 'Impact',     family: "'Impact', 'Arial Black', sans-serif" },
  { id: 'anton',      label: 'Anton',      family: "'Anton', sans-serif" },
  { id: 'bebas',      label: 'Bebas Neue', family: "'Bebas Neue', sans-serif" },
  { id: 'montserrat', label: 'Montserrat', family: "'Montserrat', sans-serif" },
  { id: 'poppins',    label: 'Poppins',    family: "'Poppins', sans-serif" },
  { id: 'oswald',     label: 'Oswald',     family: "'Oswald', sans-serif" },
];

const FontSelector = ({ selected, onSelect, onHover, onHoverEnd }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 snap-x scrollbar-thin">
      {FONTS.map((font) => {
        const isActive = selected === font.id;
        return (
          <button
            key={font.id}
            onClick={() => onSelect(font.id)}
            onMouseEnter={() => onHover?.(font.id)}
            onMouseLeave={() => onHoverEnd?.()}
            className={`snap-start shrink-0 px-4 py-2.5 rounded-xl border text-sm outline-none whitespace-nowrap transition-all duration-150 ${
              isActive
                ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)] scale-[1.04]'
                : 'bg-white/40 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.06] text-gray-600 dark:text-gray-400 hover:border-purple-400/50 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md'
            }`}
            style={{ fontFamily: font.family }}
          >
            {font.label}
          </button>
        );
      })}
    </div>
  );
};

FontSelector.FONTS = FONTS;

export default FontSelector;
