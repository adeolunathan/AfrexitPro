import type { OwnerFieldId } from '@/valuation-engine/owner-intake';
import { level1Options, level2ByLevel1 } from '@/valuation-engine/policy-registry';

export { level2ByLevel1 };

export type QuestionType =
  | 'select'
  | 'number'
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'checkbox'
  | 'financial_table'
  | 'currency';

export interface Option {
  value: string;
  label: string;
}

export interface Question {
  id: OwnerFieldId;
  type: QuestionType;
  prompt: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
  options?: Option[];
  min?: number;
  max?: number;
}

export interface Phase {
  id: 'anchor' | 'branch' | 'closing';
  title: string;
  description?: string;
}

const stateOptions: Option[] = [
  { value: 'abia', label: 'Abia' },
  { value: 'adamawa', label: 'Adamawa' },
  { value: 'akwa_ibom', label: 'Akwa Ibom' },
  { value: 'anambra', label: 'Anambra' },
  { value: 'bauchi', label: 'Bauchi' },
  { value: 'bayelsa', label: 'Bayelsa' },
  { value: 'benue', label: 'Benue' },
  { value: 'borno', label: 'Borno' },
  { value: 'cross_river', label: 'Cross River' },
  { value: 'delta', label: 'Delta' },
  { value: 'ebonyi', label: 'Ebonyi' },
  { value: 'edo', label: 'Edo' },
  { value: 'ekiti', label: 'Ekiti' },
  { value: 'enugu', label: 'Enugu' },
  { value: 'fct', label: 'FCT (Abuja)' },
  { value: 'gombe', label: 'Gombe' },
  { value: 'imo', label: 'Imo' },
  { value: 'jigawa', label: 'Jigawa' },
  { value: 'kaduna', label: 'Kaduna' },
  { value: 'kano', label: 'Kano' },
  { value: 'katsina', label: 'Katsina' },
  { value: 'kebbi', label: 'Kebbi' },
  { value: 'kogi', label: 'Kogi' },
  { value: 'kwara', label: 'Kwara' },
  { value: 'lagos_island', label: 'Lagos - Island' },
  { value: 'lagos_mainland', label: 'Lagos - Mainland' },
  { value: 'nasarawa', label: 'Nasarawa' },
  { value: 'niger', label: 'Niger' },
  { value: 'ogun', label: 'Ogun' },
  { value: 'ondo', label: 'Ondo' },
  { value: 'osun', label: 'Osun' },
  { value: 'oyo', label: 'Oyo' },
  { value: 'plateau', label: 'Plateau' },
  { value: 'rivers', label: 'Rivers' },
  { value: 'sokoto', label: 'Sokoto' },
  { value: 'taraba', label: 'Taraba' },
  { value: 'yobe', label: 'Yobe' },
  { value: 'zamfara', label: 'Zamfara' },
];

const yearsOptions: Option[] = [
  { value: 'lt_1', label: 'Less than 1 year' },
  { value: '1_3', label: '1 to 3 years' },
  { value: '3_5', label: '3 to 5 years' },
  { value: '5_10', label: '5 to 10 years' },
  { value: '10_20', label: '10 to 20 years' },
  { value: 'gt_20', label: 'More than 20 years' },
];

