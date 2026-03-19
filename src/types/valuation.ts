import type { ValuationResult } from '../valuation-engine/contracts';
import type { OwnerFieldId } from '../valuation-engine/owner-intake';

export type QuestionType = 'select' | 'number' | 'text' | 'textarea' | 'email' | 'tel' | 'checkbox';

export interface Option {
  value: string;
  label: string;
}

export interface Question {
  id: OwnerFieldId;
  type: QuestionType;
  prompt: string;
  canonicalPath: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  options?: Option[];
}

export interface Section {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export type FormValue = string | boolean;
export interface FormData extends Partial<Record<OwnerFieldId, FormValue>> {
  [key: string]: string | boolean | unknown[] | undefined;
}
export type ResultData = ValuationResult;

export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: ResultData;
}
