import React, { useEffect, useCallback } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899",
  "#14b8a6","#f97316","#06b6d4","#84cc16","#6366f1",
];

export const STATUS_CONFIG = {
  Present:    { label: "Present",  icon: "✓", cls: "badge-present",  dotColor: "var(--c-green)" },
  Absent:     { label: "Absent",   icon: "✗", cls: "badge-absent",   dotColor: "var(--c-red)" },
  "Half Day": { label: "Half Day", icon: "◑", cls: "badge-half-day", dotColor: "var(--c-amber)" },
  Remote:     { label: "Remote",   icon: "⌂", cls: "badge-remote",   dotColor: "var(--c-blue)" },
};

export const STATUSES = ["Present", "Absent", "Half Day", "Remote"];
export const DEPARTMENTS = [
  "Engineering","Product","Design","Marketing","Sales",
  "Finance","HR","Operations","Legal","Customer Success",
];

// ── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name = "", size = 36 }) {
  const initials = name.split(" ").map(n => n[0] || "").join("").slice(0, 2).toUpperCase() || "?";
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div
      className="avatar"
      style={{
        width: size, height: size,
        background: color,
        fontSize: Math.round(size * 0.35),
      }}
    >
      {initials}
    </div>
  );
}

// ── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="badge" style={{ background: "var(--c-raised)", color: "var(--c-text3)" }}>{status}</span>;
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className="badge-dot" style={{ background: cfg.dotColor }} />
      {cfg.label}
    </span>
  );
}

// ── DeptBadge ────────────────────────────────────────────────────────────────
export function DeptBadge({ dept }) {
  return <span className="badge badge-dept">{dept}</span>;
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = "primary", size, icon, loading, className = "", ...props }) {
  const cls = [
    "btn",
    `btn-${variant}`,
    size ? `btn-${size}` : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : icon}
      {children}
    </button>
  );
}

// ── FormField ────────────────────────────────────────────────────────────────
export function FormField({ label, error, required, hint, children }) {
  return (
    <div className="form-field">
      {label && (
        <label className="field-label">
          {label}
          {required && <span className="req"> *</span>}
        </label>
      )}
      {children}
      {error && <p className="field-error">⚠ {error}</p>}
      {!error && hint && <p style={{ fontSize: 11.5, color: "var(--c-text4)", marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef(function Input({ error, className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`field-input ${error ? "has-error" : ""} ${className}`}
      {...props}
    />
  );
});

// ── Select ───────────────────────────────────────────────────────────────────
export const Select = React.forwardRef(function Select({ error, children, className = "", ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`field-input ${error ? "has-error" : ""} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

// ── StatusSelector ───────────────────────────────────────────────────────────
export function StatusSelector({ value, onChange }) {
  const slugMap = {
    Present: "present", Absent: "absent",
    "Half Day": "half-day", Remote: "remote",
  };
  return (
    <div className="status-grid">
      {STATUSES.map((s) => {
        const cfg = STATUS_CONFIG[s];
        const slug = slugMap[s];
        const isSelected = value === s;
        return (
          <div
            key={s}
            className={`status-option${isSelected ? ` selected-${slug}` : ""}`}
            onClick={() => onChange(s)}
          >
            <span>{cfg.icon}</span>
            {s}
          </div>
        );
      })}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer, size }) {
  const handleEsc = useCallback((e) => { if (e.key === "Escape") onClose?.(); }, [onClose]);
  useEffect(() => {
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [handleEsc]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className={`modal${size === "sm" ? " modal-sm" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── ConfirmDialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <div>
        <div className="confirm-icon">🗑️</div>
        <p style={{ color: "var(--c-text2)", fontSize: 14, lineHeight: 1.65 }}>{message}</p>
      </div>
      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0 }}>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
      </div>
    </Modal>
  );
}

// ── Drawer ───────────────────────────────────────────────────────────────────
export function Drawer({ children, onClose }) {
  const handleEsc = useCallback((e) => { if (e.key === "Escape") onClose?.(); }, [onClose]);
  useEffect(() => {
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">{children}</div>
    </>
  );
}

// ── Toast Stack ──────────────────────────────────────────────────────────────
export function ToastStack({ toasts, onRemove }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => onRemove(t.id)}
        >
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "⚠" : t.type === "warning" ? "⚡" : "ℹ"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── LoadingState ─────────────────────────────────────────────────────────────
export function LoadingState({ text = "Loading..." }) {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      <p className="loading-text">{text}</p>
    </div>
  );
}

// ── ErrorState ───────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">⚠️</div>
      <p className="empty-title">Something went wrong</p>
      <p className="empty-msg">{message || "Failed to load data. Please try again."}</p>
      {onRetry && <Button variant="ghost" onClick={onRetry}>Try Again</Button>}
    </div>
  );
}

// ── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      {title && <p className="empty-title">{title}</p>}
      {message && <p className="empty-msg">{message}</p>}
      {action}
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, value, label, sub, color = "accent" }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value ?? "—"}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
