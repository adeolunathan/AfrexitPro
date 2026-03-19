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
  tooltipText?: string;
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
  title: 'Product Model & Operations',
  description: 'Because you selected a product-based business, we\'ll assess repeatability, defensibility, inventory discipline, and operating resilience.',
  shortDescription: 'product model, inventory, and operations',
  estimatedMinutes: 4,
  questionCount: 9,
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
      prompt: 'What is the current value tied up in stock, finished goods, or raw materials?',
      helperText: 'Enter 0 if this is mainly a service business.',
      required: true,
      placeholder: 'e.g. 18000000',
    },
    {
      id: 'productRights',
      type: 'select',
      prompt: 'Who mainly controls the commercial rights to the products you sell?',
      tooltipText:
        'This helps us assess defensibility. Product rights owned and controlled by the business usually support stronger buyer confidence than products anyone can replicate or rights owned by customers.',
      required: true,
      options: [
        { value: 'company_owned', label: 'The business owns or controls the key product rights, formulas, designs, or brand assets' },
        { value: 'mixed_control', label: 'The business controls some important rights, but not all of them' },
        { value: 'customer_owned', label: 'Important product rights mainly sit with customers, licensors, or external partners' },
        { value: 'public_domain', label: 'The offer is mostly unprotected, easy to copy, or effectively public-domain' },
        { value: 'not_sure', label: 'Not sure' },
      ],
    },
    {
      id: 'quantities',
      type: 'select',
      prompt: 'Which best describes how orders are usually fulfilled?',
      tooltipText:
        'This helps us assess repeatability and scalability. Businesses that sell standard products in repeatable volumes are usually easier to scale and transfer than businesses built around one-off custom jobs.',
      required: true,
      options: [
        { value: 'repeat_batches', label: 'Mostly repeatable standard products sold in regular or larger quantities' },
        { value: 'mixed_profile', label: 'A meaningful mix of standard-volume sales and custom work' },
        { value: 'mostly_custom', label: 'Mostly short-run, made-to-order, or customer-specific production' },
        { value: 'one_off_bespoke', label: 'Mostly one-off bespoke jobs with limited repeatability' },
        { value: 'not_sure', label: 'Not sure' },
      ],
    },
    {
      id: 'productCustomisation',
      type: 'select',
      prompt: 'How much delivery or production effort usually changes from one customer to another?',
      tooltipText:
        'This helps us assess operating repeatability. The more every order needs fresh tailoring, rework, or design effort, the harder the business is to scale cleanly.',
      required: true,
      options: [
        { value: 'standardized', label: 'Very little changes; the offer is largely standardised' },
        { value: 'configured', label: 'A standard core is sold, with limited configuration or finishing' },
        { value: 'tailored', label: 'Orders often need meaningful tailoring before delivery' },
        { value: 'fully_bespoke', label: 'Most jobs are effectively bespoke each time' },
        { value: 'not_sure', label: 'Not sure' },
      ],
    },
    {
      id: 'inventoryProfile',
      type: 'select',
      prompt: 'Which statement best fits your normal stock position?',
      required: true,
      options: [
        { value: 'lt_7', label: 'Usually under 7 days of stock on hand' },
        { value: '7_30', label: 'Usually about 7 to 30 days of stock on hand' },
        { value: '30_90', label: 'Usually about 30 to 90 days of stock on hand' },
        { value: 'gt_90', label: 'Usually over 90 days of stock on hand' },
      ],
    },
    {
      id: 'grossMarginStability',
      type: 'select',
      prompt: 'Over the last 3 completed years, how stable has gross margin been?',
      required: true,
      options: [
        { value: 'expanding', label: 'Margins have improved meaningfully over time' },
        { value: 'stable', label: 'Margins are usually within about +/-3 percentage points year to year' },
        { value: 'volatile', label: 'Margins often move materially from year to year' },
        { value: 'contracting', label: 'Margins are clearly compressing or under sustained pressure' },
      ],
    },
    {
      id: 'supplierConcentration',
      type: 'select',
      prompt: 'About what share of purchases comes from your single largest supplier?',
      helperText: 'This helps us estimate supplier-switching risk and operating resilience.',
      required: true,
      options: [
        { value: 'diversified', label: 'Under about 20%' },
        { value: 'moderate', label: 'About 20% to 35%' },
        { value: 'concentrated', label: 'About 35% to 60%' },
        { value: 'single_source', label: 'Over 60% or effectively single-source' },
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
      prompt: 'About what share of revenue depends on customers buying mainly because of you personally?',
      tooltipText:
        "This helps us measure how much revenue could be at risk if the owner is no longer the main relationship or delivery point.",
      required: true,
      options: [
        { value: 'very_little', label: 'Under about 10%' },
        { value: 'some', label: 'About 10% to 30%' },
        { value: 'large_share', label: 'About 30% to 60%' },
        { value: 'most', label: 'Over about 60%' },
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
      prompt: 'How does your realized pricing usually compare with the market rate for similar providers?',
      required: true,
      options: [
        { value: 'premium', label: 'Usually more than about 10% above market' },
        { value: 'market', label: 'Usually within about +/-10% of market' },
        { value: 'slight_discount', label: 'Usually about 10% to 20% below market' },
        { value: 'significant_discount', label: 'Usually more than about 20% below market' },
      ],
    },
  ],
};

