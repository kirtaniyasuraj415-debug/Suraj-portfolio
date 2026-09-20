# Security Specification: Firestore Rules

## 1. Data Invariants
1. **PII Protection**: Client enquiry documents contain sensitive Personally Identifiable Information (name, phone number, WhatsApp links, business details). Public read/list access is strictly forbidden. Only authenticated administrators may read or list enquiries.
2. **Schema & Boundary Integrity**: Any enquiry record must have strict key validation, field length constraints, and allowed string formats matching `firebase-blueprint.json`.
3. **Immutable Identity & Origin**: Document IDs must conform to `isValidId()` alphanumeric formatting under 128 characters. Once created, timestamps and reference IDs are immutable.
4. **Default Deny**: Any collection or path not explicitly granted is denied by default (`match /{document=**} { allow read, write: if false; }`).
5. **Terminal State Integrity**: Enquiry status updates may only transition through valid pipeline states and cannot be overwritten with unauthorized shadow fields.

## 2. The "Dirty Dozen" Payloads (Designed to Attack Identity, Integrity, and State)

1. **Payload 1 (PII Snooping - Unauthenticated Read)**:
   - Target: `GET /projectEnquiries/enquiry-123`
   - Actor: Unauthenticated visitor
   - Expected: `PERMISSION_DENIED` (PII cannot be read by public).

2. **Payload 2 (PII Harvester - Collection List)**:
   - Target: `LIST /projectEnquiries`
   - Actor: Random authenticated user
   - Expected: `PERMISSION_DENIED` (Only admin can list client enquiries).

3. **Payload 3 (ID Poisoning Attack)**:
   - Target: `CREATE /projectEnquiries/../../evil-path` or oversized 2KB ID
   - Payload: `{ name: "Spammer", phone: "+1234567890" }`
   - Expected: `PERMISSION_DENIED` (Document ID must satisfy `isValidId`).

4. **Payload 4 (Ghost / Shadow Field Injection)**:
   - Target: `CREATE /projectEnquiries/enquiry-123`
   - Payload: `{ name: "Attacker", phone: "+919876543210", projectType: "New Website", budget: "₹15,000", isAdmin: true, role: "superadmin" }`
   - Expected: `PERMISSION_DENIED` (Rejected by `hasOnly` strict key validation).

5. **Payload 5 (Denial-of-Wallet String Bomb)**:
   - Target: `CREATE /projectEnquiries/enquiry-123`
   - Payload: `{ name: "A".repeat(5000), phone: "+919876543210", projectType: "New Website", budget: "Under ₹15,000" }`
   - Expected: `PERMISSION_DENIED` (Exceeds `maxLength: 100` string limit).

6. **Payload 6 (Invalid Phone Format / Type Confusion)**:
   - Target: `CREATE /projectEnquiries/enquiry-123`
   - Payload: `{ name: "Valid Name", phone: 123456789, projectType: "New Website", budget: "Under ₹15,000" }`
   - Expected: `PERMISSION_DENIED` (Phone must be a string of at least 7 chars, not a number).

7. **Payload 7 (Missing Mandatory Fields)**:
   - Target: `CREATE /projectEnquiries/enquiry-123`
   - Payload: `{ name: "Only Name" }`
   - Expected: `PERMISSION_DENIED` (Missing `phone`, `projectType`, `budget`).

8. **Payload 8 (Arbitrary Collection Write / Catch-All Bypass)**:
   - Target: `CREATE /system_configs/config-1`
   - Payload: `{ malicious: true }`
   - Expected: `PERMISSION_DENIED` (Global default-deny catch-all).

9. **Payload 9 (Test Path Hijack / State Write)**:
   - Target: `CREATE /test/connection`
   - Payload: `{ malicious: true }`
   - Expected: `PERMISSION_DENIED` (Test probe collection is read-only for connectivity checking).

10. **Payload 10 (Unauthorized State Tampering)**:
    - Target: `UPDATE /projectEnquiries/enquiry-123`
    - Actor: Non-admin user
    - Payload: `{ status: "closed" }`
    - Expected: `PERMISSION_DENIED` (Updates restricted to authorized admins).

11. **Payload 11 (Timestamp Forgery)**:
    - Target: `CREATE /projectEnquiries/enquiry-123`
    - Payload: `{ name: "Valid Name", phone: "+919876543210", projectType: "New Website", budget: "Under ₹15,000", createdAt: "1999-01-01T00:00:00Z" }`
    - Expected: `PERMISSION_DENIED` (Timestamps must match `request.time`).

12. **Payload 12 (Admin Privilege Escalation via Claims)**:
    - Target: `GET /projectEnquiries/enquiry-123`
    - Actor: User with forged custom token claim `{ admin: true }`
    - Expected: `PERMISSION_DENIED` (Rules verify admin identity against trusted database documents, never client claims).
