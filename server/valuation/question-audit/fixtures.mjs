import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(THIS_DIR, '../../..');

function readFixtures(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')).fixtures || [];
}

const ALL_FIXTURES = [
  ...readFixtures('src/valuation-engine/owner-test-fixtures.json'),
  ...readFixtures('src/valuation-engine/owner-test-fixtures-extended.json'),
];

export const AUDIT_BASELINES = {
  recurring_software: {
    id: 'recurring_software',
    fixtureId: 'owner-recurring-software-two-year',
    label: 'Recurring software baseline',
  },
  project_service: {
    id: 'project_service',
    fixtureId: 'owner-project-it-two-year',
    label: 'Project / service baseline',
  },
  retail_commerce: {
    id: 'retail_commerce',
    fixtureId: 'owner-retail-one-year',
    label: 'Retail / commerce baseline',
  },
  manufacturing: {
    id: 'manufacturing',
    fixtureId: 'owner-manufacturing-two-year',
    label: 'Manufacturing baseline',
  },
  logistics_asset_heavy: {
    id: 'logistics_asset_heavy',
    fixtureId: 'owner-logistics-two-year',
    label: 'Logistics / asset-heavy baseline',
  },
  local_owner_led_service: {
    id: 'local_owner_led_service',
    fixtureId: 'owner-local-service-two-year',
    label: 'Local owner-led service baseline',
  },
};

export function getAuditBaseline(id) {
  const baseline = AUDIT_BASELINES[id];
  if (!baseline) {
    throw new Error(`Unknown audit baseline ${id}.`);
  }

  const fixture = ALL_FIXTURES.find((entry) => entry.id === baseline.fixtureId);
  if (!fixture) {
    throw new Error(`Missing fixture ${baseline.fixtureId} for audit baseline ${id}.`);
  }

  return {
    ...baseline,
    fixture,
  };
}

export function listAuditBaselines() {
  return Object.values(AUDIT_BASELINES).map((baseline) => getAuditBaseline(baseline.id));
}

