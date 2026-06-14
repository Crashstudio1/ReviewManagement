import "dotenv/config";
import { pathToFileURL } from "node:url";
import cors from "cors";
import express from "express";
import { pool } from "./db.js";

const port = Number(process.env.API_PORT || 4000);

function toService(row) {
  return {
    code: row.code,
    emoji: row.emoji,
    ta: row.name_ta,
    si: row.name_si,
    en: row.name_en,
  };
}

function normalizeService(input = {}) {
  return {
    code: String(input.code || "").trim().toUpperCase(),
    emoji: String(input.emoji || "📋").trim() || "📋",
    ta: String(input.ta || "").trim(),
    si: String(input.si || "").trim(),
    en: String(input.en || "").trim(),
  };
}

function requireServiceFields(service) {
  if (!service.code || !service.ta || !service.si || !service.en) {
    const error = new Error("Service code, Tamil, Sinhala, and English names are required.");
    error.status = 400;
    throw error;
  }
}

function getFeedbackStatus(rating) {
  if (rating >= 4) return "Positive";
  if (rating <= 2) return "Negative";
  return "Neutral";
}

function maskMobile(mobile) {
  if (!mobile) return "-";
  if (mobile.length <= 4) return mobile;
  return `${mobile.slice(0, 3)}*****${mobile.slice(-2)}`;
}

function toFeedbackReview(row) {
  const createdAt = row.created_at instanceof Date
    ? row.created_at
    : new Date(row.created_at);
  const date = Number.isNaN(createdAt.getTime())
    ? String(row.created_at || "")
    : createdAt.toISOString().slice(0, 16).replace("T", " ");
  const rating = Number(row.rating);

  return {
    id: Number(row.id),
    date,
    rating,
    comment: row.comment || "",
    mobile: maskMobile(String(row.mobile || "").trim()),
    status: getFeedbackStatus(rating),
  };
}

export function createApp(apiPool = pool) {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
  app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res, next) => {
  try {
    await apiPool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/services", async (_req, res, next) => {
  try {
    const [rows] = await apiPool.query(
      `SELECT code, emoji, name_ta, name_si, name_en
       FROM services
       WHERE active = 1
       ORDER BY code`,
    );
    res.json(rows.map(toService));
  } catch (error) {
    next(error);
  }
});

app.post("/api/services", async (req, res, next) => {
  try {
    const service = normalizeService(req.body);
    requireServiceFields(service);

    await apiPool.query(
      `INSERT INTO services (code, emoji, name_ta, name_si, name_en)
       VALUES (?, ?, ?, ?, ?)`,
      [service.code, service.emoji, service.ta, service.si, service.en],
    );

    res.status(201).json(service);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      error.status = 409;
      error.message = "Service code is already used.";
    }
    next(error);
  }
});

app.put("/api/services/:code", async (req, res, next) => {
  try {
    const currentCode = String(req.params.code || "").trim().toUpperCase();
    const service = normalizeService(req.body);
    requireServiceFields(service);

    const [result] = await apiPool.query(
      `UPDATE services
       SET code = ?, emoji = ?, name_ta = ?, name_si = ?, name_en = ?, active = 1
       WHERE code = ?`,
      [service.code, service.emoji, service.ta, service.si, service.en, currentCode],
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Service was not found." });
      return;
    }

    res.json(service);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      error.status = 409;
      error.message = "Service code is already used.";
    }
    next(error);
  }
});

