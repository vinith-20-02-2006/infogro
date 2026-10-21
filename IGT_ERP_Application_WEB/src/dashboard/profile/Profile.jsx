import React, { useContext, useEffect } from "react";
import AuthContext from "../../services/AuthContext";

function Profile() {
  const { user, refreshUserProfile } = useContext(AuthContext);

  useEffect(() => {
    if (refreshUserProfile) {
      refreshUserProfile();
    }
  }, [refreshUserProfile]);

  const getRoleBadgeClass = () => {
    const role = (user?.role || "").toLowerCase();
    if (role === "admin") return "bg-label-primary";
    if (role === "technical") return "bg-label-info";
    if (role.includes("sales") || role.includes("staff")) return "bg-label-warning";
    if (role === "student") return "bg-label-success";
    return "bg-label-secondary";
  };

  const getMenuDisplayName = (menuKey) => {
    switch (menuKey) {
      case "dashboard":
        return "Dashboard";
      case "course":
        return "Course";
      case "certificate":
        return "Certificates";
      case "user_management":
        return "User Management";
      case "profile":
        return "Profile";
      default:
        return menuKey;
    }
  };

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        <h4 className="fw-semibold py-3 mb-4">
          <span className="text-muted fw-light">Account /</span> Profile
        </h4>

        <div className="row">
          <div className="col-md-12">
            <div className="card mb-4">
              <h5 className="card-header">Profile Details</h5>

              <div className="card-body">
                <div className="d-flex align-items-start align-items-sm-center gap-4">
                  <img
                    src="./1.png"
                    alt="user-avatar"
                    className="d-block rounded"
                    height="100"
                    width="100"
                    id="uploadedAvatar"
                  />
                  <div className="button-wrapper">
                    <h5 className="mb-1">{user?.full_name || user?.username || "User"}</h5>
                    <p className="text-muted mb-0">
                      <span className={`badge ${getRoleBadgeClass()} me-1`}>
                        {user?.role || "User"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <hr className="my-0" />

              <div className="card-body">
                <div className="row">
                  <div className="mb-3 col-md-6">
                    <label className="form-label">Username</label>
                    <input
                      className="form-control"
                      type="text"
                      value={user?.username || ""}
                      readOnly
                    />
                  </div>

                  <div className="mb-3 col-md-6">
                    <label className="form-label">E-mail</label>
                    <input
                      className="form-control"
                      type="text"
                      value={user?.email || "Not specified"}
                      readOnly
                    />
                  </div>

                  <div className="mb-3 col-md-6">
                    <label className="form-label">Role</label>
                    <input
                      className="form-control"
                      type="text"
                      value={user?.role || "User"}
                      readOnly
                    />
                  </div>

                  <div className="mb-3 col-md-6">
                    <label className="form-label">Status</label>
                    <div>
                      <span className="badge bg-label-success">Active</span>
                    </div>
                  </div>

                  <div className="col-12 mt-2">
                    <label className="form-label d-block">Authorized Menu Access</label>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {Array.isArray(user?.permissions) && user.permissions.length > 0 ? (
                        user.permissions.map((perm) => (
                          <span key={perm} className="badge bg-label-primary">
                            <i className="bx bx-check me-1"></i>
                            {getMenuDisplayName(perm)}
                          </span>
                        ))
                      ) : (
                        <span className="badge bg-label-secondary">Profile Only</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
