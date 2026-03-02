// ==========================================
// AFREXIT VALUATION API (COMPLETE ROBUST VERSION)
// Includes: Guardrails, Validation, Diagnostics, Email
// ==========================================

const CONFIG = {
  RESPONSES_SHEET: "Responses",
  CALCULATIONS_SHEET: "Calculations",
  LOOKUP_SHEET: "Lookup Tables",
  ANALYTICS_SHEET: "Analytics",
  DIAGNOSTICS_SHEET: "Diagnostics",
  SENDER_NAME: "Afrexit",
  YOUR_WHATSAPP_NUMBER: "2348065756001",
  INSTAGRAM_URL: "https://instagram.com/deolunathan",
  TIKTOK_URL: "https://tiktok.com/@deolunathan",
  YOUTUBE_URL: "https://youtube.com/@basecasetv",
  CONFIG_SECTION: "Configuration",
  WEIGHT_SECTION: "Weight",
  SPREADSHEET_ID: "1OY8yr4N0TcCSIiTzm5SaTi9F_F_rG9K4-k6TN005jSc",
  DIAG_PAYLOAD_MAX_CHARS: 20000,
  DIAG_RESULT_MAX_CHARS: 20000,
  FUZZY_MATCH_MAX_DISTANCE: 6,
  FUZZY_MATCH_MIN_SCORE: 0.72
};

function doGet(e) {
  return respond_({
    status: "ok",
    message: "Valuation API is running. Use POST with FormData."
  });
}

function doPost(e) {
  const t0 = Date.now();
  const diagId = Utilities.getUuid().slice(0, 9);
  let ss, lookupSheet, responsesSheet, calcSheet, diagSheet;
  let payload = null;
  let warnings = [];
  let result = null;

  try {
    payload = parseRequestPayload_(e, warnings);
    payload = normalizePayload_(payload, warnings);

    const v = validatePayload_(payload);
    if (!v.ok) return respond_({ status: "error", message: v.message });

    // NEW: Suspicious data checks
    if (payload.profit > payload.revenue && payload.revenue > 0) {
      warnings.push("WARN_SUSPICIOUS: profit exceeds revenue");
    }
    if (payload.revenue > 0 && (payload.profit / payload.revenue) > 0.95) {
      warnings.push("WARN_SUSPICIOUS: margin >95% (verify inputs)");
    }

    ss = getSpreadsheet_();
    responsesSheet = ensureResponsesSheet_(ss);
    calcSheet = ensureCalculationsSheet_(ss);
    diagSheet = ensureDiagnosticsSheet_(ss);
    lookupSheet = ss.getSheetByName(CONFIG.LOOKUP_SHEET);
    
    if (!lookupSheet) {
      return respond_({ status: "error", message: `Missing sheet: "${CONFIG.LOOKUP_SHEET}"` });
    }

    // NEW: Validate enums exist in lookup tables
    validateEnumsExist_(lookupSheet, payload, warnings);

    const responseData = buildResponseDataArray_(payload);
    result = runFullAlgorithm_(lookupSheet, calcSheet, payload, responseData, diagId, warnings);

    const submissionId = Utilities.getUuid().substring(0, 8);
    const timestamp = new Date();
    responsesSheet.appendRow(buildResponsesRow_(submissionId, timestamp, payload));

    const emailResult = safe_(sendValuationReport, result.reportData, result.calcRow);
    if (emailResult && emailResult.success) {
      safe_(logAnalytics_, result.reportData, "Email Sent", "Delivered", result.calcRow);
    } else {
      safe_(logAnalytics_, result.reportData, "Email Failed", (emailResult && emailResult.error) || "Unknown", result.calcRow);
    }

    writeDiagnostics_(diagSheet, {
      diagId,
      status: "OK",
      durationMs: Date.now() - t0,
      payload,
      warnings,
      result: result.reportData
    });

    return respond_({
      status: "success",
      data: {
        businessName: result.reportData.businessName,
        industry: result.reportData.industry,
        location: result.reportData.location,
        lowEstimate: result.reportData.lowEstimate,
        highEstimate: result.reportData.highEstimate,
        adjustedValue: result.reportData.adjustedValue,
        sellabilityScore: result.reportData.sellabilityScore,
        rating: result.reportData.rating,
        distressSale: result.reportData.distressSale,
        distressFlag: result.reportData.distressFlag,
        diagId: diagId,
        warnings: warnings
      }
    });

  } catch (err) {
    try {
      if (!ss) ss = getSpreadsheet_();
      if (ss) diagSheet = ensureDiagnosticsSheet_(ss);
      if (diagSheet) {
        writeDiagnostics_(diagSheet, {
          diagId,
          status: "ERROR",
          durationMs: Date.now() - t0,
          payload: payload || {},
          warnings: warnings.concat([`ERR: ${String(err && err.message ? err.message : err)}`]),
          result: result ? result.reportData : {}
        });
      }
    } catch (e2) {}
    return respond_({ status: "error", message: String(err && err.message ? err.message : err), diagId });
  }
}

function respond_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function safe_(fn, ...args) {
  try { return fn(...args); } catch (e) { console.error(e); return { success: false, error: String(e) }; }
}

