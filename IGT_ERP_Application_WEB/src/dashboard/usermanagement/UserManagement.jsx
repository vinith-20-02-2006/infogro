import React, { useState, useEffect, useContext, useCallback } from "react";
import AuthContext from "../../services/AuthContext";
import "./usermanagement.css";

// Complete 39-menu definitions matching Image 1, 2, and 3
export const SYSTEM_MENUS = [
  // Dashboard
  { key: "dashboard", label: "Dashboard", category: "Dashboard" },

  // Master
  { key: "course", label: "Course Details", category: "Master" },
  { key: "coursemodule", label: "Course Module", category: "Master" },
  { key: "coursefees", label: "Course Fees", category: "Master" },
  { key: "department", label: "Department", category: "Master" },
  { key: "designation", label: "Designation", category: "Master" },
  { key: "batch_creation", label: "Batch Creation", category: "Master" },

  // Admission
  { key: "enquiry", label: "Enquiry", category: "Admission" },
  { key: "enquiry_followup", label: "Enquiry Follow-up", category: "Admission" },
  { key: "registration", label: "Registration", category: "Admission" },

  // Academic
  { key: "batch_scheduling", label: "Batch Scheduling", category: "Academic" },
  { key: "batch_transfer", label: "Batch Transfer", category: "Academic" },
  { key: "student_attendance", label: "Student Attendance", category: "Academic" },
  { key: "student_academic_process", label: "Student Academic Process", category: "Academic" },
  { key: "exams", label: "Exams", category: "Academic" },
  { key: "exam_schedule", label: "Exam Schedule", category: "Academic" },
  { key: "marks_entry", label: "Marks Entry", category: "Academic" },
  { key: "results", label: "Results", category: "Academic" },
  { key: "gradesheet", label: "Grade Sheet", category: "Academic" },

  // Certificate
  { key: "certificate", label: "Certificate", category: "Certificate" },
  { key: "certificate_generation", label: "Certificate Generation", category: "Certificate" },
  { key: "mail_generation", label: "Mail Generation", category: "Certificate" },
  { key: "workshop_template", label: "Workshop Template", category: "Certificate" },
  { key: "letterhead_template", label: "Letter Head Template", category: "Certificate" },
  { key: "certificate_verification", label: "Certificate Verification", category: "Certificate" },
  { key: "id_card_generation", label: "ID Card Generation", category: "Certificate" },

  // Payment
  { key: "billing", label: "Billing / Invoice", category: "Payment" },
  { key: "dues", label: "Dues & Reminders", category: "Payment" },

  // Staff
  { key: "staff_register", label: "Staff Register", category: "Staff" },
  { key: "staff_attendance", label: "Staff Attendance", category: "Staff" },
  { key: "staff_leave", label: "Staff Leave", category: "Staff" },
  { key: "payslip_generation", label: "Payslip Generation", category: "Staff" },

  // Accounts
  { key: "income", label: "Income", category: "Accounts" },
  { key: "expenses", label: "Expenses", category: "Accounts" },
  { key: "vendors", label: "Vendors", category: "Accounts" },

  // Placement
  { key: "companies", label: "Companies", category: "Placement" },
  { key: "placement_openings", label: "Job Openings", category: "Placement" },
  { key: "student_applications", label: "Student Applications", category: "Placement" },
  { key: "placed_students", label: "Placed Students", category: "Placement" },

  // Reports
  { key: "reports_enquiry", label: "Enquiry Report", category: "Report" },
  { key: "reports_fees", label: "Fees Report", category: "Report" },
  { key: "reports_attendance", label: "Attendance Report", category: "Report" },
  { key: "reports_collection", label: "Collection Report", category: "Report" },
  { key: "reports_dues", label: "Dues Report", category: "Report" },
  { key: "reports_batch", label: "Batch Report", category: "Report" },
  { key: "reports_trainer", label: "Trainer Report", category: "Report" },
  { key: "reports_exam", label: "Exam Report", category: "Report" },
  { key: "reports_placement", label: "Placement Report", category: "Report" },
  { key: "reports_income_expense", label: "Income & Expense Report", category: "Report" },

  // Settings
  { key: "settings_users", label: "Users & Roles", category: "Settings" },
  { key: "settings_backup", label: "Backup", category: "Settings" },
];

