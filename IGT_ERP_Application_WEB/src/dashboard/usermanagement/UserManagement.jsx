import React, { useState, useEffect, useContext, useCallback } from "react";
import AuthContext from "../../services/AuthContext";
import "./usermanagement.css";

const AVAILABLE_MENUS = [
  { key: "dashboard", label: "Dashboard", desc: "Access the role-based dashboard" },
  { key: "course", label: "Course", desc: "View and manage course details" },
  { key: "certificate", label: "Certificates", desc: "View, generate and issue student certificates" },
  { key: "user_management", label: "User Management", desc: "Create users and configure menu permissions" },
  { key: "profile", label: "Profile", desc: "Always visible by default" },
];

function UserManagement() {
  const { user, API_URL, refreshUserProfile } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    role: "Technical",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Permission Modal State
  const [showPermModal, setShowPermModal] = useState(false);
  const [permSelectedUser, setPermSelectedUser] = useState(null);
  const [permSubmitting, setPermSubmitting] = useState(false);
  const [permMsg, setPermMsg] = useState("");

  const getAuthHeader = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/adm/list_users`, {
        headers: {
          ...getAuthHeader(),
        },
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenPermModal = (targetUser) => {
    setPermSelectedUser({
      ...targetUser,
      permissions: Array.isArray(targetUser.permissions) ? [...targetUser.permissions] : ["profile"],
    });
    setPermMsg("");
    setShowPermModal(true);
  };

  const handleTogglePermission = (menuKey) => {
    if (menuKey === "profile") return; // Profile is always mandatory
    if (!permSelectedUser) return;

    const currentPerms = permSelectedUser.permissions || [];
    let updated;
    if (currentPerms.includes(menuKey)) {
      updated = currentPerms.filter((k) => k !== menuKey);
    } else {
      updated = [...currentPerms, menuKey];
    }
    setPermSelectedUser({
      ...permSelectedUser,
      permissions: updated,
    });
  };

  const handleSavePermissions = async () => {
    if (!permSelectedUser) return;
    setPermSubmitting(true);
    setPermMsg("");

    try {
      const res = await fetch(`${API_URL}/adm/update_user_permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          user_id: permSelectedUser.id,
          permissions: permSelectedUser.permissions,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPermMsg("Permissions updated successfully!");
        fetchUsers();
        if (user && user.id === permSelectedUser.id && refreshUserProfile) {
          refreshUserProfile();
        }
        setTimeout(() => {
          setShowPermModal(false);
          setPermSelectedUser(null);
        }, 800);
      } else {
        setPermMsg(data.error || "Failed to update permissions.");
      }
    } catch (err) {
      console.error("Error updating permissions:", err);
      setPermMsg("Network error updating permissions.");
    } finally {
      setPermSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError("");
    setCreateSuccess("");

    if (!createForm.username || !createForm.password || !createForm.role) {
      setCreateError("Username, Password, and Role are required.");
      setCreateSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/adm/create_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCreateSuccess(data.message || "User created successfully!");
        setCreateForm({
          username: "",
          password: "",
          role: "Technical",
          email: "",
          first_name: "",
          last_name: "",
        });
        fetchUsers();
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateSuccess("");
        }, 1200);
      } else {
        setCreateError(data.error || "Failed to create user account.");
      }
    } catch (err) {
      console.error("Create user error:", err);
      setCreateError("Network error while creating user.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "admin") return "bg-label-primary";
    if (r === "technical") return "bg-label-info";
    if (r.includes("sales") || r.includes("staff")) return "bg-label-warning";
    if (r === "student") return "bg-label-success";
    return "bg-label-secondary";
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        <h4 className="fw-semibold py-3 mb-4">
          <span className="text-muted fw-light">Admin /</span> User Management
        </h4>

        {/* Sneat Card for User Table */}
        <div className="card">
          <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h5 className="mb-0">User Accounts</h5>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "200px" }}
              />
              <select
                className="form-select form-select-sm"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{ width: "150px" }}
              >
                <option value="ALL">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Technical">Technical</option>
                <option value="Sales / Staff">Sales / Staff</option>
                <option value="Student">Student</option>
              </select>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setCreateError("");
                  setCreateSuccess("");
                  setShowCreateModal(true);
                }}
              >
                <i className="bx bx-plus me-1"></i> Add User
              </button>
            </div>
          </div>

          <div className="table-responsive text-nowrap">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Permitted Menus</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="table-border-bottom-0">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const perms = Array.isArray(u.permissions) ? u.permissions : ["profile"];
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src="./1.png"
                              alt="avatar"
                              className="rounded-circle me-3"
                              width="36"
                              height="36"
                            />
                            <div>
                              <strong>{u.full_name || u.username}</strong>
                              <br />
                              <small className="text-muted">{u.email || `@${u.username}`}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {perms.map((p) => (
                              <span key={p} className="badge bg-label-secondary">
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenPermModal(u)}
                            title="Configure menu access"
                          >
                            <i className="bx bx-shield-quarter me-1"></i>
                            Permissions
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create User */}
        {showCreateModal && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleCreateSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      <i className="bx bx-user-plus me-2 text-primary"></i>
                      Add New User Account
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowCreateModal(false)}
                    ></button>
                  </div>

                  <div className="modal-body">
                    {createError && (
                      <div className="alert alert-danger py-2 small" role="alert">
                        {createError}
                      </div>
                    )}
                    {createSuccess && (
                      <div className="alert alert-success py-2 small" role="alert">
                        {createSuccess}
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label">Role / Account Type *</label>
                      <select
                        className="form-select"
                        value={createForm.role}
                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                        required
                      >
                        <option value="Technical">Technical</option>
                        <option value="Sales / Staff">Sales / Staff</option>
                        <option value="Student">Student</option>
                      </select>
                      <small className="form-text text-muted">
                        New accounts default strictly to <strong>Profile only</strong> until you grant permissions.
                      </small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Username *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. rahul_tech"
                        value={createForm.username}
                        onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="At least 6 characters"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="user@example.com"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="First Name"
                          value={createForm.first_name}
                          onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Last Name"
                          value={createForm.last_name}
                          onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowCreateModal(false)}
                      disabled={createSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={createSubmitting}
                    >
                      {createSubmitting ? "Creating..." : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Manage Permissions */}
        {showPermModal && permSelectedUser && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bx bx-shield-quarter me-2 text-primary"></i>
                    Configure Permissions: <strong>{permSelectedUser.username}</strong>
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowPermModal(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="d-flex align-items-center mb-3 p-2 bg-light rounded">
                    <span className="me-2 text-muted">Role:</span>
                    <span className={`badge ${getRoleBadgeClass(permSelectedUser.role)}`}>
                      {permSelectedUser.role}
                    </span>
                  </div>

                  {permMsg && (
                    <div
                      className={`alert py-2 small ${
                        permMsg.includes("success") ? "alert-success" : "alert-danger"
                      }`}
                      role="alert"
                    >
                      {permMsg}
                    </div>
                  )}

                  <p className="text-muted small mb-3">
                    Enable or disable the navigation menus visible in the sidebar for this user:
                  </p>

                  <div className="list-group">
                    {AVAILABLE_MENUS.map((menu) => {
                      const isGranted = (permSelectedUser.permissions || []).includes(menu.key);
                      const isProfile = menu.key === "profile";
                      return (
                        <div
                          key={menu.key}
                          className="list-group-item d-flex justify-content-between align-items-center py-3"
                        >
                          <div>
                            <strong>{menu.label}</strong>
                            <br />
                            <small className="text-muted">{menu.desc}</small>
                          </div>
                          <div className="form-check form-switch mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id={`switch-${menu.key}`}
                              checked={isGranted || isProfile}
                              disabled={isProfile || permSubmitting}
                              onChange={() => handleTogglePermission(menu.key)}
                              style={{ cursor: isProfile ? "not-allowed" : "pointer" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPermModal(false)}
                    disabled={permSubmitting}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSavePermissions}
                    disabled={permSubmitting}
                  >
                    {permSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