function getSpreadsheet_() {
  try {
    if (CONFIG.SPREADSHEET_ID && !CONFIG.SPREADSHEET_ID.includes("YOUR_SPREADSHEET")) {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    }
  } catch (e) {
    console.error("openById failed, using active");
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureResponsesSheet_(ss) {
  let sh = ss.getSheetByName(CONFIG.RESPONSES_SHEET);
  if (!sh) sh = ss.insertSheet(CONFIG.RESPONSES_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow([
      "SubmissionID", "Timestamp", "Source",
      "Industry", "Location", "Age", "Revenue", "Profit", "Growth",
      "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15", "Q16", "Q17", "Q18", "Q19", "Q20", "Q21", "Q22", "Q23", "Q24",
      "DistressSale",
      "FirstName", "WhatsApp", "Email", "BusinessName", "Newsletter", "TermsAccepted", "PrivacyAccepted"
    ]);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight("bold");
  } else {
    const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    if (header.indexOf("DistressSale") === -1) {
      sh.insertColumnAfter(header.indexOf("Q24") + 1);
      sh.getRange(1, header.indexOf("Q24") + 2).setValue("DistressSale").setFontWeight("bold");
    }
    const nextHeader = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    const missingTailHeaders = ["TermsAccepted", "PrivacyAccepted"].filter(name => nextHeader.indexOf(name) === -1);
    if (missingTailHeaders.length > 0) {
      const startCol = sh.getLastColumn() + 1;
      sh.getRange(1, startCol, 1, missingTailHeaders.length).setValues([missingTailHeaders]).setFontWeight("bold");
    }
  }
  return sh;
}

function ensureCalculationsSheet_(ss) {
  let sh = ss.getSheetByName(CONFIG.CALCULATIONS_SHEET);
  if (!sh) sh = ss.insertSheet(CONFIG.CALCULATIONS_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow([
      "WhatsApp", "BaseValuation",
      "F1_Score", "F1_Discount", "F2_Score", "F2_Discount", "F3_Score", "F3_Discount",
      "F4_Score", "F4_Discount", "F5_Score", "F5_Discount", "F6_Score", "F6_Impact",
      "F7_Score", "F7_Discount", "F8_Score", "F8_Discount", "F9_Score", "F9_Discount",
      "IlliquidityDiscount", "DistressSale", "DistressFlag",
      "AdjustedValue", "LowEstimate", "HighEstimate", "SellabilityScore", "Rating",
      "DiagId", "Warnings", "EmailStatus"
    ]);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight("bold");
  }
  return sh;
}

function ensureDiagnosticsSheet_(ss) {
  let sh = ss.getSheetByName(CONFIG.DIAGNOSTICS_SHEET);
  if (!sh) sh = ss.insertSheet(CONFIG.DIAGNOSTICS_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow([
      "Timestamp", "DiagId", "Status", "DurationMs",
      "BusinessName", "Email", "WhatsApp", "Industry", "Age", "Revenue", "Profit", "Growth",
      "DistressSale", "Warnings", "PayloadJSON", "ResultJSON"
    ]);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight("bold");
  }
  return sh;
}

function setupAnalyticsSheet_(ss) {
  let sh = ss.getSheetByName(CONFIG.ANALYTICS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.ANALYTICS_SHEET);
    sh.appendRow(["Timestamp", "Event Type", "Business Name", "Email", "Sellability Score",
      "Estimated Value (M)", "Industry", "Location", "Source", "Details", "Session ID", "Calc Row"]);
    sh.getRange(1, 1, 1, 12).setFontWeight("bold");
  }
  return sh;
}

function logAnalytics_(data, eventType, details, calcRow) {
  const ss = getSpreadsheet_();
  const sh = setupAnalyticsSheet_(ss);
  sh.appendRow([
    new Date(), eventType, data.businessName, data.email, data.sellabilityScore,
    data.adjustedValue, data.industry, data.location || "N/A", "Web App", details,
    Utilities.getUuid(), calcRow
  ]);
}

function writeDiagnostics_(diagSheet, { diagId, status, durationMs, payload, warnings, result }) {
  const w = (warnings || []).join(" | ").slice(0, 1000);
  diagSheet.appendRow([
    new Date(), diagId, status, durationMs,
    payload.businessName || "", payload.email || "", payload.whatsapp || "",
    payload.industry || "", payload.age || "", payload.revenue || "", payload.profit || "", payload.growth || "",
    payload.distressSale || "", w,
    safeJsonStringify_(payload, CONFIG.DIAG_PAYLOAD_MAX_CHARS),
    safeJsonStringify_(result, CONFIG.DIAG_RESULT_MAX_CHARS)
  ]);
}

function safeJsonStringify_(obj, maxChars) {
  let s = "";
  try { s = JSON.stringify(obj); } catch (e) { s = String(obj); }
  if (s.length > maxChars) s = s.slice(0, maxChars) + "...(truncated)";
  return s;
}

function parseRequestPayload_(e, warnings) {
  let p = {};
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : "";
    const ct = e && e.postData && e.postData.type ? String(e.postData.type) : "";
    if (raw && ct && ct.indexOf("application/json") >= 0) {
      p = JSON.parse(raw);
      if (p && typeof p === "object") return p;
    }
    if (raw && raw.trim().startsWith("{")) {
      try { p = JSON.parse(raw); if (p && typeof p === "object") return p; } catch (e2) {}
    }
    if (e && e.parameter) return e.parameter;
  } catch (err) {
    warnings.push("WARN_PARSE: Failed to parse body");
    if (e && e.parameter) return e.parameter;
  }
  return {};
}

