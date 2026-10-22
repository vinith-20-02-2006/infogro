import React, { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../../services/AuthContext";

function AccessDenied({ moduleName }) {
  const { user } = useContext(AuthContext);

  return (
    <div className="container-xxl flex-grow-1 container-p-y d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
      <div className="card shadow-sm border-0 text-center p-4" style={{ maxWidth: "520px" }}>
        <div className="card-body">
          <div className="mb-3">
            <span
              className="badge rounded-pill bg-label-danger p-3"
              style={{ fontSize: "2rem" }}
            >
              <i className="bx bx-lock-alt"></i>
            </span>
          </div>
          <h4 className="fw-bold mb-2 text-dark">Access Restricted</h4>
          <p className="text-muted small mb-4">
            Your account ({user?.username} &bull; Role: <strong>{user?.role}</strong>) does not have permission to view{" "}
            {moduleName ? <strong>{moduleName}</strong> : "this module"}.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              <i className="bx bx-home-circle me-1"></i> Go to Dashboard
            </Link>
            <Link to="/profile" className="btn btn-outline-secondary btn-sm">
              <i className="bx bx-user me-1"></i> My Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;
