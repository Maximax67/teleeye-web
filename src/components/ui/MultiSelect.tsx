import { X } from 'lucide-react';
import { useState } from 'react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelect = ({ options, selected, onChange, placeholder }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] w-full cursor-pointer rounded-lg border border-gray-400 px-3 py-2 text-left dark:border-gray-600 dark:bg-gray-700"
      >
        {selected.length === 0 ? (
          <span className="text-gray-500 dark:text-gray-400">
            {placeholder || 'Select options...'}
          </span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {item}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(item);
                  }}
                  className="hover:text-blue-600 dark:hover:text-blue-200"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <div className="sticky top-0 border-b border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectAll();
                }}
                className="flex-1 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
              >
                Select All
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="flex-1 rounded bg-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-300"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="p-1">
            {filteredOptions.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900 dark:text-white">{option}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
