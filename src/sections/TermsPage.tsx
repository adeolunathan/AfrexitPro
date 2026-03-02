import { FileText, Shield, UserCheck, Scale, Lock, Gavel } from 'lucide-react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import type { LegalPage } from '@/types/legal';

interface TermsPageProps {
  onBack: () => void;
  onNavigate: (page: LegalPage) => void;
}

export function TermsPage({ onBack, onNavigate }: TermsPageProps) {
  return (
    <LegalPageShell
      activePage="terms"
      title="Terms of Use"
      summary="These terms govern your use of Afrexit's website, automated estimate tool, and related communications. They are designed to make the scope of the free tool clear and to separate it from any later paid advisory mandate."
      onBack={onBack}
      onNavigate={onNavigate}
    >
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-700" />
          <h2 className="text-xl font-bold text-black">1. What Afrexit Is and Is Not</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Afrexit is positioned as a transaction advisory platform focused on sell-side readiness and M&A support for SMEs.
          The free site tool is an automated preliminary business value estimate and buyer-readiness snapshot. Unless Afrexit
          separately agrees with you in writing, the tool is not an investment banking mandate, a regulated brokerage mandate,
          a fairness opinion, a certified valuation, a financing commitment, or an undertaking to find you a buyer.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">2. Eligibility and Authority</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          You must be at least 18 years old and legally able to use this Site. If you submit information for a company,
          you represent that you are authorized to share that information and to request an estimate or advisory follow-up
          for that business.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">3. No Advisory, Agency, Brokerage, or Fiduciary Relationship</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Using the Site, submitting the questionnaire, or receiving an estimate does not by itself create any banker-client,
          broker-client, fiduciary, legal, tax, accounting, valuation-engagement, agency, partnership, or joint-venture
          relationship between you and Afrexit. Afrexit does not represent you in any transaction unless both sides sign a
          separate written engagement document that expressly sets out the scope of work.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">4. Scope and Limits of the Free Tool</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          The estimate is generated from the information you provide, generalized market assumptions, and internal scoring logic.
          It is intended to help you understand likely value range and buyer-readiness issues. It does not account for every
          fact that could affect a real deal, including detailed diligence findings, buyer-specific synergies, tax structuring,
          legal defects, sanctions, title issues, fraud, or off-book liabilities.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">5. Confidentiality and Separate Mandate Documents</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Afrexit will handle submitted data in line with the Privacy Policy, but using the free tool does not by itself create
          a stand-alone NDA, privileged relationship, or exclusive mandate. If Afrexit later works with you on a live mandate,
          that relationship should be governed by separate documents, which may include an engagement letter, confidentiality or
          NDA terms, fee terms, conflicts disclosures, AML or KYC onboarding, and a clearly defined scope of mandate.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">6. Your Responsibilities</h2>
        </div>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-6 text-gray-700 sm:text-[15px]">
          <li>You must provide accurate, lawful, and non-misleading information.</li>
          <li>You remain responsible for any decisions you make using the output.</li>
          <li>You should obtain independent legal, tax, accounting, and regulatory advice before acting on a sale or acquisition.</li>
          <li>You may not submit confidential third-party information unless you are allowed to do so.</li>
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">7. Acceptable Use</h2>
        </div>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-6 text-gray-700 sm:text-[15px]">
          <li>You may not scrape, mirror, reverse engineer, or systematically extract data or outputs from the Site.</li>
          <li>You may not test the Site with fraudulent, abusive, infringing, or unlawful submissions.</li>
          <li>You may not interfere with the Site, attempt to bypass security, or use the tool to train competing systems.</li>
          <li>You may not reproduce Afrexit reports or materials as your own professional work product.</li>
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">8. Intellectual Property</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          The Site, branding, methodology descriptions, reports, designs, and underlying software are owned by Afrexit or its
          licensors. You may use the materials only for your internal evaluation of your business unless Afrexit gives written
          permission for broader use.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">9. Third-Party Providers</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Afrexit may rely on third-party hosting, storage, messaging, analytics, spreadsheet, and email providers to operate
          the service. Those providers act subject to their own terms and technical constraints. Afrexit is not responsible for
          outages or failures caused primarily by providers outside its reasonable control.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Gavel className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">10. Liability, Indemnity, and Governing Law</h2>
        </div>
        <p className="mb-3 text-sm leading-6 text-gray-700 sm:text-[15px]">
          To the maximum extent permitted by law, Afrexit is not liable for indirect, incidental, special, consequential, or
          reliance-based losses arising from your use of the free tool. You agree to indemnify Afrexit against claims arising
          from your misuse of the Site, unlawful submissions, or breach of these terms.
        </p>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          These terms are governed by the laws of the Federal Republic of Nigeria. Questions can be sent to
          {' '}<a href="mailto:hello@afrexit.com" className="font-medium text-purple-700 underline">hello@afrexit.com</a>{' '}
          or via WhatsApp at <span className="font-medium text-gray-900">+234 806 575 6001</span>.
        </p>
      </section>
    </LegalPageShell>
  );
}
