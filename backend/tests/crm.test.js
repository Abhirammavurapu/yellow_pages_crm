const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
require('dotenv').config();

const { normalizePhoneNumber, isValidIndianMobile } = require('../src/utils/phoneNormalizer');
const Employee = require('../src/models/Employee');
const Lead = require('../src/models/Lead');
const CallHistory = require('../src/models/CallHistory');
const FollowUp = require('../src/models/FollowUp');
const { acquireLock, releaseLock } = require('../src/services/lockService');
const { transferEmployeeWorkload } = require('../src/services/transferService');
const connectDB = require('../src/config/db');

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
});

test.after(async () => {
  if (connectDB.disconnectDB) {
    await connectDB.disconnectDB();
  } else {
    await mongoose.disconnect();
  }
});

test('1. Phone Normalizer: handles +91, 91, leading 0, and raw 10-digit Indian numbers', () => {
  assert.strictEqual(normalizePhoneNumber('+919876543210'), '9876543210');
  assert.strictEqual(normalizePhoneNumber('919876543210'), '9876543210');
  assert.strictEqual(normalizePhoneNumber('09876543210'), '9876543210');
  assert.strictEqual(normalizePhoneNumber('9876543210'), '9876543210');
  assert.strictEqual(normalizePhoneNumber('+91 98765 43210'), '9876543210');
  assert.strictEqual(normalizePhoneNumber('98765-43210'), '9876543210');

  assert.strictEqual(isValidIndianMobile('9876543210'), true);
  assert.strictEqual(isValidIndianMobile('5876543210'), false); // starts with 5
});

test('2. Atomic Concurrency Lock: prevents simultaneous callers on the same lead', async () => {
  const callerA = await Employee.findOne({ email: 'caller.anita@example.com' });
  const callerB = await Employee.findOne({ email: 'caller.vikram@example.com' });
  const lead = await Lead.findOne({ businessName: 'Royal Spice Multi-Cuisine Restaurant' });

  assert.ok(callerA, 'Caller A should exist');
  assert.ok(callerB, 'Caller B should exist');
  assert.ok(lead, 'Lead should exist');

  // Clear any existing lock
  await releaseLock(lead._id, callerA._id, true);

  // 1. Caller A acquires lock
  const lockResultA = await acquireLock(lead._id, callerA._id);
  assert.strictEqual(lockResultA.success, true, 'Caller A should successfully acquire the lock');

  // 2. Caller B attempts to acquire lock on same lead
  const lockResultB = await acquireLock(lead._id, callerB._id);
  assert.strictEqual(lockResultB.success, false, 'Caller B should be rejected');
  assert.strictEqual(lockResultB.reason, 'LOCKED', 'Reason should be LOCKED');
  assert.ok(lockResultB.message.includes('Anita Desai'), 'Message should indicate Anita Desai is handling the lead');

  // 3. Caller A releases lock
  const releaseSuccess = await releaseLock(lead._id, callerA._id);
  assert.strictEqual(releaseSuccess, true, 'Lock should be released');

  // 4. Now Caller B can acquire lock
  const lockResultBRetry = await acquireLock(lead._id, callerB._id);
  assert.strictEqual(lockResultBRetry.success, true, 'Caller B can now acquire the lock');

  // Clean up
  await releaseLock(lead._id, callerB._id, true);
});

test('3. Employee Resignation & Workload Transfer: preserves historical records and authors', async () => {
  const superAdmin = await Employee.findOne({ role: 'SUPER_ADMIN' });
  const sourceEmployee = await Employee.findOne({ email: 'caller.anita@example.com' });
  const targetEmployee = await Employee.findOne({ email: 'caller.vikram@example.com' });

  assert.ok(superAdmin && sourceEmployee && targetEmployee);

  // Find leads assigned to sourceEmployee
  const sourceLeads = await Lead.find({ assignedTo: sourceEmployee._id });
  assert.ok(sourceLeads.length > 0, 'Source employee should have leads assigned');
  const testLead = sourceLeads[0];

  // Log a call by sourceEmployee to test historical retention
  const callRecord = await CallHistory.create({
    leadId: testLead._id,
    employeeId: sourceEmployee._id,
    employeeNameSnapshot: sourceEmployee.name,
    employeeRoleSnapshot: sourceEmployee.role,
    phoneNumber: testLead.phoneNumbers[0],
    callStatus: 'INTERESTED',
    duration: 120,
    notes: 'Discussion about listing options'
  });

  // Execute Workload Transfer
  const transferResult = await transferEmployeeWorkload({
    fromEmployeeId: sourceEmployee._id,
    toEmployeeId: targetEmployee._id,
    performedBy: superAdmin,
    reason: 'Testing Workload Transfer Immobility'
  });

  assert.strictEqual(transferResult.success, true);
  assert.ok(transferResult.transferredCount > 0);

  // Check updated lead: Current owner must be targetEmployee (caller.vikram)
  const updatedLead = await Lead.findById(testLead._id);
  assert.strictEqual(String(updatedLead.assignedTo), String(targetEmployee._id), 'Current owner must be target employee');

  // Check that previous owners includes sourceEmployee
  const hasPrevOwner = updatedLead.previousOwners.some((id) => String(id) === String(sourceEmployee._id));
  assert.strictEqual(hasPrevOwner, true, 'Previous owners must contain source employee');

  // CRITICAL REQUIREMENT: Historical call record MUST STILL belong to sourceEmployee!
  const fetchedCall = await CallHistory.findById(callRecord._id);
  assert.strictEqual(String(fetchedCall.employeeId), String(sourceEmployee._id), 'Historical call author must NOT change');
  assert.strictEqual(fetchedCall.employeeNameSnapshot, sourceEmployee.name, 'Snapshot name must remain original caller');

  // Clean up reassign back for subsequent tests/use
  await Lead.updateMany({ assignedTo: targetEmployee._id }, { $set: { assignedTo: sourceEmployee._id } });
});
