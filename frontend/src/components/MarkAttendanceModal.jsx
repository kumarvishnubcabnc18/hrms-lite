import React, { useState, useEffect } from "react";
import { Modal, FormField, Select, Button, StatusSelector } from "./ui";
import { attendanceApi, ApiError } from "../utils/api";

export default function MarkAttendanceModal({ onClose, onSuccess, employees, prefillEmployeeId = "" }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    employee_id: prefillEmployeeId,
    date: today,
    status: "Present",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [existingRecord, setExistingRecord] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // Check if record already exists for this employee+date
  useEffect(() => {
    if (!form.employee_id || !form.date) { setExistingRecord(null); return; }
    let cancelled = false;
    setCheckingExisting(true);
    attendanceApi.list({ employee_id: form.employee_id, date: form.date })
      .then((res) => {
        if (cancelled) return;
        const found = res.data?.[0] || null;
        setExistingRecord(found);
        if (found) setForm((f) => ({ ...f, status: found.status }));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCheckingExisting(false); });
    return () => { cancelled = true; };
  }, [form.employee_id, form.date]);

  const set = (key) => (eOrVal) => {
    const val = eOrVal?.target ? eOrVal.target.value : eOrVal;
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setApiError(null);
  };

  const submit = async () => {
    const errs = {};
    if (!form.employee_id) errs.employee_id = "Please select an employee";
    if (!form.date) errs.date = "Date is required";
    if (!form.status) errs.status = "Status is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError(null);
    try {
      const res = await attendanceApi.mark(form);
      onSuccess(res);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const fieldErrs = {};
        err.details.forEach(({ field, message }) => { fieldErrs[field] = message; });
        setErrors(fieldErrs);
      } else {
        setApiError(err.message || "Failed to mark attendance");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedEmp = employees.find((e) => e.id === form.employee_id);

  return (
    <Modal
      title={existingRecord ? "Update Attendance" : "Mark Attendance"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={submit} loading={loading}>
            {existingRecord ? "Update" : "Mark"} Attendance
          </Button>
        </>
      }
    >
      {apiError && (
        <div className="error-banner" style={{ marginBottom: 16 }}>
          <span>⚠</span> {apiError}
        </div>
      )}

      <FormField label="Employee" error={errors.employee_id} required>
        <Select value={form.employee_id} onChange={set("employee_id")} error={errors.employee_id}>
          <option value="">Select employee…</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.id}) — {emp.department}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Date" error={errors.date} required>
        <input
          type="date"
          className={`field-input${errors.date ? " has-error" : ""}`}
          value={form.date}
          max={today}
          onChange={set("date")}
        />
      </FormField>

      {existingRecord && !checkingExisting && (
        <div style={{
          padding: "10px 14px",
          background: "var(--c-accent-bg)",
          border: "1px solid var(--c-accent-border)",
          borderRadius: "var(--r-md)",
          fontSize: 13,
          color: "var(--c-accent)",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span>ℹ</span>
          Record exists for {selectedEmp?.name} on {form.date} ({existingRecord.status}) — updating
        </div>
      )}

      <FormField label="Attendance Status" error={errors.status} required>
        <StatusSelector value={form.status} onChange={set("status")} />
      </FormField>
    </Modal>
  );
}
