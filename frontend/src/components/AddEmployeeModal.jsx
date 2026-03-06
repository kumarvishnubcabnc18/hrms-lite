import React, { useState } from "react";
import { Modal, FormField, Input, Select, Button } from "./ui";
import { DEPARTMENTS } from "./ui";
import { employeesApi, ApiError } from "../utils/api";

function validate(form) {
  const errors = {};
  if (!form.id.trim()) errors.id = "Employee ID is required";
  else if (!/^[A-Z0-9_-]{2,20}$/.test(form.id.trim().toUpperCase()))
    errors.id = "Use 2-20 uppercase letters, numbers, underscores or hyphens";
  if (!form.name.trim()) errors.name = "Full name is required";
  else if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
  if (!form.email.trim()) errors.email = "Email address is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Please enter a valid email address";
  if (!form.department) errors.department = "Department is required";
  return errors;
}

export default function AddEmployeeModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ id: "", name: "", email: "", department: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const set = (key) => (e) => {
    const val = key === "id" ? e.target.value.toUpperCase() : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((err) => ({ ...err, [key]: "" }));
    setApiError(null);
  };

  const submit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError(null);
    try {
      const res = await employeesApi.create({
        id: form.id.trim().toUpperCase(),
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department,
      });
      onSuccess(res.data);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const fieldErrs = {};
        err.details.forEach(({ field, message }) => { fieldErrs[field] = message; });
        setErrors(fieldErrs);
      } else {
        setApiError(err.message || "Failed to add employee");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add New Employee"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={submit} loading={loading}>Create Employee</Button>
        </>
      }
    >
      {apiError && (
        <div className="error-banner" style={{ marginBottom: 16 }}>
          <span>⚠</span> {apiError}
        </div>
      )}

      <div className="grid-2">
        <FormField label="Employee ID" error={errors.id} required
          hint="e.g. EMP001 — must be unique">
          <Input
            value={form.id}
            onChange={set("id")}
            placeholder="EMP001"
            error={errors.id}
            maxLength={20}
          />
        </FormField>
        <FormField label="Department" error={errors.department} required>
          <Select value={form.department} onChange={set("department")} error={errors.department}>
            <option value="">Select department…</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </FormField>
      </div>

      <FormField label="Full Name" error={errors.name} required>
        <Input
          value={form.name}
          onChange={set("name")}
          placeholder="Jane Doe"
          error={errors.name}
          maxLength={100}
        />
      </FormField>

      <FormField label="Email Address" error={errors.email} required>
        <Input
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="jane@company.com"
          error={errors.email}
        />
      </FormField>
    </Modal>
  );
}
