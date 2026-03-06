import React, { useState, useCallback } from "react";
import {
  Button, Avatar, StatusBadge, DeptBadge,
  LoadingState, ErrorState, EmptyState, ConfirmDialog
} from "../components/ui";
import AddEmployeeModal from "../components/AddEmployeeModal";
import MarkAttendanceModal from "../components/MarkAttendanceModal";
import EmployeeDetailDrawer from "../components/EmployeeDetailDrawer";
import { employeesApi } from "../utils/api";
import { useFetch, useAsync } from "../hooks";

export default function EmployeesPage({ toast }) {
  const {
    data, loading, error, refetch,
  } = useFetch(() => employeesApi.list(), []);

  const { execute: execDelete } = useAsync();

  const [showAdd, setShowAdd] = useState(false);
  const [markEmpId, setMarkEmpId] = useState(null);
  const [detailEmp, setDetailEmp] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const employees = data?.data || [];
  const departments = [...new Set(employees.map((e) => e.department))].sort();

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      (!q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)) &&
      (!deptFilter || e.department === deptFilter)
    );
  });

  const handleAddSuccess = useCallback((emp) => {
    toast.success(`${emp.name} added successfully`);
    refetch();
  }, [toast, refetch]);

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    const { error: err } = await execDelete(() => employeesApi.delete(confirmDel.id));
    setDeleting(false);
    setConfirmDel(null);
    if (err) { toast.error(err.message || "Delete failed"); return; }
    toast.info(`${confirmDel.name} removed`);
    setDetailEmp(null);
    refetch();
  };

  const handleMarkSuccess = useCallback(() => {
    toast.success("Attendance marked successfully");
    refetch();
  }, [toast, refetch]);

  if (loading) return <LoadingState text="Loading employees…" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Employees</h1>
          <p className="page-sub">{filtered.length} of {employees.length} employees</p>
        </div>
        <Button icon="+" onClick={() => setShowAdd(true)}>Add Employee</Button>
      </div>

      {/* Toolbar */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="field-input search-input"
                placeholder="Search by name, ID or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {(search || deptFilter) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setSearch(""); setDeptFilter(""); }}
              >
                Clear
              </button>
            )}
          </div>
          <span className="table-count">{filtered.length} results</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="👤"
            title={search || deptFilter ? "No matches found" : "No employees yet"}
            message={
              search || deptFilter
                ? "Try adjusting your search or filters"
                : "Add your first employee to get started"
            }
            action={
              !search && !deptFilter
                ? <Button onClick={() => setShowAdd(true)}>Add First Employee</Button>
                : undefined
            }
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th>Email</th>
                <th>Department</th>
                <th>Present Days</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className="clickable"
                  onClick={() => setDetailEmp(emp)}
                >
                  <td>
                    <div className="emp-cell">
                      <Avatar name={emp.name} size={36} />
                      <div>
                        <p className="emp-info-name">{emp.name}</p>
                        <p className="emp-info-sub">
                          Joined {new Date(emp.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td><span className="mono-id">{emp.id}</span></td>
                  <td style={{ color: "var(--c-text3)", fontSize: 13 }}>{emp.email}</td>
                  <td><DeptBadge dept={emp.department} /></td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--c-green)" }}>
                      {emp.present_days}
                    </span>
                    <span style={{ fontSize: 11.5, color: "var(--c-text4)", marginLeft: 4 }}>days</span>
                  </td>
                  <td>
                    <div
                      className="flex-row"
                      style={{ justifyContent: "flex-end", gap: 6 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => setMarkEmpId(emp.id)}
                        title="Mark Attendance"
                      >
                        📋
                      </Button>
                      <Button
                        variant="danger" size="sm"
                        onClick={() => setConfirmDel(emp)}
                        title="Delete Employee"
                      >
                        🗑
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddEmployeeModal onClose={() => setShowAdd(false)} onSuccess={handleAddSuccess} />
      )}
      {markEmpId !== null && (
        <MarkAttendanceModal
          onClose={() => setMarkEmpId(null)}
          onSuccess={handleMarkSuccess}
          employees={employees}
          prefillEmployeeId={markEmpId}
        />
      )}
      {confirmDel && (
        <ConfirmDialog
          title="Delete Employee"
          message={`Delete ${confirmDel.name} (${confirmDel.id})? All their attendance records will also be permanently removed.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
          loading={deleting}
        />
      )}
      {detailEmp && (
        <EmployeeDetailDrawer
          employee={detailEmp}
          onClose={() => setDetailEmp(null)}
          onMarkAttendance={(id) => { setDetailEmp(null); setMarkEmpId(id); }}
          onDelete={(emp) => { setDetailEmp(null); setConfirmDel(emp); }}
        />
      )}
    </div>
  );
}
