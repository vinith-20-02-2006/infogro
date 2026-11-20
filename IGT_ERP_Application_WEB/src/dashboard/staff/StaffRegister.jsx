import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../../services/AuthContext";

function StaffRegister() {
  const { API_URL } = useContext(AuthContext);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [formData, setFormData] = useState({
    staff_name: "",
    email: "",
    password: "",
    department_id: "",
    designation_id: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const getAuthHeader = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch designations filtered strictly by department_id
  const fetchDesignationsForDept = useCallback(async (deptId) => {
    if (!deptId) {
      setDesignations([]);
      return;
    }
    setLoadingDesignations(true);
    try {
      const res = await fetch(`${API_URL}/adm/designations?department_id=${encodeURIComponent(deptId)}`, {
        headers: { ...getAuthHeader() },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.designations)) {
        setDesignations(data.designations);
      } else {
        setDesignations([]);
      }
    } catch (err) {
      console.error("Error fetching designations for department:", err);
      setDesignations([]);
    } finally {
      setLoadingDesignations(false);
    }
  }, [API_URL]);

  // Initial load: Fetch departments
  useEffect(() => {
    fetch(`${API_URL}/adm/departments`, { headers: { ...getAuthHeader() } })
      .then((res) => res.json())
      .then((data) => {
        if (data.departments && Array.isArray(data.departments)) {
          setDepartments(data.departments);
          if (data.departments.length > 0) {
            const firstDeptId = data.departments[0].department_id;
            setFormData((prev) => ({
              ...prev,
              department_id: firstDeptId,
              designation_id: "",
            }));
            fetchDesignationsForDept(firstDeptId);
          }
        }
      })
      .catch((err) => console.error("Error fetching departments:", err));
  }, [API_URL, fetchDesignationsForDept]);

  // Handle department and input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "department_id") {
      setFormData((prev) => ({
        ...prev,
        department_id: value,
        designation_id: "", // Reset designation whenever department changes
      }));
      if (value) {
        fetchDesignationsForDept(value);
      } else {
        setDesignations([]);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department_id) {
      setMessage({ type: "danger", text: "Please select a department." });
      return;
    }
    if (!formData.designation_id) {
      setMessage({ type: "danger", text: "Please select a designation for this staff member." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_URL}/adm/staff/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Staff '${data.staff?.staff_name}' registered successfully! Assigned Role: ${data.staff?.role}, Designation: ${data.staff?.designation}. Account is immediately active in Users & Roles.`,
        });
        const defaultDeptId = departments[0]?.department_id || "";
        setFormData({
          staff_name: "",
          email: "",
          password: "",
          department_id: defaultDeptId,
          designation_id: "",
          phone: "",
        });
        if (defaultDeptId) {
          fetchDesignationsForDept(defaultDeptId);
        } else {
          setDesignations([]);
        }
      } else {
        setMessage({
          type: "danger",
          text: data.error || data.message || "Failed to register staff.",
        });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Network error occurred while registering staff." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: "#566a7f" }}>
            Staff Registration
          </h4>
          <p className="text-muted mb-0">
            Register new staff members. Accounts inherit permissions directly from their Department and Designation, and appear in Users & Roles.
          </p>
        </div>
        <Link to="/settings/users" className="btn btn-outline-primary btn-sm">
          <i className="bx bx-shield-quarter me-1"></i> View in Users & Roles
        </Link>
      </div>

      <div className="row">
        <div className="col-12 col-md-8 col-lg-7">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header border-bottom">
              <h5 className="card-title mb-0 fw-semibold">New Staff Information</h5>
            </div>
            <div className="card-body pt-4">
              {message.text && (
                <div className={`alert alert-${message.type} py-2 mb-4 small`} role="alert">
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">Staff Full Name</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      className="form-control"
                      name="staff_name"
                      placeholder="e.g. Arun Kumar"
                      value={formData.staff_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">Professional Email</label>
                  <div className="col-sm-9">
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      placeholder="arun@institute.in"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted">Used as the login username.</small>
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">Password</label>
                  <div className="col-sm-9">
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      placeholder="Leave blank for auto-generated password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* 1. Department Dropdown */}
                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">Department</label>
                  <div className="col-sm-9">
                    <select
                      className="form-select"
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((dept) => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">
                      Select department to load its specific designations.
                    </small>
                  </div>
                </div>

                {/* 2. Designation Dropdown (Cascading based on Department) */}
                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">Designation</label>
                  <div className="col-sm-9">
                    <select
                      className="form-select"
                      name="designation_id"
                      value={formData.designation_id}
                      onChange={handleChange}
                      disabled={!formData.department_id || loadingDesignations}
                      required
                    >
                      {!formData.department_id ? (
                        <option value="">-- Select Department First --</option>
                      ) : loadingDesignations ? (
                        <option value="">Loading designations...</option>
                      ) : designations.length === 0 ? (
                        <option value="">No designations found for this department</option>
                      ) : (
                        <>
                          <option value="">-- Select Designation --</option>
                          {designations.map((desig) => (
                            <option key={desig.designation_id} value={desig.designation_id}>
                              {desig.designation_name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <small className="text-muted">
                      Displays only designations belonging to the selected department.
                    </small>
                  </div>
                </div>

                <div className="row mb-4">
                  <label className="col-sm-3 col-form-label fw-semibold">Phone Number</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      className="form-control"
                      name="phone"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row justify-content-end">
                  <div className="col-sm-9">
                    <button type="submit" className="btn btn-primary" disabled={loading || loadingDesignations}>
                      {loading ? "Registering..." : "Register Staff"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 col-lg-5">
          <div className="card shadow-sm border-0 mb-4 bg-light">
            <div className="card-body">
              <h6 className="fw-bold mb-2">Role & Department Mapping</h6>
              <p className="small text-muted mb-3">
                In this ERP system, staff logins are generated through Staff Registration. Permissions are automatically assigned based on their department and designation:
              </p>
              <ul className="small text-muted ps-3 mb-0">
                <li className="mb-2">
                  <strong>Technical:</strong> Access to Batch Scheduling, Student Attendance, Academic Process, Exams, and Certificates.
                </li>
                <li className="mb-2">
                  <strong>Sales:</strong> Access to Course details, Enquiry, Enquiry Follow-up, Registration, Billing, and Reports.
                </li>
                <li className="mb-2">
                  <strong>HR:</strong> Access to Staff Attendance, Staff Leave, and Payslips.
                </li>
                <li className="mb-2">
                  <strong>Accounts & Finance:</strong> Access to Billing, Dues, Income, Expenses, Vendors, and Financial Reports.
                </li>
                <li className="mb-2">
                  <strong>Front Office:</strong> Access to Enquiry, Registration, Visitor Management, and ID Card Generation.
                </li>
                <li>
                  <strong>Admin:</strong> Unrestricted full access to all 39 menus and settings.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffRegister;