export const anchorQuestions: Question[] = [
  {
    id: 'level1',
    type: 'select',
    prompt: 'What industry is your business in?',
    required: true,
    options: level1Options,
  },
  {
    id: 'level2',
    type: 'select',
    prompt: 'Which best describes how you make money?',
    required: true,
  },
  {
    id: 'industryFit',
    type: 'select',
    prompt: 'How well does the industry you selected fit your actual business activity?',
    helperText: 'This helps us use the right benchmarks and also flag classification uncertainty early.',
    required: true,
    options: [
      { value: 'perfect_fit', label: 'Fits perfectly' },
      { value: 'mostly_fit', label: 'Mostly fits' },
      { value: 'partial_fit', label: 'Partly fits' },
      { value: 'poor_fit', label: 'Not a great fit' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'businessDescription',
    type: 'textarea',
    prompt: 'How would you describe your company in your own words?',
    helperText: 'Useful for classification QA, future analytics, and audit context.',
    required: true,
    placeholder: 'Describe what you do, who you serve, and how the business earns money.',
  },
  {
    id: 'revenueLatest',
    type: 'financial_table',
    prompt: 'Financial Performance History',
    helperText:
      'Enter revenue and operating profit for the last 3 years. We use this to estimate representative earnings and trend stability.',
    required: true,
  },
  {
    id: 'operatingYears',
    type: 'select',
    prompt: 'How long has the business been operating?',
    required: true,
    options: yearsOptions,
  },
  {
    id: 'primaryState',
    type: 'select',
    prompt: 'Where is the business mainly based?',
    required: true,
    options: stateOptions,
  },
  {
    id: 'catchmentArea',
    type: 'select',
    prompt: 'Where do most of your customers come from today?',
    required: true,
    options: [
      { value: 'local_city', label: 'Mainly one city or local area' },
      { value: 'single_state', label: 'Mainly one state' },
      { value: 'multi_state', label: 'Several states in Nigeria' },
      { value: 'national_single_base', label: 'Nationwide from one base' },
      { value: 'national_multi_base', label: 'Nationwide with more than one operating base' },
      { value: 'international', label: 'Meaningful sales outside Nigeria' },
    ],
  },
  {
    id: 'pricingPower',
    type: 'select',
    prompt: 'How much freedom do you have to charge above the normal market price?',
    required: true,
    options: [
      { value: 'none', label: 'Almost none, price is set by the market' },
      { value: 'some', label: 'Some freedom if we position the offer well' },
      { value: 'premium', label: 'Clear premium pricing is possible' },
      { value: 'strong_premium', label: 'Strong premium pricing is possible' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'transactionGoal',
    type: 'select',
    prompt: 'What outcome are you preparing for?',
    required: true,
    options: [
      { value: 'external_sale', label: 'Full sale to an external buyer' },
      { value: 'partial_sale', label: 'Partial sale' },
      { value: 'internal_handover', label: 'Internal handover' },
      { value: 'investor_entry', label: 'Investor entry' },
      { value: 'value_improvement', label: 'Value-improvement planning before sale' },
    ],
  },
  {
    id: 'proofReadiness',
    type: 'select',
    prompt: 'How quickly could you prove your revenue and profit to a serious buyer?',
    required: true,
    options: [
      { value: 'immediate', label: 'Immediately, with bank records and clear books' },
      { value: 'organize_fast', label: 'Within a day or two after pulling records together' },
      { value: 'show_patterns', label: 'I can show patterns, but not clean proof' },
      { value: 'difficult', label: 'It would be difficult to prove properly' },
    ],
  },
  {
    id: 'ownerControl',
    type: 'select',
    prompt: 'What percentage of the business do you own or control?',
    required: true,
    options: [
      { value: 'gt_75', label: 'More than 75%' },
      { value: '51_75', label: '51% to 75%' },
      { value: '25_50', label: '25% to 50%' },
      { value: 'lt_25', label: 'Less than 25%' },
    ],
  },
  {
    id: 'marketDemand',
    type: 'select',
    prompt: 'How is demand in your market moving right now?',
    required: true,
    options: [
      { value: 'strong_growth', label: 'Growing strongly' },
      { value: 'steady_growth', label: 'Growing steadily' },
      { value: 'flat', label: 'Mostly flat' },
      { value: 'declining', label: 'Falling' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
];

export const closingQuestions: Question[] = [
  {
    id: 'traceablePaymentsShare',
    type: 'select',
    prompt: 'What share of customer payments goes through bank or traceable channels?',
    required: true,
    options: [
      { value: '80_100', label: '80% to 100%' },
      { value: '50_79', label: '50% to 79%' },
      { value: '20_49', label: '20% to 49%' },
      { value: 'lt_20', label: 'Less than 20%' },
    ],
  },
  {
    id: 'bankingQuality',
    type: 'select',
    prompt: 'How clean are your business banking records?',
    required: true,
    options: [
      { value: 'clean', label: 'Clean business transactions with little mixing' },
      { value: 'mostly_clean', label: 'Mostly business, some personal mixing' },
      { value: 'incomplete', label: 'Incomplete or inconsistent in some periods' },
      { value: 'informal', label: 'Many transactions do not pass through formal banking' },
    ],
  },
  {
    id: 'financeTracking',
    type: 'select',
    prompt: 'How do you currently track sales, expenses, and business performance?',
    required: true,
    options: [
      { value: 'software', label: 'Accounting software or a proper business app' },
      { value: 'spreadsheet', label: 'Spreadsheet or disciplined ledger' },
      { value: 'notes', label: 'Notes and partial records' },
      { value: 'informal', label: 'Mostly in my head or informally' },
    ],
  },
  {
    id: 'ownerAbsence2Weeks',
    type: 'select',
    prompt: 'If you stepped away for 2 weeks, what would happen?',
    required: true,
    options: [
      { value: 'smooth', label: 'It would keep running smoothly' },
      { value: 'minor_issues', label: 'It would run with some issues, but nothing major' },
      { value: 'struggle', label: 'It would struggle badly' },
      { value: 'almost_stop', label: 'It would almost stop' },
    ],
  },
  {
    id: 'ownerAbsence3Months',
    type: 'select',
    prompt: 'If you were unavailable for 3 months, what would happen to the business?',
    helperText: 'This is one of the strongest transferability signals in owner mode.',
    required: true,
    options: [
      { value: 'limited_disruption', label: 'Continue with limited disruption' },
      { value: 'risky_but_possible', label: 'Could continue, but with clear risks' },
      { value: 'very_difficult', label: 'It would be very difficult' },
      { value: 'not_realistic', label: 'Not realistic, the business depends on me' },
    ],
  },
  {
    id: 'ownerCustomerRelationship',
    type: 'select',
    prompt: 'How are customer relationships tied to you personally?',
    helperText: 'We use this as the universal founder-dependence signal when a more specific branch resolver is not available.',
    required: true,
    options: [
      { value: 'brand_not_personal', label: 'Customers buy the brand or service, not me personally' },
      { value: 'knows_not_expected', label: 'Customers know me, but do not expect my direct involvement' },
      { value: 'expects_involvement', label: 'Customers know me and expect my personal involvement' },
      { value: 'buying_owner', label: 'Many customers are effectively buying me or my relationships' },
    ],
  },
  {
    id: 'managementDepth',
    type: 'select',
    prompt: 'Who currently runs day-to-day operations and key decisions?',
    required: true,
    options: [
      { value: 'team_controls', label: 'A team with clear roles and controls' },
      { value: 'trusted_manager', label: 'A trusted manager, with my oversight' },
      { value: 'founder_plus_support', label: 'Me, with occasional help from family or staff' },
      { value: 'founder_only', label: 'Mostly me alone' },
    ],
  },
  {
    id: 'processDocumentation',
    type: 'select',
    prompt: 'How well is important operating knowledge documented?',
    required: true,
    options: [
      { value: 'documented_multi', label: 'Documented and several people can follow them' },
      { value: 'partly_documented', label: 'Some documented, a few people know how things work' },
      { value: 'little_documented', label: 'Only a small amount is documented' },
      { value: 'founder_head', label: 'Most of it sits in my head' },
    ],
  },
  {
    id: 'replacementDifficulty',
    type: 'select',
    prompt: 'If you needed to replace yourself with a manager, how hard would that be?',
    required: true,
    options: [
      { value: 'easy', label: 'Easy, within a week or two' },
      { value: 'possible', label: 'Possible, within 1 to 2 months' },
      { value: 'difficult', label: 'Difficult, would take several months' },
      { value: 'founder_tied', label: 'Very difficult, the role is too tied to me' },
    ],
  },
  {
    id: 'laborMarketDifficulty',
    type: 'select',
    prompt: 'How difficult is it to recruit skilled workers for your business?',
    required: true,
    options: [
      { value: 'easy', label: 'Talent is generally available' },
      { value: 'feasible', label: 'Recruiting takes effort but is feasible' },
      { value: 'difficult', label: 'Finding the right people is difficult' },
      { value: 'severe', label: 'Talent shortage is one of our biggest challenges' },
    ],
  },
  {
    id: 'growthPotential',
    type: 'select',
    prompt: 'Over the next 3 years, how do you expect this business to perform?',
    required: true,
    options: [
      { value: 'strong_growth', label: 'Strong growth is realistic' },
      { value: 'moderate_growth', label: 'Moderate growth is realistic' },
      { value: 'stable', label: 'Stable or modest growth' },
      { value: 'decline', label: 'The business may decline' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'customerConcentration',
    type: 'select',
    prompt: 'How concentrated is your customer base?',
    required: true,
    options: [
      { value: 'none_material', label: 'No single customer is material' },
      { value: 'manageable', label: 'Top customers matter, but concentration is manageable' },
      { value: 'high', label: 'Top customers drive a large share of revenue' },
      { value: 'extreme', label: 'One or two customers carry too much of the business' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'bestCustomerImpact',
    type: 'select',
    prompt: 'What would be the impact of losing your single best customer?',
    required: true,
    options: [
      { value: 'minor', label: 'Minor, we would adjust fairly easily' },
      { value: 'noticeable', label: 'Noticeable, but not threatening' },
      { value: 'major', label: 'Major, it would seriously hurt performance' },
      { value: 'severe', label: 'Severe, it would put the business under real pressure' },
    ],
  },
  {
    id: 'partnerDependency',
    type: 'select',
    prompt: 'How dependent is the business on key partners such as suppliers or subcontractors?',
    required: true,
    options: [
      { value: 'very_easy', label: 'We can replace a critical partner easily' },
      { value: 'manageable', label: 'Replacement would be manageable' },
      { value: 'uncertain', label: 'Replacement is possible but uncertain' },
      { value: 'very_difficult', label: 'A critical partner would be very difficult to replace' },
    ],
  },
  {
    id: 'legalStructure',
    type: 'select',
    prompt: 'What is the legal form of the business?',
    required: true,
    options: [
      { value: 'sole_prop', label: 'Sole proprietorship' },
      { value: 'partnership', label: 'Partnership' },
      { value: 'limited_company', label: 'Limited liability company' },
      { value: 'group_structure', label: 'Group or holding structure' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'transactionTimeline',
    type: 'select',
    prompt: 'When do you realistically expect a transaction process could begin?',
    required: true,
    options: [
      { value: 'within_6m', label: 'Within 6 months' },
      { value: '6_12m', label: '6 to 12 months' },
      { value: '12_24m', label: '12 to 24 months' },
      { value: 'gt_24m', label: 'More than 24 months' },
      { value: 'not_sure', label: 'Not sure yet' },
    ],
  },
  {
    id: 'receivablesLatest',
    type: 'currency',
    prompt: 'How much are customers owing the business at month-end?',
    helperText: 'Trade receivables only. Enter 0 if customers pay immediately.',
    required: true,
    placeholder: 'e.g. 9,500,000',
    min: 0,
  },
  {
    id: 'payablesLatest',
    type: 'currency',
    prompt: 'How much does the business owe suppliers?',
    helperText: 'Exclude bank loans or director loans.',
    required: true,
    placeholder: 'e.g. 11,000,000',
    min: 0,
  },
  {
    id: 'cashBalance',
    type: 'currency',
    prompt: 'What is the current cash balance?',
    helperText: 'Include bank balances available to operations.',
    required: true,
    placeholder: 'e.g. 12,500,000',
    min: 0,
  },
  {
    id: 'ownerTotalCompensation',
    type: 'currency',
    prompt: 'How much do you take out annually in salary and benefits?',
    helperText: 'Enter 0 only if you take nothing out.',
    required: true,
    placeholder: 'e.g. 18,000,000',
    min: 0,
  },
  {
    id: 'marketManagerCompensation',
    type: 'currency',
    prompt: 'What would it cost to hire a capable manager to replace you?',
    helperText: 'Give your best realistic all-in estimate.',
    required: true,
    placeholder: 'e.g. 9,000,000',
    min: 0,
  },
  {
    id: 'relatedPartyRentPaid',
    type: 'currency',
    prompt: 'How much rent does the business currently pay each year if the premises is related-party or non-market?',
    helperText: 'Enter 0 if the business already pays a clear market rent.',
    required: true,
    placeholder: 'e.g. 6,000,000',
    min: 0,
  },
  {
    id: 'marketRentEquivalent',
    type: 'currency',
    prompt: 'What do you think a market-equivalent annual rent would be for the same premises?',
    helperText: 'Enter 0 only if there is no rent normalization issue.',
    required: true,
    placeholder: 'e.g. 8,500,000',
    min: 0,
  },
  {
    id: 'relatedPartyCompPaid',
    type: 'currency',
    prompt: 'How much is currently paid to related parties or family members working in the business each year?',
    helperText: 'Enter 0 if not applicable.',
    required: true,
    placeholder: 'e.g. 4,500,000',
    min: 0,
  },
  {
    id: 'marketRelatedPartyCompEquivalent',
    type: 'currency',
    prompt: 'What would be the fair market cost for those same related-party roles?',
    helperText: 'Enter 0 if not applicable.',
    required: true,
    placeholder: 'e.g. 3,200,000',
    min: 0,
  },
  {
    id: 'privateExpensesAmount',
    type: 'currency',
    prompt: 'How much personal or private spending runs through the business each year?',
    helperText: 'Enter 0 if none.',
    required: true,
    placeholder: 'e.g. 1,500,000',
    min: 0,
  },
  {
    id: 'oneOffExpenseAmount',
    type: 'currency',
    prompt: 'How much unusual or one-off expense should be removed from maintainable earnings?',
    helperText: 'Examples: one-time repairs, legal settlements, unusual losses. Enter 0 if none.',
    required: true,
    placeholder: 'e.g. 2,000,000',
    min: 0,
  },
  {
    id: 'oneOffIncomeAmount',
    type: 'currency',
    prompt: 'How much unusual or one-off income should be removed from maintainable earnings?',
    helperText: 'Enter 0 if none.',
    required: true,
    placeholder: 'e.g. 1,200,000',
    min: 0,
  },
  {
    id: 'nonCoreIncomeAmount',
    type: 'currency',
    prompt: 'How much non-core income is included in reported profit?',
    helperText: 'Examples: income not tied to the main operating business. Enter 0 if none.',
    required: true,
    placeholder: 'e.g. 2,800,000',
    min: 0,
  },
  {
    id: 'annualDepreciation',
    type: 'currency',
    prompt: 'What is the annual depreciation expense for the latest year?',
    helperText: 'Enter 0 if negligible or unknown.',
    required: false,
    placeholder: 'e.g. 2,500,000',
    min: 0,
  },
  {
    id: 'financialDebt',
    type: 'currency',
    prompt: 'What is the current financial debt balance?',
    helperText: 'Include loans and finance obligations.',
    required: true,
    placeholder: 'e.g. 8,000,000',
    min: 0,
  },
  {
    id: 'shareholderLoans',
    type: 'currency',
    prompt: 'What is the balance of shareholder or director loans?',
    helperText: 'Enter 0 if none.',
    required: true,
    placeholder: 'e.g. 5,000,000',
    min: 0,
  },
  {
    id: 'previousOffer',
    type: 'select',
    prompt: 'Have you received a purchase offer for the business in the last 2 years?',
    required: true,
    options: [
      { value: 'yes', label: 'Yes, there was a specific offer' },
      { value: 'expressions', label: 'There were expressions of interest, but no formal offer' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'previousOfferAmount',
    type: 'currency',
    prompt: 'If yes, what was the offer amount?',
    helperText: 'Shown only when there was a specific offer.',
    required: false,
    placeholder: 'e.g. 50,000,000',
    min: 0,
  },
  {
    id: 'businessName',
    type: 'text',
    prompt: 'Business name',
    required: true,
    placeholder: 'e.g. Northfield Foods',
  },
  {
    id: 'firstName',
    type: 'text',
    prompt: 'Your first name',
    required: true,
    placeholder: 'e.g. Ada',
  },
  {
    id: 'email',
    type: 'email',
    prompt: 'Email address',
    required: true,
    placeholder: 'you@company.com',
  },
  {
    id: 'whatsapp',
    type: 'tel',
    prompt: 'WhatsApp number',
    required: true,
    placeholder: '08012345678',
  },
  {
    id: 'termsAccepted',
    type: 'checkbox',
    prompt: 'I confirm these answers are honest to the best of my knowledge and I accept the valuation terms.',
    required: true,
  },
];

function isLowestRiskCustomerConcentration(value: unknown) {
  return String(value || '') === 'none_material';
}

export function getVisibleClosingQuestions(answers: Partial<Record<OwnerFieldId, unknown>>): Question[] {
  return closingQuestions.filter((question) => {
    if (question.id === 'previousOfferAmount') {
      return String(answers.previousOffer || '') === 'yes';
    }

    if (question.id === 'bestCustomerImpact') {
      return !isLowestRiskCustomerConcentration(answers.customerConcentration);
    }

    return true;
  });
}

export const totalQuestionsPhase1 = anchorQuestions.length + closingQuestions.length;
