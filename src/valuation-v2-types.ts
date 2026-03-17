import type { ValuationResult } from './valuation-engine/contracts';
import type { OwnerFieldId } from './valuation-engine/owner-intake';

export type V2QuestionType = 'select' | 'number' | 'text' | 'textarea' | 'email' | 'tel' | 'checkbox';

export interface V2Option {
  value: string;
  label: string;
}

export interface V2Question {
  id: OwnerFieldId;
  type: V2QuestionType;
  prompt: string;
  canonicalPath: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  options?: V2Option[];
}

export interface V2Section {
  id: string;
  title: string;
  description: string;
  questions: V2Question[];
}

export type V2FormValue = string | boolean;
export type V2FormData = Partial<Record<OwnerFieldId, V2FormValue>>;
export type V2ResultData = ValuationResult;

export interface V2ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: V2ResultData;
}
