import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface QuestionHelpTooltipProps {
  content: string;
}

export function QuestionHelpTooltip({ content }: QuestionHelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Question help"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-left text-sm leading-5 text-white"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
