import { serviceResponse } from './retrieval.ts';
import type { Classification, ServiceSearchRow } from './types.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const classification: Classification = {
  intent: 'government_service',
  confidence: 0.9,
  normalizedQuery: 'lost driving licence',
  possibleServiceCategory: null,
  possibleGrievanceCategory: null,
  needsClarification: false,
  clarificationQuestion: null,
};

const row: ServiceSearchRow = {
  id: '20000000-0000-4000-8000-000000000001',
  name: 'Replace Driving Licence',
  provider_name: 'BCTA',
  service_category: 'transport',
  description: null,
  official_url: null,
  requirements: null,
  fees: null,
  processing_time: null,
  verified: false,
  last_verified_at: null,
  source_name: null,
  source_url: null,
  match_score: 1,
};

Deno.test('labels unverified service candidates and withholds actions', () => {
  const result = serviceResponse(crypto.randomUUID(), classification, [row]);
  assert(result?.service && !result.service.verified, 'Candidate should remain unverified');
  assert(result.actions.length === 0, 'Unverified candidates must not get official actions');
  assert(result.message.includes('not verified'), 'Missing verification warning');
});

Deno.test('allows only safe official URLs from verified records', () => {
  const unsafe = serviceResponse(crypto.randomUUID(), classification, [
    { ...row, verified: true, official_url: 'javascript:alert(1)' },
  ]);
  assert(unsafe?.actions.length === 0, 'Dangerous URL must not be actionable');

  const safe = serviceResponse(crypto.randomUUID(), classification, [
    { ...row, verified: true, official_url: 'https://example.gov.bt/service' },
  ]);
  assert(
    safe?.actions[0]?.type === 'OPEN_OFFICIAL_SERVICE',
    'Verified HTTPS URL should be actionable',
  );
});

Deno.test('does not return a low-confidence service match', () => {
  const result = serviceResponse(crypto.randomUUID(), classification, [
    { ...row, match_score: 0.1 },
  ]);
  assert(result === null, 'Low-confidence match should be rejected');
});
