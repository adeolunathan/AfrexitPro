import type { Option } from '@/data/adaptive-question-bank';

interface OptionListInputProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
}

export function OptionListInput({
  options,
  value,
  onChange,
  disabled = false,
  emptyLabel = 'No options available yet.',
}: OptionListInputProps) {
  if (disabled || options.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div role="radiogroup" className="space-y-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`flex w-full items-start gap-3 rounded-lg border px-3.5 py-2 text-left transition-all ${
              selected
                ? 'border-purple-300 bg-purple-50 shadow-[0_0_0_3px_rgba(168,85,247,0.10)]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected ? 'border-purple-600' : 'border-slate-400'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-purple-600' : 'bg-transparent'}`} />
            </span>
            <span className={`text-[15px] leading-6 ${selected ? 'font-medium text-slate-900' : 'text-slate-800'}`}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
