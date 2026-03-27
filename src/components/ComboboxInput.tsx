import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { Option } from '@/data/adaptive-question-bank';

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export function ComboboxInput({
  value,
  onChange,
  options,
  placeholder = 'Type to search...',
}: ComboboxInputProps) {
  const committedLabel = options.find((o) => o.value === value)?.label ?? '';

  const [inputText, setInputText] = useState(committedLabel);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep input text in sync with external value (e.g. on reset)
  useEffect(() => {
    if (!open) {
      setInputText(committedLabel);
    }
  }, [committedLabel, open]);

  const filtered = inputText.trim() === ''
    ? options
    : options.filter((o) =>
        o.label.toLowerCase().includes(inputText.trim().toLowerCase())
      );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-option]');
    const el = items[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const commit = useCallback(
    (option: Option) => {
      onChange(option.value);
      setInputText(option.label);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onChange]
  );

  const revert = useCallback(() => {
    setInputText(committedLabel);
    setOpen(false);
    setActiveIndex(-1);
  }, [committedLabel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setActiveIndex(-1);
    setOpen(true);
  };

  const handleFocus = () => {
    // Clear input on focus so user sees filtered results immediately while typing
    setInputText('');
    setActiveIndex(-1);
    setOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if focus moved to something inside the container (dropdown items)
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    revert();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        commit(filtered[activeIndex]);
      } else if (filtered.length === 1) {
        commit(filtered[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      revert();
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onChange('');
    setInputText('');
    setActiveIndex(-1);
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={inputText}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-14 w-full rounded-xl border border-gray-200 bg-white px-4 pr-10 text-base text-gray-900 outline-none transition-[border-color,box-shadow] focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
        />
        <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value ? (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                handleClear();
              }}
              className="pointer-events-auto rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {open ? (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {filtered.length > 0 ? (
            filtered.map((option, index) => (
              <button
                key={option.value}
                type="button"
                role="option"
                data-option
                aria-selected={option.value === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(option);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full px-4 py-3 text-left text-[15px] transition-colors ${
                  index === activeIndex
                    ? 'bg-purple-50 text-purple-900'
                    : option.value === value
                      ? 'bg-purple-50/60 font-medium text-purple-700'
                      : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400">
              No matching states found.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
