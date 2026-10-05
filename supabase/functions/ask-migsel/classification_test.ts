import {
  classifyDeterministically,
  parseClassificationOutput,
  unknownClassification,
} from './classification.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const acceptanceCases = [
  ['I lost my driving licence.', 'government_service', 'lost driving licence'],
  ['My licence expired.', 'government_service', 'renew driving licence'],
  [
    'I sold my car. How do I transfer ownership?',
    'government_service',
    'vehicle ownership transfer',
  ],
  [
    'I lost my vehicle registration document.',
    'government_service',
    'lost vehicle registration document',
  ],
  ['I need a new CID.', 'government_service', 'new cid'],
  ['I lost my CID.', 'government_service', 'lost cid'],
  ['I need to register my newborn.', 'government_service', 'newborn registration'],
  ['I want to transfer my census.', 'government_service', 'census transfer'],
  ['How do I apply for a passport?', 'government_service', 'passport application'],
  ['I want to transfer my land.', 'government_service', 'land transfer'],
  ['How do I pay property tax?', 'government_service', 'property tax'],
  ['I want to open a business.', 'government_service', 'open business'],
  ['How do I renew my business licence?', 'government_service', 'renew business licence'],
  ['I am looking for a job.', 'government_service', 'looking for a job'],
  ['My electricity bill looks wrong.', 'government_service', 'electricity bill wrong'],
  ['There is a huge pothole outside my house.', 'grievance', 'road'],
  ["Garbage hasn't been collected.", 'grievance', 'garbage'],
  ['The streetlight near my house is broken.', 'grievance', 'lighting'],
] as const;

Deno.test('classifies the first 18 acceptance conversations deterministically', () => {
  for (const [message, intent, expected] of acceptanceCases) {
    const result = classifyDeterministically(message, []);
    assert(result, `No classification for: ${message}`);
    assert(result.intent === intent, `Wrong intent for: ${message}`);
    const actual = result.serviceSearchQuery ?? result.possibleGrievanceCategory;
    assert(actual === expected, `Wrong route for: ${message}. Received ${actual}`);
  }
});

Deno.test('asks for location before routing a water grievance', () => {
  const result = classifyDeterministically('There has been no water since yesterday.', []);
  assert(result?.intent === 'grievance', 'Water outage must be a grievance');
  assert(result.needsClarification, 'Water outage should request the affected area');
  assert(
    result.clarificationQuestion === 'Which area is affected by the water problem?',
    'Wrong clarification',
  );
});

Deno.test('asks which service was submitted for a generic follow-up', () => {
  const result = classifyDeterministically('I complained two weeks ago and nobody responded.', []);
  assert(result?.intent === 'application_followup', 'Must classify as application follow-up');
  assert(result.needsClarification, 'Must request the service or complaint type');
});

Deno.test('handles a common licence misspelling without an AI call', () => {
  const result = classifyDeterministically('I lost my driving lisence', []);
  assert(
    result?.serviceSearchQuery === 'lost driving licence',
    'Misspelling should route to replacement',
  );
});

Deno.test('keeps unsupported text unknown', () => {
  const result =
    classifyDeterministically('Something happened', []) ??
    unknownClassification('Something happened');
  assert(result.intent === 'unknown', 'Unsupported request must not be guessed');
  assert(result.needsClarification, 'Unknown request must ask one clarification');
});

Deno.test('separates emergencies from the grievance queue', () => {
  const result = classifyDeterministically('There is a fire and someone is seriously injured.', []);
  assert(result?.intent === 'emergency', 'Emergency was not detected');
  assert(!result.needsClarification, 'Emergency guidance must not be delayed');
});

Deno.test('classifies agency questions as information', () => {
  const result = classifyDeterministically('Who handles land transfer?', []);
  assert(result?.intent === 'information', 'Agency question should be information');
});

Deno.test('accepts valid structured model output', () => {
  const result = parseClassificationOutput(
    '{"intent":"information","confidence":0.72,"normalizedQuery":"land transfer","possibleServiceCategory":"land","possibleGrievanceCategory":null,"needsClarification":false,"clarificationQuestion":null}',
  );
  assert(result?.intent === 'information', 'Valid structured output was rejected');
});

Deno.test('rejects malformed or out-of-range structured model output', () => {
  assert(parseClassificationOutput('not JSON') === null, 'Malformed output must be rejected');
  assert(
    parseClassificationOutput(
      '{"intent":"government_service","confidence":2,"normalizedQuery":"licence","possibleServiceCategory":null,"possibleGrievanceCategory":null,"needsClarification":false,"clarificationQuestion":null}',
    ) === null,
    'Out-of-range confidence must be rejected',
  );
});
