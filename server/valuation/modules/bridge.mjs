import { clamp } from './utils.mjs';
import {
  buildFxExposureAdjustment,
  buildLevel1Adjustment,
  buildMarketPositionAdjustment,
  buildTraceabilityAdjustment,
  buildTransactionGoalAdjustment,
} from './qualitative-adjustments.mjs';

function compressRangeAroundMid(low, mid, high, confidenceAssessment) {
  const rangeWidthPct = confidenceAssessment?.rangeWidthPct ?? 0;
  const confidenceScore = confidenceAssessment?.overallScore ?? 45;
  const compressionFactor = clamp((confidenceScore - 45) / 35, 0, 0.85);
  const lowerBandPct = Math.max(0.08, Math.min(0.32, (rangeWidthPct / 100) * 1.05));
  const upperBandPct = Math.max(0.08, Math.min(0.34, rangeWidthPct / 100));
  const targetLow = Math.max(mid * (1 - lowerBandPct), 0);
  const targetHigh = Math.max(mid * (1 + upperBandPct), mid);

  return {
    low: Math.max(low + (targetLow - low) * compressionFactor, 0),
    mid: Math.max(mid, 0),
    high: Math.max(high + (targetHigh - high) * compressionFactor, mid, 0),
    compressionFactor,
    lowerBandPct,
    upperBandPct,
  };
}

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
  const level1Adjustment = buildLevel1Adjustment(request.classification?.level1);
  const transactionGoalAdjustment = buildTransactionGoalAdjustment(request);
  const marketPositionAdjustment = buildMarketPositionAdjustment(request);
  const fxExposureAdjustment = buildFxExposureAdjustment(request);
  const traceabilityAdjustment = buildTraceabilityAdjustment(request);
  const urgencyFactor =
    request.engagement.urgency === 'forced' ? 0.72 : request.engagement.urgency === 'accelerated' ? 0.88 : 1;
  const achievableUrgencyFactor =
    request.engagement.urgency === 'forced' ? 0.9 : request.engagement.urgency === 'accelerated' ? 0.96 : 1;
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

  const bridgeComponents = [
    { key: 'cash_and_equivalents', label: 'Cash and equivalents', amount: request.bridge.cashAndEquivalents || 0 },
    { key: 'non_operating_assets', label: 'Non-operating assets', amount: request.bridge.nonOperatingAssets || 0 },
    { key: 'working_capital_bridge', label: 'Working-capital bridge', amount: workingCapitalBridge },
    { key: 'interest_bearing_debt', label: 'Interest-bearing debt', amount: -(request.bridge.interestBearingDebt || 0) },
    { key: 'shareholder_loans', label: 'Shareholder loans', amount: -(request.bridge.shareholderLoans || 0) },
    { key: 'lease_liabilities', label: 'Lease liabilities', amount: -(request.bridge.leaseLiabilities || 0) },
    { key: 'tax_liabilities', label: 'Tax liabilities', amount: -(request.bridge.taxLiabilities || 0) },
    { key: 'contingent_liabilities', label: 'Contingent liabilities', amount: -(request.bridge.contingentLiabilities || 0) },
    { key: 'non_operating_liabilities', label: 'Non-operating liabilities', amount: -(request.bridge.nonOperatingLiabilities || 0) },
  ];
  const spreadMultiplier = Number((1 + confidenceAssessment.rangeWidthPct / 100).toFixed(4));

  const rawEnterpriseValue = {
    fundamentalLow: Math.max(reconciled.low, 0),
    fundamentalMid: Math.max(reconciled.mid, 0),
    fundamentalHigh: Math.max(reconciled.high, 0),
    achievableTodayLow: Math.max(
      reconciled.low
        * marketabilityFactor
        * geographyFactor
        * level1Adjustment.level1AdjustmentFactor
        * transactionGoalAdjustment.transactionContextFactor
        * traceabilityAdjustment.traceabilityAdjustmentFactor
        * achievableUrgencyFactor,
      0
    ),
    achievableTodayMid: Math.max(
      reconciled.mid
        * marketabilityFactor
        * geographyFactor
        * level1Adjustment.level1AdjustmentFactor
        * transactionGoalAdjustment.transactionContextFactor
        * traceabilityAdjustment.traceabilityAdjustmentFactor
        * achievableUrgencyFactor,
      0
    ),
    achievableTodayHigh: Math.max(
      reconciled.high
        * marketabilityFactor
        * geographyFactor
        * level1Adjustment.level1AdjustmentFactor
        * transactionGoalAdjustment.transactionContextFactor
        * traceabilityAdjustment.traceabilityAdjustmentFactor
        * achievableUrgencyFactor,
      0
    ),
  };

  const compressedFundamentalEnterprise = compressRangeAroundMid(
    rawEnterpriseValue.fundamentalLow,
    rawEnterpriseValue.fundamentalMid,
    rawEnterpriseValue.fundamentalHigh,
    confidenceAssessment
  );
  const compressedAchievableEnterprise = compressRangeAroundMid(
    rawEnterpriseValue.achievableTodayLow,
    rawEnterpriseValue.achievableTodayMid,
    rawEnterpriseValue.achievableTodayHigh,
    confidenceAssessment
  );

  const enterpriseValue = {
    fundamentalLow: compressedFundamentalEnterprise.low,
    fundamentalMid: compressedFundamentalEnterprise.mid,
    fundamentalHigh: compressedFundamentalEnterprise.high,
    achievableTodayLow: compressedAchievableEnterprise.low,
    achievableTodayMid: compressedAchievableEnterprise.mid,
    achievableTodayHigh: compressedAchievableEnterprise.high,
  };

  if (request.engagement.urgency !== 'orderly') {
    const rawForcedSale = {
      low: Math.max(rawEnterpriseValue.fundamentalLow * urgencyFactor, 0),
      mid: Math.max(rawEnterpriseValue.fundamentalMid * urgencyFactor, 0),
      high: Math.max(rawEnterpriseValue.fundamentalHigh * urgencyFactor, 0),
    };
    const compressedForcedSale = compressRangeAroundMid(rawForcedSale.low, rawForcedSale.mid, rawForcedSale.high, confidenceAssessment);
    enterpriseValue.forcedSaleLow = compressedForcedSale.low;
    enterpriseValue.forcedSaleMid = compressedForcedSale.mid;
    enterpriseValue.forcedSaleHigh = compressedForcedSale.high;
  }
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
      fundamentalHigh: Math.max(equityBase.fundamentalHigh, equityBase.fundamentalMid, 0),
      achievableTodayLow: Math.max(equityBase.achievableTodayLow, 0),
      achievableTodayMid: Math.max(equityBase.achievableTodayMid, 0),
      achievableTodayHigh: Math.max(equityBase.achievableTodayHigh, equityBase.achievableTodayMid, 0),
      forcedSaleLow: equityBase.forcedSaleLow === undefined ? undefined : Math.max(equityBase.forcedSaleLow, 0),
      forcedSaleMid: equityBase.forcedSaleMid === undefined ? undefined : Math.max(equityBase.forcedSaleMid, 0),
      forcedSaleHigh: equityBase.forcedSaleHigh === undefined ? undefined : Math.max(equityBase.forcedSaleHigh, 0),
    },
    workingCapitalBridge,
    qualitativeAdjustments: {
      geographyBucket: geographyAdjustment?.geographyBucket,
      normalizedPrimaryState: geographyAdjustment?.normalizedPrimaryState,
      geographyAdjustmentFactor: geographyFactor,
      level1Bucket: level1Adjustment.level1Bucket,
      level1AdjustmentFactor: level1Adjustment.level1AdjustmentFactor,
      transactionContextLabel: transactionGoalAdjustment.transactionContextLabel,
      transactionContextFactor: transactionGoalAdjustment.transactionContextFactor,
      achievableUrgencyFactor,
      marketPositionSignalScore: marketPositionAdjustment.marketPositionSignalScore,
      marketPositionAdjustmentFactor: marketPositionAdjustment.marketPositionAdjustmentFactor,
      fxExposure: fxExposureAdjustment.fxExposure,
      fxExposureAdjustmentFactor: fxExposureAdjustment.fxExposureAdjustmentFactor,
      traceablePaymentsShare: traceabilityAdjustment.traceablePaymentsShare,
      traceabilityAdjustmentFactor: traceabilityAdjustment.traceabilityAdjustmentFactor,
      branchFamily: branchQuality?.branchFamily,
      branchQualityFactor: branchQuality?.branchQualityFactor,
      branchSignalScore: branchQuality?.branchSignalScore,
      branchSignals: branchQuality?.branchSignals,
    },
    ledger: {
      marketabilityFloor: floor,
      marketabilityCeiling: ceiling,
      marketabilityFactor,
      geographyFactor,
      level1Factor: level1Adjustment.level1AdjustmentFactor,
      transactionContextFactor: transactionGoalAdjustment.transactionContextFactor,
      traceabilityFactor: traceabilityAdjustment.traceabilityAdjustmentFactor,
      achievableUrgencyFactor,
      forcedSaleUrgencyFactor: urgencyFactor,
      workingCapitalBridge,
      bridgeComponents,
      bridgeDelta,
      spreadMultiplier,
      rangeCompressionFactor: Number(compressedAchievableEnterprise.compressionFactor.toFixed(4)),
      rangeBandLowerPct: Number(compressedAchievableEnterprise.lowerBandPct.toFixed(4)),
      rangeBandUpperPct: Number(compressedAchievableEnterprise.upperBandPct.toFixed(4)),
      fundamentalEnterpriseLow: enterpriseValue.fundamentalLow,
      fundamentalEnterpriseMid: enterpriseValue.fundamentalMid,
      fundamentalEnterpriseHigh: enterpriseValue.fundamentalHigh,
      achievableEnterpriseLow: enterpriseValue.achievableTodayLow,
      achievableEnterpriseMid: enterpriseValue.achievableTodayMid,
      achievableEnterpriseHigh: enterpriseValue.achievableTodayHigh,
      fundamentalEquityLow: Math.max(equityBase.fundamentalLow, 0),
      fundamentalEquityMid: Math.max(equityBase.fundamentalMid, 0),
      fundamentalEquityHigh: Math.max(equityBase.fundamentalHigh, equityBase.fundamentalMid, 0),
      achievableEquityLow: Math.max(equityBase.achievableTodayLow, 0),
      achievableEquityMid: Math.max(equityBase.achievableTodayMid, 0),
      achievableEquityHigh: Math.max(equityBase.achievableTodayHigh, equityBase.achievableTodayMid, 0),
    },
  };
}
