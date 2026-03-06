import React, { useState, useCallback } from "react";
import "./styles/globals.css";
import Sidebar from "./components/Sidebar";
import { ToastStack, Button } from "./components/ui";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import AttendancePage from "./pages/AttendancePage";
import MarkAttendanceModal from "./components/MarkAttendanceModal";
import { useToast, useFetch } from "./hooks";
import { employeesApi } from "./utils/api";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  employees: "Employees",
  attendance: "Attendance",
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [showQuickMark, setShowQuickMark] = useState(false);
  const { toasts, toast, remove } = useToast();

  const { data: empData, refetch: refetchEmps } = useFetch(() => employeesApi.list(), []);
  const employees = empData?.data || [];

  const handleQuickMarkSuccess = useCallback((res) => {
    toast.success(res.updated ? "Attendance updated" : "Attendance marked successfully");
    refetchEmps();
  }, [toast, refetchEmps]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        employeeCount={employees.length}
      />

      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-title">{PAGE_TITLES[page]}</h2>
          </div>
          <div className="topbar-right">
            <span className="date-badge">{today}</span>
            <Button size="sm" onClick={() => setShowQuickMark(true)}>
              📋 Quick Mark
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="page-body">
          {page === "dashboard" && (
            <DashboardPage onNavigate={setPage} />
          )}
          {page === "employees" && (
            <EmployeesPage toast={toast} />
          )}
          {page === "attendance" && (
            <AttendancePage toast={toast} />
          )}
        </main>
      </div>

      {/* Quick mark modal */}
      {showQuickMark && (
        <MarkAttendanceModal
          onClose={() => setShowQuickMark(false)}
          onSuccess={handleQuickMarkSuccess}
          employees={employees}
        />
      )}

      <ToastStack toasts={toasts} onRemove={remove} />
    </div>
  );
}
