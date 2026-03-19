import { useCallback, useState, useEffect } from 'react';

interface FinancialPeriod {
  id: string;
  label: string;
  revenue: string;
  operatingProfit: string;
}

interface FinancialSpreadsheetProps {
  periods: FinancialPeriod[];
  onChange: (periods: FinancialPeriod[]) => void;
}

function formatWithCommas(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-NG');
}

function parseFormatted(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function FinancialSpreadsheet({ periods, onChange }: FinancialSpreadsheetProps) {
  const [displayValues, setDisplayValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    periods.forEach((period, idx) => {
      initial[`${idx}-revenue`] = period.revenue ? formatWithCommas(period.revenue) : '';
      initial[`${idx}-profit`] = period.operatingProfit ? formatWithCommas(period.operatingProfit) : '';
    });
    return initial;
  });

  useEffect(() => {
    setDisplayValues(prev => {
      const updated = { ...prev };
      periods.forEach((period, idx) => {
        const revenueKey = `${idx}-revenue`;
        const profitKey = `${idx}-profit`;
        const currentRevenueRaw = parseFormatted(prev[revenueKey] || '');
        if (currentRevenueRaw !== period.revenue) {
          updated[revenueKey] = period.revenue ? formatWithCommas(period.revenue) : '';
        }
        const currentProfitRaw = parseFormatted(prev[profitKey] || '');
        if (currentProfitRaw !== period.operatingProfit) {
          updated[profitKey] = period.operatingProfit ? formatWithCommas(period.operatingProfit) : '';
        }
      });
      return updated;
    });
  }, [periods]);

  const handleRevenueChange = useCallback((index: number, value: string) => {
    const rawValue = parseFormatted(value);
    const formattedValue = formatWithCommas(rawValue);
    setDisplayValues(prev => ({ ...prev, [`${index}-revenue`]: formattedValue }));
    const newPeriods = [...periods];
    newPeriods[index] = { ...newPeriods[index], revenue: rawValue };
    onChange(newPeriods);
  }, [periods, onChange]);

  const handleProfitChange = useCallback((index: number, value: string) => {
    const rawValue = parseFormatted(value);
    const formattedValue = formatWithCommas(rawValue);
    setDisplayValues(prev => ({ ...prev, [`${index}-profit`]: formattedValue }));
    const newPeriods = [...periods];
    newPeriods[index] = { ...newPeriods[index], operatingProfit: rawValue };
    onChange(newPeriods);
  }, [periods, onChange]);

  const calculateMargin = (revenue: string, profit: string): string => {
    const rev = parseFloat(revenue || '0');
    const prof = parseFloat(profit || '0');
    if (rev === 0) return '—';
    return ((prof / rev) * 100).toFixed(1) + '%';
  };

  const calculateGrowth = (current: string, previous: string): string => {
    const curr = parseFloat(current || '0');
    const prev = parseFloat(previous || '0');
    if (prev === 0) return '—';
    const growth = ((curr - prev) / prev) * 100;
    return (growth > 0 ? '+' : '') + growth.toFixed(1) + '%';
  };

  return (
    <div className="-mx-6 sm:-mx-8">
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-4 text-left font-medium text-gray-700 w-32 sm:w-40">Period</th>
              {periods.map((period) => (
                <th key={period.id} className="px-2 sm:px-3 py-4 text-center font-medium text-gray-700 min-w-[100px] sm:min-w-[140px]">
                  <span className="hidden sm:inline">{period.label}</span>
                  <span className="sm:hidden">{period.label.replace(' (Latest)', '').replace(' (YTD/Forecast)', '')}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-4 sm:py-5 font-medium text-gray-900">
                <div>Revenue</div>
                <div className="text-xs font-normal text-gray-500">(₦)</div>
              </td>
              {periods.map((period, index) => (
                <td key={period.id} className="px-1 sm:px-2 py-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={displayValues[`${index}-revenue`] || ''}
                      onChange={(e) => handleRevenueChange(index, e.target.value)}
                      className="w-full rounded-lg border border-gray-200 pl-5 pr-1 sm:pl-6 sm:pr-2 py-2 sm:py-3 text-center text-sm sm:text-base outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </td>
              ))}
            </tr>

            <tr className="border-b border-gray-100">
              <td className="px-4 py-4 sm:py-5 font-medium text-gray-900">
                <div>Operating Profit</div>
                <div className="text-xs font-normal text-gray-500">(₦)</div>
              </td>
              {periods.map((period, index) => (
                <td key={period.id} className="px-1 sm:px-2 py-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={displayValues[`${index}-profit`] || ''}
                      onChange={(e) => handleProfitChange(index, e.target.value)}
                      className="w-full rounded-lg border border-gray-200 pl-5 pr-1 sm:pl-6 sm:pr-2 py-2 sm:py-3 text-center text-sm sm:text-base outline-none transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </td>
              ))}
            </tr>

            <tr className="border-b border-gray-100 bg-gray-50/50">
              <td className="px-4 py-3 text-sm font-medium text-gray-600">
                <div>Margin</div>
                <div className="text-xs font-normal text-gray-400">(auto)</div>
              </td>
              {periods.map((period) => (
                <td key={period.id} className="px-2 py-3 text-center text-sm text-gray-600">
                  {calculateMargin(period.revenue, period.operatingProfit)}
                </td>
              ))}
            </tr>

            <tr className="bg-purple-50/30">
              <td className="px-4 py-3 text-sm font-medium text-purple-700">
                <div>YoY Growth</div>
                <div className="text-xs font-normal text-purple-400">(auto)</div>
              </td>
              {periods.map((period, index) => (
                <td key={period.id} className="px-2 py-3 text-center text-sm font-medium">
                  {index === 0 ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <span className={
                      parseFloat(calculateGrowth(period.revenue, periods[index - 1].revenue)) > 0 
                        ? 'text-green-600' 
                        : 'text-red-500'
                    }>
                      {calculateGrowth(period.revenue, periods[index - 1].revenue)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs sm:text-sm text-gray-500">
            Profit margin and year-over-year growth are calculated automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

export function getDefaultFinancialPeriods(): FinancialPeriod[] {
  const currentYear = new Date().getFullYear();
  return [
    { id: 'prior2', label: `${currentYear - 3}`, revenue: '', operatingProfit: '' },
    { id: 'prior1', label: `${currentYear - 2}`, revenue: '', operatingProfit: '' },
    { id: 'latest', label: `${currentYear - 1} (Latest)`, revenue: '', operatingProfit: '' },
    { id: 'current', label: `${currentYear} (YTD/Forecast)`, revenue: '', operatingProfit: '' },
  ];
}

export type { FinancialPeriod };
