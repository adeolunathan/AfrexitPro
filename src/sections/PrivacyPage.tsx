import { Database, Lock, Globe, Bell, UserCheck, ShieldCheck } from 'lucide-react';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import type { LegalPage } from '@/types/legal';

interface PrivacyPageProps {
  onBack: () => void;
  onNavigate: (page: LegalPage) => void;
}

export function PrivacyPage({ onBack, onNavigate }: PrivacyPageProps) {
  return (
    <LegalPageShell
      activePage="privacy"
      title="Privacy Policy"
      summary="This policy explains what information Afrexit collects, why it is used, how long it is kept, and the choices available to you when you use the estimate tool or contact Afrexit about advisory services."
      onBack={onBack}
      onNavigate={onNavigate}
    >
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-emerald-700" />
          <h2 className="text-xl font-bold text-black">1. Information We Collect</h2>
        </div>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-6 text-gray-700 sm:text-[15px]">
          <li>Identity and contact data such as first name, business name, email address, WhatsApp number, and country code.</li>
          <li>Business and financial inputs such as industry, location, revenue, profit, growth, buyer-readiness answers, and urgency to sell.</li>
          <li>Communication and consent records, including whether you accepted the Terms and Privacy Policy and whether you opted into marketing.</li>
          <li>Basic technical data such as timestamps, browser-generated requests, and troubleshooting or diagnostic records needed to secure the service.</li>
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">2. Why We Use Your Information</h2>
        </div>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-6 text-gray-700 sm:text-[15px]">
          <li>To generate and deliver your preliminary business value estimate and buyer-readiness output.</li>
          <li>To respond to your questions and to discuss potential sell-side readiness or M&A support if you ask for follow-up.</li>
          <li>To maintain records, prevent abuse, investigate suspicious activity, and improve the reliability of the tool.</li>
          <li>To send marketing or insight content only where you have opted in or another lawful basis applies.</li>
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">3. Lawful Bases We Rely On</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Depending on the context, Afrexit may process data because you requested the estimate, because Afrexit has a legitimate
          interest in operating and securing the service, because Afrexit must keep records required by law, or because you gave
          consent. Marketing communications should be treated as consent-based, and you can opt out later.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">4. Automated Estimates and Human Follow-Up</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          The tool uses automated inputs and scoring logic to generate a preliminary estimate. It does not make binding decisions
          about eligibility, financing, or representation. If you want a person to review the estimate or discuss next steps, you
          can contact Afrexit directly. Any live advisory work requires a separate written engagement.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">5. Sharing, Processors, and Cross-Border Transfers</h2>
        </div>
        <p className="mb-3 text-sm leading-6 text-gray-700 sm:text-[15px]">
          Afrexit may share data only with service providers and processors needed to run the Site and communicate with you, such as
          hosting providers, cloud spreadsheet or storage providers, email delivery tools, and messaging platforms. Afrexit may also
          disclose information where required by law, to protect rights, or in connection with a business restructuring.
        </p>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Because these providers may operate in multiple countries, your information may be processed outside Nigeria. Where that
          happens, Afrexit aims to use providers with appropriate security measures and contractual protections.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">6. Retention and Security</h2>
        </div>
        <p className="mb-3 text-sm leading-6 text-gray-700 sm:text-[15px]">
          Afrexit keeps estimate submissions, communication records, and diagnostic logs only for as long as reasonably needed for
          service delivery, follow-up, security, dispute handling, or legal compliance. As a working baseline, estimate data may be
          retained for up to 24 months unless a longer period is required for an active engagement or legal reason.
        </p>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Afrexit uses reasonable technical and organizational safeguards, but no system can promise absolute security or uninterrupted
          availability.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">7. Your Rights</h2>
        </div>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-6 text-gray-700 sm:text-[15px]">
          <li>You can request access to personal data Afrexit holds about you.</li>
          <li>You can ask Afrexit to correct inaccurate or incomplete information.</li>
          <li>You can ask Afrexit to delete data, subject to legal or operational retention needs.</li>
          <li>You can withdraw marketing consent or object to certain processing.</li>
          <li>You can complain to Afrexit first and, where applicable, to the relevant Nigerian data protection authority.</li>
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-black">8. Contact</h2>
        </div>
        <p className="text-sm leading-6 text-gray-700 sm:text-[15px]">
          Privacy questions, access requests, correction requests, deletion requests, and consent withdrawals can be sent to
          {' '}<a href="mailto:hello@afrexit.com" className="font-medium text-purple-700 underline">hello@afrexit.com</a>.
          Please include enough detail for Afrexit to locate your record.
        </p>
      </section>
    </LegalPageShell>
  );
}