function normalizePayload_(p, warnings) {
  const get = (...keys) => {
    for (const k of keys) if (p && Object.prototype.hasOwnProperty.call(p, k)) return p[k];
    return "";
  };
  
  const out = {
    industry: cleanText_(get("industry")),
    location: cleanText_(get("location")) || "Not provided",
    age: cleanText_(get("age")),
    revenue: parseMoney_(get("revenue"), warnings, "revenue"),
    profit: parseMoney_(get("profit"), warnings, "profit"),
    growth: cleanText_(get("growth")),
    q7: cleanText_(get("q7", "Q7")), q8: cleanText_(get("q8", "Q8")), q9: cleanText_(get("q9", "Q9")),
    q10: cleanText_(get("q10", "Q10")), q11: cleanText_(get("q11", "Q11")), q12: cleanText_(get("q12", "Q12")),
    q13: cleanText_(get("q13", "Q13")), q14: cleanText_(get("q14", "Q14")), q15: cleanText_(get("q15", "Q15")),
    q16: cleanText_(get("q16", "Q16")), q17: cleanText_(get("q17", "Q17")), q18: cleanText_(get("q18", "Q18")),
    q19: cleanText_(get("q19", "Q19")), q20: cleanText_(get("q20", "Q20")), q21: cleanText_(get("q21", "Q21")),
    q22: cleanText_(get("q22", "Q22")), q23: cleanText_(get("q23", "Q23")), q24: cleanText_(get("q24", "Q24")),
    distressSale: cleanText_(get("distressSale", "distress_sale", "distress")),
    firstName: cleanText_(get("firstName", "firstname", "first_name")) || "Business Owner",
    whatsapp: cleanDigits_(String(get("whatsapp", "phone", "mobile"))),
    email: cleanText_(get("email")).toLowerCase(),
    businessName: cleanText_(get("businessName", "business_name")) || "Your Business",
    newsletter: isTruthy_(get("newsletter")) ? "Yes" : "",
    termsAccepted: isTruthy_(get("termsAccepted", "terms_accepted", "termsAccepted[]")) ? "Yes" : "",
    privacyAccepted: isTruthy_(get("privacyAccepted", "privacy_accepted", "privacyAccepted[]")) ? "Yes" : ""
  };
  
  if (!out.whatsapp) warnings.push("WARN_FIELD: whatsapp empty");
  return out;
}

function validatePayload_(payload) {
  if (!payload.email || payload.email.indexOf("@") === -1) return { ok: false, message: "Valid email required." };
  if (!payload.businessName) return { ok: false, message: "Business name required." };
  if (!isTruthy_(payload.termsAccepted) || !isTruthy_(payload.privacyAccepted)) return { ok: false, message: "Terms and privacy acceptance required." };
  if ((payload.revenue <= 0) && (payload.profit <= 0)) return { ok: false, message: "Revenue or profit must be > 0." };
  return { ok: true };
}

// NEW: Enum validation
function validateEnumsExist_(sheet, payload, warnings) {
  const checks = [
    {table: "Industry", val: payload.industry}, {table: "Q3_Answer", val: payload.age},
    {table: "Q6_Answer", val: payload.growth}, {table: "Q7_Answer", val: payload.q7},
    {table: "Q8_Answer", val: payload.q8}, {table: "Q9_Answer", val: payload.q9},
    {table: "Q10_Answer", val: payload.q10}, {table: "Q11_Answer", val: payload.q11},
    {table: "Q12_Answer", val: payload.q12}, {table: "Q13_Answer", val: payload.q13},
    {table: "Q15_Answer", val: payload.q15}, {table: "Q16_Answer", val: payload.q16},
    {table: "Q17_Answer", val: payload.q17}, {table: "Q18_Answer", val: payload.q18},
    {table: "Q19_Answer", val: payload.q19}, {table: "Q20_Answer", val: payload.q20},
    {table: "Q21_Answer", val: payload.q21}, {table: "Q22_Answer", val: payload.q22},
    {table: "Q24_Answer", val: payload.q24}
  ];
  checks.forEach(c => {
    if (!c.val) return;
    const res = lookupValueRobust_(sheet, c.table, c.val, "Score");
    if (!res.matched && !res.warning) warnings.push(`WARN_UNKNOWN_ENUM: ${c.table}="${c.val}"`);
  });
}

function cleanText_(s) {
  s = (s === null || s === undefined) ? "" : String(s);
  s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, " ").trim();
  return s;
}

function cleanDigits_(s) {
  s = (s === null || s === undefined) ? "" : String(s);
  return s.replace(/[^\d]/g, "").trim();
}

function parseMoney_(x, warnings, fieldName) {
  if (x === null || x === undefined) return 0;
  if (typeof x === "number") return isNaN(x) ? 0 : x;
  let s = String(x).replace(/,/g, "").replace(/[^\d.]/g, "").trim();
  const n = Number(s);
  if (isNaN(n)) {
    warnings.push(`WARN_PARSE_MONEY: ${fieldName}="${String(x)}"`);
    return 0;
  }
  return n;
}

function isTruthy_(v) {
  const s = cleanText_(v).toLowerCase();
  return s === "yes" || s === "true" || s === "1" || s === "on" || s === "y";
}