app.post("/api/tokens", async (req, res, next) => {
  const incomingService = normalizeService(req.body.service || {});
  const serviceCode = String(req.body.serviceCode || incomingService.code || "").trim().toUpperCase();

  if (!serviceCode) {
    res.status(400).json({ error: "Service code is required." });
    return;
  }

  const connection = await apiPool.getConnection();

  try {
    await connection.beginTransaction();

    const [serviceRows] = await connection.query(
      `SELECT code, emoji, name_ta, name_si, name_en
       FROM services
       WHERE code = ?
       FOR UPDATE`,
      [serviceCode],
    );

    let service = serviceRows[0] ? toService(serviceRows[0]) : null;

    if (!service) {
      requireServiceFields({ ...incomingService, code: serviceCode });
      await connection.query(
        `INSERT INTO services (code, emoji, name_ta, name_si, name_en)
         VALUES (?, ?, ?, ?, ?)`,
        [serviceCode, incomingService.emoji, incomingService.ta, incomingService.si, incomingService.en],
      );
      service = { ...incomingService, code: serviceCode };
    }

    await connection.query(
      `INSERT INTO token_counters (service_code, counter)
       VALUES (?, 0)
       ON DUPLICATE KEY UPDATE service_code = service_code`,
      [serviceCode],
    );

    const [counterRows] = await connection.query(
      `SELECT counter
       FROM token_counters
       WHERE service_code = ?
       FOR UPDATE`,
      [serviceCode],
    );

    const nextCounter = Number(counterRows[0]?.counter || 0) + 1;
    const token = `${serviceCode}${String(nextCounter).padStart(3, "0")}`;
    const issuedYear = new Date().getFullYear();

    await connection.query(
      `UPDATE token_counters
       SET counter = ?
       WHERE service_code = ?`,
      [nextCounter, serviceCode],
    );

    await connection.query(
      `INSERT INTO token_issues (token_number, service_code, service_name, issued_year)
       VALUES (?, ?, ?, ?)`,
      [token, serviceCode, service.en, issuedYear],
    );

    await connection.commit();
    res.status(201).json({ token, service, issuedYear });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

app.get("/api/tokens/usage/by-year", async (_req, res, next) => {
  try {
    const [rows] = await apiPool.query(
      `SELECT issued_year, service_code, COUNT(*) AS total
       FROM token_issues
       GROUP BY issued_year, service_code
       ORDER BY issued_year DESC, service_code`,
    );

    const usage = {};
    for (const row of rows) {
      const year = String(row.issued_year);
      usage[year] ||= {};
      usage[year][row.service_code] = Number(row.total);
    }

    res.json(usage);
  } catch (error) {
    next(error);
  }
});

app.post("/api/feedback", async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();
    const mobile = String(req.body.mobile || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be between 1 and 5." });
      return;
    }

    const [result] = await apiPool.query(
      `INSERT INTO feedback (rating, comment, mobile)
       VALUES (?, ?, ?)`,
      [rating, comment || null, mobile || null],
    );

    res.status(201).json({ id: result.insertId, rating, comment, mobile });
  } catch (error) {
    next(error);
  }
});

app.get("/api/feedback/recent", async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit || 8);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 8;
    const [rows] = await apiPool.query(
      `SELECT id, rating, comment, mobile, created_at
       FROM feedback
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit],
    );

    res.json(rows.map(toFeedbackReview));
  } catch (error) {
    next(error);
  }
});

app.get("/api/feedback/summary", async (_req, res, next) => {
  try {
    const [[totals]] = await apiPool.query(
      `SELECT
         COUNT(*) AS total,
         COALESCE(AVG(rating), 0) AS averageRating,
         COALESCE(SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END), 0) AS positive,
         COALESCE(SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END), 0) AS negative,
         COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0) AS neutral
       FROM feedback`,
    );

    const [ratingRows] = await apiPool.query(
      `SELECT rating, COUNT(*) AS count
       FROM feedback
       GROUP BY rating
       ORDER BY rating`,
    );

    const [monthlyRows] = await apiPool.query(
      `SELECT
         DATE_FORMAT(created_at, '%b') AS month,
         DATE_FORMAT(created_at, '%Y-%m') AS monthKey,
         COUNT(*) AS reviews,
         COALESCE(AVG(rating), 0) AS avg
       FROM feedback
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY monthKey, month
       ORDER BY monthKey`,
    );

    const countsByRating = new Map(
      ratingRows.map((row) => [Number(row.rating), Number(row.count)]),
    );

    res.json({
      total: Number(totals.total || 0),
      averageRating: Number(totals.averageRating || 0),
      positive: Number(totals.positive || 0),
      negative: Number(totals.negative || 0),
      neutral: Number(totals.neutral || 0),
      ratingDistribution: [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: countsByRating.get(rating) || 0,
      })),
      monthlyTrend: monthlyRows.map((row) => ({
        month: row.month,
        reviews: Number(row.reviews || 0),
        avg: Number(Number(row.avg || 0).toFixed(1)),
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({ error: error.message || "Server error" });
});

  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = createApp();
  app.listen(port, () => {
    console.log(`Government Citizen Review API running on http://localhost:${port}`);
  });
}
