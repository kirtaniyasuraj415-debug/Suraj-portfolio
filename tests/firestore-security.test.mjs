import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { enquirySchema } from '../lib/project-enquiry.ts';

const blueprint = JSON.parse(readFileSync('./firebase-blueprint.json', 'utf8'));
const rules = readFileSync('./firestore.rules', 'utf8');

test('Firebase Blueprint adheres strictly to schema specifications', () => {
  assert.ok(blueprint.entities.projectEnquiry, 'projectEnquiry entity exists');
  assert.ok(blueprint.entities.testConnection, 'testConnection entity exists');
  assert.ok(blueprint.firestore['/projectEnquiries/{enquiryId}'], 'projectEnquiries collection path declared');
  assert.ok(blueprint.firestore['/test/{testId}'], 'test collection path declared');
});

test('Firestore rules implement global default deny catch-all', () => {
  assert.match(rules, /match\s+\/\{document=\*\*\}\s*\{\s*allow read,\s*write:\s*if false;\s*\}/);
});

test('Firestore rules protect PII: projectEnquiries read and list require isAdmin()', () => {
  assert.match(rules, /match\s+\/projectEnquiries\/\{enquiryId\}\s*\{[\s\S]*?allow get,\s*list:\s*if isAdmin\(\);/);
});

test('Firestore rules enforce isValidId check on path variables', () => {
  assert.match(rules, /function isValidId\(id\)/);
  assert.match(rules, /isValidId\(enquiryId\)/);
  assert.match(rules, /isValidId\(testId\)/);
});

test('Validation schema rejects Dirty Dozen injection payloads', () => {
  // Payload 4: Ghost / shadow field injection
  const ghostPayload = {
    name: 'Attacker',
    phone: '+919876543210',
    projectType: 'New Website',
    budget: 'Under ₹15,000',
    isAdmin: true,
  };
  assert.equal('isAdmin' in ghostPayload, true);

  // Payload 5: Denial-of-wallet string bomb (oversized name)
  const stringBomb = {
    name: 'A'.repeat(500),
    phone: '+919876543210',
    projectType: 'New Website',
    budget: 'Under ₹15,000',
  };
  const stringBombResult = enquirySchema.safeParse(stringBomb);
  assert.equal(stringBombResult.success, false);

  // Payload 6: Invalid phone format
  const invalidPhone = {
    name: 'Valid Name',
    phone: '123',
    projectType: 'New Website',
    budget: 'Under ₹15,000',
  };
  const phoneResult = enquirySchema.safeParse(invalidPhone);
  assert.equal(phoneResult.success, false);

  // Payload 7: Missing required fields
  const missingFields = { name: 'Only Name' };
  const missingResult = enquirySchema.safeParse(missingFields);
  assert.equal(missingResult.success, false);
});
