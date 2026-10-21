import React, { useState, useEffect, useContext } from "react";
import "./addcertificate.css";
import AuthContext from "../../../services/AuthContext";

function Addcertificate({ onBack, onSuccess, editData }) {
  const { insert, update, Fetch, API_URL } = useContext(AuthContext);
  const isEdit = Boolean(editData);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return "";
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("data:image")) {
      return photoPath;
    }
    const baseUrl = API_URL || "http://127.0.0.1:8000";
    const cleanPath = photoPath.startsWith("/") ? photoPath.slice(1) : photoPath;
    if (cleanPath.startsWith("media/")) {
      return `${baseUrl}/${cleanPath}`;
    }
    return `${baseUrl}/media/${cleanPath}`;
  };

  const [formData, setFormData] = useState({
    certificate_id: "",
    register_id: "",
    student_name: "",
    course_name: "",
    joining_date: "",
    issue_date: new Date().toISOString().split("T")[0],
    assignment_status: "Completed",
    assessment_status: "Completed",
    assignment_score: 90,
    assessment_score: 95,
    whatsapp_number: "",
    student_photo: "",
  });

  const handleSearchStudents = async (query) => {
    setSearching(true);
    try {
      const data = await Fetch({ q: query }, "search_eligible_students");
      if (Array.isArray(data)) {
        setEligibleStudents(data);
      } else {
        setEligibleStudents([]);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const openStudentModal = () => {
    setShowStudentModal(true);
    setModalSearchQuery("");
    handleSearchStudents("");
  };

  useEffect(() => {
    if (editData) {
      let formattedDate = editData.raw_issue_date;
      if (!formattedDate && editData.issue_date) {
        if (editData.issue_date.includes('/')) {
          const parts = editData.issue_date.split('/');
          if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        } else {
          formattedDate = editData.issue_date;
        }
      }
      if (!formattedDate) {
        formattedDate = new Date().toISOString().split("T")[0];
      }

      const regId = editData.register_id || editData.certificate_id || "";
      const certId = editData.certificate_id || editData.register_id || "";

      setFormData({
        certificate_id: certId,
        register_id: regId,
        student_name: editData.student_name || "",
        course_name: editData.course_name || "",
        joining_date: editData.joining_date || "",
        issue_date: formattedDate,
        assignment_status: editData.assignment_status || "Completed",
        assessment_status: editData.assessment_status || "Completed",
        assignment_score: editData.assignment_score || 90,
        assessment_score: editData.assessment_score || 95,
        whatsapp_number: editData.whatsapp_number || "",
        student_photo: editData.student_photo || "",
      });
    }
  }, [editData]);

  const handleSelectStudent = (student) => {
    setShowStudentModal(false);
    setFormData({
      certificate_id: "",
      register_id: student.register_id || "",
      student_name: student.student_name || "",
      course_name: student.course_name || "",
      joining_date: student.joining_date || "",
      issue_date: new Date().toISOString().split("T")[0],
      assignment_status: student.assignment_status || "Completed",
      assessment_status: student.assessment_status || "Completed",
      assignment_score: student.assignment_score || 90,
      assessment_score: student.assessment_score || 95,
      whatsapp_number: student.whatsapp_number || "",
      student_photo: student.student_photo || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_name || !formData.course_name) {
      alert("Please enter student name and course name.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await update({
          certificate_id: formData.certificate_id || formData.register_id,
          register_id: formData.register_id,
          student_name: formData.student_name,
          course_name: formData.course_name,
          issue_date: formData.issue_date,
          whatsapp_number: formData.whatsapp_number,
          student_photo: formData.student_photo,
        }, "update_certificate");
      } else {
        await insert(formData, "generate_certificate");
      }
      if (onSuccess) onSuccess();
      if (onBack) onBack();
    } catch (err) {
      console.error(isEdit ? "Update error:" : "Generation error:", err);
      alert(err.message || (isEdit ? "Error updating certificate." : "Error generating certificate."));
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
            <i className={`bx ${isEdit ? "bx-edit" : "bx-award"} me-2`} style={{ color: "#4F46E5" }}></i>
            {isEdit ? "Edit Certificate" : "Add Certificate"}
          </h3>
          <p className="page-subtitle text-muted mb-0" style={{ fontSize: "14px" }}>
            {isEdit
              ? "Modify certificate details and update student record"
              : "Click on the Student Name field to select an eligible student"}
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
        {/* Certificate Details Form */}
        <form onSubmit={handleSubmit}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 font-weight-bold" style={{ color: "#1E293B" }}>
              Student Certificate Details
            </h5>
            {formData.student_name && !isEdit && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                style={{ borderRadius: "8px", fontWeight: "600" }}
                onClick={openStudentModal}
              >
                <i className="bx bx-user-check"></i> Choose Different Student
              </button>
            )}
          </div>

          {/* Selected Student Banner with Dynamic Photo */}
          {formData.student_name && (
            <div
              className="student-selected-banner p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-3"
              style={{
                background: "linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 100%)",
                border: "1.5px solid #C7D2FE",
                borderRadius: "16px",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.08)"
              }}
            >
              <div className="d-flex align-items-center gap-3">
                {/* Photo Thumbnail */}
                <div
                  className="position-relative"
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "2.5px solid #4F46E5",
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 4px 10px rgba(79, 70, 229, 0.15)",
                    flexShrink: 0
                  }}
                >
                  {formData.student_photo ? (
                    <img
                      src={getPhotoUrl(formData.student_photo)}
                      alt={formData.student_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: formData.student_photo ? "none" : "flex",
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "24px",
                      color: "#4F46E5",
                      backgroundColor: "#EEF2FF"
                    }}
                  >
                    {formData.student_name ? formData.student_name.charAt(0).toUpperCase() : "S"}
                  </div>
                </div>

                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h5 className="mb-0 font-weight-bold" style={{ color: "#1E293B", fontSize: "18px" }}>
                      {formData.student_name}
                    </h5>
                    <span className="badge bg-primary px-2 py-1" style={{ fontSize: "12px", borderRadius: "6px" }}>
                      {formData.register_id || "No ID"}
                    </span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: "11px" }}>
                      <i className="bx bx-check-double me-1"></i>Eligible for Certificate
                    </span>
                  </div>

                  <div className="text-muted small mt-1 d-flex align-items-center gap-3 flex-wrap">
                    <span>
                      <i className="bx bx-book-open me-1 text-primary"></i>
                      <strong>Course:</strong> {formData.course_name || "N/A"}
                    </span>
                    {formData.whatsapp_number && (
                      <span className="text-success">
                        <i className="bx bxl-whatsapp me-1"></i>
                        <strong>WhatsApp:</strong> {formData.whatsapp_number}
                      </span>
                    )}
                    <span>
                      <i className="bx bx-calendar me-1 text-primary"></i>
                      <strong>Joined:</strong> {formData.joining_date || "N/A"}
                    </span>
                    <span className="text-primary">
                      <i className="bx bx-image me-1"></i>
                      <strong>Photo:</strong> {formData.student_photo ? "Loaded dynamically" : "Default avatar"}
                    </span>
                  </div>
                </div>
              </div>

              {!isEdit && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  style={{ borderRadius: "8px", fontWeight: "600" }}
                  onClick={openStudentModal}
                >
                  <i className="bx bx-refresh me-1"></i>Change Student
                </button>
              )}
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>
                Student Name: <span className="text-danger">*</span>
              </label>
              {isEdit ? (
                <input
                  type="text"
                  className="form-control bg-white"
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="Enter Student Name"
                  required
                />
              ) : (
                <div
                  className="input-group"
                  onClick={openStudentModal}
                  style={{ cursor: "pointer" }}
                  title="Click to select eligible student from pop-up modal"
                >
                  <span
                    className="input-group-text bg-white border-end-0"
                    style={{ borderRadius: "10px 0 0 10px", borderColor: "#CBD5E1" }}
                  >
                    <i className="bx bx-user" style={{ color: "#4F46E5", fontSize: "1.2rem" }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 border-end-0 bg-white"
                    value={formData.student_name}
                    readOnly
                    placeholder="Click here to select an eligible student..."
                    style={{
                      cursor: "pointer",
                      fontWeight: formData.student_name ? "600" : "400",
                      color: formData.student_name ? "#1E293B" : "#94A3B8"
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary d-flex align-items-center gap-1"
                    style={{
                      borderRadius: "0 10px 10px 0",
                      borderColor: "#CBD5E1",
                      backgroundColor: "#EEF2FF",
                      color: "#4F46E5",
                      fontWeight: "600"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openStudentModal();
                    }}
                  >
                    <i className="bx bx-search-alt"></i> Select
                  </button>
                </div>
              )}
              {!isEdit && (
                <small className="text-muted mt-1 d-block" style={{ fontSize: "12px" }}>
                  <i className="bx bx-info-circle me-1 text-primary"></i>
                  {formData.student_name
                    ? `Selected: ${formData.student_name} (${formData.register_id || "No ID"}). Click to change.`
                    : "Click on this field to open eligible student search modal."}
                </small>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>Register ID / Student ID:</label>
              <input
                type="text"
                className="form-control bg-light"
                value={formData.register_id}
                readOnly
                placeholder="Auto-populated upon selecting student"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>
                Student Photo:
              </label>
              <div
                className="d-flex align-items-center gap-3 p-2 border rounded-3 bg-light"
                style={{ minHeight: "44px", borderRadius: "10px" }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1.5px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    flexShrink: 0
                  }}
                >
                  {formData.student_photo ? (
                    <img
                      src={getPhotoUrl(formData.student_photo)}
                      alt={formData.student_name || "Student"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: formData.student_photo ? "none" : "flex",
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "16px",
                      color: "#94A3B8"
                    }}
                  >
                    {formData.student_name ? formData.student_name.charAt(0).toUpperCase() : <i className="bx bx-user"></i>}
                  </div>
                </div>
                <div className="text-truncate">
                  <div className="small font-weight-bold" style={{ color: "#1E293B" }}>
                    {formData.student_photo ? formData.student_photo.split("/").pop() : "No photo selected"}
                  </div>
                  <div className="text-muted" style={{ fontSize: "11px" }}>
                    {formData.student_photo ? "Photo loaded dynamically from database" : "Select an eligible student to view photo"}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#475569" }}>Course:</label>
              <input
                type="text"
                className={`form-control ${isEdit ? "bg-white" : "bg-light"}`}
                value={formData.course_name}
                onChange={(e) => isEdit && setFormData({ ...formData, course_name: e.target.value })}
                readOnly={!isEdit}
                placeholder={isEdit ? "Enter Course Name" : "Auto-populated upon selecting student"}
                required={isEdit}
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

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#4F46E5", fontSize: "15px" }}>
                WhatsApp Number:
              </label>
              <input
                type="text"
                className="form-control bg-white"
                style={{ borderRadius: "10px" }}
                placeholder="Enter Student WhatsApp number (e.g. 919876543210)"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold" style={{ color: "#4F46E5", fontSize: "15px" }}>
                Issue Date:
              </label>
              <input
                type="date"
                className="form-control form-control-lg bg-white"
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
                  {isEdit ? "Updating Certificate..." : "Generating Certificate..."}
                </>
              ) : (
                <>
                  <i className={`bx ${isEdit ? "bx-save" : "bx-award"} me-1`}></i>
                  {isEdit ? "Save & Update Certificate" : "Generate Certificate"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* POP-UP MODAL: SEARCH BAR AND ELIGIBLE STUDENT LIST                        */}
      {/* ========================================================================= */}
      {showStudentModal && (
        <div className="popup-overlay" onClick={() => setShowStudentModal(false)}>
          <div
            className="student-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius: "16px",
              maxWidth: "680px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)"
            }}
          >
            {/* Modal Header */}
            <div className="popup-header d-flex justify-content-between align-items-center px-4 py-3 border-bottom bg-white">
              <div>
                <h4 className="mb-0 d-flex align-items-center gap-2" style={{ color: "#1E293B", fontWeight: "700", fontSize: "18px" }}>
                  <i className="bx bx-user-check" style={{ color: "#4F46E5", fontSize: "22px" }}></i>
                  Select Eligible Student
                </h4>
                <p className="text-muted small mb-0 mt-1">
                  Choose an eligible student to automatically populate certificate details
                </p>
              </div>
              <button
                type="button"
                className="close-btn"
                style={{ fontSize: "26px", lineHeight: "1" }}
                onClick={() => setShowStudentModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-bottom" style={{ backgroundColor: "#F8FAFC" }}>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0" style={{ borderRadius: "10px 0 0 10px", borderColor: "#CBD5E1" }}>
                  <i className="bx bx-search text-muted" style={{ fontSize: "18px" }}></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-white"
                  style={{ borderRadius: "0 10px 10px 0", borderColor: "#CBD5E1" }}
                  placeholder="Search by student name, register ID, email, or WhatsApp..."
                  value={modalSearchQuery}
                  onChange={(e) => {
                    setModalSearchQuery(e.target.value);
                    handleSearchStudents(e.target.value);
                  }}
                  autoFocus
                />
                {modalSearchQuery && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0"
                    style={{ borderColor: "#CBD5E1" }}
                    onClick={() => {
                      setModalSearchQuery("");
                      handleSearchStudents("");
                    }}
                  >
                    <i className="bx bx-x"></i>
                  </button>
                )}
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2 px-1">
                <span className="text-muted small">
                  <i className="bx bx-list-check me-1 text-primary"></i>
                  {searching ? "Searching candidates..." : `${eligibleStudents.length} eligible student${eligibleStudents.length === 1 ? "" : "s"} found`}
                </span>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style={{ fontSize: "11px" }}>
                  <i className="bx bx-check-double me-1"></i> Assignment & Assessment Completed
                </span>
              </div>
            </div>

            {/* Modal Student List */}
            <div className="p-3 overflow-auto flex-grow-1" style={{ maxHeight: "420px" }}>
              {searching ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border text-primary mb-2" role="status"></div>
                  <div>Searching eligible students...</div>
                </div>
              ) : eligibleStudents.length > 0 ? (
                eligibleStudents.map((st) => {
                  const isSelected = formData.register_id === st.register_id;
                  return (
                    <div
                      key={st.register_id || st.enrollment_id}
                      className="result-item p-3 mb-2 rounded border d-flex justify-content-between align-items-center"
                      style={{
                        cursor: "pointer",
                        background: isSelected ? "#EEF2FF" : "#FFFFFF",
                        borderColor: isSelected ? "#6366F1" : "#E2E8F0",
                        transition: "all 0.15s ease",
                        borderRadius: "12px"
                      }}
                      onClick={() => handleSelectStudent(st)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: isSelected ? "2px solid #4F46E5" : "1.5px solid #E2E8F0",
                            backgroundColor: "#EEF2FF",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.06)",
                            flexShrink: 0
                          }}
                        >
                          {st.student_photo ? (
                            <img
                              src={getPhotoUrl(st.student_photo)}
                              alt={st.student_name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                e.target.style.display = "none";
                                if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            style={{
                              display: st.student_photo ? "none" : "flex",
                              width: "100%",
                              height: "100%",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "16px",
                              color: isSelected ? "#4F46E5" : "#6366F1",
                              backgroundColor: "#EEF2FF"
                            }}
                          >
                            {st.student_name ? st.student_name.charAt(0).toUpperCase() : "S"}
                          </div>
                        </div>
                        <div>
                          <div className="font-weight-bold" style={{ color: "#1E293B", fontSize: "15px" }}>
                            {st.student_name}
                            <span className="badge bg-light text-primary border ms-2" style={{ fontSize: "11px" }}>
                              {st.register_id}
                            </span>
                          </div>
                          <div className="text-muted small mt-1 d-flex gap-3 flex-wrap">
                            <span>
                              <i className="bx bx-book-open me-1 text-primary"></i> {st.course_name}
                            </span>
                            {st.whatsapp_number && (
                              <span className="text-success">
                                <i className="bx bxl-whatsapp me-1"></i> {st.whatsapp_number}
                              </span>
                            )}
                            {st.assignment_score != null && (
                              <span className="text-muted">
                                Score: <strong>{st.assessment_score || st.assignment_score}%</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            backgroundColor: isSelected ? "#4F46E5" : "#6366F1",
                            borderColor: "#4F46E5",
                            color: "#FFFFFF",
                            borderRadius: "8px",
                            padding: "6px 14px",
                            fontWeight: "600"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStudent(st);
                          }}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-muted">
                  <i className="bx bx-user-x text-warning" style={{ fontSize: "2.8rem" }}></i>
                  <p className="mt-2 mb-1 font-weight-bold text-dark" style={{ fontSize: "15px" }}>
                    No eligible students found
                  </p>
                  <p className="small text-muted mb-0">
                    {modalSearchQuery
                      ? `No eligible candidates match "${modalSearchQuery}".`
                      : "All eligible students already have certificates, or haven't completed their assignments and assessments."}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-top bg-light d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-secondary px-4"
                style={{ borderRadius: "8px", fontWeight: "500" }}
                onClick={() => setShowStudentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Addcertificate;
