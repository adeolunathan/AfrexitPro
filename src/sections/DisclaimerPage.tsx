import { AlertTriangle, Scale, BriefcaseBusiness, Shield, CircleOff } from 'lucide-react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import type { LegalPage } from '@/types/legal';

interface DisclaimerPageProps {
  onBack: () => void;
  onNavigate: (page: LegalPage) => void;
}

export function DisclaimerPage({ onBack, onNavigate }: DisclaimerPageProps) {
  return (
    <LegalPageShell
      activePage="disclaimer"
      title="Important Disclosures"
      summary="These disclosures explain what the automated estimate is meant to do, where its limits are, and why a real live transaction still requires human diligence, proper advisors, and separate written mandate documents."
      onBack={onBack}
      onNavigate={onNavigate}
    >
      <section className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-700" />
          <h2 className="text-xl font-bold text-black">1. This Tool Produces a Preliminary Estimate</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Afrexit's free tool is an automated preliminary business value estimate and buyer-readiness screen built for Nigerian
          SMEs. It uses your inputs and internal weighting logic to give you a directional range. It is not a certified valuation,
          fairness opinion, audit, or formal professional appraisal.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">2. No Financial, Legal, Tax, or Investment Advice</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Nothing on the Site or in the estimate should be treated as financial advice, investment advice, legal advice, tax
          advice, or a recommendation to buy, sell, or transfer a business. You should consult qualified advisors before acting
          on any proposed transaction.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <BriefcaseBusiness className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">3. No Promise of Sale Price or Buyer Outcome</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          A real transaction depends on diligence, documentation quality, liabilities, tax structuring, negotiation leverage,
          buyer appetite, FX conditions, working capital adjustments, representations and warranties, and other deal terms. The
          estimate does not guarantee that a buyer will pay the output range or that a transaction will close at all.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <CircleOff className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">4. No Mandate, No Representation, No Exclusive Relationship</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Using the tool or speaking with Afrexit after receiving the estimate does not automatically make Afrexit your sell-side
          advisor, M&A representative, broker, or exclusive agent. Any live transaction work starts only after a separate written
          agreement clearly states what Afrexit will and will not do for you.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">5. You Are Responsible for the Inputs</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          The estimate is only as good as the information you submit. Inaccurate revenue, profit, liabilities, operating history,
          or readiness answers can materially distort the output. Afrexit may flag unusual data patterns, but it does not verify
          every number or statement at the free-tool stage.
        </p>
      </section>
    </LegalPageShell>
  );
}
