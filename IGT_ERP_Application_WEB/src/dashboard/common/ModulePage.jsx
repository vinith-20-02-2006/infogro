import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthContext from "../../services/AuthContext";

function ModulePage({ title, category, menuKey, icon, description }) {
  const { user, hasPermission } = useContext(AuthContext);
  const location = useLocation();

  const canView = hasPermission(menuKey, "view");
  const canAdd = hasPermission(menuKey, "add");
  const canEdit = hasPermission(menuKey, "edit");
  const canDelete = hasPermission(menuKey, "delete");

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Breadcrumb */}
      <h4 className="fw-bold py-3 mb-4">
        <span className="text-muted fw-light">
          <Link to="/dashboard" className="text-muted">Home</Link> / {category || "Module"} /
        </span>{" "}
        {title}
      </h4>

      {/* Header Card */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center">
              <div
                className="rounded p-3 me-3 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: "rgba(105, 108, 255, 0.12)", color: "#696cff" }}
              >
                <i className={icon ? `${icon} fs-2` : "bx bx-layer fs-2"}></i>
              </div>
              <div>
                <h5 className="mb-1 fw-bold text-dark">{title}</h5>
                <p className="text-muted mb-0 small">
                  {description || `Manage and view ${title.toLowerCase()} records in the ERP application.`}
                </p>
              </div>
            </div>

            {/* Permission Badges */}
            <div className="d-flex align-items-center flex-wrap gap-2">
              <span className={`badge ${canView ? "bg-label-success" : "bg-label-secondary"}`}>
                <i className="bx bx-show me-1"></i> View: {canView ? "Allowed" : "Restricted"}
              </span>
              <span className={`badge ${canAdd ? "bg-label-primary" : "bg-label-secondary"}`}>
                <i className="bx bx-plus me-1"></i> Add: {canAdd ? "Allowed" : "Restricted"}
              </span>
              <span className={`badge ${canEdit ? "bg-label-warning" : "bg-label-secondary"}`}>
                <i className="bx bx-edit-alt me-1"></i> Edit: {canEdit ? "Allowed" : "Restricted"}
              </span>
              <span className={`badge ${canDelete ? "bg-label-danger" : "bg-label-secondary"}`}>
                <i className="bx bx-trash me-1"></i> Delete: {canDelete ? "Allowed" : "Restricted"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="card shadow-sm border-0">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom py-3">
          <h5 className="card-title mb-0 fw-semibold text-dark">
            {title} Overview
          </h5>
          <div className="d-flex align-items-center gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder={`Search ${title.toLowerCase()}...`}
              style={{ width: "200px" }}
            />
            {canAdd && (
              <button type="button" className="btn btn-primary btn-sm">
                <i className="bx bx-plus me-1"></i> Add Record
              </button>
            )}
          </div>
        </div>

        <div className="card-body py-5 text-center">
          <div className="mb-3">
            <i
              className={icon ? `${icon} text-primary` : "bx bx-folder text-primary"}
              style={{ fontSize: "3rem", opacity: 0.8 }}
            ></i>
          </div>
          <h6 className="fw-bold mb-1 text-dark">{title} Module Active</h6>
          <p className="text-muted small mx-auto mb-4" style={{ maxWidth: "480px" }}>
            You are viewing the <strong>{title}</strong> interface with role <strong>{user?.role || "Staff"}</strong>.
            Permissions for this module are dynamically managed from the Users & Roles permission matrix.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
              <i className="bx bx-home-circle me-1"></i> Return to Dashboard
            </Link>
            {user?.role === "Admin" && (
              <Link to="/settings/users" className="btn btn-outline-primary btn-sm">
                <i className="bx bx-shield-quarter me-1"></i> Configure Permissions
              </Link>
            )}
          </div>
        </div>

        <div className="card-footer bg-light border-top text-muted small py-2 d-flex justify-content-between align-items-center">
          <span>Current Path: <code>{location.pathname}</code></span>
          <span>Access Key: <code>{menuKey}</code></span>
        </div>
      </div>
    </div>
  );
}

export default ModulePage;