function UserManagement() {
  const { API_URL, refreshUserProfile } = useContext(AuthContext);

  // Summary State
  const [summary, setSummary] = useState({
    admin_count: 2,
    staff_count: 14,
    sales_count: 6,
    student_count: 428,
    total_users: 450,
  });

  // All Users Table State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Role Permissions Modal State (Pop-up)
  const [showRolePermModal, setShowRolePermModal] = useState(false);
  const [rolePermSearch, setRolePermSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("Student");
  const [rolePermissions, setRolePermissions] = useState({});
  const [loadingRolePerms, setLoadingRolePerms] = useState(false);
  const [savingRolePerms, setSavingRolePerms] = useState(false);
  const [resettingRolePerms, setResettingRolePerms] = useState(false);
  const [roleMessage, setRoleMessage] = useState({ type: "", text: "" });

  // User Permissions Override Modal State
  const [overrideUser, setOverrideUser] = useState(null);
  const [overridePerms, setOverridePerms] = useState({});
  const [overrideSearch, setOverrideSearch] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState({ type: "", text: "" });

  // Add Role Modal State
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [copyFromRole, setCopyFromRole] = useState("Technical");
  const [addRoleMsg, setAddRoleMsg] = useState({ type: "", text: "" });

  const getAuthHeader = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Fetch Summary Counts
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/adm/user_roles_summary`, {
        headers: { ...getAuthHeader() },
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch roles summary:", err);
    }
  }, [API_URL]);

  // 2. Fetch Users List
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        role: filterRole,
        status: filterStatus,
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      const res = await fetch(`${API_URL}/adm/list_all_users?${params.toString()}`, {
        headers: { ...getAuthHeader() },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setTotalUsers(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch users list:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, [API_URL, searchTerm, filterRole, filterStatus, page, pageSize]);

  // 3. Fetch Role Permissions for popup modal
  const fetchRolePermissions = useCallback(async (roleName) => {
    setLoadingRolePerms(true);
    setRoleMessage({ type: "", text: "" });
    try {
      const res = await fetch(`${API_URL}/adm/role_permissions?role=${encodeURIComponent(roleName)}`, {
        headers: { ...getAuthHeader() },
      });
      const data = await res.json();
      if (data.success && data.permissions) {
        setRolePermissions(data.permissions);
      }
    } catch (err) {
      console.error("Failed to fetch role permissions:", err);
    } finally {
      setLoadingRolePerms(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (showRolePermModal) {
      fetchRolePermissions(selectedRole);
    }
  }, [fetchRolePermissions, selectedRole, showRolePermModal]);

  // 4. Toggle User Status (Lock / Unlock)
  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/adm/toggle_user_status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchSummary();
      } else {
        alert(data.error || "Failed to toggle status");
      }
    } catch (err) {
      console.error("Error toggling user status:", err);
    }
  };

  // 5. Handle Checkbox Change in Role Permissions
  const handleRolePermChange = (menuKey, action, checked) => {
    setRolePermissions((prev) => {
      const current = prev[menuKey] || { view: false, add: false, edit: false, delete: false };
      return {
        ...prev,
        [menuKey]: {
          ...current,
          [action]: checked,
        },
      };
    });
  };

  // 6. Save Role Permissions
  const handleSaveRolePermissions = async () => {
    setSavingRolePerms(true);
    setRoleMessage({ type: "", text: "" });
    try {
      const res = await fetch(`${API_URL}/adm/role_permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          role: selectedRole,
          permissions: rolePermissions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoleMessage({
          type: "success",
          text: `Permissions for ${selectedRole} saved successfully and updated for all users.`,
        });
        refreshUserProfile();
        fetchUsers();
      } else {
        setRoleMessage({ type: "danger", text: data.error || "Failed to save permissions." });
      }
    } catch (err) {
      setRoleMessage({ type: "danger", text: "Network error saving permissions." });
    } finally {
      setSavingRolePerms(false);
    }
  };

  // 7. Reset Role Permissions
  const handleResetRolePermissions = async () => {
    if (!window.confirm(`Are you sure you want to reset permissions for ${selectedRole} to defaults?`)) {
      return;
    }
    setResettingRolePerms(true);
    setRoleMessage({ type: "", text: "" });
    try {
      const res = await fetch(`${API_URL}/adm/reset_role_permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      if (data.success) {
        setRolePermissions(data.permissions);
        setRoleMessage({
          type: "success",
          text: `Permissions for ${selectedRole} reset to defaults.`,
        });
        refreshUserProfile();
        fetchUsers();
      } else {
        setRoleMessage({ type: "danger", text: data.error || "Failed to reset permissions." });
      }
    } catch (err) {
      setRoleMessage({ type: "danger", text: "Network error resetting permissions." });
    } finally {
      setResettingRolePerms(false);
    }
  };

  // 8. Open User Override Modal
  const handleOpenOverrideModal = (u) => {
    setOverrideUser(u);
    setOverridePerms(u.permissions || {});
    setOverrideSearch("");
    setOverrideMsg({ type: "", text: "" });
  };

  const handleOverridePermChange = (menuKey, action, checked) => {
    setOverridePerms((prev) => {
      const current = prev[menuKey] || { view: false, add: false, edit: false, delete: false };
      return {
        ...prev,
        [menuKey]: {
          ...current,
          [action]: checked,
        },
      };
    });
  };

  const handleSaveUserOverride = async () => {
    if (!overrideUser) return;
    setSavingOverride(true);
    setOverrideMsg({ type: "", text: "" });
    try {
      const res = await fetch(`${API_URL}/adm/update_user_override_permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          user_id: overrideUser.id,
          custom_permissions: overridePerms,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOverrideMsg({ type: "success", text: "User permissions updated successfully." });
        setTimeout(() => {
          setOverrideUser(null);
          fetchUsers();
          refreshUserProfile();
        }, 1000);
      } else {
        setOverrideMsg({ type: "danger", text: data.error || "Failed to save permissions." });
      }
    } catch (err) {
      setOverrideMsg({ type: "danger", text: "Network error saving permissions." });
    } finally {
      setSavingOverride(false);
    }
  };

  // 9. Handle Add Role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setAddRoleMsg({ type: "danger", text: "Please provide a valid role name." });
      return;
    }
    try {
      const copyRes = await fetch(`${API_URL}/adm/role_permissions?role=${encodeURIComponent(copyFromRole)}`, {
        headers: { ...getAuthHeader() },
      });
      const copyData = await copyRes.json();
      const initialPerms = copyData.permissions || {};

      const saveRes = await fetch(`${API_URL}/adm/role_permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          role: newRoleName.trim(),
          permissions: initialPerms,
        }),
      });
      const saveData = await saveRes.json();
      if (saveData.success) {
        setSelectedRole(newRoleName.trim());
        setShowAddRoleModal(false);
        setNewRoleName("");
        alert(`Role '${newRoleName.trim()}' created successfully!`);
      } else {
        setAddRoleMsg({ type: "danger", text: saveData.error || "Failed to create role." });
      }
    } catch (err) {
      setAddRoleMsg({ type: "danger", text: "Error creating role." });
    }
  };

  // Helper for Role Badges
  const renderRoleBadge = (role) => {
    const r = (role || "").toLowerCase();
    if (r === "admin") {
      return <span className="badge bg-label-danger">Admin</span>;
    }
    if (r === "student") {
      return <span className="badge bg-label-success">Student</span>;
    }
    if (r === "sales" || r === "sales / staff") {
      return <span className="badge bg-label-warning">Sales</span>;
    }
    if (r === "hr") {
      return <span className="badge bg-label-secondary">HR</span>;
    }
    return <span className="badge bg-label-info">Staff</span>;
  };

  const startUserIndex = totalUsers === 0 ? 0 : (page - 1) * pageSize + 1;
  const endUserIndex = Math.min(page * pageSize, totalUsers);

  // Filtered menus for Role Permissions pop-up
  const filteredRoleMenus = SYSTEM_MENUS.filter(
    (m) =>
      m.label.toLowerCase().includes(rolePermSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(rolePermSearch.toLowerCase())
  );

  return (
    <div className="users-roles-container">
      {/* 1. Header with Role Permissions & Add Role Buttons */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: "#566a7f" }}>
            Users & Roles
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
            Create logins and decide which menus each role can open.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* Role & Permission Pop-up Trigger Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setRoleMessage({ type: "", text: "" });
              setRolePermSearch("");
              setShowRolePermModal(true);
            }}
          >
            <i className="bx bx-shield-quarter me-1"></i> Role permissions
          </button>

          {/* Add Role Button */}
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              setNewRoleName("");
              setAddRoleMsg({ type: "", text: "" });
              setShowAddRoleModal(true);
            }}
          >
            <i className="bx bx-plus me-1"></i> Add role
          </button>
        </div>
      </div>

      {/* 2. Top Summary Cards */}
      <div className="row mb-4">
        {/* Admin Card */}
        <div className="col-12 col-sm-6 col-xl-3 mb-3">
          <div className="card summary-card h-100">
            <div className="card-body">
              <span className="badge bg-label-danger mb-2">Admin</span>
              <h3 className="fw-bold mb-1">{summary.admin_count ?? 2}</h3>
              <small className="text-muted">Full access, all 39 menus</small>
            </div>
          </div>
        </div>

        {/* Staff Card */}
        <div className="col-12 col-sm-6 col-xl-3 mb-3">
          <div className="card summary-card h-100">
            <div className="card-body">
              <span className="badge bg-label-info mb-2">Staff</span>
              <h3 className="fw-bold mb-1">{summary.staff_count ?? 14}</h3>
              <small className="text-muted">Trainers and academic staff</small>
            </div>
          </div>
        </div>

        {/* Sales Card */}
        <div className="col-12 col-sm-6 col-xl-3 mb-3">
          <div className="card summary-card h-100">
            <div className="card-body">
              <span className="badge bg-label-warning mb-2">Sales</span>
              <h3 className="fw-bold mb-1">{summary.sales_count ?? 6}</h3>
              <small className="text-muted">Enquiry, admission and fees</small>
            </div>
          </div>
        </div>

        {/* Student Card */}
        <div className="col-12 col-sm-6 col-xl-3 mb-3">
          <div className="card summary-card h-100">
            <div className="card-body">
              <span className="badge bg-label-success mb-2">Student</span>
              <h3 className="fw-bold mb-1">{summary.student_count ?? 428}</h3>
              <small className="text-muted">Own records only</small>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Full-Width All Users Table */}
      <div className="row">
        <div className="col-12 mb-4">
          <div className="card shadow-sm border-0">
            {/* Card Header with Search & Filters */}
            <div className="card-header-flex border-bottom">
              <div>
                <h5 className="card-title mb-0 fw-bold" style={{ color: "#566a7f" }}>
                  All users
                </h5>
                <small className="text-muted">
                  Total {totalUsers} registered user account{totalUsers !== 1 ? "s" : ""}
                </small>
              </div>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search name or email"
                  style={{ width: "200px" }}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
                <select
                  className="form-select form-select-sm"
                  style={{ width: "130px" }}
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">All roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                  <option value="Sales">Sales</option>
                  <option value="Technical">Technical</option>
                  <option value="HR">HR</option>
                  <option value="Student">Student</option>
                </select>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "120px" }}
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="ALL">All status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive text-nowrap">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="table-light">
                    <th>USER</th>
                    <th>ROLE</th>
                    <th>DEPARTMENT / DESIGNATION</th>
                    <th>LAST LOGIN</th>
                    <th>STATUS</th>
                    <th className="text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No users found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="fw-semibold text-dark">{u.full_name || u.username}</div>
                          <small className="text-muted">{u.email}</small>
                        </td>
                        <td>{renderRoleBadge(u.role)}</td>
                        <td>
                          {u.department ? (
                            <span className="badge bg-label-primary me-1">{u.department}</span>
                          ) : null}
                          <span className="text-muted small">
                            {u.designation || (u.role === "Student" ? "Student Account" : "—")}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted small">{u.last_login}</span>
                        </td>
                        <td>
                          {u.is_active ? (
                            <span className="badge bg-label-success">Active</span>
                          ) : (
                            <span className="badge bg-label-secondary">Inactive</span>
                          )}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn-action-icon me-1"
                            title="Edit Permissions Override"
                            onClick={() => handleOpenOverrideModal(u)}
                          >
                            <i className="bx bx-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className={`btn-action-icon ${u.is_active ? "" : "danger"}`}
                            title={u.is_active ? "Lock Account" : "Unlock Account"}
                            onClick={() => handleToggleUserStatus(u.id)}
                          >
                            <i className={u.is_active ? "bx bx-lock-alt" : "bx bx-lock-open-alt"}></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="card-footer d-flex justify-content-between align-items-center border-top py-2">
              <span className="text-muted small">
                Showing {startUserIndex} to {endUserIndex} of {totalUsers} users
              </span>
              <div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary me-2"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ROLE & PERMISSIONS POP-UP MODAL */}
      {showRolePermModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-lg-custom p-4">
            {/* Modal Header */}
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded p-2 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "rgba(105, 108, 255, 0.12)", color: "#696cff" }}
                >
                  <i className="bx bx-shield-quarter fs-3"></i>
                </div>
                <div>
                  <h5 className="modal-title fw-bold mb-0 text-dark">Role Permissions</h5>
                  <small className="text-muted">
                    Configure default menu access and CRUD permissions for roles.
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted fw-semibold">Role:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "160px" }}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="Student">Student</option>
                  <option value="Technical">Staff (Technical)</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Admin">Admin</option>
                </select>
                <button
                  type="button"
                  className="btn-close ms-2"
                  onClick={() => setShowRolePermModal(false)}
                ></button>
              </div>
            </div>

            {/* Notification alert */}
            {roleMessage.text && (
              <div className={`alert alert-${roleMessage.type} py-2 small mb-3`} role="alert">
                {roleMessage.text}
              </div>
            )}

            {/* Search filter for menus inside modal */}
            <div className="mb-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search menus (e.g. Course, Enquiry, Certificate, Report)..."
                value={rolePermSearch}
                onChange={(e) => setRolePermSearch(e.target.value)}
              />
            </div>

            {/* Scrollable Matrix Table */}
            <div className="permissions-scroll-pane flex-grow-1 border rounded mb-3">
              <table className="table table-hover permissions-table mb-0">
                <thead className="sticky-top">
                  <tr>
                    <th>MENU</th>
                    <th className="text-center" style={{ width: "80px" }}>VIEW</th>
                    <th className="text-center" style={{ width: "80px" }}>ADD</th>
                    <th className="text-center" style={{ width: "80px" }}>EDIT</th>
                    <th className="text-center" style={{ width: "80px" }}>DELETE</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRolePerms ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        Loading permissions...
                      </td>
                    </tr>
                  ) : filteredRoleMenus.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No menus found matching "{rolePermSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredRoleMenus.map((m) => {
                      const perm = rolePermissions[m.key] || {
                        view: false,
                        add: false,
                        edit: false,
                        delete: false,
                      };
                      return (
                        <tr key={m.key}>
                          <td>
                            <div className="fw-semibold text-dark">{m.label}</div>
                            <small className="text-muted">{m.category}</small>
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={!!perm.view}
                              onChange={(e) => handleRolePermChange(m.key, "view", e.target.checked)}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={!!perm.add}
                              onChange={(e) => handleRolePermChange(m.key, "add", e.target.checked)}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={!!perm.edit}
                              onChange={(e) => handleRolePermChange(m.key, "edit", e.target.checked)}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={!!perm.delete}
                              onChange={(e) => handleRolePermChange(m.key, "delete", e.target.checked)}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Note & Action Buttons */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleResetRolePermissions}
                  disabled={resettingRolePerms}
                >
                  <i className="bx bx-reset me-1"></i>
                  {resettingRolePerms ? "Resetting..." : "Reset to Defaults"}
                </button>
                <small className="text-muted d-none d-md-inline" style={{ fontSize: "0.8rem" }}>
                  Menus not ticked stay hidden for {selectedRole}.
                </small>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowRolePermModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveRolePermissions}
                  disabled={savingRolePerms}
                >
                  <i className="bx bx-check me-1"></i>
                  {savingRolePerms ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Edit User Custom Override Permissions Modal */}
      {overrideUser && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom p-4">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <div>
                <h5 className="modal-title fw-bold mb-0">
                  Custom Permissions: {overrideUser.full_name || overrideUser.username}
                </h5>
                <small className="text-muted">
                  Role: <strong>{overrideUser.role}</strong> &bull; Custom rules here override role defaults.
                </small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setOverrideUser(null)}
              ></button>
            </div>

            {overrideMsg.text && (
              <div className={`alert alert-${overrideMsg.type} py-2 small mb-3`} role="alert">
                {overrideMsg.text}
              </div>
            )}

            <div className="mb-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search menus to override..."
                value={overrideSearch}
                onChange={(e) => setOverrideSearch(e.target.value)}
              />
            </div>

            <div className="permissions-scroll-pane flex-grow-1 border rounded mb-3">
              <table className="table table-hover permissions-table mb-0">
                <thead className="sticky-top">
                  <tr>
                    <th>MENU</th>
                    <th className="text-center">VIEW</th>
                    <th className="text-center">ADD</th>
                    <th className="text-center">EDIT</th>
                    <th className="text-center">DELETE</th>
                  </tr>
                </thead>
                <tbody>
                  {SYSTEM_MENUS.filter((m) =>
                    m.label.toLowerCase().includes(overrideSearch.toLowerCase())
                  ).map((m) => {
                    const perm = overridePerms[m.key] || {
                      view: false,
                      add: false,
                      edit: false,
                      delete: false,
                    };
                    return (
                      <tr key={m.key}>
                        <td>
                          <span className="fw-semibold text-dark">{m.label}</span>
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!perm.view}
                            onChange={(e) => handleOverridePermChange(m.key, "view", e.target.checked)}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!perm.add}
                            onChange={(e) => handleOverridePermChange(m.key, "add", e.target.checked)}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!perm.edit}
                            onChange={(e) => handleOverridePermChange(m.key, "edit", e.target.checked)}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={!!perm.delete}
                            onChange={(e) => handleOverridePermChange(m.key, "delete", e.target.checked)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setOverrideUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveUserOverride}
                disabled={savingOverride}
              >
                {savingOverride ? "Saving..." : "Save Custom Overrides"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Role Modal */}
      {showAddRoleModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom p-4" style={{ maxWidth: "480px" }}>
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <h5 className="modal-title fw-bold mb-0">Add Role</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowAddRoleModal(false)}
              ></button>
            </div>

            {addRoleMsg.text && (
              <div className={`alert alert-${addRoleMsg.type} py-2 small mb-3`} role="alert">
                {addRoleMsg.text}
              </div>
            )}

            <form onSubmit={handleCreateRole}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Role Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Placement Officer, Accountant"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Copy Permissions From</label>
                <select
                  className="form-select"
                  value={copyFromRole}
                  onChange={(e) => setCopyFromRole(e.target.value)}
                >
                  <option value="Technical">Staff (Technical)</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Student">Student</option>
                  <option value="Admin">Admin</option>
                </select>
                <small className="text-muted">
                  The new role will inherit all menu permissions of this base template.
                </small>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowAddRoleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