function buildResponseDataArray_(payload) {
  const a = new Array(40).fill("");
  a[3] = payload.industry; a[4] = payload.location; a[5] = payload.age;
  a[6] = payload.revenue; a[7] = payload.profit; a[8] = payload.growth;
  a[9] = payload.q7; a[10] = payload.q8; a[11] = payload.q9; a[12] = payload.q10;
  a[13] = payload.q11; a[14] = payload.q12; a[15] = payload.q13; a[16] = payload.q14;
  a[17] = payload.q15; a[18] = payload.q16; a[19] = payload.q17; a[20] = payload.q18;
  a[21] = payload.q19; a[22] = payload.q20; a[23] = payload.q21; a[24] = payload.q22;
  a[25] = payload.q23; a[26] = payload.q24; a[31] = payload.distressSale;
  a[27] = payload.firstName; a[28] = payload.whatsapp; a[29] = payload.email; a[30] = payload.businessName;
  return a;
}

function buildResponsesRow_(submissionId, timestamp, payload) {
  return [
    submissionId, timestamp, "NETLIFY",
    payload.industry, payload.location, payload.age, payload.revenue, payload.profit, payload.growth,
    payload.q7, payload.q8, payload.q9, payload.q10, payload.q11, payload.q12, payload.q13, payload.q14,
    payload.q15, payload.q16, payload.q17, payload.q18, payload.q19, payload.q20, payload.q21, payload.q22,
    payload.q23, payload.q24, payload.distressSale || "",
    payload.firstName, payload.whatsapp, payload.email, payload.businessName, payload.newsletter, payload.termsAccepted, payload.privacyAccepted
  ];
}

function lookupNumberRobust_(sheet, columnName, lookupVal, returnColumn, defaultValue, warnings, contextKey) {
  const { value, matched, warning } = lookupValueRobust_(sheet, columnName, lookupVal, returnColumn);
  if (warning) warnings.push(`${warning}${contextKey ? ` (${contextKey})` : ""}`);
  if (typeof value === "number" && !isNaN(value)) return value;
  if (value !== "" && value !== null && !isNaN(value)) return Number(value);
  if (matched) warnings.push(`WARN_LOOKUP_NONNUM: ${columnName}="${lookupVal}" -> ${returnColumn}="${value}"`);
  return defaultValue;
}

function lookupValueRobust_(sheet, columnName, lookupVal, returnColumn) {
  if (!lookupVal) return { value: null, matched: false, warning: null };
  const data = sheet.getDataRange().getValues();
  const rawLookup = String(lookupVal);
  const normLookup = normalizeKey_(rawLookup);

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(columnName).trim()) {
      let colIndex = -1;
      for (let c = 0; c < data[i].length; c++) {
        if (String(data[i][c]).trim() === String(returnColumn).trim()) { colIndex = c; break; }
      }
      if (colIndex === -1) return { value: null, matched: false, warning: `Column ${returnColumn} not found` };

      let exactRow = null;
      let best = { score: 0, dist: 9999, row: null, key: "" };

      for (let r = i + 1; r < data.length; r++) {
        const k = data[r][0];
        if (k === "" || k === null) break;
        const rawKey = String(k).trim();
        const normKey = normalizeKey_(rawKey);
        
        if (rawKey === rawLookup || normKey === normLookup) {
          exactRow = r;
          break;
        }
        const sim = similarity_(normLookup, normKey);
        if (sim > best.score) best = { score: sim, dist: levenshtein_(normLookup, normKey), row: r, key: rawKey };
      }

      if (exactRow !== null) return { value: data[exactRow][colIndex], matched: true, warning: null };
      if (best.row !== null && best.dist <= CONFIG.FUZZY_MATCH_MAX_DISTANCE && best.score >= CONFIG.FUZZY_MATCH_MIN_SCORE) {
        return { value: data[best.row][colIndex], matched: true, warning: `FUZZY: "${rawLookup}"~>"${best.key}"` };
      }
      return { value: null, matched: false, warning: `MISS: "${rawLookup}" not in ${columnName}` };
    }
  }
  return { value: null, matched: false, warning: `Section ${columnName} not found` };
}

function normalizeKey_(s) {
  return cleanText_(s).toLowerCase().replace(/[^a-z0-9%+ ]/g, " ").replace(/\s+/g, " ").trim();
}

function similarity_(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const dist = levenshtein_(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : (1 - dist / maxLen);
}

// FIXED: Corrected indices in Levenshtein
function levenshtein_(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;  // FIXED: was b[i-1]
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
    }
  }
  return dp[m][n];
}

function getConfigValue_(lookupSheet, key, defaultValue) {
  const data = lookupSheet.getDataRange().getValues();
  // Check CFG section
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === "CFG" || String(data[i][0]).trim() === CONFIG.CONFIG_SECTION) {
      for (let k = i + 1; k < data.length; k++) {
        if (data[k][0] === "" || data[k][0] === null) continue;
        if (String(data[k][1]).trim() === key) {
          const val = data[k][2];
          if (val !== "" && val !== null && !isNaN(val)) return Number(val);
        }
      }
    }
  }
  // Check Weight section
  if (key.includes("_WEIGHT")) {
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === "W" || String(data[i][0]).trim() === CONFIG.WEIGHT_SECTION) {
        for (let k = i + 1; k < data.length; k++) {
          if (String(data[k][1]).trim() === key) {
            const val = data[k][2];
            if (val !== "" && val !== null && !isNaN(val)) return Number(val);
          }
        }
      }
    }
  }
  return defaultValue;
}

