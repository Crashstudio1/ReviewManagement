import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { getJwtTtlSeconds, hashPassword, signJwt, verifyJwt, verifyPassword } from "./auth.js";
import { pool } from "./db.js";

const port = Number(process.env.API_PORT || 4000);
const currentFile = fileURLToPath(import.meta.url);
const DEFAULT_TEMPORARY_TOKEN_START = 300;
const TEMPORARY_TOKEN_STARTS = {
  A: 303,
  B: 250,
  C: 305,
  D: 310,
  E: 315,
  F: 320,
  G: 325,
  H: 330,
  I: 335,
  J: 340,
  K: 345,
  L: 350,
};

function getTemporaryTokenStart(serviceCode) {
  return TEMPORARY_TOKEN_STARTS[serviceCode] || DEFAULT_TEMPORARY_TOKEN_START;
}

function toService(row) {
  return {
    code: row.code,
    emoji: row.emoji,
    ta: row.name_ta,
    si: row.name_si,
    en: row.name_en,
    counterNumber: row.counter_number || "",
  };
}

function normalizeService(input = {}) {
  return {
    code: String(input.code || "").trim().toUpperCase(),
    emoji: String(input.emoji || "📋").trim() || "📋",
    ta: String(input.ta || "").trim(),
    si: String(input.si || "").trim(),
    en: String(input.en || "").trim(),
    counterNumber: String(input.counterNumber || input.counter_number || "").trim(),
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

function displayMobile(mobile) {
  if (!mobile) return "-";
  return mobile;
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
    mobile: displayMobile(String(row.mobile || "").trim()),
    serviceCode: row.service_code || "",
    serviceName: row.service_name || "",
    status: getFeedbackStatus(rating),
  };
}

function toAdminUser(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString().slice(0, 10)
      : String(row.created_at || ""),
  };
}

function csvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows, columns) {
  return [
    columns.map((column) => csvValue(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => csvValue(row[column.key])).join(",")),
  ].join("\n");
}

