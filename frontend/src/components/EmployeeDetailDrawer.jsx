import React, { useState, useEffect } from "react";
import { Drawer, Avatar, StatusBadge, DeptBadge, Button, LoadingState, EmptyState } from "./ui";
import { employeesApi } from "../utils/api";

function AttendanceSummaryBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: "var(--c-text3)" }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--c-text2)" }}>
          {count} <span style={{ color: "var(--c-text4)" }}>({pct}%)</span>
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function EmployeeDetailDrawer({ employee, onClose, onMarkAttendance, onDelete }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState("");

  useEffect(() => {
    if (!employee) return;
    setLoading(true);
    const params = {};
    if (monthFilter) {
      const [year, month] = monthFilter.split("-");
      params.year = year; params.month = month;
    }
    employeesApi.getAttendance(employee.id, params)
      .then((res) => setAttendance(res.data || []))
      .catch(() => setAttendance([]))
      .finally(() => setLoading(false));
  }, [employee, monthFilter]);

  if (!employee) return null;

  const present = attendance.filter((a) => a.status === "Present").length;
  const remote  = attendance.filter((a) => a.status === "Remote").length;
  const absent  = attendance.filter((a) => a.status === "Absent").length;
  const halfDay = attendance.filter((a) => a.status === "Half Day").length;
  const total   = attendance.length;
  const attendanceRate = total > 0 ? Math.round(((present + remote) / total) * 100) : 0;

  return (
    <Drawer onClose={onClose}>
      {/* Header */}
      <div className="drawer-header">
        <button
          onClick={onClose}
          style={{
            background: "transparent", border: "1px solid var(--c-border)",
            borderRadius: "var(--r-md)", color: "var(--c-text3)",
            width: 34, height: 34, cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >←</button>
        <Avatar name={employee.name} size={46} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)", marginBottom: 3 }}>
            {employee.name}
          </h3>
          <div className="flex-row" style={{ gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--c-text4)" }}>
              {employee.id}
            </span>
            <DeptBadge dept={employee.department} />
          </div>
        </div>
        <div className="flex-row">
          <Button variant="ghost" size="sm" onClick={() => onMarkAttendance(employee.id)}>
            + Attendance
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(employee)}>
            Delete
          </Button>
        </div>
      </div>

      <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--c-border)" }}>
        <div className="grid-2" style={{ marginBottom: 14 }}>
          {[
            { label: "Email", value: employee.email },
            { label: "Joined", value: new Date(employee.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--c-text4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 13, color: "var(--c-text2)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Attendance Rate */}
        <div style={{
          background: "var(--c-raised)", borderRadius: "var(--r-md)",
          padding: "14px 16px", border: "1px solid var(--c-border)",
        }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--c-text3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Attendance Rate ({total} records)
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: attendanceRate >= 80 ? "var(--c-green)" : attendanceRate >= 60 ? "var(--c-amber)" : "var(--c-red)" }}>
              {attendanceRate}%
            </span>
          </div>
          <div className="flex-col" style={{ gap: 8 }}>
            <AttendanceSummaryBar label="Present" count={present} total={total} color="var(--c-green)" />
            <AttendanceSummaryBar label="Remote" count={remote} total={total} color="var(--c-blue)" />
            <AttendanceSummaryBar label="Half Day" count={halfDay} total={total} color="var(--c-amber)" />
            <AttendanceSummaryBar label="Absent" count={absent} total={total} color="var(--c-red)" />
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="drawer-body">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>Attendance History</h4>
          <input
            type="month"
            className="filter-select"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
        </div>

        {loading ? (
          <LoadingState text="Loading records…" />
        ) : attendance.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No records found"
            message={monthFilter ? "No attendance for this month" : "Attendance hasn't been marked yet"}
          />
        ) : (
          <div className="flex-col" style={{ gap: 6 }}>
            {attendance.map((rec) => (
              <div
                key={rec.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--c-raised)",
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--r-md)",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--c-text2)" }}>
                  {new Date(rec.date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "short", year: "numeric", month: "short", day: "numeric",
                  })}
                </span>
                <StatusBadge status={rec.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
