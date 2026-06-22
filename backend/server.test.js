import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { hashPassword, signJwt } from "./auth.js";
import { createApp } from "./server.js";

async function withServer(app, run) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function adminHeaders(headers = {}) {
  return {
    Authorization: `Bearer ${signJwt({
      sub: 1,
      name: "Admin",
      email: "admin@example.com",
      role: "Administrator",
    })}`,
    ...headers,
  };
}

test("GET /api/health confirms database connectivity", async () => {
  const calls = [];
  const app = createApp({
    async query(sql) {
      calls.push(sql);
      return [[]];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });

  assert.deepEqual(calls, ["SELECT 1"]);
});

test("GET /api/services maps database rows to kiosk services", async () => {
  const app = createApp({
    async query(sql) {
      assert.match(sql, /FROM services/);
      return [[
        {
          code: "A",
          emoji: "B",
          name_ta: "Tamil service",
          name_si: "Sinhala service",
          name_en: "English service",
          counter_number: "2",
        },
      ]];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/services`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [
      {
        code: "A",
        emoji: "B",
        ta: "Tamil service",
        si: "Sinhala service",
        en: "English service",
        counterNumber: "2",
      },
    ]);
  });
});

test("POST /api/auth/login returns a JWT for valid admin credentials", async () => {
  const passwordHash = await hashPassword("Secret123");
  const calls = [];
  const app = createApp({
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.includes("FROM admin_users")) {
        return [[{
          id: 1,
          name: "Admin",
          email: "admin@example.com",
          role: "Administrator",
          active: 1,
          password_hash: passwordHash,
          created_at: new Date("2026-06-14T10:30:00.000Z"),
        }]];
      }
      return [{ affectedRows: 1 }];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ADMIN@EXAMPLE.COM", password: "Secret123" }),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(typeof body.token, "string");
    assert.equal(body.user.email, "admin@example.com");
    assert.equal(body.user.role, "Administrator");
  });

  assert.match(calls[0].sql, /FROM admin_users/);
  assert.deepEqual(calls[0].params, ["admin@example.com"]);
  assert.match(calls[1].sql, /last_login_at/);
});

test("admin routes require a valid JWT", async () => {
  const app = createApp({
    async query() {
      throw new Error("query should not be called without auth");
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/settings`);

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Admin login is required." });
  });
});

test("POST /api/services validates required service fields", async () => {
  const app = createApp({
    async query() {
      throw new Error("query should not be called for invalid services");
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/services`, {
      method: "POST",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ code: "X" }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "Service code, Tamil, Sinhala, and English names are required.",
    });
  });
});

test("POST /api/services reports duplicate service codes", async () => {
  const app = createApp({
    async query() {
      const error = new Error("Duplicate entry");
      error.code = "ER_DUP_ENTRY";
      throw error;
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/services`, {
      method: "POST",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        code: "A",
        emoji: "B",
        ta: "Tamil",
        si: "Sinhala",
        en: "English",
      }),
    });

    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {
      error: "Service code is already used.",
    });
  });
});

test("PUT /api/services/:code updates an existing service", async () => {
  const calls = [];
  const app = createApp({
    async query(sql, params) {
      calls.push({ sql, params });
      return [{ affectedRows: 1 }];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/services/A`, {
      method: "PUT",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        code: "B",
        emoji: "C",
        ta: "Tamil updated",
        si: "Sinhala updated",
        en: "English updated",
        counterNumber: "4",
      }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      code: "B",
      emoji: "C",
      ta: "Tamil updated",
      si: "Sinhala updated",
      en: "English updated",
      counterNumber: "4",
    });
  });

  assert.match(calls[0].sql, /UPDATE services/);
  assert.deepEqual(calls[0].params, [
    "B",
    "C",
    "Tamil updated",
    "Sinhala updated",
    "English updated",
    "4",
    "A",
  ]);
});

test("PUT /api/services/:code reports missing services", async () => {
  const app = createApp({
    async query() {
      return [{ affectedRows: 0 }];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/services/MISSING`, {
      method: "PUT",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        code: "M",
        emoji: "N",
        ta: "Tamil",
        si: "Sinhala",
        en: "English",
      }),
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: "Service was not found.",
    });
  });
});

