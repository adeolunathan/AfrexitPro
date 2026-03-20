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
  tooltipText?: string;
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
    id: 'respondentRole',
    type: 'select',
    prompt: 'Are you the business owner completing this assessment?',
    helperText: 'This only changes how we phrase owner-related questions. It does not change the valuation logic.',
    required: true,
    options: [
      { value: 'owner', label: 'Yes, I am the owner' },
      { value: 'representative', label: 'No, I am completing this for the owner' },
    ],
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
      'Enter revenue and operating profit in ₦ millions for the last completed year, the prior 2 years if available, and the current-year forecast if you have one. You can paste directly from a spreadsheet.',
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
    prompt: 'Compared with similar competitors, how much price premium can you usually sustain without losing most customers?',
    tooltipText:
      'This helps us assess whether the business has real pricing strength or is competing mostly on price, which affects resilience and valuation quality.',
    required: true,
    options: [
      { value: 'none', label: 'No real premium; usually within about 0% to 5% of market price' },
      { value: 'some', label: 'A small premium is possible; roughly 5% to 10%' },
      { value: 'premium', label: 'A clear premium is possible; roughly 10% to 20%' },
      { value: 'strong_premium', label: 'A strong premium is possible; usually above 20%' },
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
    tooltipText:
      'This measures how quickly a buyer could verify the numbers. Strong proof improves confidence and usually supports a tighter valuation range.',
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
    prompt: 'Based on what you are seeing in actual demand, how is your market moving right now?',
    required: true,
    options: [
      { value: 'strong_growth', label: 'Demand is growing strongly and new business is easier to win' },
      { value: 'steady_growth', label: 'Demand is growing steadily, but not overheating' },
      { value: 'flat', label: 'Demand is broadly flat or only moving slightly' },
      { value: 'declining', label: 'Demand is weakening or customers are cutting back' },
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
    tooltipText:
      "This helps us assess how dependent the business is on the owner's presence for day-to-day decisions and operations.",
    required: true,
    options: [
      { value: 'smooth', label: 'It would continue normally with no material issues' },
      { value: 'minor_issues', label: 'It would continue with minor issues or under about 5% disruption' },
      { value: 'struggle', label: 'It would struggle materially during that period' },
      { value: 'almost_stop', label: 'It would nearly stop without me' },
    ],
  },
  {
    id: 'ownerAbsence3Months',
    type: 'select',
    prompt: 'If you were unavailable for 3 months, what is the most realistic impact on operations and revenue?',
    helperText: 'Base this on what would happen without your direct involvement, not on a best-case hope. This is one of the strongest transferability signals in owner mode.',
    tooltipText:
      "This helps us assess the risk to the company if the owner is unavailable for an extended period and how independent the business really is.",
    required: true,
    options: [
      { value: 'no_disruption', label: 'Business would continue with no material disruption' },
      { value: 'limited_disruption', label: 'Business would continue, with likely disruption under about 10%' },
      { value: 'risky_but_possible', label: 'Business would continue, but with clear risk or roughly 10% to 30% disruption' },
      { value: 'very_difficult', label: 'Business would be severely disrupted or likely lose more than about 30%' },
      { value: 'not_realistic', label: 'Not realistic; the business depends too heavily on me' },
    ],
  },
  {
    id: 'ownerCustomerRelationship',
    type: 'select',
    prompt: 'How are customer relationships tied to you personally?',
    helperText: 'We use this as the universal founder-dependence signal when a more specific branch resolver is not available.',
    tooltipText:
      "This helps us assess whether customer loyalty depends on the owner's direct involvement or would continue if the owner stepped back.",
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
    prompt: 'Who currently carries most day-to-day operating control and key decisions?',
    required: true,
    options: [
      { value: 'team_controls', label: 'A management team with clear roles, controls, and delegated authority' },
      { value: 'trusted_manager', label: 'A trusted manager runs most of it, with my oversight' },
      { value: 'founder_plus_support', label: 'I still run most of it, with occasional help from staff or family' },
      { value: 'founder_only', label: 'The business still depends on me for most key decisions and coordination' },
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
      { value: 'easy', label: 'A credible replacement could be found and stabilised within a few weeks' },
      { value: 'possible', label: 'A replacement is possible, but would likely take 1 to 2 months' },
      { value: 'difficult', label: 'A replacement would likely take several months and real handover effort' },
      { value: 'founder_tied', label: 'Very difficult; too much of the role is still tied to me personally' },
    ],
  },
  {
    id: 'laborMarketDifficulty',
    type: 'select',
    prompt: 'If you needed to hire one solid skilled employee today, how long would it usually take to find and onboard the right person?',
    required: true,
    options: [
      { value: 'easy', label: 'Usually within 30 days' },
      { value: 'feasible', label: 'Usually about 1 to 3 months' },
      { value: 'difficult', label: 'Usually about 3 to 6 months' },
      { value: 'severe', label: 'Usually over 6 months or very uncertain' },
    ],
  },
  {
    id: 'growthPotential',
    type: 'select',
    prompt: 'Over the next 3 years, what average annual revenue growth is most realistic?',
    required: true,
    options: [
      { value: 'strong_growth', label: 'More than 20% a year' },
      { value: 'moderate_growth', label: 'About 8% to 20% a year' },
      { value: 'stable', label: 'Between about -5% and +8% a year' },
      { value: 'decline', label: 'Likely to shrink by more than about 5% a year' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'differentiation',
    type: 'select',
    prompt: 'What most often wins business for you against comparable alternatives?',
    helperText: 'Choose the main reason customers buy from you today, not the reason you want to be known for.',
    tooltipText:
      'This tells us whether demand is driven by something durable and hard to copy or by factors that are easier for competitors to match.',
    required: true,
    options: [
      { value: 'price', label: 'Mostly lower price, convenience, or location' },
      { value: 'reliability', label: 'Mostly more reliable delivery, service, or execution' },
      { value: 'hard_to_copy', label: 'Mostly something hard to copy: brand, capability, process, distribution, or certification' },
      { value: 'founder_trust', label: 'Mostly personal trust in me or my relationships' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'customerConcentration',
    type: 'select',
    prompt: 'About what share of annual revenue comes from your single largest customer?',
    tooltipText:
      'This helps us assess how exposed the business is to losing one important customer. Higher concentration usually reduces transferability and buyer confidence.',
    required: true,
    options: [
      { value: 'none_material', label: 'Less than 10%' },
      { value: 'manageable', label: 'About 10% to 20%' },
      { value: 'high', label: 'About 20% to 40%' },
      { value: 'extreme', label: 'More than 40%' },
      { value: 'not_sure', label: 'Not sure' },
    ],
  },
  {
    id: 'bestCustomerImpact',
    type: 'select',
    prompt: 'If you lost your largest customer, how much annual revenue or profit would likely be at risk before replacement?',
    tooltipText:
      'This estimates how much of current performance depends on the biggest customer and how painful that loss would be before a replacement is found.',
    required: true,
    options: [
      { value: 'minor', label: 'Minor; likely under about 10% at risk' },
      { value: 'noticeable', label: 'Noticeable; roughly 10% to 20% at risk' },
      { value: 'major', label: 'Major; roughly 20% to 40% at risk' },
      { value: 'severe', label: 'Severe; over 40% at risk or threatens viability' },
    ],
  },
  {
    id: 'partnerDependency',
    type: 'select',
    prompt: 'If you lost your most important supplier or operating partner, how hard would it be to replace them without major disruption?',
    required: true,
    options: [
      { value: 'very_easy', label: 'Replaceable in under 2 weeks' },
      { value: 'manageable', label: 'Replaceable in about 2 to 8 weeks' },
      { value: 'uncertain', label: 'Possible, but likely 2 to 6 months or uncertain' },
      { value: 'very_difficult', label: 'Very difficult; likely over 6 months or not realistically replaceable' },
    ],
  },
  {
    id: 'assetSeparation',
    type: 'select',
    prompt: 'How clearly are business assets separated from personal assets today?',
    tooltipText:
      'Buyers prefer assets to be clearly identifiable and transferable. Mixed personal and business assets can slow a deal or reduce value certainty.',
    required: true,
    options: [
      { value: 'clear', label: 'Clear - business assets are fully identifiable and separate' },
      { value: 'mostly', label: 'Mostly clear - a few items need tidying up' },
      { value: 'partial', label: 'Partly mixed - several items still overlap' },
      { value: 'no', label: 'Not really - business and personal assets are materially mixed' },
    ],
  },
  {
    id: 'fxExposure',
    type: 'select',
    prompt: 'Roughly what share of your cost base is exposed to imports, foreign currency swings, or customs/logistics disruption?',
    tooltipText:
      'This helps us assess cost volatility and margin risk, especially for businesses that depend on imported inputs or foreign-currency-linked costs.',
    required: true,
    options: [
      { value: 'low', label: 'Low - under about 10%' },
      { value: 'moderate', label: 'Moderate - about 10% to 30%' },
      { value: 'high', label: 'High - about 30% to 60%' },
      { value: 'very_high', label: 'Very high - over about 60%' },
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
    helperText: 'Trade receivables only. Enter the amount in ₦ millions. Enter 0 if customers pay immediately.',
    tooltipText:
      'Receivables are part of working capital. We use them to understand how much cash is tied up in the business and how that affects equity value at deal time.',
    required: true,
    placeholder: 'e.g. 9.5',
    min: 0,
  },
  {
    id: 'payablesLatest',
    type: 'currency',
    prompt: 'How much does the business owe suppliers?',
    helperText: 'Exclude bank loans or director loans. Enter the amount in ₦ millions.',
    tooltipText:
      'Payables are part of working capital. They help us estimate the funding the business needs to operate normally and the likely deal-time working-capital position.',
    required: true,
    placeholder: 'e.g. 11',
    min: 0,
  },
  {
    id: 'cashBalance',
    type: 'currency',
    prompt: 'What is the current cash balance?',
    helperText: 'Include bank balances available to operations. Enter the amount in ₦ millions.',
    tooltipText:
      'Cash affects the equity bridge directly. More available operating cash can increase the equity value available to a seller.',
    required: true,
    placeholder: 'e.g. 12.5',
    min: 0,
  },
  {
    id: 'ownerTotalCompensation',
    type: 'currency',
    prompt: 'What is your total annual all-in compensation from the business?',
    helperText: 'Include salary, bonuses, benefits, allowances, and regular owner pay. Enter the amount in ₦ millions. Enter 0 only if you take nothing out.',
    tooltipText:
      'We use this to normalize earnings. Buyer value is based on maintainable profit after allowing for a realistic replacement cost, not just the current owner draw.',
    required: true,
    placeholder: 'e.g. 18',
    min: 0,
  },
  {
    id: 'marketManagerCompensation',
    type: 'currency',
    prompt: 'If you had to hire a full-time non-owner manager to do your role properly, what total annual pay package would be realistic?',
    helperText: 'Include salary, bonuses, benefits, pension, and statutory costs. Enter the amount in ₦ millions and use your best realistic estimate for your size of business and location.',
    tooltipText:
      'This is the replacement cost we compare against current owner pay to estimate maintainable earnings for a buyer.',
    required: true,
    placeholder: 'e.g. 9',
    min: 0,
  },
  {
    id: 'relatedPartyRentPaid',
    type: 'currency',
    prompt: 'What total annual rent does the business currently pay for premises that are related-party, subsidized, or otherwise not at market terms?',
    helperText: 'Enter the amount in ₦ millions. Enter 0 if the business already pays a clear market rent.',
    tooltipText:
      'If the business uses below-market or related-party premises, we normalize that cost so profit better reflects what a buyer would likely face after a deal.',
    required: true,
    placeholder: 'e.g. 6',
    min: 0,
  },
  {
    id: 'marketRentEquivalent',
    type: 'currency',
    prompt: 'What would the total annual market rent be for the same premises on arm\'s-length terms?',
    helperText: 'Enter the amount in ₦ millions. Enter 0 only if there is no rent normalization issue.',
    tooltipText:
      'This is the market cost benchmark we use to adjust reported profit if current rent is not on normal commercial terms.',
    required: true,
    placeholder: 'e.g. 8.5',
    min: 0,
  },
  {
    id: 'relatedPartyCompPaid',
    type: 'currency',
    prompt: 'What is the total annual all-in amount paid to related parties or family members working in the business?',
    helperText: 'Include salary, wages, bonuses, allowances, pension, benefits, and any other compensation. Enter the amount in ₦ millions. Enter 0 if none.',
    tooltipText:
      'We compare current related-party pay with a normal market replacement cost so maintainable earnings are not overstated or understated.',
    required: true,
    placeholder: 'e.g. 4.5',
    min: 0,
  },
  {
    id: 'marketRelatedPartyCompEquivalent',
    type: 'currency',
    prompt: 'What would be the total annual all-in market cost to hire non-related staff for those same roles?',
    helperText: 'Use a realistic replacement cost including salary, benefits, and statutory costs. Enter the amount in ₦ millions. Enter 0 if none.',
    tooltipText:
      'This estimates what a buyer would likely need to pay independent staff to perform those same roles after a transaction.',
    required: true,
    placeholder: 'e.g. 3.2',
    min: 0,
  },
  {
    id: 'privateExpensesAmount',
    type: 'currency',
    prompt: 'How much personal or private spending runs through the business each year?',
    helperText: 'Enter the amount in ₦ millions. Enter 0 if none.',
    tooltipText:
      'We add back personal expenses that are not needed to operate the business so the valuation reflects true maintainable business earnings.',
    required: true,
    placeholder: 'e.g. 1.5',
    min: 0,
  },
  {
    id: 'oneOffExpenseAmount',
    type: 'currency',
    prompt: 'In the latest year, how much expense in reported profit came from unusual or non-recurring items that should not be treated as ongoing?',
    helperText: 'Examples: one-time repairs, legal settlements, exceptional losses, or relocation costs. Enter the amount in ₦ millions. Enter 0 if none.',
    tooltipText:
      'We remove one-time expenses that are unlikely to repeat so the valuation is based on maintainable operating performance, not a distorted bad year.',
    required: true,
    placeholder: 'e.g. 2',
    min: 0,
  },
  {
    id: 'oneOffIncomeAmount',
    type: 'currency',
    prompt: 'In the latest year, how much income in reported profit came from unusual or non-recurring items that are unlikely to happen again?',
    helperText: 'Examples: asset sale gains, insurance recoveries, exceptional rebates, or one-time settlements. Enter the amount in ₦ millions. Enter 0 if none.',
    tooltipText:
      'We remove unusual income that is unlikely to repeat so the valuation reflects maintainable earnings rather than one-time boosts.',
    required: true,
    placeholder: 'e.g. 1.2',
    min: 0,
  },
  {
    id: 'nonCoreIncomeAmount',
    type: 'currency',
    prompt: 'In the latest year, how much income in reported profit came from activities outside the main business?',
    helperText: 'Examples: rent from non-core property, investment income, side ventures, or other income not required to run the core business. Enter the amount in ₦ millions. Enter 0 if none.',
    tooltipText:
      'We separate non-core income so the valuation focuses on the operating business a buyer is actually assessing.',
    required: true,
    placeholder: 'e.g. 2.8',
    min: 0,
  },
  {
    id: 'annualDepreciation',
    type: 'currency',
    prompt: 'What is the annual depreciation expense for the latest year?',
    helperText: 'Enter the amount in ₦ millions. Enter 0 if negligible or unknown.',
    tooltipText:
      'Depreciation helps us bridge between EBIT and EBITDA-style earnings and improves comparability across valuation methods.',
    required: false,
    placeholder: 'e.g. 2.5',
    min: 0,
  },
  {
    id: 'financialDebt',
    type: 'currency',
    prompt: 'What is the current financial debt balance?',
    helperText: 'Include loans and finance obligations. Enter the amount in ₦ millions.',
    tooltipText:
      'Financial debt reduces the equity value available to the seller even when enterprise value stays the same.',
    required: true,
    placeholder: 'e.g. 8',
    min: 0,
  },
  {
    id: 'shareholderLoans',
    type: 'currency',
    prompt: 'What is the balance of shareholder or director loans?',
    helperText: 'Enter the amount in ₦ millions. Enter 0 if none.',
    tooltipText:
      'Shareholder or director loans can change the final equity bridge and are important for understanding what a buyer would actually assume or repay.',
    required: true,
    placeholder: 'e.g. 5',
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
    helperText: 'Shown only when there was a specific offer. Enter the amount in ₦ millions.',
    required: false,
    placeholder: 'e.g. 50',
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
    id: 'lastName',
    type: 'text',
    prompt: 'Your last name',
    required: true,
    placeholder: 'e.g. Okafor',
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
