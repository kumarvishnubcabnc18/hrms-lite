const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const db = require("../db");

const router = express.Router();

const VALID_STATUSES = ["Present", "Absent", "Half Day", "Remote"];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── GET /api/attendance ─────────────────────────────────────────────────────
router.get(
  "/",
  [
    query("date").optional().isISO8601().withMessage("Date must be YYYY-MM-DD"),
    query("employee_id").optional().trim(),
    query("status").optional().isIn(VALID_STATUSES).withMessage("Invalid status"),
    query("month").optional().matches(/^\d{4}-\d{2}$/).withMessage("Month must be YYYY-MM"),
  ],
  handleValidation,
  (req, res) => {
    try {
      const { date, employee_id, status, month } = req.query;
      let sql = `
        SELECT
          a.id, a.employee_id, a.date, a.status, a.marked_at,
          e.name AS employee_name, e.department
        FROM attendance a
        JOIN employees e ON e.id = a.employee_id
      `;
      const params = [];
      const where = [];

      if (date) { where.push("a.date = ?"); params.push(date); }
      if (employee_id) { where.push("a.employee_id = ?"); params.push(employee_id); }
      if (status) { where.push("a.status = ?"); params.push(status); }
      if (month) { where.push("strftime('%Y-%m', a.date) = ?"); params.push(month); }

      if (where.length) sql += " WHERE " + where.join(" AND ");
      sql += " ORDER BY a.date DESC, e.name ASC";

      const records = db.prepare(sql).all(...params);
      res.json({ data: records, count: records.length });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch attendance", message: err.message });
    }
  }
);

// ── POST /api/attendance ────────────────────────────────────────────────────
router.post(
  "/",
  [
    body("employee_id").trim().notEmpty().withMessage("Employee ID is required"),
    body("date")
      .trim()
      .notEmpty().withMessage("Date is required")
      .isISO8601().withMessage("Date must be a valid date (YYYY-MM-DD)"),
    body("status")
      .trim()
      .notEmpty().withMessage("Status is required")
      .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(", ")}`),
  ],
  handleValidation,
  (req, res) => {
    try {
      const { employee_id, date, status } = req.body;

      // Verify employee exists
      const employee = db
        .prepare("SELECT id, name FROM employees WHERE id = ?")
        .get(employee_id.trim().toUpperCase());

      if (!employee) {
        return res.status(404).json({
          error: "Employee not found",
          details: [{ field: "employee_id", message: `No employee with ID '${employee_id}'` }],
        });
      }

      // Upsert: update if exists, insert if not
      const existing = db
        .prepare("SELECT id FROM attendance WHERE employee_id = ? AND date = ?")
        .get(employee.id, date);

      let record;
      if (existing) {
        db.prepare(
          "UPDATE attendance SET status = ?, marked_at = datetime('now') WHERE employee_id = ? AND date = ?"
        ).run(status, employee.id, date);
        record = db
          .prepare("SELECT * FROM attendance WHERE employee_id = ? AND date = ?")
          .get(employee.id, date);
        return res.json({ data: record, message: "Attendance updated", updated: true });
      }

      const result = db
        .prepare("INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)")
        .run(employee.id, date, status);

      record = db.prepare("SELECT * FROM attendance WHERE id = ?").get(result.lastInsertRowid);
      res.status(201).json({ data: record, message: "Attendance marked", updated: false });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark attendance", message: err.message });
    }
  }
);

// ── PUT /api/attendance/:id ─────────────────────────────────────────────────
router.put(
  "/:id",
  [
    param("id").isInt().withMessage("Invalid attendance ID"),
    body("status").trim().isIn(VALID_STATUSES).withMessage("Invalid status"),
  ],
  handleValidation,
  (req, res) => {
    try {
      const record = db
        .prepare("SELECT * FROM attendance WHERE id = ?")
        .get(req.params.id);

      if (!record) {
        return res.status(404).json({ error: "Attendance record not found" });
      }

      db.prepare(
        "UPDATE attendance SET status = ?, marked_at = datetime('now') WHERE id = ?"
      ).run(req.body.status, req.params.id);

      const updated = db.prepare("SELECT * FROM attendance WHERE id = ?").get(req.params.id);
      res.json({ data: updated, message: "Attendance updated" });
    } catch (err) {
      res.status(500).json({ error: "Failed to update attendance", message: err.message });
    }
  }
);

// ── DELETE /api/attendance/:id ──────────────────────────────────────────────
router.delete(
  "/:id",
  [param("id").isInt().withMessage("Invalid attendance ID")],
  handleValidation,
  (req, res) => {
    try {
      const record = db
        .prepare("SELECT * FROM attendance WHERE id = ?")
        .get(req.params.id);

      if (!record) {
        return res.status(404).json({ error: "Attendance record not found" });
      }

      db.prepare("DELETE FROM attendance WHERE id = ?").run(req.params.id);
      res.json({ message: "Attendance record deleted" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete attendance", message: err.message });
    }
  }
);

// ── GET /api/attendance/summary ─────────────────────────────────────────────
router.get("/summary", (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { date = today } = req.query;

    const summary = db.prepare(`
      SELECT
        COUNT(DISTINCT e.id) AS total_employees,
        COUNT(CASE WHEN a.status IN ('Present','Remote') THEN 1 END) AS present,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) AS absent,
        COUNT(CASE WHEN a.status = 'Half Day' THEN 1 END) AS half_day,
        COUNT(CASE WHEN a.status = 'Remote' THEN 1 END) AS remote,
        COUNT(DISTINCT e.id) - COUNT(a.id) AS not_marked
      FROM employees e
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = ?
    `).get(date);

    res.json({ data: { ...summary, date } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch summary", message: err.message });
  }
});

module.exports = router;