function runFullAlgorithm_(lookupSheet, calcSheet, payload, responseData, diagId, warnings) {
  const industry = responseData[3];
  const location = responseData[4] || payload.location || "Not provided";
  const age = responseData[5];
  const actualRevenue = Number(responseData[6]) || 0;
  const actualProfit = Number(responseData[7]) || 0;
  const growthRate = responseData[8];
  const firstName = responseData[27] || "Business Owner";
  const whatsapp = String(responseData[28] || "").trim();
  const email = responseData[29] || "";
  const businessName = responseData[30] || "Your Business";
  const distressSale = responseData[31] || payload.distressSale || "";

  const illiquidityDiscount = getConfigValue_(lookupSheet, "ILLIQUIDITY_DISCOUNT", -0.10);
  const distressMultiplier = getConfigValue_(lookupSheet, "DISTRESS_MULTIPLIER", -0.15);
  const distressFlag = isDistressSaleYes_(distressSale);
  const lowFactor = getConfigValue_(lookupSheet, "LOW_ESTIMATE_FACTOR", 0.75);
  const highFactor = getConfigValue_(lookupSheet, "HIGH_ESTIMATE_FACTOR", 1.25);

  const weights = {
    f1: getConfigValue_(lookupSheet, "F1_WEIGHT", 0.20), f2: getConfigValue_(lookupSheet, "F2_WEIGHT", 0.20),
    f3: getConfigValue_(lookupSheet, "F3_WEIGHT", 0.15), f4: getConfigValue_(lookupSheet, "F4_WEIGHT", 0.20),
    f5: getConfigValue_(lookupSheet, "F5_WEIGHT", 0.10), f6: getConfigValue_(lookupSheet, "F6_WEIGHT", 0.05),
    f7: getConfigValue_(lookupSheet, "F7_WEIGHT", 0.05), f8: getConfigValue_(lookupSheet, "F8_WEIGHT", 0.03),
    f9: getConfigValue_(lookupSheet, "F9_WEIGHT", 0.02)
  };

  // NEW: Validate weight sum
  const weightSum = Object.values(weights).reduce((a,b)=>a+b,0);
  if (Math.abs(weightSum - 1.0) > 0.02) {
    warnings.push(`WARN_WEIGHTS_SUM: ${weightSum.toFixed(3)} (expected 1.0)`);
  }

  const revenueMultiple = lookupNumberRobust_(lookupSheet, "Industry", industry, "Revenue_Multiple", 1.0, warnings, "Industry.Rev");
  const profitMultiple = lookupNumberRobust_(lookupSheet, "Industry", industry, "Profit_Multiple", 3.0, warnings, "Industry.Prof");
  
  let revenueValue = actualRevenue * revenueMultiple;
  let profitValue = actualProfit * profitMultiple;
  let baseValuation = actualProfit > 0 ? (revenueValue + profitValue) / 2 : revenueValue;
  
  const ageMultiplier = lookupNumberRobust_(lookupSheet, "Q3_Answer", age, "Age_Multiplier", 1.0, warnings, "Age");
  const growthMultiplier = lookupNumberRobust_(lookupSheet, "Q6_Answer", growthRate, "Growth_Multiplier", 1.0, warnings, "Growth");
  baseValuation = baseValuation * ageMultiplier * growthMultiplier;

  const factors = calculateAllFactors_(lookupSheet, responseData, distressSale, warnings);

  // NEW: GUARDRAILS - Apply value adjustments with caps
  const adjustments = [
    factors.f1.discount, factors.f2.discount, factors.f3.discount,
    factors.f4.discount, factors.f5.discount, factors.f6.impact,
    factors.f7.discount, factors.f8.discount, factors.f9.discount,
    illiquidityDiscount
  ];
  
  // Cap individual factor (-25% to +20%)
  const cappedAdjustments = adjustments.map(adj => Math.max(-0.25, Math.min(0.20, adj)));
  
  // Calculate cumulative
  let cumulativeFactor = 1;
  cappedAdjustments.forEach(adj => cumulativeFactor *= (1 + adj));
  
  // Cap total (50% to 130% of base)
  cumulativeFactor = Math.max(0.50, Math.min(1.30, cumulativeFactor));
  
  let adjustedValue = baseValuation * cumulativeFactor;
  
  // Distress applied after cap
  if (distressFlag) adjustedValue *= (1 + distressMultiplier);
  
  // Absolute floor: 20% of revenue-based value
  const absoluteFloor = (actualRevenue * revenueMultiple) * 0.20;
  adjustedValue = Math.max(absoluteFloor, adjustedValue);
  
  const lowEstimate = adjustedValue * lowFactor;
  const highEstimate = adjustedValue * highFactor;

  const sellabilityScore = (
    factors.f1.score * weights.f1 + factors.f2.score * weights.f2 + factors.f3.score * weights.f3 +
    factors.f4.score * weights.f4 + factors.f5.score * weights.f5 + factors.f6.score * weights.f6 +
    factors.f7.score * weights.f7 + factors.f8.score * weights.f8 + factors.f9.score * weights.f9
  );

  const rating = getRating_(sellabilityScore);
  
  const reportData = {
    whatsapp, email, firstName, businessName, industry, location,
    adjustedValue: Math.round(adjustedValue / 1000000),
    lowEstimate: Math.round(lowEstimate / 1000000),
    highEstimate: Math.round(highEstimate / 1000000),
    sellabilityScore: Math.round(sellabilityScore),
    rating, distressSale, distressFlag,
    f1_score: Math.round(factors.f1.score), f2_score: Math.round(factors.f2.score),
    f3_score: Math.round(factors.f3.score), f4_score: Math.round(factors.f4.score),
    f5_score: Math.round(factors.f5.score)
  };

  const calcRow = calcSheet.getLastRow() + 1;
  const calcData = [
    whatsapp, baseValuation,
    factors.f1.score, factors.f1.discount, factors.f2.score, factors.f2.discount,
    factors.f3.score, factors.f3.discount, factors.f4.score, factors.f4.discount,
    factors.f5.score, factors.f5.discount, factors.f6.score, factors.f6.impact,
    factors.f7.score, factors.f7.discount, factors.f8.score, factors.f8.discount,
    factors.f9.score, factors.f9.discount,
    illiquidityDiscount, distressSale || "", distressFlag ? "Yes" : "No",
    adjustedValue, lowEstimate, highEstimate, sellabilityScore, rating,
    diagId, (warnings || []).join(" | ").slice(0, 1000), "Pending"
  ];
  calcSheet.getRange(calcRow, 1, 1, calcData.length).setValues([calcData]);
  
  return { reportData, calcRow };
}

