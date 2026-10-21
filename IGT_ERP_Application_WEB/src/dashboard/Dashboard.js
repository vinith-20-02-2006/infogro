import React, { useContext } from "react";
import AuthContext from "../services/AuthContext";

function Dashboard() {
  const { user } = useContext(AuthContext);

  const getDashboardHeading = () => {
    if (!user || !user.role) return "Dashboard";
    const role = (user.role || "").trim().toLowerCase();
    if (role === "admin") return "Admin Dashboard";
    if (role === "technical") return "Technical Dashboard";
    if (role.includes("sales") || role.includes("staff")) return "Sales / Staff Dashboard";
    if (role === "student") return "Student Dashboard";
    return `${user.role} Dashboard`;
  };

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        <h4 className="fw-semibold py-3 mb-4">{getDashboardHeading()}</h4>
      </div>
    </div>
  );
}

export default Dashboard;