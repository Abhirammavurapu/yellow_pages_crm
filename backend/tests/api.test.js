const test = require('node:test');
const assert = require('node:assert');
require('dotenv').config();

let server;
let baseUrl = 'http://localhost:5000/api';

test.before(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/health');
    if (res.ok) {
      baseUrl = 'http://localhost:5000/api';
      return;
    }
  } catch (err) {
    // Port 5000 not running
  }

  const app = require('../src/server');
  const mongoose = require('mongoose');
  await new Promise((resolve) => {
    const testPort = 5055;
    server = app.listen(testPort, () => {
      baseUrl = `http://localhost:${testPort}/api`;
      resolve();
    });
  });

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
      setTimeout(resolve, 5000);
    });
  }
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    const mongoose = require('mongoose');
    await mongoose.disconnect();
  }
});

async function apiRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

test('API 1: Health check endpoint responds with UP status', async () => {
  const res = await apiRequest('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, 'UP');
});

test('API 2: Authentication & RBAC Login for Super Admin and Telecaller', async () => {
  // Super Admin login
  const saRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.com', password: 'ChangeMe123!' }
  });
  assert.strictEqual(saRes.status, 200);
  assert.strictEqual(saRes.data.success, true);
  assert.strictEqual(saRes.data.data.user.role, 'SUPER_ADMIN');
  assert.ok(saRes.data.data.token);

  // Telecaller login
  const tcRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: 'caller.anita@example.com', password: 'AgentPass123!' }
  });
  assert.strictEqual(tcRes.status, 200);
  assert.strictEqual(tcRes.data.data.user.role, 'TELECALLER');
});

test('API 3: Concurrency Locking Workflow via HTTP APIs', async () => {
  // Login Telecaller 1
  const tc1Res = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: 'caller.anita@example.com', password: 'AgentPass123!' }
  });
  const token1 = tc1Res.data.data.token;

  // Login Telecaller 2
  const tc2Res = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: 'caller.vikram@example.com', password: 'AgentPass123!' }
  });
  const token2 = tc2Res.data.data.token;

  // Fetch a lead
  const leadsRes = await apiRequest('/leads?limit=1', {
    headers: { Authorization: `Bearer ${token1}` }
  });
  assert.strictEqual(leadsRes.status, 200);
  assert.ok(leadsRes.data.data.length > 0);
  const targetLeadId = leadsRes.data.data[0]._id;

  // 1. Release any existing lock on target lead
  await apiRequest(`/leads/${targetLeadId}/unlock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` }
  });

  // 2. Caller 1 acquires lock
  const lockRes1 = await apiRequest(`/leads/${targetLeadId}/lock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` }
  });
  assert.strictEqual(lockRes1.status, 200);
  assert.strictEqual(lockRes1.data.success, true);

  // 3. Caller 2 attempts to lock the SAME lead -> Must receive 423 Locked
  const lockRes2 = await apiRequest(`/leads/${targetLeadId}/lock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token2}` }
  });
  assert.strictEqual(lockRes2.status, 423, 'Simultaneous lock must return HTTP 423');
  assert.strictEqual(lockRes2.data.errorCode, 'LEAD_LOCKED');
  assert.ok(lockRes2.data.message.includes('Anita Desai'), 'Message must name current caller');

  // 4. Caller 1 logs a call with outcome "INTERESTED"
  const callRes = await apiRequest(`/calls/lead/${targetLeadId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token1}` },
    body: {
      phoneNumber: '9848011223',
      callStatus: 'INTERESTED',
      duration: 180,
      notes: 'Customer confirmed interest in Yellow Pages premium listing',
      followUpDate: new Date(Date.now() + 86400000).toISOString(),
      releaseLockAfterCall: true
    }
  });
  assert.strictEqual(callRes.status, 201);
  assert.strictEqual(callRes.data.success, true);

  // 5. Verify lock was automatically released after call completion
  const lockRes2Retry = await apiRequest(`/leads/${targetLeadId}/lock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token2}` }
  });
  assert.strictEqual(lockRes2Retry.status, 200, 'Caller 2 can now acquire lock after Caller 1 completed call');

  // Clean up
  await apiRequest(`/leads/${targetLeadId}/unlock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token2}` }
  });
});

