const express = require("express");
const db = require("../db");

const router = express.Router();

// ── GET /api/dashboard ──────────────────────────────────────────────────────
router.get("/", (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Employee counts
    const empStats = db.prepare(`
      SELECT
        COUNT(*) AS total,
        COUNT(DISTINCT department) AS departments
      FROM employees
    `).get();

    // Today's attendance
    const todayStats = db.prepare(`
      SELECT
        COUNT(CASE WHEN a.status IN ('Present','Remote') THEN 1 END) AS present,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) AS absent,
        COUNT(CASE WHEN a.status = 'Half Day' THEN 1 END) AS half_day,
        COUNT(CASE WHEN a.status = 'Remote' THEN 1 END) AS remote,
        COUNT(a.id) AS marked
      FROM employees e
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = ?
    `).get(today);

    // 7-day trend
    const trend = db.prepare(`
      SELECT
        date,
        COUNT(CASE WHEN status IN ('Present','Remote') THEN 1 END) AS present,
        COUNT(CASE WHEN status = 'Absent' THEN 1 END) AS absent,
        COUNT(*) AS total
      FROM attendance
      WHERE date >= date('now', '-6 days')
      GROUP BY date
      ORDER BY date ASC
    `).all();

    // Department breakdown
    const departments = db.prepare(`
      SELECT department, COUNT(*) AS count
      FROM employees
      GROUP BY department
      ORDER BY count DESC
    `).all();

    // Recent attendance (last 10)
    const recentAttendance = db.prepare(`
      SELECT a.*, e.name AS employee_name, e.department
      FROM attendance a
      JOIN employees e ON e.id = a.employee_id
      ORDER BY a.marked_at DESC
      LIMIT 10
    `).all();

    res.json({
      data: {
        employees: { ...empStats, not_marked_today: empStats.total - todayStats.marked },
        today: { ...todayStats, date: today },
        trend,
        departments,
        recent_activity: recentAttendance,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard data", message: err.message });
  }
});

module.exports = router;
