# Generated Policy Calibration Audit

Generated: 2026-03-27T17:21:20.655Z

## Summary

- Total policy groups: 20
- Groups with calibration overrides: 20
- Market-metric basis overrides: 13
- Capitalized-metric basis overrides: 13
- High-priority review groups: PG_AGRI_PRIMARY, PG_AGRO_PROCESSING, PG_CONTRACT_MANUFACTURING, PG_CREATIVE_AGENCY, PG_EDUCATION_ENROLLMENT, PG_HEALTHCARE_DISTRIBUTION, PG_HEALTHCARE_SERVICE, PG_HOSPITALITY_VENUE, PG_LOGISTICS_ASSET, PG_PROFESSIONAL_PLATFORM, PG_PROJECT_CONTRACTING, PG_REAL_ESTATE_SERVICE, PG_RETAIL_COMMERCE
- Fixed in this pass: PG_PROJECT_SOFTWARE_IT

## Rows

| Policy Group | Severity | Market Basis | Capitalized Basis | Key Range Overrides | Benchmark Sets | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| PG_PROJECT_SOFTWARE_IT | fixed_now | No metric-basis override | No metric-basis override | cap-rate range | BMK_OWNER_NG_PROJECT_SOFTWARE_IT_2026Q1 | Restored to EBITDA-led market multiples because the prior revenue-multiple override was based on a broad proxy pack and produced misleading early outputs for high-margin IT-support cases. |
| PG_AGRI_PRIMARY | high | adjustedEbit -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_AGRI_PRIMARY_2026Q1 | Review whether the calibration has become too revenue-led for a business model that base policy treats as earnings-sensitive. |
| PG_AGRO_PROCESSING | high | adjustedEbitda -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_AGRO_PROCESSING_2026Q1 | Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset. |
| PG_CONTRACT_MANUFACTURING | high | adjustedEbitda -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_CONTRACT_MANUFACTURING_2026Q1 | Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset. |
| PG_CREATIVE_AGENCY | high | adjustedEbitda -> revenue | No metric-basis override | market range, cap-rate range | BMK_OWNER_NG_CREATIVE_AGENCY_2026Q1 | Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset. |
| PG_EDUCATION_ENROLLMENT | high | adjustedEbitda -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_EDUCATION_ENROLLMENT_2026Q1 | Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset. |
| PG_HEALTHCARE_DISTRIBUTION | high | adjustedEbit -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_HEALTHCARE_DISTRIBUTION_2026Q1 | Review whether the calibration has become too revenue-led for a business model that base policy treats as earnings-sensitive. |
| PG_HEALTHCARE_SERVICE | high | adjustedEbitda -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_HEALTHCARE_SERVICE_2026Q1 | Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset. |
| PG_HOSPITALITY_VENUE | high | adjustedEbitda -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_HOSPITALITY_VENUE_2026Q1 | Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset. |
| PG_LOGISTICS_ASSET | high | adjustedEbitda -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_LOGISTICS_ASSET_2026Q1 | Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset. |
| PG_PROFESSIONAL_PLATFORM | high | adjustedEbitda -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_PROFESSIONAL_PLATFORM_2026Q1 | Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset. |
| PG_PROJECT_CONTRACTING | high | adjustedEbitda -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_PROJECT_CONTRACTING_2026Q1 | Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset. |
| PG_REAL_ESTATE_SERVICE | high | adjustedEbitda -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_REAL_ESTATE_SERVICE_2026Q1 | Review whether revenue should really replace EBITDA as the primary market basis here, especially if the benchmark set is a proxy blend rather than a tight sector dataset. |
| PG_RETAIL_COMMERCE | high | adjustedEbit -> revenue | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_RETAIL_COMMERCE_2026Q1 | Review whether the calibration has become too revenue-led for a business model that base policy treats as earnings-sensitive. |
| PG_PROPERTY_ASSET_NAV | medium | No metric-basis override | adjustedEbit -> sde | market range, cap-rate range | BMK_OWNER_NG_PROPERTY_ASSET_NAV_2026Q1 | Confirm that the owner-mode calibration should truly anchor on SDE rather than maintainable EBIT for this policy family. |
| PG_ASSET_HEAVY_MANUFACTURING | low | No metric-basis override | No metric-basis override | market range, cap-rate range, weights | BMK_OWNER_NG_ASSET_HEAVY_MANUFACTURING_2026Q1 | No immediate action beyond normal calibration monitoring. |
| PG_LOCAL_SERVICE_OWNER_OP | low | No metric-basis override | No metric-basis override | market range, cap-rate range, weights | BMK_OWNER_NG_LOCAL_SERVICE_OWNER_OP_2026Q1 | No immediate action beyond normal calibration monitoring. |
| PG_PROFESSIONAL_OWNER_LED | low | No metric-basis override | No metric-basis override | market range, cap-rate range, weights | BMK_OWNER_NG_PROFESSIONAL_OWNER_LED_2026Q1 | No immediate action beyond normal calibration monitoring. |
| PG_RECURRING_SOFTWARE | low | No metric-basis override | No metric-basis override | market range, weights | BMK_OWNER_NG_RECURRING_SOFTWARE_2026Q1 | No immediate action beyond normal calibration monitoring. |
| PG_TRADING_DISTRIBUTION | low | No metric-basis override | No metric-basis override | market range, cap-rate range | BMK_OWNER_NG_TRADING_DISTRIBUTION_2026Q1 | No immediate action beyond normal calibration monitoring. |

## Notes

- This audit compares the base policy registry against the calibration override table now in force.
- A market-metric basis override is the strongest structural mismatch signal, because it can change the valuation family from earnings-led to revenue-led.
- Proxy-blended benchmark sets deserve more skepticism when they flip metric basis, especially for service businesses with strong margins.
