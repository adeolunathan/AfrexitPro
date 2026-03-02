import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import type { Question, FormData } from '../types/questionnaire';

interface QuestionnaireProps {
  questions: Question[];
  formData: FormData;
  onUpdate: (data: FormData) => void;
  onSubmit: (data: FormData) => void;
  onNotice: (message: string) => void;
  onBackToLanding: () => void;
  onOpenDisclaimer?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
}

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

export function Questionnaire({
  questions,
  formData,
  onUpdate,
  onSubmit,
  onNotice,
  onBackToLanding,
  onOpenDisclaimer,
  onOpenTerms,
  onOpenPrivacy,
}: QuestionnaireProps) {
  const [step, setStep] = useState(0);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryPickerRef = useRef<HTMLDivElement | null>(null);

  const currentQuestion = questions[step];
  const progress = (step / (questions.length - 1)) * 100;
  const currentValue = currentQuestion.type === 'contact' ? '' : (formData[currentQuestion.id] || '');
  const selectedCountry = formData.countryCode
    ? countryCodes.find((country) => country.code === formData.countryCode) || countryCodes[0]
    : countryCodes[0];
  const firstNameValue = formData.firstName || '';
  const businessNameValue = formData.businessName || '';
  const emailValue = formData.email || '';
  const fullWhatsappValue = formData.whatsapp || '';
  const whatsappValue = fullWhatsappValue.startsWith(selectedCountry.code)
    ? fullWhatsappValue.slice(selectedCountry.code.length)
    : fullWhatsappValue;
  const marketingConsentChecked = formData.newsletter !== 'No';
  const termsAcceptedChecked = formData.termsAccepted === 'Yes' && formData.privacyAccepted === 'Yes';

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

  const formatCurrency = (value: string): string => {
    const num = value.replace(/[^\d]/g, '');
    if (!num) return '';
    return '₦' + Number(num).toLocaleString('en-NG');
  };

  const parseCurrency = (value: string): string => value.replace(/[^\d]/g, '');

  const handleNext = () => {
    let pendingUpdate: FormData = {};

    if (currentQuestion.type === 'text' || currentQuestion.type === 'number') {
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
      const firstName = firstNameValue.trim();
      const businessName = businessNameValue.trim();
      const email = emailValue.trim();
      const whatsappRaw = whatsappValue.trim();

      if (!firstName || !businessName || !email || !whatsappRaw) {
        onNotice('Please fill in your name, business name, email, and WhatsApp number.');
        return;
      }

      if (!email.includes('@')) {
        onNotice('Please enter a valid email.');
        return;
      }

      if (!termsAcceptedChecked) {
        onNotice('Please accept the Terms of Use and Privacy Policy before submitting.');
        return;
      }

      const whatsappNumber = whatsappRaw.replace(/[^\d]/g, '');
      const fullWhatsapp = selectedCountry.code + whatsappNumber;

      pendingUpdate = {
        firstName,
        businessName,
        email,
        whatsapp: fullWhatsapp,
        countryCode: selectedCountry.code,
        newsletter: marketingConsentChecked ? 'Yes' : 'No',
        termsAccepted: termsAcceptedChecked ? 'Yes' : 'No',
        privacyAccepted: termsAcceptedChecked ? 'Yes' : 'No',
      };
    }

    if (step < questions.length - 1) {
      if (Object.keys(pendingUpdate).length > 0) {
        onUpdate(pendingUpdate);
      }
      setStep(step + 1);
      return;
    }

    const finalData = { ...formData, ...pendingUpdate };
    if (Object.keys(pendingUpdate).length > 0) {
      onUpdate(pendingUpdate);
    }
    onSubmit(finalData);
  };

  const handleBack = () => {
    if (step === 0) {
      onBackToLanding();
      return;
    }

    setStep(step - 1);
  };

  const selectOption = (value: string) => {
    onUpdate({ [currentQuestion.id]: value });
    if (step < questions.length - 1) {
      setStep((prev) => Math.min(prev + 1, questions.length - 1));
    }
  };

  const handleEnterToProceed = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    handleNext();
  };

  const handleContactEnter = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentField: 'firstName' | 'businessName' | 'email' | 'whatsapp'
  ) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const nextFieldMap: Partial<Record<typeof currentField, string>> = {
      firstName: 'businessName',
      businessName: 'email',
      email: 'whatsapp',
    };

    const nextFieldId = nextFieldMap[currentField];
    if (nextFieldId) {
      const nextInput = document.getElementById(nextFieldId) as HTMLInputElement | null;
      nextInput?.focus();
      return;
    }

    handleNext();
  };

  const selectCountry = (country: typeof countryCodes[0]) => {
    setShowCountryDropdown(false);
    onUpdate({
      countryCode: country.code,
      whatsapp: country.code + whatsappValue.replace(/[^\d]/g, ''),
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={onBackToLanding}
              aria-label="Go to homepage"
              className="flex items-center gap-2"
            >
              <img
                src="/logo-mark.png"
                alt="Afrexit logo"
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain"
              />
              <span className="font-semibold text-black">
                <span className="text-purple">Afr</span>
                <span className="text-blue">exit</span>
              </span>
            </button>
            <div className="text-sm text-gray-500">
              Step {step + 1} of {questions.length}
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-gray-200" />
        </div>
      </header>

      <main
        className={`flex-1 flex items-center justify-center pb-20 px-4 sm:px-6 ${
          step === 0 ? 'pt-1 sm:pt-0' : 'pt-10'
        }`}
      >
        <div className="w-full max-w-2xl mx-auto">
          {step === 0 && (
            <div className="mb-16 w-full rounded-lg border border-amber-200 bg-amber-50 p-3 sm:mb-20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="text-xs leading-relaxed text-amber-800">
                    <strong>Important:</strong> This is an automated preliminary estimate, not professional advice or a signed advisory mandate.
                    {' '}Results are based on the information you provide and generalized market logic for Nigerian SMEs.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    <button
                      type="button"
                      onClick={onOpenDisclaimer}
                      className="font-medium text-amber-700 underline hover:text-amber-900"
                    >
                      Important Disclosures
                    </button>
                    <button
                      type="button"
                      onClick={onOpenTerms}
                      className="font-medium text-amber-700 underline hover:text-amber-900"
                    >
                      Terms of Use
                    </button>
                    <button
                      type="button"
                      onClick={onOpenPrivacy}
                      className="font-medium text-amber-700 underline hover:text-amber-900"
                    >
                      Privacy Policy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="fade-in">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-black">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="mb-8">
              {currentQuestion.type === 'text' && (
                <div className="field">
                  <Input
                    type="text"
                    value={currentValue}
                    onChange={(e) => onUpdate({ [currentQuestion.id]: e.target.value })}
                    onKeyDown={handleEnterToProceed}
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
                    onChange={(e) => onUpdate({ [currentQuestion.id]: parseCurrency(e.target.value) })}
                    onKeyDown={handleEnterToProceed}
                    placeholder={currentQuestion.placeholder || ''}
                    className="w-full p-4 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                    autoFocus
                  />
                </div>
              )}

              {currentQuestion.type === 'select' && currentQuestion.options && (
                <>
                  {currentQuestion.id === 'location' || currentQuestion.id === 'industry' ? (
                    <div className="field">
                      {(() => {
                        const placeholder =
                          currentQuestion.id === 'industry' ? 'Select your industry' : 'Select your state';

                        return (
                      <select
                        value={formData[currentQuestion.id] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value) {
                            onUpdate({ [currentQuestion.id]: value });
                          }
                        }}
                        className="w-full p-4 text-lg bg-white border border-gray-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 rounded-lg text-black appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 1rem center',
                          backgroundSize: '1.5rem',
                        }}
                        autoFocus
                      >
                        <option value="" disabled>{placeholder}</option>
                        {currentQuestion.options.map((option, idx) => (
                          <option key={idx} value={option}>{option}</option>
                        ))}
                      </select>
                        );
                      })()}
                    </div>
                  ) : (
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
                </>
              )}

              {currentQuestion.type === 'contact' && (
                <>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-semibold text-gray-500">First name</label>
                    <Input
                      type="text"
                      id="firstName"
                      placeholder="e.g., Bolu"
                      value={firstNameValue}
                      onChange={(e) => onUpdate({ firstName: e.target.value })}
                      onKeyDown={(e) => handleContactEnter(e, 'firstName')}
                      className="w-full p-4 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-semibold text-gray-500">Business name</label>
                    <Input
                      type="text"
                      id="businessName"
                      placeholder="e.g., PolarBear"
                      value={businessNameValue}
                      onChange={(e) => onUpdate({ businessName: e.target.value })}
                      onKeyDown={(e) => handleContactEnter(e, 'businessName')}
                      className="w-full p-4 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-semibold text-gray-500">Email</label>
                    <Input
                      type="text"
                      id="email"
                      placeholder="e.g., you@email.com"
                      value={emailValue}
                      onChange={(e) => onUpdate({ email: e.target.value })}
                      onKeyDown={(e) => handleContactEnter(e, 'email')}
                      className="w-full p-4 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-semibold text-gray-500">WhatsApp number</label>
                    <div className="flex items-stretch gap-2">
                      <div ref={countryPickerRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex h-14 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 hover:bg-gray-50"
                          aria-haspopup="listbox"
                          aria-expanded={showCountryDropdown}
                        >
                          <span className="text-xl">{selectedCountry.flag}</span>
                          <span className="font-medium text-black">{selectedCountry.code}</span>
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                            {countryCodes.map((country, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => selectCountry(country)}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                                  selectedCountry.code === country.code ? 'bg-purple/5' : ''
                                }`}
                              >
                                <span className="text-xl">{country.flag}</span>
                                <span className="text-black">{country.name}</span>
                                <span className="ml-auto text-gray-400">{country.code}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Input
                        type="text"
                        id="whatsapp"
                        inputMode="numeric"
                        placeholder="801 234 5678"
                        value={whatsappValue}
                        onChange={(e) => {
                          const nextValue = e.target.value.replace(/[^\d ]/g, '');
                          onUpdate({ whatsapp: selectedCountry.code + nextValue.replace(/[^\d]/g, '') });
                        }}
                        onKeyDown={(e) => handleContactEnter(e, 'whatsapp')}
                        className="h-14 flex-1 px-4 py-0 text-lg bg-white border-gray-200 focus:border-purple rounded-lg text-black"
                      />
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <label htmlFor="termsAccepted" className="flex items-start gap-3 cursor-pointer">
                      <input
                        id="termsAccepted"
                        type="checkbox"
                        checked={termsAcceptedChecked}
                        onChange={(e) => onUpdate({
                          termsAccepted: e.target.checked ? 'Yes' : 'No',
                          privacyAccepted: e.target.checked ? 'Yes' : 'No',
                        })}
                        className="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 accent-purple-600"
                      />
                      <span className="text-sm leading-6 text-gray-700">
                        I agree to Afrexit&apos;s{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenTerms?.();
                          }}
                          className="font-medium text-purple-700 underline underline-offset-4"
                        >
                          Terms of Use
                        </button>
                        {' '}and acknowledge the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenPrivacy?.();
                          }}
                          className="font-medium text-purple-700 underline underline-offset-4"
                        >
                          Privacy Policy
                        </button>
                        . I understand this free tool gives an automated preliminary estimate only and does not create an advisory or brokerage mandate.
                      </span>
                    </label>
                  </div>

                  <div className="mb-4 rounded-lg border border-gray-200 p-4">
                    <label htmlFor="newsletter" className="flex items-start gap-3 cursor-pointer">
                      <input
                        id="newsletter"
                        type="checkbox"
                        checked={marketingConsentChecked}
                        onChange={(e) => onUpdate({ newsletter: e.target.checked ? 'Yes' : 'No' })}
                        className="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 accent-purple-600"
                      />
                      <span className="text-sm leading-6 text-gray-600">
                        I want to receive occasional Afrexit insights, exit-readiness tips, and transaction-advisory updates by email or WhatsApp.
                      </span>
                    </label>
                  </div>

                  <p className="text-xs leading-5 text-gray-500">
                    You can review our{' '}
                    <button
                      type="button"
                      onClick={onOpenDisclaimer}
                      className="underline underline-offset-4 hover:text-purple-600"
                    >
                      Important Disclosures
                    </button>
                    {' '}at any time before submitting.
                  </p>
                </>
              )}
            </div>

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
