const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const db = require("../db");

const router = express.Router();

// ── Validation middleware ───────────────────────────────────────────────────
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

const employeeValidators = [
  body("id")
    .trim()
    .notEmpty().withMessage("Employee ID is required")
    .matches(/^[A-Z0-9_-]{2,20}$/).withMessage("ID must be 2-20 uppercase alphanumeric characters"),
  body("name")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("department")
    .trim()
    .notEmpty().withMessage("Department is required")
    .isLength({ min: 2, max: 100 }).withMessage("Department must be 2-100 characters"),
];

// ── GET /api/employees ──────────────────────────────────────────────────────
router.get(
  "/",
  [
    query("department").optional().trim(),
    query("search").optional().trim(),
  ],
  (req, res) => {
    try {
      const { department, search } = req.query;
      let sql = `
        SELECT
          e.id, e.name, e.email, e.department, e.created_at,
          COUNT(CASE WHEN a.status IN ('Present','Remote') THEN 1 END) AS present_days,
          COUNT(a.id) AS total_records
        FROM employees e
        LEFT JOIN attendance a ON a.employee_id = e.id
      `;
      const params = [];
      const where = [];

      if (department) {
        where.push("e.department = ?");
        params.push(department);
      }
      if (search) {
        where.push("(e.name LIKE ? OR e.id LIKE ? OR e.email LIKE ?)");
        const like = `%${search}%`;
        params.push(like, like, like);
      }
      if (where.length) sql += " WHERE " + where.join(" AND ");
      sql += " GROUP BY e.id ORDER BY e.created_at DESC";

      const employees = db.prepare(sql).all(...params);
      res.json({ data: employees, count: employees.length });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch employees", message: err.message });
    }
  }
);

// ── GET /api/employees/:id ──────────────────────────────────────────────────
router.get(
  "/:id",
  [param("id").trim().notEmpty()],
  handleValidation,
  (req, res) => {
    try {
      const employee = db
        .prepare(`
          SELECT
            e.id, e.name, e.email, e.department, e.created_at,
            COUNT(CASE WHEN a.status IN ('Present','Remote') THEN 1 END) AS present_days,
            COUNT(a.id) AS total_records
          FROM employees e
          LEFT JOIN attendance a ON a.employee_id = e.id
          WHERE e.id = ?
          GROUP BY e.id
        `)
        .get(req.params.id);

      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json({ data: employee });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch employee", message: err.message });
    }
  }
);

// ── POST /api/employees ─────────────────────────────────────────────────────
router.post("/", employeeValidators, handleValidation, (req, res) => {
  try {
    const { id, name, email, department } = req.body;
    const upperID = id.trim().toUpperCase();

    // Check duplicate ID
    const existingId = db.prepare("SELECT id FROM employees WHERE id = ?").get(upperID);
    if (existingId) {
      return res.status(409).json({
        error: "Duplicate employee",
        details: [{ field: "id", message: `Employee ID '${upperID}' already exists` }],
      });
    }

    // Check duplicate email
    const existingEmail = db.prepare("SELECT id FROM employees WHERE email = ?").get(email.toLowerCase());
    if (existingEmail) {
      return res.status(409).json({
        error: "Duplicate employee",
        details: [{ field: "email", message: "Email address is already registered" }],
      });
    }

    const stmt = db.prepare(
      "INSERT INTO employees (id, name, email, department) VALUES (?, ?, ?, ?)"
    );
    stmt.run(upperID, name.trim(), email.toLowerCase(), department.trim());

    const created = db.prepare("SELECT * FROM employees WHERE id = ?").get(upperID);
    res.status(201).json({ data: { ...created, present_days: 0, total_records: 0 }, message: "Employee created successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create employee", message: err.message });
  }
});

// ── DELETE /api/employees/:id ───────────────────────────────────────────────
router.delete(
  "/:id",
  [param("id").trim().notEmpty()],
  handleValidation,
  (req, res) => {
    try {
      const employee = db
        .prepare("SELECT id, name FROM employees WHERE id = ?")
        .get(req.params.id);

      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      // CASCADE handles attendance deletion via FK
      db.prepare("DELETE FROM employees WHERE id = ?").run(req.params.id);
      res.json({ message: `Employee '${employee.name}' deleted successfully` });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete employee", message: err.message });
    }
  }
);

// ── GET /api/employees/:id/attendance ──────────────────────────────────────
router.get("/:id/attendance", (req, res) => {
  try {
    const employee = db
      .prepare("SELECT id FROM employees WHERE id = ?")
      .get(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const { month, year } = req.query; // e.g. month=03&year=2025
    let sql = "SELECT * FROM attendance WHERE employee_id = ?";
    const params = [req.params.id];

    if (month && year) {
      sql += " AND strftime('%Y-%m', date) = ?";
      params.push(`${year}-${month.padStart(2, "0")}`);
    } else if (year) {
      sql += " AND strftime('%Y', date) = ?";
      params.push(year);
    }
    sql += " ORDER BY date DESC";

    const records = db.prepare(sql).all(...params);
    res.json({ data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch attendance", message: err.message });
  }
});

module.exports = router;
