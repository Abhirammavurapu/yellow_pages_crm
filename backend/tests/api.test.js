const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('../src/server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    // Start on test port
    const testPort = 5055;
    server = app.listen(testPort, () => {
      baseUrl = `http://localhost:${testPort}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
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
