import React, { useState, useEffect, useContext, useCallback } from "react";
import AuthContext from "../../services/AuthContext";

function DepartmentDesignation() {
  const { API_URL } = useContext(AuthContext);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [newDept, setNewDept] = useState({ department_name: "", description: "" });
  const [newDesig, setNewDesig] = useState({ designation_name: "", department_id: "", description: "" });
  const [message, setMessage] = useState({ type: "", text: "" });

  const getAuthHeader = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadData = useCallback(() => {
    fetch(`${API_URL}/adm/departments`, { headers: { ...getAuthHeader() } })
      .then((res) => res.json())
      .then((data) => {
        if (data.departments) {
          setDepartments(data.departments);
          if (data.departments.length > 0 && !newDesig.department_id) {
            setNewDesig((prev) => ({ ...prev, department_id: data.departments[0].department_id }));
          }
        }
      })
      .catch((err) => console.error("Error fetching departments:", err));

    fetch(`${API_URL}/adm/designations`, { headers: { ...getAuthHeader() } })
      .then((res) => res.json())
      .then((data) => {
        if (data.designations) {
          setDesignations(data.designations);
        }
      })
      .catch((err) => console.error("Error fetching designations:", err));
  }, [API_URL, newDesig.department_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDept.department_name.trim()) return;
    try {
      const res = await fetch(`${API_URL}/adm/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(newDept),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Department '${newDept.department_name}' created.` });
        setNewDept({ department_name: "", description: "" });
        loadData();
      } else {
        setMessage({ type: "danger", text: data.error || "Failed to create department." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Network error creating department." });
    }
  };

  const handleAddDesig = async (e) => {
    e.preventDefault();
    if (!newDesig.designation_name.trim()) return;
    try {
      const res = await fetch(`${API_URL}/adm/designations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(newDesig),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Designation '${newDesig.designation_name}' created.` });
        setNewDesig((prev) => ({ ...prev, designation_name: "", description: "" }));
        loadData();
      } else {
        setMessage({ type: "danger", text: data.error || "Failed to create designation." });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Network error creating designation." });
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: "#566a7f" }}>
          Department & Designation Management
        </h4>
        <p className="text-muted mb-0">
          Configure departments and staff designations. Staff members inherit their security role based on their department.
        </p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} py-2 mb-4 small`} role="alert">
          {message.text}
        </div>
      )}

      <div className="row">
        {/* Departments Column */}
        <div className="col-12 col-lg-6 mb-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header border-bottom">
              <h5 className="card-title mb-0 fw-semibold">Add Department</h5>
            </div>
            <div className="card-body pt-3">
              <form onSubmit={handleAddDept}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Department Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Technical, Sales, HR, Accounts"
                    value={newDept.department_name}
                    onChange={(e) => setNewDept((prev) => ({ ...prev, department_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Description or notes"
                    value={newDept.description}
                    onChange={(e) => setNewDept((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">
                  Add Department
                </button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header border-bottom">
              <h5 className="card-title mb-0 fw-semibold">Existing Departments</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>NAME</th>
                    <th>ROLE MAPPING</th>
                    <th>DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.department_id}>
                      <td className="fw-semibold text-dark">{d.department_name}</td>
                      <td>
                        <span className="badge bg-label-info">{d.department_name}</span>
                      </td>
                      <td className="text-muted small">{d.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Designations Column */}
        <div className="col-12 col-lg-6 mb-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header border-bottom">
              <h5 className="card-title mb-0 fw-semibold">Add Designation</h5>
            </div>
            <div className="card-body pt-3">
              <form onSubmit={handleAddDesig}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Designation Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Senior Python Trainer, Academic Counselor"
                    value={newDesig.designation_name}
                    onChange={(e) => setNewDesig((prev) => ({ ...prev, designation_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Department</label>
                  <select
                    className="form-select"
                    value={newDesig.department_id}
                    onChange={(e) => setNewDesig((prev) => ({ ...prev, department_id: e.target.value }))}
                  >
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">
                  Add Designation
                </button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header border-bottom">
              <h5 className="card-title mb-0 fw-semibold">Existing Designations</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>DESIGNATION</th>
                    <th>DEPARTMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {designations.map((desig) => (
                    <tr key={desig.designation_id}>
                      <td className="fw-semibold text-dark">{desig.designation_name}</td>
                      <td>
                        <span className="badge bg-label-secondary">
                          {desig.department_name || "General"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentDesignation;
