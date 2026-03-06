import React, { useState, useCallback } from "react";
import {
  Button, Avatar, StatusBadge,
  LoadingState, ErrorState, EmptyState, StatCard
} from "../components/ui";
import MarkAttendanceModal from "../components/MarkAttendanceModal";
import { attendanceApi, employeesApi } from "../utils/api";
import { useFetch } from "../hooks";

export default function AttendancePage({ toast }) {
  const today = new Date().toISOString().split("T")[0];

  const [dateFilter, setDateFilter] = useState(today);
  const [empFilter, setEmpFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [showMark, setShowMark] = useState(false);
  const [prefillEmpId, setPrefillEmpId] = useState("");

  const buildParams = useCallback(() => {
    const p = {};
    if (dateFilter && !monthFilter) p.date = dateFilter;
    if (empFilter) p.employee_id = empFilter;
    if (statusFilter) p.status = statusFilter;
    if (monthFilter) p.month = monthFilter;
    return p;
  }, [dateFilter, empFilter, statusFilter, monthFilter]);

  const { data, loading, error, refetch } = useFetch(
    () => attendanceApi.list(buildParams()),
    [dateFilter, empFilter, statusFilter, monthFilter]
  );

  const { data: empData } = useFetch(() => employeesApi.list(), []);
  const employees = empData?.data || [];

  const records = data?.data || [];

  // Today summary
  const { data: summaryData } = useFetch(() => attendanceApi.summary(today), [today]);
  const summary = summaryData?.data;

  const handleMarkSuccess = useCallback((res) => {
    toast.success(res.updated ? "Attendance updated" : "Attendance marked");
    refetch();
  }, [toast, refetch]);

  const openMark = (empId = "") => {
    setPrefillEmpId(empId);
    setShowMark(true);
  };

  const clearFilters = () => {
    setDateFilter(today);
    setEmpFilter("");
    setStatusFilter("");
    setMonthFilter("");
  };

  const hasFilter = empFilter || statusFilter || monthFilter || dateFilter !== today;

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Attendance</h1>
          <p className="page-sub">{records.length} record{records.length !== 1 ? "s" : ""} found</p>
        </div>
        <Button icon="📋" onClick={() => openMark()}>Mark Attendance</Button>
      </div>

      {/* Today summary */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <StatCard icon="✅" value={summary.present} label="Present" sub="incl. remote" color="green" />
          <StatCard icon="❌" value={summary.absent} label="Absent" sub="today" color="red" />
          <StatCard icon="◑" value={summary.half_day} label="Half Day" sub="today" color="amber" />
          <StatCard icon="⏳" value={summary.not_marked} label="Not Marked" sub="pending" color="blue" />
        </div>
      )}

      {/* Filters */}
      <div className="table-container">
        <div className="table-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
          <div className="table-toolbar-left" style={{ flexWrap: "wrap" }}>
            {/* Date or Month */}
            <div className="flex-row" style={{ gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--c-text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                Date
              </label>
              <input
                type="date"
                className="filter-select"
                value={monthFilter ? "" : dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setMonthFilter(""); }}
                disabled={!!monthFilter}
              />
            </div>

            <span style={{ color: "var(--c-text4)", fontSize: 12 }}>or</span>

            <div className="flex-row" style={{ gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--c-text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                Month
              </label>
              <input
                type="month"
                className="filter-select"
                value={monthFilter}
                onChange={(e) => { setMonthFilter(e.target.value); if (e.target.value) setDateFilter(""); }}
              />
            </div>

            <select className="filter-select" value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
              ))}
            </select>

            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {["Present","Absent","Half Day","Remote"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>
            )}
          </div>
          <span className="table-count">{records.length} records</span>
        </div>

        {loading ? (
          <LoadingState text="Loading attendance…" />
        ) : records.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No records found"
            message={hasFilter ? "No attendance records match the current filters" : "Start marking attendance for employees"}
            action={<Button onClick={() => openMark()}>Mark Attendance</Button>}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Department</th>
                <th>Marked At</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <div className="emp-cell">
                      <Avatar name={rec.employee_name} size={32} />
                      <div>
                        <p className="emp-info-name">{rec.employee_name}</p>
                        <span className="mono-id">{rec.employee_id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--c-text2)" }}>
                      {new Date(rec.date + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric",
                      })}
                    </span>
                  </td>
                  <td><StatusBadge status={rec.status} /></td>
                  <td style={{ color: "var(--c-text3)", fontSize: 13 }}>{rec.department}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--c-text4)" }}>
                    {rec.marked_at
                      ? new Date(rec.marked_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                      : "—"
                    }
                  </td>
                  <td>
                    <div className="flex-row" style={{ justifyContent: "flex-end" }}>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => openMark(rec.employee_id)}
                      >
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showMark && (
        <MarkAttendanceModal
          onClose={() => setShowMark(false)}
          onSuccess={handleMarkSuccess}
          employees={employees}
          prefillEmployeeId={prefillEmpId}
        />
      )}
    </div>
  );
}
