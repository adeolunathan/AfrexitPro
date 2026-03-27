import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { formatMillionsDisplay, sanitizeMillionInput, serializeMillions } from '@/lib/million-currency';

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  min?: number;
  max?: number;
  id?: string;
}

export function formatNaira(value: number | string): string {
  return formatMillionsDisplay(value, { allowNegative: true, emptyDisplay: '0' });
}

export function parseNaira(formatted: string): string {
  return serializeMillions(formatted);
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '12.5',
  required,
  className,
  min,
  max,
  id,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const rawValue = typeof value === 'number' ? String(value) : String(value || '');
    setDisplayValue(sanitizeMillionInput(rawValue));
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeMillionInput(e.target.value);
    const rawValue = serializeMillions(sanitized);
    const numValue = parseFloat(rawValue || '0');

    if (min !== undefined && numValue < min) {
      return;
    }
    if (max !== undefined && numValue > max) {
      return;
    }

    setDisplayValue(sanitized);
    onChange(rawValue);
  }, [onChange, min, max]);

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={`h-14 rounded-xl border-gray-200 px-4 text-right text-base focus:border-purple-500 focus:ring-4 focus:ring-purple-100 ${className || ''}`}
      />
    </div>
  );
}

/**
 * Display-only formatted currency value
 */
export function CurrencyDisplay({ value }: { value: number | string }) {
  const formatted = formatNaira(value);
  return <span className="font-medium">{formatted || '—'}</span>;
}
