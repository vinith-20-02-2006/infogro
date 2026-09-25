import React, { useState, useEffect } from "react";
import "./addcertificate.css";
import CertificateService from "../../../services/CertificateService";

function Addcertificate({ onBack, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    register_id: "",
    student_name: "",
    course_name: "",
    joining_date: "",
    issue_date: new Date().toISOString().split("T")[0],
    assignment_status: "Completed",
    assessment_status: "Completed",
    assignment_score: 90,
    assessment_score: 95,
  });

  const handleSearchStudents = async (query) => {
    setSearchQuery(query);
    try {
      const data = await CertificateService.searchEligibleStudents(query);
      setEligibleStudents(data);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  useEffect(() => {
    handleSearchStudents("");
  }, []);

  const handleSelectStudent = (student) => {
    setSearchQuery(`${student.student_name} (${student.register_id})`);
    setEligibleStudents([]);
    setFormData({
      register_id: student.register_id || "",
      student_name: student.student_name || "",
      course_name: student.course_name || "",
      joining_date: student.joining_date || "",
      issue_date: new Date().toISOString().split("T")[0],
      assignment_status: student.assignment_status || "Completed",
      assessment_status: student.assessment_status || "Completed",
      assignment_score: student.assignment_score || 90,
      assessment_score: student.assessment_score || 95,
    });
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    if (!formData.student_name || !formData.course_name) {
      alert("Please search and select an eligible student to generate a certificate.");
      return;
    }

    setLoading(true);
    try {
      await CertificateService.generateCertificate(formData);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Generation error:", err);
      alert(err.message || "Error generating certificate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card certificate-card p-4">
      {/* Full Page Header */}
      <div className="cert-fullpage-header d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
        <div>
          <h3 className="page-title mb-1" style={{ color: "#1E293B", fontWeight: "700" }}>
            <i className="bx bx-award me-2" style={{ color: "#4F46E5" }}></i>
            Add Certificate
          </h3>
          <p className="page-subtitle text-muted mb-0" style={{ fontSize: "14px" }}>
            Search an eligible student and issue a new certificate
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
          style={{ borderRadius: "10px", fontWeight: "500" }}
          onClick={onBack}
        >
          <i className="bx bx-arrow-back"></i> Back to Certificate List
        </button>
      </div>

      <div className="cert-fullpage-body">
        {/* Search Eligible Student Bar */}
        <div className="card p-3 mb-4 border-0" style={{ background: "#F8FAFC", borderRadius: "14px" }}>
          <label className="form-label font-weight-bold" style={{ color: "#4F46E5", fontSize: "15px", fontWeight: "600" }}>
            <i className="bx bx-search-alt me-1"></i> Search Eligible Student (Name, Register ID, Email, WhatsApp):
          </label>
          <input
            type="text"
            className="form-control form-control-lg bg-white"
            style={{ borderRadius: "10px", border: "1px solid #CBD5E1" }}
            placeholder="Type Student Name, Register ID, Email, or WhatsApp Number (e.g. Priya or IGP001)..."
            value={searchQuery}
            onChange={(e) => handleSearchStudents(e.target.value)}
          />

          {/* Autocomplete / Prominent Results List */}
          {eligibleStudents.length > 0 ? (
            <div className="search-results-dropdown shadow-sm mt-3 bg-white border rounded p-2" style={{ maxHeight: "250px", overflowY: "auto" }}>
              <div className="text-muted px-2 py-1 small font-weight-bold border-bottom mb-2 d-flex justify-content-between align-items-center">
                <span>
                  <i className="bx bx-user-check me-1 text-primary"></i> SELECT AN ELIGIBLE STUDENT BELOW ({eligibleStudents.length} CANDIDATE{eligibleStudents.length > 1 ? "S" : ""} FOUND):
                </span>
                <span className="badge bg-indigo-subtle text-primary border">
                  Assignment & Assessment Completed
                </span>
              </div>
              {eligibleStudents.map((st) => (
                <div
                  key={st.register_id || st.enrollment_id}
                  className="result-item p-3 mb-2 rounded border d-flex justify-content-between align-items-center"
                  style={{
                    cursor: "pointer",
                    background: formData.register_id === st.register_id ? "#EEF2FF" : "#FFFFFF",
                    borderColor: formData.register_id === st.register_id ? "#6366F1" : "#E2E8F0",
                    transition: "all 0.15s ease"
                  }}
                  onClick={() => handleSelectStudent(st)}
                >
                  <div>
                    <div className="font-weight-bold" style={{ color: "#1E293B", fontSize: "15px" }}>
                      <i className="bx bx-user me-1" style={{ color: "#4F46E5" }}></i> {st.student_name}
                      <span className="badge bg-light text-primary border ms-2">{st.register_id}</span>
                    </div>
                    <div className="text-muted small mt-1">
                      <i className="bx bx-book-open me-1"></i> {st.course_name}
                      {st.whatsapp_number && (
                        <span className="ms-3 text-secondary">
                          <i className="bx bxl-whatsapp text-success me-1"></i> {st.whatsapp_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-success-subtle text-success border border-success me-2 px-2 py-1" style={{ fontSize: "12px" }}>
                      <i className="bx bx-check-double me-1"></i> Ready
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary ms-1"
                      style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5", borderRadius: "6px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectStudent(st);
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 p-3 bg-white border rounded text-center text-muted" style={{ borderRadius: "10px" }}>
              <i className="bx bx-info-circle me-1 text-warning"></i> No eligible students found matching query. Ensure assignment & assessment are completed and certificate is not already generated.
            </div>
          )}
        </div>

        {/* Full Page Certificate Generation Form */}
        <form onSubmit={handleGenerateCertificate}>
          <h5 className="mb-3 font-weight-bold" style={{ color: "#1E293B" }}>
            Student Certificate Details
          </h5>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>Register ID / Student ID:</label>
              <input
                type="text"
                className="form-control bg-light"
                value={formData.register_id}
                readOnly
                placeholder="Select an eligible student above"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>Student Name:</label>
              <input
                type="text"
                className="form-control bg-light"
                value={formData.student_name}
                readOnly
                placeholder="Select an eligible student above"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>Course:</label>
              <input
                type="text"
                className="form-control bg-light"
                value={formData.course_name}
                readOnly
                placeholder="Select an eligible student above"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>Joining / Starting Date:</label>
              <input
                type="text"
                className="form-control bg-light"
                value={formData.joining_date}
                readOnly
                placeholder="Auto-populated"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>Assignment Status:</label>
              <input
                type="text"
                className="form-control text-success font-weight-bold bg-light"
                value={formData.assignment_status}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>Assessment Status:</label>
              <input
                type="text"
                className="form-control text-success font-weight-bold bg-light"
                value={formData.assessment_status}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>Assignment Score:</label>
              <input
                type="text"
                className="form-control bg-light"
                value={formData.assignment_score}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>Assessment Score:</label>
              <input
                type="text"
                className="form-control bg-light"
                value={formData.assessment_score}
                readOnly
              />
            </div>

            <div className="col-md-12">
              <label className="form-label font-weight-bold" style={{ color: "#4F46E5", fontSize: "15px" }}>
                Issue Date:
              </label>
              <input
                type="date"
                className="form-control form-control-lg"
                style={{ borderRadius: "10px" }}
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-4 pt-3 border-top text-end">
            <button
              type="button"
              className="btn btn-outline-secondary btn-lg me-3"
              style={{ borderRadius: "10px" }}
              onClick={onBack}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5", borderRadius: "10px" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Generating Certificate...
                </>
              ) : (
                <>
                  <i className="bx bx-award me-1"></i> Generate Certificate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Addcertificate;
