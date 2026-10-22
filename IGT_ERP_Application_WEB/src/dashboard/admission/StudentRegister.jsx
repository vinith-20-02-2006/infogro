import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../../services/AuthContext";

function StudentRegister() {
  const { API_URL } = useContext(AuthContext);

  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    student_name: "",
    register_id: "",
    email: "",
    password: "",
    course_id: "",
    whatsapp_number: "",
    student_photo: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const getAuthHeader = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    // Fetch courses
    fetch(`${API_URL}/adm/get_course_datail`, {
      method: "POST",
      headers: { ...getAuthHeader() },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses(data);
          if (data.length > 0) {
            setFormData((prev) => ({ ...prev, course_id: data[0].Course_id }));
          }
        }
      })
      .catch((err) => console.error("Error fetching courses:", err));
  }, [API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`${API_URL}/adm/student/register`, {
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
          text: `Student '${data.student?.student_name}' registered successfully with ID '${data.student?.register_id}'. Student portal login is active!`,
        });
        setFormData({
          student_name: "",
          register_id: "",
          email: "",
          password: "",
          course_id: courses[0]?.Course_id || "",
          whatsapp_number: "",
          student_photo: "",
        });
      } else {
        setMessage({
          type: "danger",
          text: data.error || data.message || "Failed to register student.",
        });
      }
    } catch (err) {
      setMessage({ type: "danger", text: "Network error occurred while registering student." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: "#566a7f" }}>
            Student Registration
          </h4>
          <p className="text-muted mb-0">
            Register students into academic courses. A Student account is automatically created with Student role and permissions.
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
              <h5 className="card-title mb-0 fw-semibold">Student Information</h5>
            </div>
            <div className="card-body pt-4">
              {message.text && (
                <div className={`alert alert-${message.type} py-2 mb-4 small`} role="alert">
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">Student Name</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      className="form-control"
                      name="student_name"
                      placeholder="e.g. Divya Lakshmi"
                      value={formData.student_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">Register ID</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      className="form-control"
                      name="register_id"
                      placeholder="e.g. IGT-2026-0042"
                      value={formData.register_id}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted">Unique student identification number.</small>
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">Email Address</label>
                  <div className="col-sm-9">
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      placeholder="divya.s@student.in"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <small className="text-muted">Used for login and certificate notifications.</small>
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">Password</label>
                  <div className="col-sm-9">
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      placeholder="Leave blank to use Register ID as password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">Course</label>
                  <div className="col-sm-9">
                    <select
                      className="form-select"
                      name="course_id"
                      value={formData.course_id}
                      onChange={handleChange}
                    >
                      {courses.map((c) => (
                        <option key={c.Course_id} value={c.Course_id}>
                          {c.Course_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <label className="col-sm-3 col-form-label fw-semibold">WhatsApp Number</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      className="form-control"
                      name="whatsapp_number"
                      placeholder="e.g. 9876543210"
                      value={formData.whatsapp_number}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row mb-4">
                  <label className="col-sm-3 col-form-label fw-semibold">Student Photo URL</label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      className="form-control"
                      name="student_photo"
                      placeholder="https://example.com/photo.jpg or relative path"
                      value={formData.student_photo}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="row justify-content-end">
                  <div className="col-sm-9">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Registering..." : "Register Student"}
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
              <h6 className="fw-bold mb-2">Student Account Integration</h6>
              <p className="small text-muted mb-3">
                Students registered here automatically receive student portal credentials. In accordance with the system security architecture:
              </p>
              <ul className="small text-muted ps-3 mb-0">
                <li className="mb-2">
                  <strong>Role:</strong> Assigned role is strictly <code>Student</code>.
                </li>
                <li className="mb-2">
                  <strong>Scope:</strong> Students can only view their own attendance, exams, certificates, fees, and applications.
                </li>
                <li className="mb-2">
                  <strong>Users & Roles:</strong> New students immediately increment the Student summary card and can have individual overrides set by Admin.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentRegister;
