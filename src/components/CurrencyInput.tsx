import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';

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

/**
 * Format a number as Nigerian Naira currency with commas
 * e.g., 85000000 -> "₦85,000,000"
 */
export function formatNaira(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9]/g, '')) : value;
  if (isNaN(num) || num === 0) return '';
  
  return '₦' + num.toLocaleString('en-NG');
}

/**
 * Parse a formatted Naira string back to raw number string
 * e.g., "₦85,000,000" -> "85000000"
 */
export function parseNaira(formatted: string): string {
  return formatted.replace(/[^0-9]/g, '');
}

/**
 * Format with commas only (no currency symbol)
 * e.g., "85000000" -> "85,000,000"
 */
function formatWithCommas(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-NG');
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '85,000,000',
  required,
  className,
  min,
  max,
  id,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Update display value when prop changes
  useEffect(() => {
    const rawValue = typeof value === 'number' ? String(value) : parseNaira(value || '');
    if (rawValue && rawValue !== '0') {
      setDisplayValue(formatWithCommas(rawValue));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Extract just the digits from what was typed
    const digitsOnly = inputValue.replace(/[^0-9]/g, '');
    
    // Check min/max constraints
    const numValue = parseFloat(digitsOnly || '0');
    if (min !== undefined && numValue < min) {
      return;
    }
    if (max !== undefined && numValue > max) {
      return;
    }
    
    // Format with commas immediately for real-time display
    const formatted = formatWithCommas(digitsOnly);
    setDisplayValue(formatted);
    
    // Send raw digits to parent
    onChange(digitsOnly);
  }, [onChange, min, max]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        ₦
      </span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={`h-14 rounded-xl border-gray-200 pl-10 pr-4 text-base focus:border-purple-500 focus:ring-4 focus:ring-purple-100 ${className || ''}`}
      />
      {displayValue && (
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          NGN
        </div>
      )}
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
