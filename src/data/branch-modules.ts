// Branch Module System for Adaptive Questionnaire
// Each branch contains business model-specific questions

import type { OwnerFieldId } from '@/valuation-engine/owner-intake';

export type QuestionType = 'select' | 'number' | 'text' | 'textarea' | 'email' | 'tel' | 'checkbox';

export interface Option {
  value: string;
  label: string;
}

export interface BranchQuestion {
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

export interface BranchModule {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  estimatedMinutes: number;
  questionCount: number;
  // Trigger function - returns true if this branch should be shown
  trigger: (level2: string, answers: Record<string, unknown>) => boolean;
  questions: BranchQuestion[];
  // Skip logic - returns array of question IDs to skip based on answers
  skipLogic?: (answers: Record<string, unknown>) => string[];
}

// BRANCH 1: Product/Retail/Distribution
export const productRetailBranch: BranchModule = {
  id: 'product_retail',
  title: 'Inventory & Operations Deep-Dive',
  description: 'Because you selected a product-based business, we\'ll ask about inventory, suppliers, and operational efficiency.',
  shortDescription: 'inventory, suppliers, and operations',
  estimatedMinutes: 4,
  questionCount: 6,
  trigger: (level2) => [
    'retail_physical',
    'retail_ecommerce', 
    'wholesale',
    'distribution',
    'food_restaurant',
    'food_fast_food',
  ].includes(level2),
  questions: [
    {
      id: 'inventoryValueLatest',
      type: 'number',
      prompt: 'What is the current inventory value tied up in stock or raw materials?',
      helperText: 'Enter 0 if this is mainly a service business.',
      required: true,
      placeholder: 'e.g. 18000000',
    },
    {
      id: 'inventoryProfile',
      type: 'select',
      prompt: 'Which best describes your inventory position?',
      required: true,
      options: [
        { value: 'lt_7', label: 'Less than 7 days of stock' },
        { value: '7_30', label: '7 to 30 days of stock' },
        { value: '30_90', label: '30 to 90 days of stock' },
        { value: 'gt_90', label: 'More than 90 days of stock' },
      ],
    },
    {
      id: 'grossMarginStability',
      type: 'select',
      prompt: 'How stable are your gross margins year to year?',
      required: true,
      options: [
        { value: 'expanding', label: 'Expanding - margins improving' },
        { value: 'stable', label: 'Stable - consistent margins' },
        { value: 'volatile', label: 'Volatile - significant fluctuations' },
        { value: 'contracting', label: 'Contracting - margins under pressure' },
      ],
    },
    {
      id: 'supplierConcentration',
      type: 'select',
      prompt: 'How concentrated are your suppliers?',
      helperText: 'Do you rely on one or two key suppliers, or do you have options?',
      required: true,
      options: [
        { value: 'diversified', label: 'Diversified - many supplier options' },
        { value: 'moderate', label: 'Moderate - several main suppliers' },
        { value: 'concentrated', label: 'Concentrated - 2-3 key suppliers' },
        { value: 'single_source', label: 'Single source - one critical supplier' },
      ],
    },
    {
      id: 'shrinkageSpoilage',
      type: 'select',
      prompt: 'Do you experience significant shrinkage, spoilage, or inventory loss?',
      required: true,
      options: [
        { value: 'minimal', label: 'Minimal - less than 1% of inventory value' },
        { value: 'moderate', label: 'Moderate - 1-3% of inventory value' },
        { value: 'significant', label: 'Significant - 3-5% of inventory value' },
        { value: 'major', label: 'Major - more than 5% of inventory value' },
      ],
    },
    {
      id: 'peakSeasonDependency',
      type: 'select',
      prompt: 'How dependent is your business on peak seasons?',
      required: true,
      options: [
        { value: 'flat', label: 'Flat - revenue consistent year-round' },
        { value: 'slight', label: 'Slight - 10-20% variance by season' },
        { value: 'moderate', label: 'Moderate - 20-50% variance by season' },
        { value: 'extreme', label: 'Extreme - over 50% in peak season' },
      ],
    },
  ],
  skipLogic: (answers) => {
    const skip: string[] = [];
    // If they said they don't hold inventory, skip inventory questions
    if (answers.inventoryProfile === 'service_business') {
      skip.push('inventoryValueLatest', 'inventoryProfile');
    }
    return skip;
  },
};

// BRANCH 2: Professional Services
export const professionalServicesBranch: BranchModule = {
  id: 'professional_services',
  title: 'Client Base & Team Capability',
  description: 'Because you selected a service-based business, we\'ll focus on client relationships, recurring revenue, and how dependent the business is on you personally.',
  shortDescription: 'client relationships and team capability',
  estimatedMinutes: 4,
  questionCount: 6,
  trigger: (level2) => [
    'consulting',
    'legal',
    'accounting',
    'agency',
    'advisory',
    'professional_services',
    'personal_services',
  ].includes(level2),
  questions: [
    {
      id: 'founderRevenueDependence',
      type: 'select',
      prompt: 'How much of revenue depends on customers buying mainly because of you personally?',
      required: true,
      options: [
        { value: 'very_little', label: 'Very little - clients buy the brand/service' },
        { value: 'some', label: 'Some - personal relationships help' },
        { value: 'large_share', label: 'Large share - my involvement is key' },
        { value: 'most', label: 'Most - clients are buying me personally' },
      ],
    },
    {
      id: 'recurringRevenueShare',
      type: 'select',
      prompt: 'How much of your revenue is recurring or contract-backed?',
      helperText: 'Subscriptions, retainers, recurring purchase patterns, maintenance contracts.',
      required: true,
      options: [
        { value: 'very_little', label: 'Very little - mostly one-off projects' },
        { value: 'some', label: 'Some - mix of project and recurring' },
        { value: 'meaningful', label: 'Meaningful - 40-60% recurring' },
        { value: 'large_share', label: 'Large share - over 60% recurring' },
      ],
    },
    {
      id: 'revenueVisibility',
      type: 'select',
      prompt: 'How visible is future revenue today?',
      required: true,
      options: [
        { value: 'contract_backed', label: 'Strong recurring or contract-backed visibility' },
        { value: 'good_repeat', label: 'Good repeat business pattern' },
        { value: 'some_repeat', label: 'Some repeat business' },
        { value: 'unpredictable', label: 'Mostly one-off and unpredictable' },
      ],
    },
    {
      id: 'staffUtilization',
      type: 'select',
      prompt: 'What is your typical staff utilization rate?',
      helperText: 'Percentage of billable hours vs total available hours',
      required: true,
      options: [
        { value: 'gt_80', label: 'Over 80% - highly utilized' },
        { value: '60_80', label: '60-80% - good utilization' },
        { value: '40_60', label: '40-60% - moderate utilization' },
        { value: 'lt_40', label: 'Under 40% - significant idle capacity' },
      ],
    },
    {
      id: 'keyPersonDependencies',
      type: 'select',
      prompt: 'Besides yourself, how many key people could not easily be replaced?',
      required: true,
      options: [
        { value: 'none', label: 'None - team is replaceable' },
        { value: 'one', label: 'One key person' },
        { value: 'few', label: '2-3 key people' },
        { value: 'many', label: 'More than 3 critical people' },
      ],
    },
    {
      id: 'pricingPowerVsMarket',
      type: 'select',
      prompt: 'How does your pricing compare to market rates?',
      required: true,
      options: [
        { value: 'premium', label: 'Premium - we charge above market rates' },
        { value: 'market', label: 'Market rate - competitive with peers' },
        { value: 'slight_discount', label: 'Slight discount - competitive pressure' },
        { value: 'significant_discount', label: 'Significant discount - price competition' },
      ],
    },
  ],
};

// BRANCH 3: Manufacturing/Production
export const manufacturingBranch: BranchModule = {
  id: 'manufacturing',
  title: 'Production Capacity & Equipment',
  description: 'Because you selected Manufacturing, we\'ll ask about equipment, utilization, and production constraints.',
  shortDescription: 'equipment, utilization, and capacity',
  estimatedMinutes: 4,
  questionCount: 5,
  trigger: (level2) => [
    'manufacturing',
    'assembly',
    'production',
    'light_manufacturing',
    'fabrication',
  ].includes(level2),
  questions: [
    {
      id: 'capacityUtilization',
      type: 'select',
      prompt: 'What is your current capacity utilization?',
      required: true,
      options: [
        { value: 'gt_90', label: 'Over 90% - near maximum capacity' },
        { value: '70_90', label: '70-90% - good utilization' },
        { value: '50_70', label: '50-70% - moderate utilization' },
        { value: 'lt_50', label: 'Under 50% - significant idle capacity' },
      ],
    },
    {
      id: 'equipmentAgeCondition',
      type: 'select',
      prompt: 'How would you describe your main equipment age and condition?',
      required: true,
      options: [
        { value: 'modern', label: 'Modern - well maintained, recent purchase' },
        { value: 'good', label: 'Good - functional, regular maintenance' },
        { value: 'aging', label: 'Aging - functional but nearing replacement' },
        { value: 'outdated', label: 'Outdated - requires significant investment' },
      ],
    },
    {
      id: 'maintenanceCapexLatest',
      type: 'number',
      prompt: 'How much do you spend annually on equipment maintenance and upkeep?',
      helperText: 'Use naira. Enter 0 if negligible.',
      required: true,
      placeholder: 'e.g. 3500000',
    },
    {
      id: 'rawMaterialPriceExposure',
      type: 'select',
      prompt: 'How exposed are you to raw material price fluctuations?',
      required: true,
      options: [
        { value: 'minimal', label: 'Minimal - long-term contracts or hedging' },
        { value: 'moderate', label: 'Moderate - some pass-through ability' },
        { value: 'significant', label: 'Significant - prices affect margins materially' },
        { value: 'critical', label: 'Critical - major vulnerability to price swings' },
      ],
    },
    {
      id: 'qualityCertifications',
      type: 'select',
      prompt: 'Do you hold quality certifications (ISO, industry-specific, etc.)?',
      required: true,
      options: [
        { value: 'major', label: 'Yes - internationally recognized certifications' },
        { value: 'local', label: 'Yes - local or industry-specific certifications' },
        { value: 'in_progress', label: 'In progress' },
        { value: 'none', label: 'None' },
      ],
    },
  ],
};

// BRANCH REGISTRY - Add new branches here
export const branchRegistry: BranchModule[] = [
  productRetailBranch,
  professionalServicesBranch,
  manufacturingBranch,
];

// Detect which branches apply based on answers
export function detectBranches(level2: string, answers: Record<string, unknown>): BranchModule[] {
  return branchRegistry.filter(branch => branch.trigger(level2, answers));
}

// Get questions for a branch, applying skip logic
export function getBranchQuestions(
  branch: BranchModule, 
  answers: Record<string, unknown>
): BranchQuestion[] {
  const skipIds = branch.skipLogic?.(answers) || [];
  return branch.questions.filter(q => !skipIds.includes(q.id));
}

// Calculate total questions across all branches
export function calculateTotalQuestions(
  anchorCount: number,
  branches: BranchModule[],
  closingCount: number,
  answers: Record<string, unknown>
): number {
  const branchQuestions = branches.reduce(
    (total, branch) => total + getBranchQuestions(branch, answers).length,
    0
  );
  return anchorCount + branchQuestions + closingCount;
}