test("PUT /api/services/:code reports duplicate service codes", async () => {
  const app = createApp({
    async query() {
      const error = new Error("Duplicate entry");
      error.code = "ER_DUP_ENTRY";
      throw error;
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/services/A`, {
      method: "PUT",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        code: "B",
        emoji: "C",
        ta: "Tamil",
        si: "Sinhala",
        en: "English",
      }),
    });

    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {
      error: "Service code is already used.",
    });
  });
});

test("POST /api/tokens issues the next token inside a transaction", async () => {
  const queries = [];
  const connection = {
    committed: false,
    released: false,
    async beginTransaction() {},
    async query(sql, params) {
      queries.push({ sql, params });
      if (sql.includes("FROM services")) {
        return [[{
          code: "A",
          emoji: "B",
          name_ta: "Tamil",
          name_si: "Sinhala",
          name_en: "English",
          counter_number: "3",
          active: 1,
        }]];
      }
      if (sql.includes("FROM token_counters")) {
        return [[{ counter: 7 }]];
      }
      return [{}];
    },
    async commit() {
      this.committed = true;
    },
    async rollback() {
      throw new Error("rollback should not be called");
    },
    release() {
      this.released = true;
    },
  };
  const app = createApp({
    async getConnection() {
      return connection;
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceCode: "A" }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      token: "A008",
      service: {
        code: "A",
        emoji: "B",
        ta: "Tamil",
        si: "Sinhala",
        en: "English",
        counterNumber: "3",
      },
      issuedYear: new Date().getFullYear(),
    });
  });

  assert.equal(connection.committed, true);
  assert.equal(connection.released, true);
  assert.equal(queries.at(-2).params[0], 8);
  assert.equal(queries.at(-1).params[0], "A008");
});

test("GET /api/tokens/counters returns current counters for active services", async () => {
  const app = createApp({
    async query(sql) {
      assert.match(sql, /LEFT JOIN token_counters/);
      assert.match(sql, /s\.active = 1/);
      return [[
        { code: "A", counter: 8 },
        { code: "B", counter: 0 },
      ]];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tokens/counters`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { A: 8, B: 0 });
  });
});

