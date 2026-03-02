export interface Question {
  id: string;
  type: 'select' | 'number' | 'text' | 'contact';
  question: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface FormData {
  [key: string]: string;
}

export interface ValuationResult {
  status: string;
  message?: string;
  data?: {
    lowEstimate: string;
    highEstimate: string;
    adjustedValue: string;
    sellabilityScore: number;
    rating: string;
    diagId: string;
    warnings?: string[];
  };
}

// Questions exactly as in the working standalone HTML
export const questions: Question[] = [
  { type: "select", id: "industry", question: "What industry best describes your business?", required: true,
    options: ["Retail/E-commerce","Food & Beverage","Professional Services","Personal Services","Manufacturing/Production","Logistics/Transportation","Technology/Software","Healthcare","Education/Training","Wholesale/Distribution","Other"] },
  { type: "select", id: "location", question: "Where is your business located?", required: true,
    options: ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT (Abuja)","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos - Island","Lagos - Mainland","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"] },
  { type: "select", id: "age", question: "How long has the business been operating?", required: true,
    options: ["Less than 1 year","1-3 years","3-5 years","5-10 years","10-20 years","More than 20 years"] },
  { type: "number", id: "revenue", question: "What is your annual revenue (₦)?", placeholder: "e.g., 80000000", required: false },
  { type: "number", id: "profit", question: "What is your annual profit (₦)?", placeholder: "e.g., 34000000", required: false },
  { type: "select", id: "growth", question: "How is the business trending?", required: true,
    options: ["Growing significantly (20%+ per year)","Growing moderately (10-20% per year)","Growing slightly (0-10% per year)","Stable (no growth no decline)","Declining slightly (0-10% per year)","Declining significantly (10%+ per year)"] },
  { type: "select", id: "q7", question: "How quickly could you prove your revenue/profit to a serious buyer?", required: true,
    options: ["Show them bank statements and invoices immediately","Need a day to organize records but could prove it","Struggle to prove exact amounts but could show patterns","Honestly it would be very difficult"] },
  { type: "select", id: "q8", question: "What % of payments go through bank channels?", required: true,
    options: ["80-100% (most payments banked)","50-80% (mix of bank and cash)","20-50% (mostly cash some banking)","Less than 20% (mostly cash)"] },
  { type: "select", id: "q9", question: "How do you pay rent (or facility costs)?", required: true,
    options: ["Bank transfer to landlord's business account with receipt","Bank transfer to landlord's personal account","Cash with proper receipt","Cash sometimes with receipt","Cash no receipt","I don't rent, I have my own space"] },
  { type: "select", id: "q10", question: "Do you have significant outside obligations or liabilities?", required: true,
    options: ["Nothing or minimal (less than ₦50k)","Moderate (₦50k - ₦200k)","Significant (₦200k - ₦500k)","Very significant (₦500k+)"] },
  { type: "select", id: "q11", question: "Do you have clean business banking statements?", required: true,
    options: ["Yes clean statements with clear business transactions","Yes but mixed with personal transactions","Partially some months missing or incomplete","No I don't bank most transactions"] },
  { type: "select", id: "q12", question: "If you stop working for 2 weeks, what happens?", required: true,
    options: ["Run smoothly without me","Run with minor issues nothing critical","Struggle significantly might lose customers","Effectively stop operating"] },
  { type: "select", id: "q13", question: "How documented is key operational knowledge?", required: true,
    options: ["Multiple people everything is documented","One or two people know most of it","One person knows some of it","Only I know this information"] },
  { type: "select", id: "q14", question: "Who manages daily operations and controls?", required: true,
    options: ["Multiple people with clear systems and controls","Trusted employee handles it with my oversight","I handle it but family member sometimes helps","I handle everything personally"] },
  { type: "select", id: "q15", question: "How long would it take to train a new manager?", required: true,
    options: ["Less than 1 week (it's documented and simple)","1-2 weeks (some documentation mostly shadowing)","1-2 months (need to learn by doing)","3+ months (complex mostly in my head)"] },
  { type: "select", id: "q16", question: "How do you track finances day-to-day?", required: true,
    options: ["Software/app with full records","Spreadsheet or written ledger updated regularly","Written notes sometimes incomplete","Mental notes or no formal tracking"] },
  { type: "select", id: "q17", question: "How much inventory do you typically hold?", required: true,
    options: ["Less than 7 days (lean inventory)","7-30 days (normal working stock)","30-90 days (significant stock on hand)","90+ days (heavy inventory)","I don't hold stock, I run a services business"] },
  { type: "select", id: "q18", question: "What does your working capital position look like?", required: true,
    options: ["Positive (customers owe me more)","Roughly break even","Negative (I owe suppliers more)","I don't really know"] },
  { type: "select", id: "q19", question: "Are business assets clearly separated and verifiable?", required: true,
    options: ["No everything is in the business location","Yes minor items (less than ₦500k value)","Yes significant stock/equipment (₦500k - ₦2M)","Yes substantial assets (₦2M+)"] },
  { type: "select", id: "q20", question: "How dependent is revenue on you personally?", required: true,
    options: ["Less than 20% (they buy for product/price/location)","20-40% (mix of relationship and product)","40-60% (relationships matter a lot)","More than 60% (mostly personal relationships)"] },
  { type: "select", id: "q21", question: "Why do customers choose you vs competitors?", required: true,
    options: ["Service quality and customer relationships (defensible)","Unique products or expertise they can't match","Match their prices (commodity business)","Hope customers stay loyal"] },
  { type: "select", id: "q22", question: "Could a buyer keep your key suppliers easily?", required: true,
    options: ["Yes definitely","Probably yes","Maybe depends on the supplier","Probably not or I'm not sure"] },
  { type: "select", id: "q23", question: "Why are you checking your business value?", required: true,
    options: ["Actively planning to sell soon (within 6 months)","Thinking about selling (6-12 months)","Planning for future sale (1-2 years)","Just curious about value","Other reason"] },
  { type: "select", id: "q24", question: "If you had to sell, how long could you wait?", required: true,
    options: ["6+ months comfortably","3-6 months","1-3 months","Less than 1 month (need to sell urgently)"] },
  { type: "select", id: "distressSale", question: "Are you under urgent pressure to sell?", required: true,
    options: ["No, I'm not under pressure","Yes, I may need to sell urgently"] },
  { type: "contact", id: "contact", question: "Where should we send your estimate summary?", required: true }
];

// Google Apps Script URL from working HTML
export const API_URL = "https://script.google.com/macros/s/AKfycbyyBwKT1O4CxCoPnC4W07qE-cJYsH_1PP6IJMU3c6aB6Wi7cXXhGSTSc7zAIcvl1gnyDg/exec";