function isDistressSaleYes_(distressSale) {
  const s = normalizeKey_(distressSale);
  return s.includes("yes") || s.includes("urgent") || s.includes("sell urgently");
}

function calculateAllFactors_(lookupSheet, data, distressSale, warnings) {
  const f1Rate = getConfigValue_(lookupSheet, "F1_DISCOUNT_RATE", -0.20);
  const f2Rate = getConfigValue_(lookupSheet, "F2_DISCOUNT_RATE", -0.15);
  const f3Rate = getConfigValue_(lookupSheet, "F3_DISCOUNT_RATE", -0.15);
  const f4Rate = getConfigValue_(lookupSheet, "F4_DISCOUNT_RATE", -0.20);
  const f5Rate = getConfigValue_(lookupSheet, "F5_DISCOUNT_RATE", -0.08);
  const f7Rate = getConfigValue_(lookupSheet, "F7_DISCOUNT_RATE", -0.05);
  const f8Rate = getConfigValue_(lookupSheet, "F8_DISCOUNT_RATE", -0.05);
  
  const sQ = (table, answer, ctx) => lookupNumberRobust_(lookupSheet, table, answer, "Score", 50, warnings, ctx);
  
  const f1Score = average_([sQ("Q7_Answer", data[9], "F1"), sQ("Q16_Answer", data[18], "F1"), sQ("Q19_Answer", data[21], "F1")]);
  const f2Score = average_([sQ("Q8_Answer", data[10], "F2"), sQ("Q9_Answer", data[11], "F2"), sQ("Q11_Answer", data[13], "F2")]);
  const f3Score = average_([sQ("Q20_Answer", data[22], "F3"), sQ("Q21_Answer", data[23], "F3")]);
  const f4Score = average_([sQ("Q12_Answer", data[14], "F4"), sQ("Q13_Answer", data[15], "F4"), sQ("Q15_Answer", data[17], "F4")]);
  const f5Score = average_([sQ("Q17_Answer", data[19], "F5"), sQ("Q18_Answer", data[20], "F5")]);
  const f6Score = average_([sQ("Q22_Answer", data[24], "F6"), sQ("Q21_Answer", data[23], "F6")]);
  const f7Score = average_([sQ("Q19_Answer", data[21], "F7"), sQ("Q10_Answer", data[12], "F7")]);
  const f8Score = sQ("Q10_Answer", data[12], "F8");
  
  // F9: Q24 + distressSale (hardcoded scores, no lookup)
  const q24Score = sQ("Q24_Answer", data[26], "F9");
  const distressScore = isDistressSaleYes_(distressSale) ? 10 : 100;
  const f9Score = average_([q24Score, distressScore]);
  
  return {
    f1: { score: f1Score, get discount() { return f1Rate * (1 - this.score / 100); } },
    f2: { score: f2Score, get discount() { return f2Rate * (1 - this.score / 100); } },
    f3: { score: f3Score, get discount() { return f3Rate * (1 - this.score / 100); } },
    f4: { score: f4Score, get discount() { return f4Rate * (1 - this.score / 100); } },
    f5: { score: f5Score, get discount() { return f5Rate * (1 - this.score / 100); } },
    f6: { score: f6Score, get impact() { return this.score >= 75 ? 0.10 * (this.score/100) : -0.10 * (1 - this.score/100); } },
    f7: { score: f7Score, get discount() { return f7Rate * (1 - this.score / 100); } },
    f8: { score: f8Score, get discount() { return f8Rate * (1 - this.score / 100); } },
    f9: { score: f9Score, discount: 0 } // Score only, distress handled separately
  };
}

function average_(arr) {
  const valid = arr.filter(x => typeof x === "number" && !isNaN(x));
  return valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : 50;
}

function getRating_(score) {
  if (score >= 85) return "Highly Sellable";
  if (score >= 70) return "Very Sellable";
  if (score >= 55) return "Moderately Sellable";
  if (score >= 40) return "Needs Improvement";
  return "Significant Work Needed";
}