// BRANCH 3: Manufacturing/Production
export const manufacturingBranch: BranchModule = {
  id: 'manufacturing',
  title: 'Production Model & Factory Economics',
  description: 'Because you selected manufacturing, we\'ll assess repeatability, value capture, capacity, equipment quality, and production risk.',
  shortDescription: 'production model, equipment, and capacity',
  estimatedMinutes: 4,
  questionCount: 9,
  trigger: (level2) => [
    'manufacturing',
    'assembly',
    'production',
    'light_manufacturing',
    'fabrication',
  ].includes(level2),
  questions: [
    {
      id: 'productRights',
      type: 'select',
      prompt: 'Who mainly controls the commercial rights to the products you manufacture?',
      tooltipText:
        'This helps us assess defensibility. Manufacturing businesses with protected designs, formulas, or owned brands are usually harder to copy and easier to defend.',
      required: true,
      options: [
        { value: 'company_owned', label: 'The business owns or controls the key product rights, formulas, designs, or brand assets' },
        { value: 'mixed_control', label: 'The business controls some important rights, but not all of them' },
        { value: 'customer_owned', label: 'Important product rights mainly sit with customers, licensors, or external partners' },
        { value: 'public_domain', label: 'The offer is mostly unprotected, easy to copy, or effectively public-domain' },
        { value: 'not_sure', label: 'Not sure' },
      ],
    },
    {
      id: 'quantities',
      type: 'select',
      prompt: 'Which best describes the production pattern in your factory today?',
      tooltipText:
        'This helps us assess repeatability and scale efficiency. Longer production runs and repeat batches are usually easier to plan, staff, and scale than one-off work.',
      required: true,
      options: [
        { value: 'repeat_batches', label: 'Mostly repeat batches or standard products made in regular quantities' },
        { value: 'mixed_profile', label: 'A meaningful mix of repeat production and custom jobs' },
        { value: 'mostly_custom', label: 'Mostly short-run, made-to-order, or customer-specific production' },
        { value: 'one_off_bespoke', label: 'Mostly one-off bespoke jobs with limited repeatability' },
        { value: 'not_sure', label: 'Not sure' },
      ],
    },
    {
      id: 'productCustomisation',
      type: 'select',
      prompt: 'How much engineering, tooling, or production effort usually changes from one order to another?',
      tooltipText:
        'This measures how standardised production really is. More order-specific rework generally reduces scalability and makes performance more dependent on specific people or processes.',
      required: true,
      options: [
        { value: 'standardized', label: 'Very little changes; production is largely standardised' },
        { value: 'configured', label: 'The core product is standard, with limited configuration or finishing' },
        { value: 'tailored', label: 'Orders often need meaningful adaptation before delivery' },
        { value: 'fully_bespoke', label: 'Most jobs are effectively bespoke each time' },
        { value: 'not_sure', label: 'Not sure' },
      ],
    },
    {
      id: 'manufacturingValueCreation',
      type: 'select',
      prompt: 'Where is most of the manufacturing value actually created?',
      tooltipText:
        'This helps us assess whether value creation sits inside the business or mainly with subcontractors and suppliers. More in-house control can support defensibility, margins, and transferability.',
      required: true,
      options: [
        { value: 'in_house_majority', label: 'The business itself performs most of the value-adding production work' },
        { value: 'balanced', label: 'Value creation is meaningfully split between the business and outside partners' },
        { value: 'outsourced_majority', label: 'A majority of value creation sits with subcontractors or suppliers' },
        { value: 'assembly_only', label: 'The business mainly assembles, coordinates, or resells rather than manufacturing deeply' },
        { value: 'not_sure', label: 'Not sure' },
      ],
    },
    {
      id: 'capacityUtilization',
      type: 'select',
      prompt: 'What is current practical capacity utilisation?',
      required: true,
      options: [
        { value: 'gt_90', label: 'Above 90%; the plant is close to practical limits' },
        { value: '70_90', label: 'About 70% to 90%; capacity is being used well' },
        { value: '50_70', label: 'About 50% to 70%; there is still room to absorb growth' },
        { value: 'lt_50', label: 'Below 50%; there is significant unused capacity' },
      ],
    },
    {
      id: 'equipmentAgeCondition',
      type: 'select',
      prompt: 'How would you describe the age and condition of the main production equipment?',
      required: true,
      options: [
        { value: 'modern', label: 'Modern and well maintained, with no near-term replacement concern' },
        { value: 'good', label: 'In good working order with normal maintenance requirements' },
        { value: 'aging', label: 'Still functional, but meaningful replacement or refurbishment is approaching' },
        { value: 'outdated', label: 'Aging or constrained enough to require significant reinvestment' },
      ],
    },
    {
      id: 'maintenanceCapexLatest',
      type: 'number',
      prompt: 'How much do you typically spend each year just to maintain existing equipment and keep production running?',
      helperText: 'Use naira. Enter 0 if negligible.',
      required: true,
      placeholder: 'e.g. 3500000',
    },
    {
      id: 'rawMaterialPriceExposure',
      type: 'select',
      prompt: 'How exposed are margins to raw-material price swings?',
      required: true,
      options: [
        { value: 'minimal', label: 'Low exposure; prices are stable or mostly passed through' },
        { value: 'moderate', label: 'Moderate exposure; some margin pressure is manageable' },
        { value: 'significant', label: 'Significant exposure; raw-material moves affect margins materially' },
        { value: 'critical', label: 'Critical exposure; raw-material moves can severely disrupt profitability' },
      ],
    },
    {
      id: 'qualityCertifications',
      type: 'select',
      prompt: 'What is the current status of quality or process certifications relevant to your market?',
      required: true,
      options: [
        { value: 'major', label: 'Recognised international or major customer-required certifications are in place' },
        { value: 'local', label: 'Relevant local or industry-specific certifications are in place' },
        { value: 'in_progress', label: 'Certification work is in progress but not yet completed' },
        { value: 'none', label: 'No meaningful certifications are currently in place' },
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
