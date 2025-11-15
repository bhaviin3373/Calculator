

import React from 'react';

interface UnitSelectorProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  displayMap?: Record<string, string>;
}

const UnitSelector: React.FC<UnitSelectorProps> = ({ label, value, options, onChange, displayMap }) => {
  return (
    <div className="flex-1">
      <label htmlFor={label} className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </label>
      <select
        id={label}
        value={value}
        onChange={onChange}
        className="w-full bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {displayMap?.[option] ?? option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default UnitSelector;