function requireAdmin(req, res, next) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const payload = verifyJwt(token);

  if (!payload) {
    res.status(401).json({ error: "Admin login is required." });
    return;
  }

  req.admin = payload;
  next();
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
      `SELECT code, emoji, name_ta, name_si, name_en, counter_number
       FROM services
       WHERE active = 1
       ORDER BY code`,
    );
    res.json(rows.map(toService));
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const [rows] = await apiPool.query(
      `SELECT id, name, email, role, password_hash, active
       FROM admin_users
       WHERE email = ?
       LIMIT 1`,
      [email],
    );
    const user = rows[0];
    const passwordOk = user && Number(user.active) === 1
      ? await verifyPassword(password, user.password_hash)
      : false;

    if (!passwordOk) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    await apiPool.query(
      `UPDATE admin_users
       SET last_login_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [user.id],
    );

    const admin = toAdminUser(user);
    const expiresIn = getJwtTtlSeconds();
    const token = signJwt({
      sub: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    }, { expiresIn });

    res.json({ token, user: admin, expiresIn });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAdmin, async (req, res) => {
  res.json({
    user: {
      id: Number(req.admin.sub),
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      active: true,
      createdAt: "",
    },
  });
});

app.post("/api/services", requireAdmin, async (req, res, next) => {
  try {
    const service = normalizeService(req.body);
    requireServiceFields(service);

    const [result] = await apiPool.query(
      `INSERT INTO services (code, emoji, name_ta, name_si, name_en, counter_number)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         emoji = VALUES(emoji),
         name_ta = VALUES(name_ta),
         name_si = VALUES(name_si),
         name_en = VALUES(name_en),
         counter_number = VALUES(counter_number),
         active = 1`,
      [service.code, service.emoji, service.ta, service.si, service.en, service.counterNumber],
    );

    res.status(result.insertId ? 201 : 200).json(service);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      error.status = 409;
      error.message = "Service code is already used.";
    }
    next(error);
  }
});

app.put("/api/services/:code", requireAdmin, async (req, res, next) => {
  try {
    const currentCode = String(req.params.code || "").trim().toUpperCase();
    const service = normalizeService(req.body);
    requireServiceFields(service);

    const [result] = await apiPool.query(
      `UPDATE services
       SET code = ?, emoji = ?, name_ta = ?, name_si = ?, name_en = ?, counter_number = ?, active = 1
       WHERE code = ?`,
      [service.code, service.emoji, service.ta, service.si, service.en, service.counterNumber, currentCode],
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

app.delete("/api/services/:code", requireAdmin, async (req, res, next) => {
  try {
    const code = String(req.params.code || "").trim().toUpperCase();
    const [result] = await apiPool.query(
      `UPDATE services
       SET active = 0
       WHERE code = ?`,
      [code],
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Service was not found." });
      return;
    }

    res.json({ code, active: false });
  } catch (error) {
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
      `SELECT code, emoji, name_ta, name_si, name_en, counter_number, active
       FROM services
       WHERE code = ?
       FOR UPDATE`,
      [serviceCode],
    );

    if (serviceRows[0] && Number(serviceRows[0].active) !== 1) {
      const error = new Error("Service is unavailable.");
      error.status = 404;
      throw error;
    }

    let service = serviceRows[0] ? toService(serviceRows[0]) : null;

    if (!service) {
      requireServiceFields({ ...incomingService, code: serviceCode });
      await connection.query(
        `INSERT INTO services (code, emoji, name_ta, name_si, name_en, counter_number)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          serviceCode,
          incomingService.emoji,
          incomingService.ta,
          incomingService.si,
          incomingService.en,
          incomingService.counterNumber,
        ],
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

    const [issuedCounterRows] = await connection.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(token_number, ?) AS UNSIGNED)), 0) AS counter
       FROM token_issues
       WHERE service_code = ?`,
      [serviceCode.length + 1, serviceCode],
    );

    const currentCounter = Math.max(
      Number(counterRows[0]?.counter || 0),
      Number(issuedCounterRows[0]?.counter || 0),
    );
    const nextCounter = Math.max(currentCounter + 1, getTemporaryTokenStart(serviceCode));
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

app.get("/api/tokens/counters", async (_req, res, next) => {
  try {
    const [rows] = await apiPool.query(
      `SELECT
         s.code,
         GREATEST(
           COALESCE(c.counter, 0),
           COALESCE(MAX(CAST(SUBSTRING(t.token_number, CHAR_LENGTH(s.code) + 1) AS UNSIGNED)), 0)
         ) AS counter
       FROM services s
       LEFT JOIN token_counters c ON c.service_code = s.code
       LEFT JOIN token_issues t ON t.service_code = s.code
       WHERE s.active = 1
       GROUP BY s.code, c.counter
       ORDER BY s.code`,
    );

    const counters = {};
    for (const row of rows) {
      counters[row.code] = Number(row.counter || 0);
    }

    res.json(counters);
  } catch (error) {
    next(error);
  }
});

app.post("/api/feedback", async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();
    const mobile = String(req.body.mobile || "").trim();
    const serviceCode = String(req.body.serviceCode || "").trim().toUpperCase();
    const fallbackServiceName = String(req.body.serviceName || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be between 1 and 5." });
      return;
    }

    let feedbackServiceCode = serviceCode || null;
    let feedbackServiceName = fallbackServiceName || null;

    if (serviceCode) {
      const [serviceRows] = await apiPool.query(
        `SELECT code, name_en
         FROM services
         WHERE code = ?
         LIMIT 1`,
        [serviceCode],
      );
      if (serviceRows[0]) {
        feedbackServiceCode = serviceRows[0].code;
        feedbackServiceName = serviceRows[0].name_en;
      }
    }

    const [result] = await apiPool.query(
      `INSERT INTO feedback (rating, comment, mobile, service_code, service_name)
       VALUES (?, ?, ?, ?, ?)`,
      [rating, comment || null, mobile || null, feedbackServiceCode, feedbackServiceName],
    );

    res.status(201).json({
      id: result.insertId,
      rating,
      comment,
      mobile,
      serviceCode: feedbackServiceCode || "",
      serviceName: feedbackServiceName || "",
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/feedback/recent", requireAdmin, async (req, res, next) => {
  try {
    const requestedLimit = Number(req.query.limit || 8);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 8;
    const [rows] = await apiPool.query(
      `SELECT id, rating, comment, mobile, service_code, service_name, created_at
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

