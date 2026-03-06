const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const employeesRouter = require("./routes/employees");
const attendanceRouter = require("./routes/attendance");
const dashboardRouter = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// ── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "HRMS Lite API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/employees", employeesRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/dashboard", dashboardRouter);

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 HRMS Lite API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
