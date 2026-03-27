# Generated Question Audit Report

Generated at: 2026-03-27T15:01:03.081Z

## Coverage

- Manifest valid: yes
- Live questions covered: 80
- Passing: 69
- Wrong direction: 0
- Too weak / tied: 0
- Unexpected method switch: 0
- No effect: 0
- Context-only by design: 10
- Structural by design: 1

## Question Status

| Question | Class | Canonical path | Baseline | Metric | Status | Baseline value | Best case | Worst case | Failures |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `annualDepreciation` | direct_value_lever | `financials.historicals[0].depreciationAmortization` | Local owner-led service baseline | `summary.adjustedValue` | passing | ₦75.00m | 87.345 | 74.647 | — |
| `assetSeparation` | indirect_readiness_confidence_lever | `operatingProfile.assetSeparation` | Retail / commerce baseline | `summary.readinessScore` | passing | ₦60.00m | 68.213 | 64.963 | — |
| `bankingQuality` | indirect_readiness_confidence_lever | `financials.sourceQuality.bankingQuality` | Retail / commerce baseline | `summary.confidenceScore` | passing | ₦60.00m | 43.479 | 39.354 | — |
| `bestCustomerImpact` | indirect_readiness_confidence_lever | `operatingProfile.bestCustomerRisk` | Retail / commerce baseline | `summary.readinessScore` | passing | ₦60.00m | 67.213 | 65.113 | — |
| `businessDescription` | operational_exception | `company.businessSummary` | custom | `n/a` | context-only by design | — | — | — | — |
| `businessName` | operational_exception | `company.businessName` | custom | `n/a` | context-only by design | — | — | — | — |
| `capacityUtilization` | direct_value_lever | `operatingProfile.capacityUtilization` | Manufacturing baseline | `summary.adjustedValue` | passing | ₦99.00m | 99.332 | 97.561 | — |
| `cashBalance` | direct_value_lever | `bridge.cashAndEquivalents` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 79.626 | 48.71 | — |
| `catchmentArea` | direct_value_lever | `operatingProfile.catchmentArea` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 62.505 | 59.174 | — |
| `criticalHireSalaryPremium` | indirect_readiness_confidence_lever | `operatingProfile.criticalHireSalaryPremium` | Local owner-led service baseline | `summary.confidenceScore` | passing | ₦75.00m | 42.241 | 42.104 | — |
| `criticalHireTime` | indirect_readiness_confidence_lever | `operatingProfile.criticalHireTime` | Local owner-led service baseline | `summary.confidenceScore` | passing | ₦75.00m | 42.282 | 42.1 | — |
| `customerConcentration` | indirect_readiness_confidence_lever | `operatingProfile.customerConcentration` | Retail / commerce baseline | `summary.readinessScore` | passing | ₦60.00m | 67.213 | 65.113 | — |
| `differentiation` | direct_value_lever | `operatingProfile.differentiation` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 60.428 | 59.146 | — |
| `email` | operational_exception | `company.email` | custom | `n/a` | context-only by design | — | — | — | — |
| `equipmentAgeCondition` | direct_value_lever | `operatingProfile.equipmentAgeCondition` | Manufacturing baseline | `summary.adjustedValue` | passing | ₦99.00m | 99.607 | 97.049 | — |
| `financeTracking` | indirect_readiness_confidence_lever | `financials.sourceQuality.bookkeepingQuality` | Retail / commerce baseline | `summary.confidenceScore` | passing | ₦60.00m | 43.479 | 39.629 | — |
| `financialDebt` | direct_value_lever | `bridge.interestBearingDebt` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 72.266 | 41.201 | — |
| `firstName` | operational_exception | `company.firstName` | custom | `n/a` | context-only by design | — | — | — | — |
| `founderRevenueDependence` | indirect_readiness_confidence_lever | `operatingProfile.founderRevenueDependence` | Project / service baseline | `summary.readinessScore` | passing | ₦181.00m | 73.625 | 71.375 | — |
| `fxExposure` | direct_value_lever | `operatingProfile.fxExposure` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 59.84 | 56.535 | — |
| `grossMarginStability` | direct_value_lever | `operatingProfile.grossMarginStability` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 60.192 | 58.487 | — |
| `growthPotential` | indirect_readiness_confidence_lever | `operatingProfile.growthOutlook` | Retail / commerce baseline | `summary.confidenceScore` | passing | ₦60.00m | 43.312 | 41.846 | — |
| `industryFit` | indirect_readiness_confidence_lever | `classification.industryFit` | Retail / commerce baseline | `summary.confidenceScore` | passing | ₦60.00m | 42.642 | 41.504 | — |
| `inventoryProfile` | indirect_readiness_confidence_lever | `operatingProfile.inventoryProfile` | Retail / commerce baseline | `summary.confidenceScore` | passing | ₦60.00m | 42.505 | 42.303 | — |
| `inventoryValueLatest` | direct_value_lever | `financials.historicals[0].inventory` | Manufacturing baseline | `summary.adjustedValue` | passing | ₦99.00m | 103.438 | 64.753 | — |
| `keyPersonDependencies` | direct_value_lever | `operatingProfile.keyPersonDependencies` | Project / service baseline | `summary.adjustedValue` | passing | ₦181.00m | 184.004 | 178.78 | — |
| `largestSupplierShare` | indirect_readiness_confidence_lever | `operatingProfile.largestSupplierShare` | Retail / commerce baseline | `summary.confidenceScore` | passing | ₦60.00m | 42.379 | 42.246 | — |
| `lastName` | operational_exception | `company.lastName` | custom | `n/a` | context-only by design | — | — | — | — |
| `legalStructure` | indirect_readiness_confidence_lever | `company.legalStructure` | Local owner-led service baseline | `summary.readinessScore` | passing | ₦75.00m | 68.425 | 66.675 | — |
| `level1` | direct_value_lever | `classification.level1` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 60.464 | 59.216 | — |
| `level2` | structural_classifier | `classification.level2` | custom | `summary.adjustedValue` | structural by design | — | 229.271 | 59.84 | — |
| `maintenanceCapexLatest` | direct_value_lever | `financials.historicals[0].maintenanceCapex` | Manufacturing baseline | `summary.adjustedValue` | passing | ₦99.00m | 99.017 | 98.387 | — |
| `managementDepth` | indirect_readiness_confidence_lever | `readiness.managementDepth` | Local owner-led service baseline | `summary.readinessScore` | passing | ₦75.00m | 69.775 | 67.525 | — |
| `manufacturingValueCreation` | direct_value_lever | `operatingProfile.manufacturingValueCreation` | Manufacturing baseline | `summary.adjustedValue` | passing | ₦99.00m | 99.755 | 97.718 | — |
| `marketDemand` | indirect_readiness_confidence_lever | `operatingProfile.marketDemand` | Retail / commerce baseline | `summary.confidenceScore` | passing | ₦60.00m | 43.312 | 41.846 | — |
| `marketManagerCompensation` | direct_value_lever | `normalization.schedule.owner_comp_market_equivalent` | Local owner-led service baseline | `summary.adjustedValue` | passing | ₦75.00m | 85.313 | 39.602 | — |
| `marketRelatedPartyCompEquivalent` | direct_value_lever | `normalization.schedule.related_party_comp_market` | Local owner-led service baseline | `summary.adjustedValue` | passing | ₦75.00m | 74.647 | 54.331 | — |
| `marketRentEquivalent` | direct_value_lever | `normalization.schedule.related_party_rent_market` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 59.84 | 55.701 | — |
| `nonCoreIncomeAmount` | direct_value_lever | `normalization.schedule.non_core_income` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 59.84 | 58.001 | — |
| `oneOffExpenseAmount` | direct_value_lever | `normalization.schedule.one_off_expenses` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 61.679 | 59.84 | — |
| `oneOffIncomeAmount` | direct_value_lever | `normalization.schedule.one_off_income` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 59.84 | 58.001 | — |
| `operatingYears` | indirect_readiness_confidence_lever | `company.operatingYearsBand` | Local owner-led service baseline | `summary.readinessScore` | passing | ₦75.00m | 71.225 | 65.925 | — |
| `ownerAbsence2Weeks` | indirect_readiness_confidence_lever | `readiness.ownerAbsence2Weeks` | Local owner-led service baseline | `summary.readinessScore` | passing | ₦75.00m | 69.025 | 66.775 | — |
| `ownerAbsence3Months` | indirect_readiness_confidence_lever | `readiness.ownerAbsence3Months` | Local owner-led service baseline | `summary.readinessScore` | passing | ₦75.00m | 69.505 | 67.075 | — |
| `ownerControl` | indirect_readiness_confidence_lever | `company.ownerControlBand` | Local owner-led service baseline | `summary.readinessScore` | passing | ₦75.00m | 68.425 | 66.675 | — |
| `ownerCustomerRelationship` | indirect_readiness_confidence_lever | `operatingProfile.founderRevenueDependence` | Local owner-led service baseline | `summary.readinessScore` | passing | ₦75.00m | 70.075 | 67.825 | — |
| `ownerTotalCompensation` | direct_value_lever | `normalization.schedule.owner_comp_total` | Local owner-led service baseline | `summary.adjustedValue` | passing | ₦75.00m | 130.516 | 39.094 | — |
| `payablesLatest` | direct_value_lever | `financials.historicals[0].payables` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 74.458 | 47.387 | — |
| `peakSeasonDependency` | direct_value_lever | `operatingProfile.peakSeasonDependency` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 60.165 | 58.622 | — |
| `previousOffer` | operational_exception | `engagement.previousOfferStatus` | custom | `n/a` | context-only by design | — | — | — | — |
| `previousOfferAmount` | operational_exception | `engagement.previousOfferAmount` | custom | `n/a` | context-only by design | — | — | — | — |
| `pricingPower` | direct_value_lever | `operatingProfile.pricingPower` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 62.158 | 59.84 | — |
| `pricingPowerVsMarket` | direct_value_lever | `operatingProfile.pricingPowerVsMarket` | Project / service baseline | `summary.adjustedValue` | passing | ₦181.00m | 184.256 | 179.201 | — |
| `primaryState` | direct_value_lever | `company.primaryState` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 59.84 | 56.798 | — |
| `privateExpensesAmount` | direct_value_lever | `normalization.schedule.private_expense_addbacks` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 61.242 | 59.403 | — |
| `processDocumentation` | indirect_readiness_confidence_lever | `readiness.processDocumentation` | Local owner-led service baseline | `summary.readinessScore` | passing | ₦75.00m | 72.3 | 60.675 | — |
| `productCustomisation` | direct_value_lever | `operatingProfile.productCustomisation` | Manufacturing baseline | `summary.adjustedValue` | passing | ₦99.00m | 99.883 | 97.718 | — |
| `productRights` | direct_value_lever | `operatingProfile.productRights` | Manufacturing baseline | `summary.adjustedValue` | passing | ₦99.00m | 99.814 | 97.649 | — |
| `proofReadiness` | indirect_readiness_confidence_lever | `financials.sourceQuality.proofReadiness` | Retail / commerce baseline | `summary.confidenceScore` | passing | ₦60.00m | 44.854 | 41.004 | — |
| `qualityCertifications` | direct_value_lever | `operatingProfile.qualityCertifications` | Manufacturing baseline | `summary.adjustedValue` | passing | ₦99.00m | 99.686 | 97.718 | — |
| `quantities` | direct_value_lever | `operatingProfile.quantities` | Manufacturing baseline | `summary.adjustedValue` | passing | ₦99.00m | 99.755 | 97.649 | — |
| `rawMaterialPriceExposure` | direct_value_lever | `operatingProfile.rawMaterialPriceExposure` | Manufacturing baseline | `summary.adjustedValue` | passing | ₦99.00m | 100.67 | 98.23 | — |
| `receivablesLatest` | direct_value_lever | `financials.historicals[0].receivables` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 82.579 | 55.509 | — |
| `recurringRevenueShare` | indirect_readiness_confidence_lever | `operatingProfile.recurringRevenueShare` | Project / service baseline | `summary.readinessScore` | passing | ₦181.00m | 73.325 | 71.675 | — |
| `relatedPartyCompPaid` | direct_value_lever | `normalization.schedule.related_party_comp_actual` | Local owner-led service baseline | `summary.adjustedValue` | passing | ₦75.00m | 94.963 | 74.647 | — |
| `relatedPartyRentPaid` | direct_value_lever | `normalization.schedule.related_party_rent_actual` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 63.978 | 59.84 | — |
| `replacementDifficulty` | indirect_readiness_confidence_lever | `readiness.replacementDifficulty` | Local owner-led service baseline | `summary.readinessScore` | passing | ₦75.00m | 69.925 | 67.825 | — |
| `respondentRole` | operational_exception | `meta.respondentRole` | custom | `n/a` | context-only by design | — | — | — | — |
| `revenueLatest` | direct_value_lever | `financials.historicals[0].revenue` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 66.771 | 52.909 | — |
| `revenueVisibility` | indirect_readiness_confidence_lever | `operatingProfile.revenueVisibility` | Project / service baseline | `summary.readinessScore` | passing | ₦181.00m | 73.925 | 72.125 | — |
| `shareholderLoans` | direct_value_lever | `bridge.shareholderLoans` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 59.84 | 39.84 | — |
| `shrinkageSpoilage` | direct_value_lever | `operatingProfile.shrinkageSpoilage` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 60.381 | 58.622 | — |
| `staffUtilization` | direct_value_lever | `operatingProfile.staffUtilization` | Project / service baseline | `summary.adjustedValue` | passing | ₦181.00m | 184.256 | 179.623 | — |
| `supplierConcentration` | direct_value_lever | `operatingProfile.supplierConcentration` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 60.381 | 58.622 | — |
| `supplierReplacementTime` | indirect_readiness_confidence_lever | `operatingProfile.supplierReplacementTime` | Retail / commerce baseline | `summary.confidenceScore` | passing | ₦60.00m | 42.379 | 42.246 | — |
| `termsAccepted` | operational_exception | `meta.acknowledged` | custom | `n/a` | context-only by design | — | — | — | — |
| `traceablePaymentsShare` | direct_value_lever | `financials.sourceQuality.traceablePaymentsShare` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 59.84 | 53.369 | — |
| `transactionGoal` | direct_value_lever | `engagement.purpose` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 60.15 | 59.219 | — |
| `transactionTimeline` | direct_value_lever | `engagement.urgency` | Retail / commerce baseline | `summary.adjustedValue` | passing | ₦60.00m | 59.84 | 57.346 | — |
| `whatsapp` | operational_exception | `company.whatsapp` | custom | `n/a` | context-only by design | — | — | — | — |

## Failures
