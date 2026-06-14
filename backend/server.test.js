import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
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
      },
    ]);
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "B",
        emoji: "C",
        ta: "Tamil updated",
        si: "Sinhala updated",
        en: "English updated",
      }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      code: "B",
      emoji: "C",
      ta: "Tamil updated",
      si: "Sinhala updated",
      en: "English updated",
    });
  });

  assert.match(calls[0].sql, /UPDATE services/);
  assert.deepEqual(calls[0].params, [
    "B",
    "C",
    "Tamil updated",
    "Sinhala updated",
    "English updated",
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
      },
      issuedYear: new Date().getFullYear(),
    });
  });

  assert.equal(connection.committed, true);
  assert.equal(connection.released, true);
  assert.equal(queries.at(-2).params[0], 8);
  assert.equal(queries.at(-1).params[0], "A008");
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
      return [{ insertId: 42 }];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 4, comment: " Good ", mobile: "" }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), {
      id: 42,
      rating: 4,
      comment: "Good",
      mobile: "",
    });
  });

  assert.match(calls[0].sql, /INSERT INTO feedback/);
  assert.deepEqual(calls[0].params, [4, "Good", null]);
});

test("GET /api/feedback/recent returns masked live reviews", async () => {
  const app = createApp({
    async query(sql, params) {
      assert.match(sql, /FROM feedback/);
      assert.deepEqual(params, [8]);
      return [[{
        id: 7,
        rating: 5,
        comment: "Fast service",
        mobile: "0771234523",
        created_at: new Date("2026-06-14T09:15:00.000Z"),
      }]];
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/feedback/recent`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [{
      id: 7,
      date: "2026-06-14 09:15",
      rating: 5,
      comment: "Fast service",
      mobile: "077*****23",
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
    const response = await fetch(`${baseUrl}/api/feedback/summary`);

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
