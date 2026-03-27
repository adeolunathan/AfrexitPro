import { useEffect, useMemo, useRef, useState, useCallback, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { Switch } from '@/components/ui/switch';
import { QuestionHelpTooltip } from '@/components/QuestionHelpTooltip';
import {
  formatMillions,
  formatMillionsDisplay,
  normalizeMillions,
  sanitizeMillionInput,
  serializeMillions,
} from '@/lib/million-currency';

export interface FinancialPeriod {
  id: FinancialPeriodId;
  label: string;
  enabled: boolean;
  revenue: string;
  operatingProfit: string;
}

export type FinancialPeriodId = 'prior2' | 'prior1' | 'latest' | 'forecast';

interface FinancialSpreadsheetProps {
  periods: FinancialPeriod[];
  onChange: (periods: FinancialPeriod[]) => void;
}

type EditableRowKey = 'revenue' | 'operatingProfit';
type RowKey = EditableRowKey | 'margin' | 'growth';

interface RowDefinition {
  key: RowKey;
  label: string;
  editable: boolean;
  allowNegative?: boolean;
  tooltipText?: string;
}

const rowDefinitions: RowDefinition[] = [
  {
    key: 'revenue',
    label: 'Revenue',
    editable: true,
    allowNegative: false,
    tooltipText:
      'Enter annual business turnover from normal operations for that year, excluding VAT collected on behalf of government and after sales returns, discounts, or refunds. Use the net revenue figure you would recognise in your books.',
  },
  {
    key: 'operatingProfit',
    label: 'Operating Profit',
    editable: true,
    allowNegative: true,
    tooltipText:
      'Enter the operating result from the core business before finance costs and company income tax. This is often the operating profit or EBIT in management accounts. If the business made an operating loss, enter the negative amount.',
  },
  { key: 'margin', label: 'Margin', editable: false },
  { key: 'growth', label: 'YoY Growth', editable: false },
];

const editableRows = rowDefinitions.filter((row): row is RowDefinition & { key: EditableRowKey } => row.editable);

interface CellCoord {
  rowIndex: number;
  colIndex: number;
}

interface SpreadsheetState {
  activeCell: CellCoord | null;
  editingCell: CellCoord | null;
  editValue: string;
}

const PERIOD_FIELD_MAP: Record<Exclude<FinancialPeriodId, 'forecast'>, { revenue: string; operatingProfit: string }> = {
  prior2: { revenue: 'revenuePrevious2', operatingProfit: 'operatingProfitPrevious2' },
  prior1: { revenue: 'revenuePrevious1', operatingProfit: 'operatingProfitPrevious1' },
  latest: { revenue: 'revenueLatest', operatingProfit: 'operatingProfitLatest' },
};

const METRIC_COLUMN_WIDTH = 220;
const PERIOD_COLUMN_WIDTH = 156;
function calculateMargin(revenue: string, profit: string): string {
  const revenueValue = Number(revenue || 0);
  const profitValue = Number(profit || 0);
  if (!revenueValue) return '0';
  return `${((profitValue / revenueValue) * 100).toFixed(1)}`;
}

function calculateGrowth(current: string, previous: string): string {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (!previousValue) return '0';
  const growth = ((currentValue - previousValue) / previousValue) * 100;
  return `${growth.toFixed(1)}`;
}

function isEditableCell(rowIndex: number): boolean {
  return rowDefinitions[rowIndex]?.editable ?? false;
}

function getRowKey(rowIndex: number): RowKey {
  return rowDefinitions[rowIndex]?.key ?? 'revenue';
}

function parseClipboardData(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  
  return lines.map(line => {
    if (line.includes('\t')) {
      return line.split('\t');
    }
    if (line.includes(',')) {
      return line.split(',').map(cell => cell.trim());
    }
    return [line];
  });
}

function coordsEqual(a: CellCoord, b: CellCoord): boolean {
  return a.rowIndex === b.rowIndex && a.colIndex === b.colIndex;
}

function isLockedPeriod(periodId: FinancialPeriodId) {
  return periodId === 'latest';
}

function isPeriodEnabled(period: FinancialPeriod | undefined) {
  return Boolean(period?.enabled);
}

function getEnabledColumnIndices(periods: FinancialPeriod[]) {
  return periods
    .map((period, index) => (isPeriodEnabled(period) ? index : -1))
    .filter((index) => index >= 0);
}

function getLastEnabledColumn(periods: FinancialPeriod[]) {
  const enabled = getEnabledColumnIndices(periods);
  return enabled[enabled.length - 1] ?? Math.max(0, periods.length - 1);
}

function getNearestEnabledColumn(periods: FinancialPeriod[], currentIndex: number) {
  const enabled = getEnabledColumnIndices(periods);
  if (enabled.length === 0) return Math.max(0, periods.length - 1);
  if (enabled.includes(currentIndex)) return currentIndex;

  return enabled.reduce((closest, candidate) => {
    return Math.abs(candidate - currentIndex) < Math.abs(closest - currentIndex) ? candidate : closest;
  }, enabled[enabled.length - 1]);
}

function moveAcrossEnabledColumns(periods: FinancialPeriod[], currentIndex: number, direction: -1 | 1) {
  const enabled = getEnabledColumnIndices(periods);
  if (enabled.length === 0) return currentIndex;

  const currentEnabledIndex = enabled.indexOf(getNearestEnabledColumn(periods, currentIndex));
  const nextIndex = Math.max(0, Math.min(currentEnabledIndex + direction, enabled.length - 1));
  return enabled[nextIndex];
}

function getPreviousEnabledColumn(periods: FinancialPeriod[], currentIndex: number) {
  const enabled = getEnabledColumnIndices(periods);
  const currentEnabledIndex = enabled.indexOf(currentIndex);
  if (currentEnabledIndex <= 0) {
    return undefined;
  }
  return enabled[currentEnabledIndex - 1];
}

export function FinancialSpreadsheet({ periods, onChange }: FinancialSpreadsheetProps) {
  const normalizedPeriods = useMemo(() => normalizeFinancialPeriods(periods), [periods]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<SpreadsheetState>(() => ({
    activeCell: { rowIndex: 0, colIndex: getLastEnabledColumn(normalizedPeriods) },
    editingCell: null,
    editValue: '',
  }));

  // Track if this is the initial focus for editing
  const initialFocusRef = useRef(false);
  
  useEffect(() => {
    if (state.editingCell && inputRef.current) {
      inputRef.current.focus();
      
      // Only handle selection on initial focus, not on every keystroke
      if (!initialFocusRef.current) {
        initialFocusRef.current = true;
        // Select all for easy replacement when editing existing content
        if (state.editValue.length > 1 || state.editValue === '') {
          inputRef.current.select();
        } else {
          // Single character typed to start - put cursor at end
          inputRef.current.setSelectionRange(state.editValue.length, state.editValue.length);
        }
      }
    } else if (!state.editingCell) {
      // Reset when editing ends
      initialFocusRef.current = false;
    }
  }, [state.editingCell]);

  useEffect(() => {
    if (containerRef.current && !state.editingCell) {
      containerRef.current.focus();
    }
  }, [state.editingCell, state.activeCell]);

  useEffect(() => {
    setState((prev) => {
      if (!prev.activeCell) {
        return {
          ...prev,
          activeCell: { rowIndex: 0, colIndex: getLastEnabledColumn(normalizedPeriods) },
        };
      }

      const nextColIndex = getNearestEnabledColumn(normalizedPeriods, prev.activeCell.colIndex);
      if (nextColIndex === prev.activeCell.colIndex) {
        return prev;
      }

      return {
        ...prev,
        activeCell: { ...prev.activeCell, colIndex: nextColIndex },
        editingCell:
          prev.editingCell && prev.editingCell.colIndex === prev.activeCell.colIndex
            ? null
            : prev.editingCell,
        editValue:
          prev.editingCell && prev.editingCell.colIndex === prev.activeCell.colIndex ? '' : prev.editValue,
      };
    });
  }, [normalizedPeriods]);

  const getCellValue = useCallback((rowIndex: number, colIndex: number): string => {
    const period = normalizedPeriods[colIndex];
    if (!period || !isPeriodEnabled(period)) return '';
    
    const rowKey = getRowKey(rowIndex);
    if (rowKey === 'revenue') return period.revenue;
    if (rowKey === 'operatingProfit') return period.operatingProfit;
    return '';
  }, [normalizedPeriods]);

  const setCellValue = useCallback((rowIndex: number, colIndex: number, value: string) => {
    const rowDef = rowDefinitions[rowIndex];
    const period = normalizedPeriods[colIndex];
    if (!rowDef || !rowDef.editable || !isPeriodEnabled(period)) return;
    
    const storedValue = serializeMillions(value, rowDef.allowNegative ?? false);
    
    const nextPeriods = normalizedPeriods.map((p, i) => 
      i === colIndex 
        ? { ...p, [rowDef.key]: storedValue }
        : p
    );
    
    onChange(nextPeriods);
  }, [normalizedPeriods, onChange]);

  const getDisplayValue = useCallback((rowIndex: number, colIndex: number): string => {
    const period = normalizedPeriods[colIndex];
    if (!period) return '0';
    
    const rowKey = getRowKey(rowIndex);
    
    if (rowKey === 'revenue') {
      return formatMillions(period.revenue, false) || '0';
    }
    if (rowKey === 'operatingProfit') {
      return formatMillions(period.operatingProfit, true) || '0';
    }
    if (rowKey === 'margin') {
      return calculateMargin(period.revenue, period.operatingProfit);
    }
    if (rowKey === 'growth') {
      const prevColumnIndex = getPreviousEnabledColumn(normalizedPeriods, colIndex);
      if (prevColumnIndex === undefined) return '0';
      const prevPeriod = normalizedPeriods[prevColumnIndex];
      return calculateGrowth(period.revenue, prevPeriod?.revenue ?? '0');
    }
    return '';
  }, [normalizedPeriods]);

  const getNumericValue = useCallback((rowIndex: number, colIndex: number): number => {
    const period = normalizedPeriods[colIndex];
    if (!period || !isPeriodEnabled(period)) return 0;
    
    const rowKey = getRowKey(rowIndex);
    if (rowKey === 'margin') {
      return Number(calculateMargin(period.revenue, period.operatingProfit));
    }
    if (rowKey === 'growth') {
      const prevColumnIndex = getPreviousEnabledColumn(normalizedPeriods, colIndex);
      if (prevColumnIndex === undefined) return 0;
      const prevPeriod = normalizedPeriods[prevColumnIndex];
      return Number(calculateGrowth(period.revenue, prevPeriod?.revenue ?? '0'));
    }
    return 0;
  }, [normalizedPeriods]);

  const startEditing = useCallback((coord: CellCoord, initialValue?: string) => {
    if (!isEditableCell(coord.rowIndex) || !isPeriodEnabled(normalizedPeriods[coord.colIndex])) return;
    
    const rowDef = rowDefinitions[coord.rowIndex];
    const currentValue = getCellValue(coord.rowIndex, coord.colIndex);
    const value = initialValue !== undefined 
      ? sanitizeMillionInput(initialValue, rowDef.allowNegative ?? false)
      : sanitizeMillionInput(formatMillions(currentValue, rowDef.allowNegative ?? false), rowDef.allowNegative ?? false);
    
    setState(prev => ({
      ...prev,
      editingCell: coord,
      editValue: value,
      activeCell: coord,
    }));
  }, [getCellValue, normalizedPeriods]);

  const stopEditing = useCallback(() => {
    setState(prev => ({
      ...prev,
      editingCell: null,
      editValue: '',
    }));
  }, []);

  const commitEditing = useCallback(() => {
    if (!state.editingCell) return;
    
    setCellValue(state.editingCell.rowIndex, state.editingCell.colIndex, state.editValue);
    stopEditing();
  }, [state.editingCell, state.editValue, setCellValue, stopEditing]);

  const cancelEditing = useCallback(() => {
    stopEditing();
  }, [stopEditing]);

  const moveActiveCell = useCallback((rowDelta: number, colDelta: number) => {
    setState(prev => {
      if (!prev.activeCell) return prev;
      
      const newRowIndex = Math.max(0, Math.min(prev.activeCell.rowIndex + rowDelta, rowDefinitions.length - 1));
      const newColIndex = colDelta === 0
        ? getNearestEnabledColumn(normalizedPeriods, prev.activeCell.colIndex)
        : moveAcrossEnabledColumns(normalizedPeriods, prev.activeCell.colIndex, colDelta > 0 ? 1 : -1);
      
      return {
        ...prev,
        activeCell: { rowIndex: newRowIndex, colIndex: newColIndex },
        editingCell: null,
        editValue: '',
      };
    });
  }, [normalizedPeriods]);

  const moveToNextEditableCell = useCallback((direction: 1 | -1) => {
    setState(prev => {
      if (!prev.activeCell) return prev;
      
      const editableIndices = editableRows.map(r => rowDefinitions.findIndex(rd => rd.key === r.key));
      const enabledColumns = getEnabledColumnIndices(normalizedPeriods);
      if (enabledColumns.length === 0) return prev;
      const currentEditableIndex = editableIndices.indexOf(prev.activeCell.rowIndex);
      
      if (currentEditableIndex < 0) {
        const nearest = editableIndices.reduce((closest, idx) => {
          const dist = Math.abs(idx - prev.activeCell!.rowIndex);
          return dist < Math.abs(closest - prev.activeCell!.rowIndex) ? idx : closest;
        }, editableIndices[0] ?? 0);
        
        return {
          ...prev,
          activeCell: { rowIndex: nearest, colIndex: getNearestEnabledColumn(normalizedPeriods, prev.activeCell.colIndex) },
          editingCell: null,
          editValue: '',
        };
      }
      
      const currentColIndex = getNearestEnabledColumn(normalizedPeriods, prev.activeCell.colIndex);
      const currentEnabledColIndex = enabledColumns.indexOf(currentColIndex);
      const currentLinear = currentEditableIndex * enabledColumns.length + Math.max(0, currentEnabledColIndex);
      const totalEditableCells = editableIndices.length * enabledColumns.length;
      const nextLinear = Math.max(0, Math.min(currentLinear + direction, totalEditableCells - 1));
      
      const nextEditableIndex = Math.floor(nextLinear / enabledColumns.length);
      const nextColIndex = enabledColumns[nextLinear % enabledColumns.length];
      
      return {
        ...prev,
        activeCell: { rowIndex: editableIndices[nextEditableIndex], colIndex: nextColIndex },
        editingCell: null,
        editValue: '',
      };
    });
  }, [normalizedPeriods]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (state.editingCell) {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          commitEditing();
          moveActiveCell(1, 0);
          return;
        case 'Tab':
          event.preventDefault();
          commitEditing();
          moveToNextEditableCell(event.shiftKey ? -1 : 1);
          return;
        case 'Escape':
          event.preventDefault();
          cancelEditing();
          return;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          event.stopPropagation();
          return;
      }
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        moveActiveCell(0, 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveActiveCell(0, -1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveActiveCell(1, 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActiveCell(-1, 0);
        break;
      case 'Tab':
        event.preventDefault();
        moveToNextEditableCell(event.shiftKey ? -1 : 1);
        break;
      case 'Enter':
        event.preventDefault();
        if (state.activeCell && isEditableCell(state.activeCell.rowIndex)) {
          startEditing(state.activeCell);
        }
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        if (state.activeCell && isEditableCell(state.activeCell.rowIndex)) {
          setCellValue(state.activeCell.rowIndex, state.activeCell.colIndex, '');
        }
        break;
      case 'F2':
        event.preventDefault();
        if (state.activeCell && isEditableCell(state.activeCell.rowIndex)) {
          startEditing(state.activeCell);
        }
        break;
      default:
        if (state.activeCell &&
            isEditableCell(state.activeCell.rowIndex) &&
            isPeriodEnabled(normalizedPeriods[state.activeCell.colIndex]) &&
            event.key.length === 1 && 
            /[0-9.-]/.test(event.key) &&
            !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          const rowDef = rowDefinitions[state.activeCell.rowIndex];
          const initialValue =
            event.key === '.'
              ? '0.'
              : event.key === '-' && !(rowDef?.allowNegative ?? false)
                ? undefined
                : event.key;
          if (initialValue !== undefined) {
            startEditing(state.activeCell, initialValue);
          }
        }
        break;
    }
  }, [state.editingCell, state.activeCell, moveActiveCell, moveToNextEditableCell, 
      startEditing, commitEditing, cancelEditing, setCellValue]);

  const handlePaste = useCallback((event: ClipboardEvent<HTMLDivElement>) => {
    if (state.editingCell) return;
    
    const pastedText = event.clipboardData.getData('text/plain');
    if (!pastedText.trim()) return;
    
    event.preventDefault();
    
    if (!state.activeCell) return;
    
    const matrix = parseClipboardData(pastedText);
    if (matrix.length === 0 || matrix[0].length === 0) return;
    
    const editableRowIndices = editableRows.map(r => rowDefinitions.findIndex(rd => rd.key === r.key));
    const startEditableIdx = editableRowIndices.indexOf(state.activeCell.rowIndex);
    if (startEditableIdx < 0) return;
    const enabledColumns = getEnabledColumnIndices(normalizedPeriods);
    const startEnabledColIdx = enabledColumns.indexOf(state.activeCell.colIndex);
    if (startEnabledColIdx < 0) return;
    
    const nextPeriods: FinancialPeriod[] = normalizedPeriods.map(p => ({ ...p }));
    let appliedCount = 0;
    
    for (let rowOffset = 0; rowOffset < matrix.length; rowOffset++) {
      const targetEditableIdx = startEditableIdx + rowOffset;
      if (targetEditableIdx >= editableRowIndices.length) break;
      
      const targetRowIndex = editableRowIndices[targetEditableIdx];
      const rowDef = rowDefinitions[targetRowIndex];
      if (!rowDef.editable || (rowDef.key !== 'revenue' && rowDef.key !== 'operatingProfit')) continue;
      
      const rowData = matrix[rowOffset];
      for (let colOffset = 0; colOffset < rowData.length; colOffset++) {
        const targetEnabledColIdx = startEnabledColIdx + colOffset;
        if (targetEnabledColIdx >= enabledColumns.length) break;
        const targetColIndex = enabledColumns[targetEnabledColIdx];
        
        const cellValue = rowData[colOffset];
        const storedValue = serializeMillions(cellValue, rowDef.allowNegative ?? false);
        if (storedValue) {
          nextPeriods[targetColIndex] = {
            ...nextPeriods[targetColIndex],
            enabled: true,
            [rowDef.key]: storedValue,
          };
          appliedCount++;
        }
      }
    }
    
    if (appliedCount > 0) {
      onChange(nextPeriods);
    }
  }, [state.editingCell, state.activeCell, normalizedPeriods, onChange]);

  const handleCellMouseDown = useCallback((event: MouseEvent<HTMLDivElement>, rowIndex: number, colIndex: number) => {
    event.preventDefault();
    
    setState(prev => ({
      ...prev,
      activeCell: { rowIndex, colIndex },
      editingCell: null,
      editValue: '',
    }));
    
    containerRef.current?.focus();
  }, []);

  const handleCellDoubleClick = useCallback((rowIndex: number, colIndex: number) => {
    if (isEditableCell(rowIndex)) {
      startEditing({ rowIndex, colIndex });
    }
  }, [startEditing]);

  const handleTogglePeriod = useCallback((periodId: FinancialPeriodId, checked: boolean) => {
    if (isLockedPeriod(periodId)) return;

    const nextPeriods = normalizedPeriods.map((period) =>
      period.id === periodId
        ? {
            ...period,
            enabled: checked,
            revenue: checked ? period.revenue : '',
            operatingProfit: checked ? period.operatingProfit : '',
          }
        : period
    );

    onChange(nextPeriods);
    setState((prev) => ({
      ...prev,
      activeCell: prev.activeCell
        ? { ...prev.activeCell, colIndex: getNearestEnabledColumn(nextPeriods, prev.activeCell.colIndex) }
        : { rowIndex: 0, colIndex: getLastEnabledColumn(nextPeriods) },
      editingCell: prev.editingCell?.colIndex === normalizedPeriods.findIndex((period) => period.id === periodId) && !checked
        ? null
        : prev.editingCell,
      editValue: prev.editingCell?.colIndex === normalizedPeriods.findIndex((period) => period.id === periodId) && !checked
        ? ''
        : prev.editValue,
    }));
    containerRef.current?.focus();
  }, [normalizedPeriods, onChange]);

  const isCellActive = useCallback((rowIndex: number, colIndex: number): boolean => {
    if (!state.activeCell) return false;
    return coordsEqual(state.activeCell, { rowIndex, colIndex });
  }, [state.activeCell]);

  const isCellEditing = useCallback((rowIndex: number, colIndex: number): boolean => {
    if (!state.editingCell) return false;
    return coordsEqual(state.editingCell, { rowIndex, colIndex });
  }, [state.editingCell]);

  const sheetMinWidth = useMemo(
    () => `${METRIC_COLUMN_WIDTH + normalizedPeriods.length * PERIOD_COLUMN_WIDTH}px`,
    [normalizedPeriods.length]
  );
  const sheetGridTemplateColumns = useMemo(
    () => `minmax(${METRIC_COLUMN_WIDTH}px, 1fr) repeat(${normalizedPeriods.length}, ${PERIOD_COLUMN_WIDTH}px)`,
    [normalizedPeriods.length]
  );

  const getRenderedColumnStart = useCallback(
    (colIndex: number) => colIndex + 2,
    []
  );

  const isFirstVisibleGroupColumn = useCallback(
    (colIndex: number) => colIndex > 0 && !isPeriodEnabled(normalizedPeriods[colIndex - 1]),
    [normalizedPeriods]
  );

  return (
    <div className="w-full">
      <div className="max-w-full overflow-x-auto">
        <div className="flex w-full min-w-fit flex-col" style={{ minWidth: sheetMinWidth }}>
          <div className="mb-3 text-sm text-slate-500">
            Enter all figures in <span className="font-medium text-slate-700">₦ millions</span>. Example: <span className="font-medium text-slate-700">12.5</span> means <span className="font-medium text-slate-700">₦12.5m</span>.
          </div>
          {/* Toggle Row - Fixed positions for all 4 periods */}
          <div
            className="mb-4 grid w-full items-end gap-y-1"
            style={{ gridTemplateColumns: sheetGridTemplateColumns }}
          >
            <div aria-hidden="true" />
            {normalizedPeriods.map((period) => (
              <div key={`toggle-${period.id}`} className="flex justify-end px-2">
                <label className="inline-flex flex-col items-end gap-1 text-[11px] font-medium text-slate-600">
                  {!isLockedPeriod(period.id) ? (
                    <Switch
                      checked={period.enabled}
                      onCheckedChange={(checked) => handleTogglePeriod(period.id, checked)}
                      aria-label={`Toggle ${period.label}`}
                    />
                  ) : (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-purple-700">
                      Required
                    </span>
                  )}
                  {!period.enabled ? <span className="text-right">{period.label}</span> : null}
                </label>
              </div>
            ))}
          </div>

          <div 
            ref={containerRef}
            role="grid"
            aria-label="Financial history data editor"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="w-full select-none outline-none"
          >
            <div 
              className="grid w-full"
              style={{ gridTemplateColumns: sheetGridTemplateColumns }}
            >
              <div className="flex h-9 items-center rounded-tl-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-400">
                <span className="sr-only">Metric</span>
              </div>
              {normalizedPeriods.map((period, colIndex) => {
                if (!isPeriodEnabled(period)) {
                  return null;
                }

                const addLeftBorder = colIndex === 0 || isFirstVisibleGroupColumn(colIndex);

                return (
                  <div
                    key={period.id}
                    style={{ gridColumn: getRenderedColumnStart(colIndex) }}
                    className={`flex h-9 items-center justify-end border-b border-r border-t border-slate-200 bg-slate-50 px-3 text-right text-xs font-medium ${
                      addLeftBorder ? 'border-l' : ''
                    } ${
                      state.activeCell?.colIndex === colIndex ? 'bg-purple-100 text-purple-900' : 'text-slate-600'
                    }`}
                  >
                    {period.label}
                  </div>
                );
              })}
            </div>

            {rowDefinitions.map((rowDef, rowIndex) => (
              <div 
                key={rowDef.key}
                className="grid w-full"
                style={{ gridTemplateColumns: sheetGridTemplateColumns }}
                role="row"
              >
                <div className={`flex h-9 items-center border-b border-l border-r border-slate-200 px-3 text-sm font-medium ${
                  state.activeCell?.rowIndex === rowIndex ? 'bg-purple-50 text-purple-700' : 'text-slate-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <span>{rowDef.label}</span>
                    {rowDef.tooltipText ? <QuestionHelpTooltip content={rowDef.tooltipText} /> : null}
                  </div>
                </div>

                {normalizedPeriods.map((period, colIndex) => {
                  if (!isPeriodEnabled(period)) {
                    return null;
                  }

                  const isActive = isCellActive(rowIndex, colIndex);
                  const isEditing = isCellEditing(rowIndex, colIndex);
                  const displayValue = getDisplayValue(rowIndex, colIndex);
                  const isEditable = rowDef.editable;
                  const numericValue = getNumericValue(rowIndex, colIndex);
                  const isNegative = numericValue < 0;
                  const isPositive = numericValue > 0;
                  const addLeftBorder = colIndex === 0 || isFirstVisibleGroupColumn(colIndex);

                  return (
                    <div
                      key={`${period.id}-${rowDef.key}`}
                      role="gridcell"
                      aria-selected={isActive}
                      style={{ gridColumn: getRenderedColumnStart(colIndex) }}
                      onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                      className={`relative flex h-9 items-center justify-end border-b border-r border-slate-200 px-3 text-sm ${
                        addLeftBorder ? 'border-l' : ''
                      } ${
                        isEditing 
                          ? 'bg-white p-0' 
                          : isActive 
                            ? 'bg-purple-50' 
                            : 'bg-white'
                      } ${isEditable ? 'cursor-cell' : 'cursor-default'}`}
                    >
                      {isActive && !isEditing && (
                        <div className="pointer-events-none absolute inset-0 z-10 rounded-sm border-2 border-purple-500" />
                      )}

                      {isEditing ? (
                        <div className="absolute inset-0 flex items-center bg-white">
                          <input
                            ref={inputRef}
                            type="text"
                            inputMode="decimal"
                            value={state.editValue}
                            onChange={(e) => {
                              const sanitized = sanitizeMillionInput(
                                e.target.value, 
                                rowDef.allowNegative ?? false
                              );
                              setState(prev => ({ ...prev, editValue: sanitized }));
                            }}
                            onBlur={commitEditing}
                            className="h-full w-full bg-transparent px-3 text-right text-sm font-medium text-slate-900 outline-none"
                            placeholder="0"
                          />
                        </div>
                      ) : (
                        <span className={`font-medium ${
                            isNegative
                              ? 'text-rose-500'
                              : isPositive && !rowDef.editable
                                ? 'text-emerald-600'
                                : 'text-slate-700'
                        }`}>
                          {rowDef.editable
                            ? formatMillionsDisplay(getCellValue(rowIndex, colIndex), {
                                allowNegative: rowDef.allowNegative ?? false,
                                emptyDisplay: '0',
                              })
                            : `${displayValue}%`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export function getDefaultFinancialPeriods(): FinancialPeriod[] {
  const currentYear = new Date().getFullYear();
  return [
    { id: 'prior2', label: `${currentYear - 3}`, enabled: false, revenue: '', operatingProfit: '' },
    { id: 'prior1', label: `${currentYear - 2}`, enabled: false, revenue: '', operatingProfit: '' },
    { id: 'latest', label: `${currentYear - 1} Actual`, enabled: true, revenue: '', operatingProfit: '' },
    { id: 'forecast', label: `${currentYear} Forecast`, enabled: false, revenue: '', operatingProfit: '' },
  ];
}

export function normalizeFinancialPeriods(value: unknown): FinancialPeriod[] {
  const defaults = getDefaultFinancialPeriods();
  if (!Array.isArray(value)) {
    return defaults;
  }

  const byId = new Map(
    value
      .filter((period): period is Partial<FinancialPeriod> & { id: string } => 
        Boolean(period && typeof period === 'object' && 'id' in period)
      )
      .map((period) => [period.id, period])
  );

  return defaults.map((defaultPeriod) => {
    const saved = byId.get(defaultPeriod.id);
    return {
      ...defaultPeriod,
      enabled:
        isLockedPeriod(defaultPeriod.id) ||
        (typeof saved?.enabled === 'boolean'
          ? saved.enabled
          : defaultPeriod.enabled || Boolean(saved?.revenue || saved?.operatingProfit)),
      revenue: saved?.revenue ? normalizeMillions(saved.revenue) : '',
      operatingProfit: saved?.operatingProfit ? normalizeMillions(saved.operatingProfit) : '',
    };
  });
}

export function getFinancialPeriodById(periods: FinancialPeriod[], periodId: FinancialPeriodId) {
  const normalized = normalizeFinancialPeriods(periods);
  return normalized.find((period) => period.id === periodId) ?? normalized[normalized.length - 1];
}

export function buildFinancialPeriodsFromAnswers(
  answers: Partial<Record<string, unknown>>
): FinancialPeriod[] {
  const defaults = getDefaultFinancialPeriods();

  return defaults.map((period) => {
    if (period.id === 'forecast') {
      const savedForecast =
        Array.isArray(answers._financialPeriods)
          ? normalizeFinancialPeriods(answers._financialPeriods).find((savedPeriod) => savedPeriod.id === 'forecast')
          : undefined;

      return {
        ...period,
        enabled: Boolean(savedForecast?.enabled),
        revenue: savedForecast?.revenue ? normalizeMillions(savedForecast.revenue) : '',
        operatingProfit: savedForecast?.operatingProfit ? normalizeMillions(savedForecast.operatingProfit) : '',
      };
    }

    const fieldMap = PERIOD_FIELD_MAP[period.id as Exclude<FinancialPeriodId, 'forecast'>];
    const revenue = normalizeMillions(answers[fieldMap.revenue]);
    const operatingProfit = normalizeMillions(answers[fieldMap.operatingProfit]);

    return {
      ...period,
      enabled: isLockedPeriod(period.id) || Boolean(revenue || operatingProfit),
      revenue,
      operatingProfit,
    };
  });
}