test("DELETE /api/services/:code soft deletes services for the kiosk", async () => {
  const calls = [];
  const app = createApp({
    async query(sql, params) {
      calls.push({ sql, params });
      return [{ affectedRows: 1 }];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/services/A`, {
      method: "DELETE",
      headers: adminHeaders(),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { code: "A", active: false });
  });

  assert.match(calls[0].sql, /SET active = 0/);
  assert.deepEqual(calls[0].params, ["A"]);
});

test("POST /api/feedback validates rating range", async () => {
  const app = createApp({
    async query() {
      throw new Error("query should not be called for invalid feedback");
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 6 }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "Rating must be between 1 and 5.",
    });
  });
});

test("POST /api/feedback stores valid reviews", async () => {
  const calls = [];
  const app = createApp({
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.includes("FROM services")) {
        return [[{ code: "A", name_en: "Building Approval" }]];
      }
      return [{ insertId: 42 }];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 4, comment: " Good ", mobile: "", serviceCode: "A" }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      id: 42,
      rating: 4,
      comment: "Good",
      mobile: "",
      serviceCode: "A",
      serviceName: "Building Approval",
    });
  });

  assert.match(calls[0].sql, /FROM services/);
  assert.deepEqual(calls[0].params, ["A"]);
  assert.match(calls[1].sql, /INSERT INTO feedback/);
  assert.deepEqual(calls[1].params, [4, "Good", null, "A", "Building Approval"]);
});

test("GET /api/feedback/recent returns live reviews with contact numbers", async () => {
  const app = createApp({
    async query(sql, params) {
      assert.match(sql, /FROM feedback/);
      assert.deepEqual(params, [8]);
      return [[{
        id: 7,
      rating: 5,
      comment: "Fast service",
      mobile: "0771234523",
      service_code: "A",
      service_name: "Building Approval",
        created_at: new Date("2026-06-14T09:15:00.000Z"),
      }]];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/feedback/recent`, {
      headers: adminHeaders(),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [{
      id: 7,
      date: "2026-06-14 09:15",
      rating: 5,
      comment: "Fast service",
      mobile: "0771234523",
      serviceCode: "A",
      serviceName: "Building Approval",
      status: "Positive",
    }]);
  });
});

test("GET /api/feedback/summary returns real dashboard aggregates", async () => {
  let call = 0;
  const app = createApp({
    async query(sql) {
      call += 1;
      if (call === 1) {
        assert.match(sql, /COUNT\(\*\) AS total/);
        return [[{
          total: 3,
          averageRating: 3.666,
          positive: 2,
          negative: 1,
          neutral: 0,
        }]];
      }
      if (call === 2) {
        assert.match(sql, /GROUP BY rating/);
        return [[
          { rating: 1, count: 1 },
          { rating: 5, count: 2 },
        ]];
      }
      assert.match(sql, /GROUP BY monthKey/);
      return [[{
        month: "Jun",
        reviews: 3,
        avg: 3.666,
      }]];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/feedback/summary`, {
      headers: adminHeaders(),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      total: 3,
      averageRating: 3.666,
      positive: 2,
      negative: 1,
      neutral: 0,
      ratingDistribution: [
        { rating: 1, count: 1 },
        { rating: 2, count: 0 },
        { rating: 3, count: 0 },
        { rating: 4, count: 0 },
        { rating: 5, count: 2 },
      ],
      monthlyTrend: [{
        month: "Jun",
        reviews: 3,
        avg: 3.7,
      }],
    });
  });
});

test("GET /api/analytics/overview returns live analytics aggregates", async () => {
  let call = 0;
  const app = createApp({
    async query(sql) {
      call += 1;
      if (call === 1) {
        assert.match(sql, /COUNT\(\*\) AS total/);
        return [[{ total: 4, averageRating: 4.25, positive: 3, negative: 1 }]];
      }
      if (call === 2) {
        assert.match(sql, /GROUP BY rating/);
        return [[{ rating: 1, count: 1 }, { rating: 5, count: 3 }]];
      }
      if (call === 3) {
        assert.match(sql, /positive/);
        return [[{ month: "Jun", positive: 3, negative: 1, reviews: 4, avg: 4.25 }]];
      }
      assert.match(sql, /GROUP BY dayKey/);
      return [[{ day: "Mon", reviews: 4 }]];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/analytics/overview`, {
      headers: adminHeaders(),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      totalReviews: 4,
      satisfactionRate: 75,
      negativeRate: 25,
      averageRating: 4.3,
      dailyAverage: 4,
      ratingDistribution: [
        { name: "1 Star", rating: 1, value: 1 },
        { name: "2 Stars", rating: 2, value: 0 },
        { name: "3 Stars", rating: 3, value: 0 },
        { name: "4 Stars", rating: 4, value: 0 },
        { name: "5 Stars", rating: 5, value: 3 },
      ],
      monthlyTrend: [{ month: "Jun", positive: 3, negative: 1, reviews: 4, avg: 4.3 }],
      dailyVolume: [{ day: "Mon", reviews: 4 }],
    });
  });
});

test("GET /api/reports/tokens returns issued token rows", async () => {
  const app = createApp({
    async query(sql) {
      assert.match(sql, /FROM token_issues/);
      return [[{
        id: 9,
        token_number: "A001",
        service_code: "A",
        service_name: "Building Approval",
        issued_year: 2026,
        issued_at: new Date("2026-06-14T10:30:00.000Z"),
      }]];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reports/tokens`, {
      headers: adminHeaders(),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [{
      id: 9,
      token: "A001",
      serviceCode: "A",
      serviceName: "Building Approval",
      issuedYear: 2026,
      issuedAt: "2026-06-14 10:30",
    }]);
  });
});

test("GET /api/settings returns admin settings object", async () => {
  const app = createApp({
    async query(sql) {
      assert.match(sql, /FROM admin_settings/);
      return [[
        { setting_key: "organizationName", setting_value: "Council" },
        { setting_key: "supportPhone", setting_value: "011" },
      ]];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/settings`, {
      headers: adminHeaders(),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      organizationName: "Council",
      supportPhone: "011",
    });
  });
});

test("POST /api/users creates admin users", async () => {
  const calls = [];
  const app = createApp({
    async query(sql, params) {
      calls.push({ sql, params });
      return [{ insertId: 12 }];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        name: "Jane Admin",
        email: "JANE@EXAMPLE.COM",
        role: "Supervisor",
        password: "Secret123",
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.id, 12);
    assert.equal(body.name, "Jane Admin");
    assert.equal(body.email, "jane@example.com");
    assert.equal(body.role, "Supervisor");
    assert.equal(body.active, true);
  });

  assert.match(calls[0].sql, /INSERT INTO admin_users/);
  assert.equal(calls[0].params[0], "Jane Admin");
  assert.equal(calls[0].params[1], "jane@example.com");
  assert.equal(calls[0].params[2], "Supervisor");
  assert.match(calls[0].params[3], /^scrypt\$/);
});
