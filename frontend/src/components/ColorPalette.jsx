import React from 'react';

const COLORS = [
  "#ffffff", "#000000", "#ff0000", "#00ff00",
  "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
  "#ffa500", "#800080", "#008000", "#808080"
];

const ColorPalette = ({ colors = COLORS, selected, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {colors.map((color) => {
        const isSelected = selected === color;
        return (
          <button
            key={color}
            onClick={() => onSelect(color)}
            title={color}
            className={`w-6 h-6 rounded-full transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-[2.5px] border-white scale-110 shadow-md ring-2 ring-purple-500/50'
                : 'border border-gray-300 dark:border-gray-600 hover:scale-105 shadow-sm'
            }`}
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );
};

export { ColorPalette, COLORS };
