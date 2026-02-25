import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronRight, TrendingUp as Trend, Shield, Users, Building2, FileText, Wallet, BarChart3, Lock, Award } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const nineFactors = [
  {
    icon: Trend,
    title: 'Financial Performance',
    description: 'Revenue trends, profitability, and growth trajectory',
  },
  {
    icon: Shield,
    title: 'Documentation Quality',
    description: 'Bank records, invoices, and financial transparency',
  },
  {
    icon: Users,
    title: 'Customer Concentration',
    description: 'Dependency on personal relationships vs. brand loyalty',
  },
  {
    icon: Building2,
    title: 'Operational Independence',
    description: 'Can the business run without the owner?',
  },
  {
    icon: FileText,
    title: 'Supplier Relationships',
    description: 'Credit terms and verified payment history',
  },
  {
    icon: Wallet,
    title: 'Working Capital',
    description: 'Inventory management and debtor/creditor position',
  },
  {
    icon: BarChart3,
    title: 'Market Position',
    description: 'Competitive advantage and defensibility',
  },
  {
    icon: Lock,
    title: 'Asset Ownership',
    description: 'Clear title to equipment, stock, and property',
  },
  {
    icon: Award,
    title: 'Transferability',
    description: 'Ease of handing over to a new owner',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Answer Questions',
    description: 'Complete our 24-question assessment about your business operations, finances, and structure.',
  },
  {
    step: '02',
    title: 'We Analyze',
    description: 'Our system evaluates your responses against market data and buyer criteria.',
  },
  {
    step: '03',
    title: 'Get Your Report',
    description: 'Receive a detailed valuation report via email within 24 hours.',
  },
];

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img
                src="/logo-mark.png"
                alt="Afrexit logo"
                className="w-16 h-16 sm:w-10 sm:h-10 object-contain shrink-0"
              />
              <span className="text-4xl font-bold">
                <span className="text-purple-600">Afr</span>
                <span className="text-blue-600">Exit</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <span>Built for Nigerian SMEs</span>
              <span className="text-purple-600">•</span>
              <span>Free Valuation Tool</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-600">Now serving Nigerian businesses nationwide</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-black">Discover What Your </span>
            <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">Business</span>
            <span className="text-black"> is </span>
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">Really Worth</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Get a professional valuation based on 9 critical factors that buyers actually care about. Designed specifically for Nigerian SMEs.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={onStart}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg shadow-purple-200"
            >
              Start Your Valuation
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="px-6 py-6 text-base font-semibold border-gray-300 text-black hover:bg-gray-50"
                >
                  How It Works
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
                <div className="p-5 sm:p-6">
                  <DialogHeader className="text-left">
                    <DialogTitle className="text-xl text-black">
                      How It Works
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                      Three steps to get your valuation report.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {howItWorks.map((item) => (
                      <div
                        key={item.step}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left"
                      >
                        <div className="text-xs font-semibold tracking-[0.16em] text-purple mb-2">
                          STEP {item.step}
                        </div>
                        <h3 className="text-sm font-bold text-black mb-1.5">
                          {item.title}
                        </h3>
                        <p className="text-xs leading-5 text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Takes 5-7 minutes • Free report
          </p>
        </div>
      </section>

      {/* 9-Factor Framework Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-black">
              The <span className="text-purple">9-Factor</span> Valuation Framework
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Our assessment evaluates your business across nine dimensions that determine real market value in the Nigerian context.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nineFactors.map((factor, index) => (
              <div
                key={index}
                className="bg-white rounded-md border border-gray-200 p-3 hover:shadow-sm transition-shadow"
              >
                <div className="w-8 h-8 rounded-md bg-purple/10 flex items-center justify-center mb-2">
                  <factor.icon className="w-4 h-4 text-purple" />
                </div>
                <h3 className="text-sm font-bold mb-1 text-black leading-snug">{factor.title}</h3>
                <p className="text-xs leading-4 text-gray-500">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 border-t border-gray-200">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-gray-400">
            © 2026 Afrexit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