app.get("/api/feedback/summary", requireAdmin, async (_req, res, next) => {
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

app.get("/api/analytics/overview", requireAdmin, async (_req, res, next) => {
  try {
    const [[totals]] = await apiPool.query(
      `SELECT
         COUNT(*) AS total,
         COALESCE(AVG(rating), 0) AS averageRating,
         COALESCE(SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END), 0) AS positive,
         COALESCE(SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END), 0) AS negative
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
         COALESCE(SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END), 0) AS positive,
         COALESCE(SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END), 0) AS negative,
         COUNT(*) AS reviews,
         COALESCE(AVG(rating), 0) AS avg
       FROM feedback
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY monthKey, month
       ORDER BY monthKey`,
    );
    const [dailyRows] = await apiPool.query(
      `SELECT
         DATE_FORMAT(created_at, '%a') AS day,
         DATE(created_at) AS dayKey,
         COUNT(*) AS reviews
       FROM feedback
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY dayKey, day
       ORDER BY dayKey`,
    );

    const total = Number(totals.total || 0);
    const positive = Number(totals.positive || 0);
    const negative = Number(totals.negative || 0);

    res.json({
      totalReviews: total,
      satisfactionRate: total ? Math.round((positive / total) * 100) : 0,
      negativeRate: total ? Number(((negative / total) * 100).toFixed(1)) : 0,
      averageRating: Number(Number(totals.averageRating || 0).toFixed(1)),
      dailyAverage: dailyRows.length
        ? Number((dailyRows.reduce((sum, row) => sum + Number(row.reviews || 0), 0) / dailyRows.length).toFixed(1))
        : 0,
      ratingDistribution: [1, 2, 3, 4, 5].map((rating) => {
        const row = ratingRows.find((item) => Number(item.rating) === rating);
        return {
          name: `${rating} ${rating === 1 ? "Star" : "Stars"}`,
          rating,
          value: Number(row?.count || 0),
        };
      }),
      monthlyTrend: monthlyRows.map((row) => ({
        month: row.month,
        positive: Number(row.positive || 0),
        negative: Number(row.negative || 0),
        reviews: Number(row.reviews || 0),
        avg: Number(Number(row.avg || 0).toFixed(1)),
      })),
      dailyVolume: dailyRows.map((row) => ({
        day: row.day,
        reviews: Number(row.reviews || 0),
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/feedback", requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await apiPool.query(
      `SELECT id, rating, comment, mobile, service_code, service_name, created_at
       FROM feedback
       ORDER BY created_at DESC`,
    );
    res.json(rows.map(toFeedbackReview));
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/tokens", requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await apiPool.query(
      `SELECT id, token_number, service_code, service_name, issued_year, issued_at
       FROM token_issues
       ORDER BY issued_at DESC`,
    );
    res.json(rows.map((row) => ({
      id: Number(row.id),
      token: row.token_number,
      serviceCode: row.service_code,
      serviceName: row.service_name,
      issuedYear: Number(row.issued_year),
      issuedAt: row.issued_at instanceof Date
        ? row.issued_at.toISOString().slice(0, 16).replace("T", " ")
        : String(row.issued_at || ""),
    })));
  } catch (error) {
    next(error);
  }
});

app.get("/api/reports/:type/export", requireAdmin, async (req, res, next) => {
  try {
    if (req.params.type === "feedback") {
      const [rows] = await apiPool.query(
        `SELECT id, rating, comment, mobile, service_code, service_name, created_at
         FROM feedback
         ORDER BY created_at DESC`,
      );
      const csv = toCsv(rows.map(toFeedbackReview), [
        { key: "id", label: "ID" },
        { key: "date", label: "Date & Time" },
        { key: "serviceCode", label: "Service Code" },
        { key: "serviceName", label: "Service Name" },
        { key: "rating", label: "Rating" },
        { key: "comment", label: "Comment" },
        { key: "mobile", label: "Contact Number" },
        { key: "status", label: "Status" },
      ]);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=feedback-report.csv");
      res.send(csv);
      return;
    }

    if (req.params.type === "tokens") {
      const [rows] = await apiPool.query(
        `SELECT id, token_number, service_code, service_name, issued_year, issued_at
         FROM token_issues
         ORDER BY issued_at DESC`,
      );
      const csv = toCsv(rows.map((row) => ({
        id: Number(row.id),
        token: row.token_number,
        serviceCode: row.service_code,
        serviceName: row.service_name,
        issuedYear: Number(row.issued_year),
        issuedAt: row.issued_at instanceof Date
          ? row.issued_at.toISOString().slice(0, 16).replace("T", " ")
          : String(row.issued_at || ""),
      })), [
        { key: "id", label: "ID" },
        { key: "token", label: "Token" },
        { key: "serviceCode", label: "Service Code" },
        { key: "serviceName", label: "Service Name" },
        { key: "issuedYear", label: "Issued Year" },
        { key: "issuedAt", label: "Issued At" },
      ]);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=token-report.csv");
      res.send(csv);
      return;
    }

    res.status(404).json({ error: "Report type was not found." });
  } catch (error) {
    next(error);
  }
});

app.get("/api/settings", requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await apiPool.query(
      `SELECT setting_key, setting_value
       FROM admin_settings
       ORDER BY setting_key`,
    );
    const settings = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

app.put("/api/settings", requireAdmin, async (req, res, next) => {
  try {
    const allowed = ["organizationName", "kioskTitle", "supportPhone", "reportEmail"];
    const settings = {};

    for (const key of allowed) {
      if (Object.hasOwn(req.body || {}, key)) {
        const value = String(req.body[key] || "").trim();
        settings[key] = value;
        await apiPool.query(
          `INSERT INTO admin_settings (setting_key, setting_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [key, value],
        );
      }
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await apiPool.query(
      `SELECT id, name, email, role, active, created_at
       FROM admin_users
       ORDER BY active DESC, name`,
    );
    res.json(rows.map(toAdminUser));
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = String(req.body.role || "Staff").trim() || "Staff";
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required." });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters." });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [result] = await apiPool.query(
      `INSERT INTO admin_users (name, email, role, password_hash)
       VALUES (?, ?, ?, ?)`,
      [name, email, role, passwordHash],
    );

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      role,
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      error.status = 409;
      error.message = "User email is already used.";
    }
    next(error);
  }
});

app.patch("/api/users/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const active = Boolean(req.body.active);
    const [result] = await apiPool.query(
      `UPDATE admin_users
       SET active = ?
       WHERE id = ?`,
      [active ? 1 : 0, id],
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "User was not found." });
      return;
    }

    res.json({ id, active });
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

export function startServer(apiPool = pool) {
  const app = createApp(apiPool);
  return app.listen(port, () => {
    console.log(`Government Citizen Review API running on http://localhost:${port}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  startServer();
}
