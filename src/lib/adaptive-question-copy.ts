import type { Question, Option } from '@/data/adaptive-question-bank';
import type { BranchQuestion } from '@/data/branch-modules';

type QuestionLike = Pick<Question, 'id' | 'prompt' | 'helperText' | 'tooltipText' | 'options'> | BranchQuestion;

export interface ResolvedQuestionCopy {
  prompt: string;
  helperText?: string;
  tooltipText?: string;
  options?: Option[];
}

export function isOwnerRespondent(role: unknown) {
  return String(role || 'owner') !== 'representative';
}

function cloneOptions(options?: Option[]) {
  return options?.map((option) => ({ ...option }));
}

export function resolveQuestionCopy(
  question: QuestionLike,
  respondentRole: unknown
): ResolvedQuestionCopy {
  const ownerRespondent = isOwnerRespondent(respondentRole);
  const resolved: ResolvedQuestionCopy = {
    prompt: question.prompt,
    helperText: question.helperText,
    tooltipText: question.tooltipText,
    options: cloneOptions(question.options),
  };

  if (ownerRespondent) {
    return resolved;
  }

  switch (question.id) {
    case 'ownerControl':
      resolved.prompt = 'What percentage of the business does the owner own or control?';
      break;
    case 'ownerAbsence2Weeks':
      resolved.prompt = 'If the owner stepped away for 2 weeks, what would happen?';
      break;
    case 'ownerAbsence3Months':
      resolved.prompt = 'If the owner were unavailable for 3 months, what is the most realistic impact on operations and revenue?';
      resolved.helperText =
        'Base this on what would happen without the owner\'s direct involvement, not on a best-case hope. This is one of the strongest transferability signals in owner mode.';
      if (resolved.options) {
        resolved.options = resolved.options.map((option) =>
          option.value === 'not_realistic'
            ? { ...option, label: 'Not realistic; the business depends too heavily on the owner' }
            : option
        );
      }
      break;
    case 'ownerCustomerRelationship':
      resolved.prompt = 'How strongly are customer relationships tied to the owner\'s personal involvement?';
      if (resolved.options) {
        resolved.options = [
          { value: 'brand_not_personal', label: 'Customers buy the brand or service, not the owner personally' },
          { value: 'knows_not_expected', label: 'Customers know the owner, but do not expect the owner\'s direct involvement' },
          { value: 'expects_involvement', label: 'Customers know the owner and expect the owner\'s personal involvement' },
          { value: 'buying_owner', label: 'Many customers are effectively buying the owner or the owner\'s relationships' },
        ];
      }
      break;
    case 'managementDepth':
      if (resolved.options) {
        resolved.options = [
          { value: 'team_controls', label: 'A team with clear roles and controls' },
          { value: 'trusted_manager', label: 'A trusted manager, with the owner\'s oversight' },
          { value: 'founder_plus_support', label: 'The owner, with occasional help from family or staff' },
          { value: 'founder_only', label: 'Mostly the owner alone' },
        ];
      }
      break;
    case 'processDocumentation':
      if (resolved.options) {
        resolved.options = resolved.options.map((option) =>
          option.value === 'founder_head'
            ? { ...option, label: 'Most of it sits in the owner\'s head' }
            : option
        );
      }
      break;
    case 'replacementDifficulty':
      resolved.prompt = 'If the business needed to replace the owner with a manager, how hard would that be?';
      if (resolved.options) {
        resolved.options = resolved.options.map((option) =>
          option.value === 'founder_tied'
            ? { ...option, label: 'Very difficult, the role is too tied to the owner' }
            : option
        );
      }
      break;
    case 'ownerTotalCompensation':
      resolved.prompt = 'What is the owner\'s total annual all-in compensation from the business?';
      resolved.helperText =
        'Include salary, bonuses, benefits, allowances, and regular owner pay. Enter 0 only if the owner takes nothing out.';
      break;
    case 'marketManagerCompensation':
      resolved.prompt = 'What would be the total annual all-in market cost to hire a capable manager to replace the owner?';
      break;
    case 'founderRevenueDependence':
      resolved.prompt = 'About what share of revenue depends on customers buying mainly because of the owner personally?';
      break;
    default:
      break;
  }

  return resolved;
}
