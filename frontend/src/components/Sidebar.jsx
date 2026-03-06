import React from "react";

const NAV_ITEMS = [
  { id: "dashboard",  icon: "⬡",  label: "Dashboard" },
  { id: "employees",  icon: "👥", label: "Employees" },
  { id: "attendance", icon: "📋", label: "Attendance" },
];

export default function Sidebar({ currentPage, onNavigate, employeeCount, attendanceCount }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-mark">
          <div className="brand-icon">⬡</div>
          <div>
            <div className="brand-name">HRMS Lite</div>
            <div className="brand-tagline">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <p className="nav-section-label">Menu</p>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item${currentPage === item.id ? " active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-row">
            <span className="status-dot" />
            System Online
          </div>
          <div style={{ fontSize: 11.5, color: "var(--c-text4)", marginTop: 2 }}>
            {employeeCount ?? "—"} employees · {today}
          </div>
        </div>
      </div>
    </aside>
  );
}
