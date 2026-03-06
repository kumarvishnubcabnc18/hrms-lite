import React from "react";
import { StatCard, LoadingState, ErrorState, StatusBadge, Avatar } from "../components/ui";
import { dashboardApi } from "../utils/api";
import { useFetch } from "../hooks";

function MiniChart({ trend }) {
  if (!trend?.length) return null;
  const max = Math.max(...trend.map((d) => d.present + d.absent), 1);

  return (
    <div className="mini-chart">
      {trend.map((d, i) => {
        const pHeight = Math.round(((d.present) / max) * 70);
        const aHeight = Math.round(((d.absent) / max) * 70);
        const label = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
        return (
          <div key={i} className="mini-bar-wrap">
            <div style={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "flex-end", height: 70 }}>
              {d.absent > 0 && (
                <div className="mini-bar" style={{ height: aHeight, background: "rgba(248,113,113,0.35)", border: "1px solid rgba(248,113,113,0.5)" }} />
              )}
              {d.present > 0 && (
                <div className="mini-bar" style={{ height: pHeight, background: "var(--c-green)" }} />
              )}
            </div>
            <span className="mini-bar-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage({ onNavigate }) {
  const { data, loading, error, refetch } = useFetch(() => dashboardApi.get());
  const d = data?.data;

  if (loading) return <LoadingState text="Loading dashboard…" />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-sub">{today}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon="👥" value={d?.employees?.total ?? 0} label="Total Employees"
          sub={`${d?.employees?.departments ?? 0} departments`} color="accent" />
        <StatCard icon="✅" value={d?.today?.present ?? 0} label="Present Today"
          sub={`of ${d?.employees?.total ?? 0} employees`} color="green" />
        <StatCard icon="❌" value={d?.today?.absent ?? 0} label="Absent Today"
          sub="marked absent" color="red" />
        <StatCard icon="⏳" value={d?.employees?.not_marked_today ?? 0} label="Not Marked"
          sub="pending today" color="amber" />
      </div>

      {/* Row 2 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* 7-day trend */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">7-Day Attendance Trend</h3>
            <div className="flex-row" style={{ gap: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--c-green)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--c-green)", display: "inline-block" }} />
                Present
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--c-red)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(248,113,113,0.35)", border: "1px solid var(--c-red)", display: "inline-block" }} />
                Absent
              </span>
            </div>
          </div>
          <div className="panel-body">
            {d?.trend?.length ? (
              <MiniChart trend={d.trend} />
            ) : (
              <p style={{ color: "var(--c-text4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                No attendance data yet
              </p>
            )}
          </div>
        </div>

        {/* Department breakdown */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Departments</h3>
          </div>
          <div className="panel-body">
            {d?.departments?.length ? (
              <div className="flex-col">
                {d.departments.map((dept) => {
                  const pct = Math.round((dept.count / (d?.employees?.total || 1)) * 100);
                  return (
                    <div key={dept.department}>
                      <div className="flex-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "var(--c-text2)" }}>{dept.department}</span>
                        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--c-text3)" }}>
                          {dept.count} · {pct}%
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--c-accent), var(--c-accent2))" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "var(--c-text4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                No employees yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Today's summary */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">
            Today's Status —{" "}
            <span style={{ color: "var(--c-text3)", fontWeight: 400, fontSize: 13 }}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </h3>
          <button
            onClick={() => onNavigate("attendance")}
            style={{ fontSize: 12, color: "var(--c-accent)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            View all →
          </button>
        </div>
        <div className="panel-body">
          {d?.recent_activity?.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {d.recent_activity.slice(0, 8).map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px",
                    background: "var(--c-raised)", border: "1px solid var(--c-border)",
                    borderRadius: "var(--r-md)",
                  }}
                >
                  <Avatar name={rec.employee_name} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {rec.employee_name}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--c-text4)" }}>{rec.department}</p>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--c-text4)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
              No attendance marked today
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