test('API 4: Location Hierarchy Endpoints', async () => {
  const statesRes = await apiRequest('/locations/states');
  assert.strictEqual(statesRes.status, 200);
  assert.ok(statesRes.data.data.includes('Telangana'));
  assert.ok(statesRes.data.data.includes('All India'));

  const districtsRes = await apiRequest('/locations/districts?state=Telangana');
  assert.strictEqual(districtsRes.status, 200);
  assert.ok(districtsRes.data.data.includes('Hyderabad'));
});

test('API 5: Public User Sign Up and Direct Authentication', async () => {
  const randomEmail = `caller.${Date.now()}@example.com`;
  const signupRes = await apiRequest('/auth/signup', {
    method: 'POST',
    body: {
      name: 'Rohan Sharma',
      email: randomEmail,
      phone: '98765' + Math.floor(10000 + Math.random() * 90000),
      password: 'CallerPass123!',
      confirmPassword: 'CallerPass123!',
      role: 'TELECALLER'
    }
  });

  assert.strictEqual(signupRes.status, 201);
  assert.strictEqual(signupRes.data.success, true);
  assert.strictEqual(signupRes.data.data.user.role, 'TELECALLER');
  assert.ok(signupRes.data.data.token, 'Must return JWT token for immediate login');
});

test('API 6: Admin Registration with Security Passkey', async () => {
  const randomAdminEmail = `admin.${Date.now()}@example.com`;

  // Without passkey -> should fail 403
  const failRes = await apiRequest('/auth/signup', {
    method: 'POST',
    body: {
      name: 'Vikram Admin',
      email: randomAdminEmail,
      phone: '98766' + Math.floor(10000 + Math.random() * 90000),
      password: 'AdminPass123!',
      confirmPassword: 'AdminPass123!',
      role: 'ADMIN',
      adminKey: 'WRONGKEY'
    }
  });
  assert.strictEqual(failRes.status, 403);

  // With correct passkey -> should succeed 201
  const successRes = await apiRequest('/auth/signup', {
    method: 'POST',
    body: {
      name: 'Vikram Admin',
      email: randomAdminEmail,
      phone: '98766' + Math.floor(10000 + Math.random() * 90000),
      password: 'AdminPass123!',
      confirmPassword: 'AdminPass123!',
      role: 'ADMIN',
      adminKey: 'ADMIN2024'
    }
  });
  assert.strictEqual(successRes.status, 201);
  assert.strictEqual(successRes.data.data.user.role, 'ADMIN');
  assert.ok(successRes.data.data.token);
});

test('API 7: Lead Creation Auto-Assignment & Queue Visibility', async () => {
  // Login as telecaller
  const tcRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: 'caller.anita@example.com', password: 'AgentPass123!' }
  });
  const token = tcRes.data.data.token;
  const callerId = tcRes.data.data.user._id;

  // Create lead without specifying assignedTo
  const uniquePhone = '98450' + Math.floor(10000 + Math.random() * 90000);
  const leadRes = await apiRequest('/leads', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      businessName: 'Apex Precision Tools',
      contactPerson: 'Karan Mehra',
      phone: uniquePhone,
      category: 'Manufacturing',
      city: 'Pune',
      state: 'Maharashtra'
    }
  });
  assert.strictEqual(leadRes.status, 201);
  assert.strictEqual(leadRes.data.data.assignedTo, callerId, 'Lead must be auto-assigned to creator');

  // Verify lead immediately appears in caller queue
  const myLeads = await apiRequest('/leads', {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(myLeads.status, 200);
  const found = myLeads.data.data.some(
    (l) => l.businessName === 'Apex Precision Tools' || (l.phoneNumbers && l.phoneNumbers.includes(uniquePhone))
  );
  assert.strictEqual(found, true, 'Lead must be present in caller leads list');
});

test('API 8: Duplicate Phone Prevention', async () => {
  const saRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.com', password: 'ChangeMe123!' }
  });
  const token = saRes.data.data.token;

  const phone = '98451' + Math.floor(10000 + Math.random() * 90000);

  // First creation -> 201
  const first = await apiRequest('/leads', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      businessName: 'First Cafe',
      contactPerson: 'Owner A',
      phone: phone,
      city: 'Delhi',
      state: 'Delhi'
    }
  });
  assert.strictEqual(first.status, 201);

  // Duplicate creation -> 409 Conflict
  const second = await apiRequest('/leads', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      businessName: 'Second Cafe',
      contactPerson: 'Owner B',
      phone: phone,
      city: 'Delhi',
      state: 'Delhi'
    }
  });
  assert.strictEqual(second.status, 409, 'Duplicate phone must be rejected with 409');
});
