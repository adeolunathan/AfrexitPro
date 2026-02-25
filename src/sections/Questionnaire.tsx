import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { Question, FormData } from '../types/questionnaire';

interface QuestionnaireProps {
  questions: Question[];
  formData: FormData;
  onUpdate: (data: FormData) => void;
  onSubmit: (data: FormData) => void;
  onNotice: (message: string) => void;
  onBackToLanding: () => void;
}

// Country codes with flags
const countryCodes = [
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
];

export function Questionnaire({ questions, formData, onUpdate, onSubmit, onNotice, onBackToLanding }: QuestionnaireProps) {
  const [step, setStep] = useState(0);
  const [currentValue, setCurrentValue] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [newsletterChecked, setNewsletterChecked] = useState(true);
  const countryPickerRef = useRef<HTMLDivElement | null>(null);

  const currentQuestion = questions[step];
  const progress = ((step) / (questions.length - 1)) * 100;

  // Load saved value for current question
  useEffect(() => {
    if (currentQuestion.type === 'contact') {
      setCurrentValue('');
      // Load saved country code if exists
      const savedCountryCode = formData.countryCode;
      if (savedCountryCode) {
        const found = countryCodes.find(c => c.code === savedCountryCode);
        if (found) setSelectedCountry(found);
      }
      // Load newsletter preference
      const savedNewsletter = formData.newsletter;
      setNewsletterChecked(savedNewsletter !== 'No');
    } else {
      const savedValue = formData[currentQuestion.id] || '';
      setCurrentValue(savedValue);
    }
  }, [step, currentQuestion, formData]);

  useEffect(() => {
    if (!showCountryDropdown) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (countryPickerRef.current && target && !countryPickerRef.current.contains(target)) {
        setShowCountryDropdown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCountryDropdown]);

  // Format currency with ₦ and commas
  const formatCurrency = (value: string): string => {
    const num = value.replace(/[^\d]/g, '');
    if (!num) return '';
    return '₦' + Number(num).toLocaleString('en-NG');
  };

  // Parse currency back to plain number
  const parseCurrency = (value: string): string => {
    return value.replace(/[^\d]/g, '');
  };

  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseCurrency(e.target.value);
    setCurrentValue(rawValue);
  };

  const handleNext = () => {
    let pendingUpdate: FormData = {};

    // Validate and collect current answer
    if (currentQuestion.type === 'text') {
      const val = currentValue.trim();
      if (currentQuestion.required && !val) {
        onNotice('Please enter a value.');
        return;
      }
      pendingUpdate = { [currentQuestion.id]: val };
    } else if (currentQuestion.type === 'number') {
      const val = currentValue.trim();
      if (currentQuestion.required && !val) {
        onNotice('Please enter a value.');
        return;
      }
      pendingUpdate = { [currentQuestion.id]: val };
    } else if (currentQuestion.type === 'select') {
      const val = formData[currentQuestion.id] || '';
      if (currentQuestion.required && !val) {
        onNotice('Please select an option.');
        return;
      }
      if (val) {
        pendingUpdate = { [currentQuestion.id]: val };
      }
    } else if (currentQuestion.type === 'contact') {
      const firstName = (document.getElementById('firstName') as HTMLInputElement)?.value?.trim() || '';
      const businessName = (document.getElementById('businessName') as HTMLInputElement)?.value?.trim() || '';
      const email = (document.getElementById('email') as HTMLInputElement)?.value?.trim() || '';
      const whatsappRaw = (document.getElementById('whatsapp') as HTMLInputElement)?.value?.trim() || '';
      
      if (!firstName || !businessName || !email || !whatsappRaw) {
        onNotice('Please fill in your name, business name, email, and WhatsApp number.');
        return;
      }
      if (!email.includes('@')) {
        onNotice('Please enter a valid email.');
        return;
      }
      
      // Format WhatsApp with country code
      const whatsappNumber = whatsappRaw.replace(/[^\d]/g, '');
      const fullWhatsapp = selectedCountry.code + whatsappNumber;
      
      pendingUpdate = {
        firstName, 
        businessName, 
        email, 
        whatsapp: fullWhatsapp,
        countryCode: selectedCountry.code,
        newsletter: newsletterChecked ? 'Yes' : 'No'
      };
    }

    if (step < questions.length - 1) {
      if (Object.keys(pendingUpdate).length > 0) {
        onUpdate(pendingUpdate);
      }
      setStep(step + 1);
    } else {
      // Submit with current step merged in immediately (avoids stale state on first submit)
      const finalData = { ...formData, ...pendingUpdate };
      if (Object.keys(pendingUpdate).length > 0) {
        onUpdate(pendingUpdate);
      }
      onSubmit(finalData);
    }
  };

  const handleBack = () => {
    if (step === 0) {
      onBackToLanding();
    } else {
      setStep(step - 1);
    }
  };

  const selectOption = (value: string) => {
    onUpdate({ [currentQuestion.id]: value });
  };

  const selectCountry = (country: typeof countryCodes[0]) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <img
                  src="/logo-mark.png"
                  alt="Afrexit logo"
                  className="w-11 h-11 sm:w-12 sm:h-12 object-contain"
                />
                <span className="font-semibold text-black">
                  <span className="text-purple">Afr</span>
                  <span className="text-blue">exit</span>
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Step {step + 1} of {questions.length}
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-gray-200" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-4 sm:px-6">
        <div className="w-full max-w-2xl mx-auto">
          <div className="fade-in">
            {/* Question */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-black">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Input Area */}
            <div className="mb-8">
              {currentQuestion.type === 'text' && (
                <div className="field">
                  <Input
                    type="text"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder={currentQuestion.placeholder || ''}
                    className="w-full p-4 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                    autoFocus
                  />
                </div>
              )}

              {currentQuestion.type === 'number' && (
                <div className="field">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrency(currentValue)}
                    onChange={handleCurrencyInput}
                    placeholder={currentQuestion.placeholder || ''}
                    className="w-full p-4 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                    autoFocus
                  />
                </div>
              )}

              {currentQuestion.type === 'select' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectOption(option)}
                      className={`w-full p-4 rounded-lg border text-left transition-all-smooth ${
                        formData[currentQuestion.id] === option
                          ? 'border-purple bg-purple/5'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData[currentQuestion.id] === option
                              ? 'border-purple'
                              : 'border-gray-400'
                          }`}
                        >
                          {formData[currentQuestion.id] === option && (
                            <div className="w-2.5 h-2.5 rounded-full bg-purple" />
                          )}
                        </div>
                        <span className="text-sm sm:text-base text-black">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'contact' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-500 mb-2 font-semibold">First name</label>
                    <Input
                      type="text"
                      id="firstName"
                      placeholder="e.g., Bolu"
                      defaultValue={formData.firstName || ''}
                      className="w-full p-4 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-500 mb-2 font-semibold">Business name</label>
                    <Input
                      type="text"
                      id="businessName"
                      placeholder="e.g., PolarBear"
                      defaultValue={formData.businessName || ''}
                      className="w-full p-4 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-500 mb-2 font-semibold">Email</label>
                    <Input
                      type="text"
                      id="email"
                      placeholder="e.g., you@email.com"
                      defaultValue={formData.email || ''}
                      className="w-full p-4 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-500 mb-2 font-semibold">WhatsApp number</label>
                    <div className="flex items-stretch gap-2">
                      {/* Country Code Dropdown */}
                      <div ref={countryPickerRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex h-14 items-center gap-2 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                          aria-haspopup="listbox"
                          aria-expanded={showCountryDropdown}
                        >
                          <span className="text-xl">{selectedCountry.flag}</span>
                          <span className="text-black font-medium">{selectedCountry.code}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                            {countryCodes.map((country, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => selectCountry(country)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left ${
                                  selectedCountry.code === country.code ? 'bg-purple/5' : ''
                                }`}
                              >
                                <span className="text-xl">{country.flag}</span>
                                <span className="text-black">{country.name}</span>
                                <span className="text-gray-400 ml-auto">{country.code}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Phone Number Input */}
                      <Input
                        type="text"
                        id="whatsapp"
                        inputMode="numeric"
                        placeholder="801 234 5678"
                        defaultValue={formData.whatsapp ? formData.whatsapp.replace(selectedCountry.code, '') : ''}
                        className="h-14 flex-1 px-4 py-0 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                      />
                    </div>
                  </div>
                  <label htmlFor="newsletter" className="mb-4 flex items-center gap-3 cursor-pointer select-none">
                    <input
                      id="newsletter"
                      type="checkbox"
                      checked={newsletterChecked}
                      onChange={(e) => setNewsletterChecked(e.target.checked)}
                      className="h-5 w-5 cursor-pointer rounded border-gray-300 accent-purple-600"
                    />
                    <span className="text-sm text-gray-600">
                      Subscribe to newsletter for business insights
                    </span>
                  </label>
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-gray-300 hover:bg-gray-100 text-black"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                className="bg-purple hover:bg-purple/90 text-white px-6"
              >
                {step === questions.length - 1 ? 'Submit' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