function getScoreTier_(score) {
  if (score >= 70) return { 
    level: "high", 
    badgeColor: "#10b981", 
    bgColor: "#d1fae5",
    headline: "Your Business is Ready for Market", 
    message: "Strong fundamentals. Buyers can validate performance with minimal friction.", 
    ctaText: "Click Here to Discuss Your Exit Strategy →" 
  };
  if (score >= 40) return { 
    level: "medium", 
    badgeColor: "#f59e0b", 
    bgColor: "#fef3c7",
    headline: "Strong Foundation with Room to Grow", 
    message: "Real value is present. 90 days of improvements could raise buyer readiness and your likely estimate range.", 
    ctaText: "Click Here to Get Improvement Roadmap →" 
  };
  return { 
    level: "low", 
    badgeColor: "#ef4444", 
    bgColor: "#fee2e2",
    headline: "Build Value Before You Sell", 
    message: "Benefit from stronger records and transferability before market.", 
    ctaText: "Click Here to Fix the Gaps First →" 
  };
}

function generateEmailHTML(data) {
  const tier = getScoreTier_(data.sellabilityScore);
  const whatsappLink = `https://wa.me/${CONFIG.YOUR_WHATSAPP_NUMBER}?text=` + encodeURIComponent(`Hi, I received my preliminary estimate for ${data.businessName} (Score: ${data.sellabilityScore}) and I'd like to discuss next steps.`);
  const reportDate = new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preliminary Business Value Estimate - ${data.businessName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
    background: #f3f4f6; 
    margin: 0; 
    color: #111827; 
    line-height: 1.6;
  }
  .container { 
    max-width: 600px; 
    margin: 20px auto; 
    background: white; 
    border-radius: 16px; 
    overflow: hidden; 
    box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
  }
  .header { 
    padding: 32px 28px; 
    background: linear-gradient(135deg, #7c3aed, #4f46e5); 
    color: white; 
    text-align: center;
  }
  .header-logo {
    font-size: 40px;
    font-weight: 800;
    line-height: 1.05;
    margin-bottom: 16px;
  }
  .header-logo span:first-child { color: #a78bfa; }
  .header h1 { 
    margin: 0 0 8px 0; 
    font-size: 20px; 
    font-weight: 700; 
  }
  .header p { 
    margin: 0; 
    opacity: 0.9; 
    font-size: 14px; 
  }
  .content { padding: 28px; }
  .greeting {
    font-size: 16px;
    color: #374151;
    margin-bottom: 24px;
  }
  .greeting strong {
    color: #111827;
  }
  .section {
    margin-bottom: 24px;
  }
  .section-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
    margin-bottom: 12px;
  }
  .valuation-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-bottom: 20px;
  }
  .valuation-col {
    width: 33.33%;
    vertical-align: top;
    padding: 0 4px;
  }
  .valuation-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px 12px;
    text-align: center;
    min-height: 92px;
  }
  .valuation-card.highlight {
    background: linear-gradient(135deg, #ede9fe, #ddd6fe);
    border-color: #a78bfa;
  }
  .valuation-label {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 8px;
  }
  .valuation-amount {
    font-size: 26px;
    font-weight: 800;
    color: #111827;
  }
  .valuation-card.highlight .valuation-amount {
    color: #5b21b6;
  }
  .score-section {
    background: ${tier.bgColor};
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  }
  .score-table {
    width: 100%;
    border-collapse: collapse;
  }
  .score-badge-cell {
    width: 108px;
    vertical-align: middle;
  }
  .score-copy {
    vertical-align: middle;
    padding-left: 18px;
  }
  .score-content h3 {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 6px 0;
  }
  .score-content p {
    font-size: 15px;
    color: #4b5563;
    margin: 0;
  }
  .distress-warning {
    font-size: 13px;
    color: #dc2626;
    margin-top: 8px;
    line-height: 1.4;
  }
  .score-badge {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    display: block;
    background: ${tier.badgeColor};
    color: white;
    font-size: 37px;
    font-weight: 800;
    line-height: 88px;
    text-align: center;
    margin: 0 auto;
  }
  .score-info h3 {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 4px 0;
  }
  .score-info p {
    font-size: 13px;
    color: #4b5563;
    margin: 0;
  }
  .rating-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 20px;
    background: ${tier.badgeColor};
    color: white;
    font-size: 12px;
    font-weight: 700;
    margin-top: 8px;
  }
  .factors-grid {
    width: 100%;
  }
  .factor-item {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    margin-bottom: 8px;
  }
  .factor-name {
    font-size: 13px;
    color: #4b5563;
    text-align: left;
    padding: 10px 12px;
  }
  .factor-score {
    font-size: 13px;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    text-align: right;
    padding: 10px 12px;
    padding-left: 20px;
  }
  .cta-section {
    background: #111827;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    margin-top: 24px;
  }
  .cta-section h4 {
    color: white;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 8px 0;
  }
  .cta-section p {
    color: #9ca3af;
    font-size: 13px;
    margin: 0 0 16px 0;
  }
  .cta-button {
    display: inline-block;
    background: #22c55e;
    color: white !important;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
  }
  .disclaimer {
    margin-top: 20px;
    padding: 12px;
    background: #fef3c7;
    border-radius: 8px;
    font-size: 11px;
    color: #92400e;
    line-height: 1.5;
  }
  .follow-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
  }
  .follow-section p {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 8px;
  }
  .footer { 
    padding: 20px 28px; 
    background: #f9fafb; 
    border-top: 1px solid #e5e7eb; 
    text-align: center;
    font-size: 12px; 
    color: #6b7280; 
  }
  .social-links {
    margin-top: 12px;
  }
  .social-links a {
    color: #6b7280;
    text-decoration: none;
    margin: 0 8px;
  }
  @media (max-width: 480px) {
    .container { margin: 0; border-radius: 0; }
    .valuation-card { padding: 12px 8px; }
    .valuation-label { font-size: 9px; }
    .valuation-amount { font-size: 20px; }
    .score-badge { width: 72px; height: 72px; font-size: 29px; line-height: 72px; }
    .score-badge-cell { width: 84px; }
    .score-copy { padding-left: 12px; }
    .content { padding: 20px; }
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo"><span>Afr</span><span>exit</span></div>
      <h1>${data.businessName}</h1>
      <p>${data.industry} &bull; ${data.location} &bull; ${reportDate}</p>
    </div>
    
    <div class="content">
      <p class="greeting">Hi <strong>${data.firstName}</strong>,</p>
      <p class="greeting">Your preliminary business value estimate is ready. Below is the automated estimate summary based on the information you provided.</p>
      
      <div class="section">
        <div class="section-title">Estimated Value Range</div>
        <table role="presentation" class="valuation-table" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td class="valuation-col" width="33%">
              <div class="valuation-card">
                <div class="valuation-label">Conservative</div>
                <div class="valuation-amount">₦${data.lowEstimate}M</div>
              </div>
            </td>
            <td class="valuation-col" width="34%">
              <div class="valuation-card highlight">
                <div class="valuation-label">Most Likely</div>
                <div class="valuation-amount">₦${data.adjustedValue}M</div>
              </div>
            </td>
            <td class="valuation-col" width="33%">
              <div class="valuation-card">
                <div class="valuation-label">Optimistic</div>
                <div class="valuation-amount">₦${data.highEstimate}M</div>
              </div>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="score-section">
        <table role="presentation" class="score-table" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td class="score-badge-cell" width="108" valign="middle">
              <div class="score-badge">${data.sellabilityScore}</div>
            </td>
            <td class="score-copy" valign="middle">
              <div class="score-content">
                <h3>Sellability Score</h3>
                <p><strong>${data.rating}</strong></p>
                ${data.distressFlag ? `<div class="distress-warning"><strong>⚠️ Distress Sale:</strong> Urgent sale may reduce value by 15%</div>` : ''}
              </div>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">Factor Breakdown</div>
        <div class="factors-grid">
          <table role="presentation" class="factor-item" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="factor-name">Records &amp; Proof</td>
              <td class="factor-score">${data.f1_score}/100</td>
            </tr>
          </table>
          <table role="presentation" class="factor-item" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="factor-name">Banking Transparency</td>
              <td class="factor-score">${data.f2_score}/100</td>
            </tr>
          </table>
          <table role="presentation" class="factor-item" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="factor-name">Customer Defensibility</td>
              <td class="factor-score">${data.f3_score}/100</td>
            </tr>
          </table>
          <table role="presentation" class="factor-item" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="factor-name">Owner Independence</td>
              <td class="factor-score">${data.f4_score}/100</td>
            </tr>
          </table>
          <table role="presentation" class="factor-item" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="factor-name">Working Capital</td>
              <td class="factor-score">${data.f5_score}/100</td>
            </tr>
          </table>
        </div>
      </div>
      
      <div class="cta-section">
        <h4>${tier.headline}</h4>
        <p>${tier.message}</p>
        <a href="${whatsappLink}" class="cta-button">${tier.ctaText}</a>
      </div>
      
      <div class="disclaimer">
        <strong>Important:</strong> This is an automated preliminary estimate for informational purposes only. It is not a certified valuation, financial advice, legal advice, or a signed advisory mandate. Actual deal value requires diligence, negotiation, and separate written engagement terms if Afrexit is to represent you.
      </div>
    </div>
    
    <div class="footer">
      <div class="follow-section">
        <p><strong>Follow for more insights:</strong><br>I share weekly content about SME exits, buyer readiness, and M&A in Nigeria:</p>
        <div class="social-links">
          <a href="${CONFIG.INSTAGRAM_URL}">Instagram</a> &bull;
          <a href="${CONFIG.TIKTOK_URL}">TikTok</a> &bull;
          <a href="${CONFIG.YOUTUBE_URL}">YouTube</a>
        </div>
      </div>
      <p style="margin-top: 12px;">&copy; ${new Date().getFullYear()} ${CONFIG.SENDER_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function sendValuationReport(data, calcRow) {
  if (!data.email || data.email.indexOf("@") === -1) return { success: false, error: "No valid email" };
  try {
    const subject = `Your Preliminary Business Value Estimate: ₦${data.lowEstimate}M - ₦${data.highEstimate}M`;
    const htmlBody = generateEmailHTML(data);
    GmailApp.sendEmail(data.email, subject, `Hi ${data.firstName}, your preliminary estimate is ready.`, { htmlBody, name: CONFIG.SENDER_NAME });
    setEmailStatus_(calcRow, "Sent");
    return { success: true };
  } catch (error) {
    setEmailStatus_(calcRow, "Failed");
    return { success: false, error: String(error) };
  }
}

function setEmailStatus_(calcRow, status) {
  try {
    const ss = getSpreadsheet_();
    const sh = ss.getSheetByName(CONFIG.CALCULATIONS_SHEET);
    if (!sh) return;
    const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    const idx = header.indexOf("EmailStatus");
    if (idx >= 0) sh.getRange(calcRow, idx + 1).setValue(status);
  } catch (e) {}
}
