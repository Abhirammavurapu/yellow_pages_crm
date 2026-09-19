const test = require('node:test');
const assert = require('node:assert');
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('../src/server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    const testPort = 5056;

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
  }

  await mongoose.disconnect();
});

async function apiRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body
      ? JSON.stringify(options.body)
      : undefined
  });

  const data = await res.json().catch(() => ({}));

  return {
    status: res.status,
    ok: res.ok,
    data
  };
}

test('CRM API: Health check', async () => {
  const res = await apiRequest('/health');

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, 'UP');
});

test('CRM API: Super Admin login', async () => {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@example.com',
      password: 'ChangeMe123!'
    }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.strictEqual(
    res.data.data.user.role,
    'SUPER_ADMIN'
  );
  assert.ok(res.data.data.token);
});

test('CRM API: Telecaller login', async () => {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: {
      email: 'caller.anita@example.com',
      password: 'AgentPass123!'
    }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(
    res.data.data.user.role,
    'TELECALLER'
  );
});

test('CRM API: Location hierarchy', async () => {
  const states = await apiRequest('/locations/states');

  assert.strictEqual(states.status, 200);
  assert.ok(states.data.data.includes('Telangana'));
  assert.ok(states.data.data.includes('All India'));

  const districts = await apiRequest(
    '/locations/districts?state=Telangana'
  );

  assert.strictEqual(districts.status, 200);
  assert.ok(
    districts.data.data.includes('Hyderabad')
  );
});

test('CRM API: Lead creation', async () => {
  const login = await apiRequest('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@example.com',
      password: 'ChangeMe123!'
    }
  });

  assert.strictEqual(login.status, 200);

  const token = login.data.data.token;

  const uniquePhone =
    '98450' +
    Math.floor(10000 + Math.random() * 90000);

  const lead = await apiRequest('/leads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: {
      businessName: 'CRM Test Business',
      contactPerson: 'Test Owner',
      phone: uniquePhone,
      category: 'Testing',
      city: 'Hyderabad',
      state: 'Telangana'
    }
  });

  assert.strictEqual(lead.status, 201);
  assert.strictEqual(lead.data.success, true);
});

test('CRM API: Duplicate phone prevention', async () => {
  const login = await apiRequest('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@example.com',
      password: 'ChangeMe123!'
    }
  });

  const token = login.data.data.token;

  const phone =
    '98451' +
    Math.floor(10000 + Math.random() * 90000);

  const first = await apiRequest('/leads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: {
      businessName: 'Duplicate Test One',
      contactPerson: 'Owner One',
      phone,
      city: 'Hyderabad',
      state: 'Telangana'
    }
  });

  assert.strictEqual(first.status, 201);

  const second = await apiRequest('/leads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: {
      businessName: 'Duplicate Test Two',
      contactPerson: 'Owner Two',
      phone,
      city: 'Hyderabad',
      state: 'Telangana'
    }
  });

  assert.strictEqual(second.status, 409);
});