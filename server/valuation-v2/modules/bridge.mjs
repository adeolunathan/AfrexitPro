import { clamp } from './utils.mjs';

export function buildEnterpriseAndEquityValues(
  request,
  reconciled,
  readinessAssessment,
  confidenceAssessment,
  normalizedMetrics,
  policyGroup,
  geographyAdjustment,
  branchQuality
) {
  const floor = policyGroup?.ownerPhase?.marketabilityFloor ?? 0.82;
  const ceiling = policyGroup?.ownerPhase?.marketabilityCeiling ?? 0.98;
  const marketabilityFactor = clamp(floor + readinessAssessment.overallScore / 520, floor, ceiling);
  const geographyFactor = geographyAdjustment?.geographyAdjustmentFactor || 1;
  const urgencyFactor =
    request.engagement.urgency === 'forced' ? 0.72 : request.engagement.urgency === 'accelerated' ? 0.88 : 1;
  const workingCapitalBridge =
    typeof normalizedMetrics.actualWorkingCapital === 'number' && typeof normalizedMetrics.normalizedWorkingCapital === 'number'
      ? normalizedMetrics.actualWorkingCapital - normalizedMetrics.normalizedWorkingCapital
      : 0;

  const bridgeDelta =
    (request.bridge.cashAndEquivalents || 0) +
    (request.bridge.nonOperatingAssets || 0) +
    workingCapitalBridge -
    (request.bridge.interestBearingDebt || 0) -
    (request.bridge.shareholderLoans || 0) -
    (request.bridge.leaseLiabilities || 0) -
    (request.bridge.taxLiabilities || 0) -
    (request.bridge.contingentLiabilities || 0) -
    (request.bridge.nonOperatingLiabilities || 0);

  const enterpriseValue = {
    fundamentalLow: Math.max(reconciled.low, 0),
    fundamentalMid: Math.max(reconciled.mid, 0),
    fundamentalHigh: Math.max(reconciled.high, 0),
    achievableTodayLow: Math.max(reconciled.low * marketabilityFactor * geographyFactor, 0),
    achievableTodayMid: Math.max(reconciled.mid * marketabilityFactor * geographyFactor, 0),
    achievableTodayHigh: Math.max(reconciled.high * marketabilityFactor * geographyFactor, 0),
  };

  if (request.engagement.urgency !== 'orderly') {
    enterpriseValue.forcedSaleLow = Math.max(enterpriseValue.fundamentalLow * urgencyFactor, 0);
    enterpriseValue.forcedSaleMid = Math.max(enterpriseValue.fundamentalMid * urgencyFactor, 0);
    enterpriseValue.forcedSaleHigh = Math.max(enterpriseValue.fundamentalHigh * urgencyFactor, 0);
  }

  const spreadMultiplier = 1 + confidenceAssessment.rangeWidthPct / 100;
  const equityBase = {
    fundamentalLow: enterpriseValue.fundamentalLow + bridgeDelta,
    fundamentalMid: enterpriseValue.fundamentalMid + bridgeDelta,
    fundamentalHigh: enterpriseValue.fundamentalHigh + bridgeDelta,
    achievableTodayLow: enterpriseValue.achievableTodayLow + bridgeDelta,
    achievableTodayMid: enterpriseValue.achievableTodayMid + bridgeDelta,
    achievableTodayHigh: enterpriseValue.achievableTodayHigh + bridgeDelta,
    forcedSaleLow: enterpriseValue.forcedSaleLow === undefined ? undefined : enterpriseValue.forcedSaleLow + bridgeDelta,
    forcedSaleMid: enterpriseValue.forcedSaleMid === undefined ? undefined : enterpriseValue.forcedSaleMid + bridgeDelta,
    forcedSaleHigh: enterpriseValue.forcedSaleHigh === undefined ? undefined : enterpriseValue.forcedSaleHigh + bridgeDelta,
  };

  return {
    enterpriseValue,
    equityValue: {
      fundamentalLow: Math.max(equityBase.fundamentalLow, 0),
      fundamentalMid: Math.max(equityBase.fundamentalMid, 0),
      fundamentalHigh: Math.max(equityBase.fundamentalHigh, equityBase.fundamentalMid * spreadMultiplier, 0),
      achievableTodayLow: Math.max(equityBase.achievableTodayLow, 0),
      achievableTodayMid: Math.max(equityBase.achievableTodayMid, 0),
      achievableTodayHigh: Math.max(equityBase.achievableTodayHigh, equityBase.achievableTodayMid * spreadMultiplier, 0),
      forcedSaleLow: equityBase.forcedSaleLow === undefined ? undefined : Math.max(equityBase.forcedSaleLow, 0),
      forcedSaleMid: equityBase.forcedSaleMid === undefined ? undefined : Math.max(equityBase.forcedSaleMid, 0),
      forcedSaleHigh: equityBase.forcedSaleHigh === undefined ? undefined : Math.max(equityBase.forcedSaleHigh, 0),
    },
    workingCapitalBridge,
    qualitativeAdjustments: {
      geographyBucket: geographyAdjustment?.geographyBucket,
      normalizedPrimaryState: geographyAdjustment?.normalizedPrimaryState,
      geographyAdjustmentFactor: geographyFactor,
      branchFamily: branchQuality?.branchFamily,
      branchQualityFactor: branchQuality?.branchQualityFactor,
      branchSignalScore: branchQuality?.branchSignalScore,
      branchSignals: branchQuality?.branchSignals,
    },
  };
}
