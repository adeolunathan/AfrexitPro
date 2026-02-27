import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  MessageCircle,
  Instagram,
  Youtube,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface SuccessPageProps {
  onRestart: () => void;
}

export function SuccessPage({ onRestart }: SuccessPageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onRestart}
              aria-label="Go to homepage"
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-purple rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-black">
                <span className="text-purple">Afr</span>
                <span className="text-blue">exit</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 sm:px-6">
        <div className="w-full max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center border border-green-200">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Thank You Message */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-black">
            Thank You! Your Valuation is <span className="text-purple">In Progress</span>
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
            We've received your business information and our team is analyzing your responses 
            against our 9-factor valuation framework.
          </p>

          {/* What Happens Next */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2 text-black">
              <Clock className="w-5 h-5 text-purple" />
              What Happens Next
            </h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-purple font-semibold">1</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="text-black font-medium">Check your email</span> - We've sent a confirmation 
                    and your detailed valuation report will arrive within 24 hours.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-purple font-semibold">2</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="text-black font-medium">Review your report</span> - Your personalized 
                    valuation will include insights on all 9 factors and recommendations.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-purple font-semibold">3</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="text-black font-medium">Connect with us</span> - Have questions? 
                    Reach out on WhatsApp or follow us for more business insights.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="mb-8">
            <a
              href="https://wa.me/2348012345678?text=Hi%20Afrexit%20team,%20I%20just%20submitted%20my%20business%20valuation%20and%20have%20some%20questions."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold btn-lift w-full sm:w-auto"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat on WhatsApp
              </Button>
            </a>
            <p className="text-sm text-gray-500 mt-3">
              Quick responses during business hours (9AM - 6PM WAT)
            </p>
          </div>

          {/* Social Links */}
          <div className="mb-12">
            <p className="text-sm text-gray-500 mb-4">Follow for more business insights</p>
            <div className="flex justify-center gap-4">
              <a
                href="https://instagram.com/deolunathan"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-purple/10 hover:border-purple/30 transition-all"
              >
                <Instagram className="w-5 h-5 text-gray-600" />
              </a>
              <a
                href="https://youtube.com/@deolunathan"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all"
              >
                <Youtube className="w-5 h-5 text-gray-600" />
              </a>
              <a
                href="https://tiktok.com/@deolunathan"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-purple/10 hover:border-purple/30 transition-all"
              >
                <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-3">@deolunathan</p>
          </div>

          {/* Start Another */}
          <button
            onClick={onRestart}
            className="text-gray-500 hover:text-black transition-colors text-sm flex items-center gap-2 mx-auto"
          >
            Start another valuation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 border-t border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-gray-500">
            © 2025 Afrexit. Professional business valuations for Nigerian SMEs.
          </p>
        </div>
      </footer>
    </div>
  );
}
