import React, { useState, useEffect, useCallback } from "react";
import "./Certificate.css";

const API_URL = "http://127.0.0.1:8000";

const Certificate = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Page View Mode: 'list' (default table view) or 'add' (full-page Add Certificate screen)
  const [viewMode, setViewMode] = useState("list");

  // Modals state for Table Actions (View Image & Edit)
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Selected item for View or Edit
  const [selectedCert, setSelectedCert] = useState(null);

  // Search & Eligible Students State
  const [searchQuery, setSearchQuery] = useState("");
  const [eligibleStudents, setEligibleStudents] = useState([]);


  // Form Fields for Certificate Generation
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

  // Edit Form Fields
  const [editData, setEditData] = useState({
    certificate_id: "",
    register_id: "",
    student_name: "",
    course_name: "",
    issue_date: "",
  });

  // 1. Fetch All Certificates for Table Page
  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/certificate/list_certificates`);
      if (res.ok) {
        const data = await res.json();
        setCertificates(data);
      }
    } catch (err) {
      console.error("Error fetching certificates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // 2. Search Eligible Students
  const handleSearchStudents = async (query) => {
    setSearchQuery(query);
    if (!query || query.trim().length === 0) {
      try {
        const res = await fetch(`${API_URL}/certificate/search_eligible_students`);
        if (res.ok) {
          const data = await res.json();
          setEligibleStudents(data);
        }
      } catch (err) {
        console.error("Search error:", err);
      }
      return;
    }

    try {
      const res = await fetch(`${API_URL}/certificate/search_eligible_students?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setEligibleStudents(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // Open Full-Page Add Certificate Screen
  const openAddPage = () => {
    setViewMode("add");
    setSearchQuery("");
    setFormData({
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
    handleSearchStudents("");
  };

  // 3. Select Eligible Student from Search Results -> Auto Populate Form
  const handleSelectStudent = (student) => {
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

  // 4. Submit / Generate Certificate
  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    if (!formData.student_name || !formData.course_name) {
      alert("Please search and select an eligible student to generate a certificate.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/certificate/generate_certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Certificate generated successfully!");
        setViewMode("list");
        fetchCertificates();
      } else {
        alert(data.message || "Failed to generate certificate.");
      }
    } catch (err) {
      console.error("Generation error:", err);
      alert("Error generating certificate.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Action: View Certificate Image Modal
  const handleViewCert = (cert) => {
    setSelectedCert(cert);
    setShowViewModal(true);
  };

  // 6. Action: Download Certificate JPG
  const handleDownloadCert = (registerId) => {
    const downloadUrl = `${API_URL}/certificate/download_certificate_jpg?register_id=${registerId}`;
    window.open(downloadUrl, "_blank");
  };

  // 7. Action: WhatsApp Share
  const handleWhatsAppShare = (cert) => {
    const certId = cert.register_id || cert.certificate_id;
    const recipient = cert.student_name || "Student";
    const course = cert.course_name || "Course";

    const text = `Congratulations ${recipient}! You have successfully completed the ${course} course at IGT ERP Academy.\n\nStudent ID: ${certId}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };


  // 8. Action: Open Edit Modal
  const handleOpenEdit = (cert) => {
    setSelectedCert(cert);
    setEditData({
      certificate_id: cert.certificate_id,
      register_id: cert.register_id,
      student_name: cert.student_name,
      course_name: cert.course_name,
      issue_date: cert.raw_issue_date || new Date().toISOString().split("T")[0],
    });
    setShowEditModal(true);
  };

  // 9. Action: Save Edit Certificate Changes
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/certificate/update_certificate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        setShowEditModal(false);
        fetchCertificates();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update certificate.");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Error updating certificate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="certificate-page-container container-xxl">
      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 1: CERTIFICATE TABLE LIST PAGE (DEFAULT)                        */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <div className="certificate-card-main">
          {/* Header matching reference UI screenshot */}
          <div className="cert-header-bar">
            <div className="cert-header-left">
              <div className="cert-header-icon-bg">
                <i className="bx bx-user-check"></i>
              </div>
              <h4 className="cert-header-title">VIEW CERTIFICATE</h4>
            </div>

            <button className="btn-add-cert" onClick={openAddPage}>
              <i className="bx bx-user-plus"></i> + Add Certificate
            </button>
          </div>

          {/* Certificate Table */}
          <div className="cert-table-wrapper">
            <table className="cert-custom-table">
              <thead>
                <tr>
                  <th>STUDENT ID</th>
                  <th>STUDENT NAME</th>
                  <th>COURSE</th>
                  <th>ISSUE DATE</th>
                  <th>CERTIFICATE</th>
                  <th>DOWNLOAD</th>
                  <th>SHARE</th>
                  <th>EDIT</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length > 0 ? (
                  certificates.map((row, index) => (
                    <tr key={row.certificate_id || index}>
                      <td className="font-weight-bold" style={{ color: "#566a7f" }}>
                        {row.register_id || row.certificate_id}
                      </td>
                      <td style={{ color: "#435971", fontWeight: "500" }}>{row.student_name}</td>
                      <td style={{ color: "#697a8d" }}>{row.course_name}</td>
                      <td style={{ color: "#697a8d" }}>{row.issue_date}</td>

                      {/* View Action (Eye icon) */}
                      <td>
                        <button
                          className="icon-btn-action icon-btn-view"
                          title="View Certificate JPG"
                          onClick={() => handleViewCert(row)}
                        >
                          <i className="bx bx-show"></i>
                        </button>
                      </td>

                      {/* Download Action (Download icon) */}
                      <td>
                        <button
                          className="icon-btn-action icon-btn-download"
                          title="Download Certificate JPG"
                          onClick={() => handleDownloadCert(row.register_id)}
                        >
                          <i className="bx bx-download"></i>
                        </button>
                      </td>

                      {/* Share Action (WhatsApp icon) */}
                      <td>
                        <button
                          className="icon-btn-action icon-btn-share"
                          title="Share on WhatsApp"
                          onClick={() => handleWhatsAppShare(row)}
                        >
                          <i className="bx bxl-whatsapp"></i>
                        </button>
                      </td>

                      {/* Edit Action (Edit icon) */}
                      <td>
                        <button
                          className="icon-btn-action icon-btn-edit"
                          title="Edit Certificate"
                          onClick={() => handleOpenEdit(row)}
                        >
                          <i className="bx bx-edit-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      {loading ? "Loading certificates..." : "No certificates generated yet. Click '+ Add Certificate' to create one."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: FULL-PAGE ADD CERTIFICATE SCREEN                             */}
      {/* ========================================================================= */}
      {viewMode === "add" && (
        <div className="certificate-card-main">
          {/* Full Page Header */}
          <div className="cert-header-bar border-bottom pb-3 mb-4">
            <div className="cert-header-left">
              <div className="cert-header-icon-bg">
                <i className="bx bx-user-plus"></i>
              </div>
              <h4 className="cert-header-title">ADD CERTIFICATE</h4>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={() => setViewMode("list")}
            >
              <i className="bx bx-arrow-back"></i> Back to Certificate List
            </button>
          </div>

          <div className="cert-fullpage-body">
            {/* 1. Search Eligible Student Bar */}
            <div className="card p-3 mb-4 border-0 bg-light">
              <label className="form-label font-weight-bold" style={{ color: "#0F4C81", fontSize: "16px" }}>
                <i className="bx bx-search-alt me-1"></i> Search Eligible Student (Name or Register ID):
              </label>
              <input
                type="text"
                className="form-control form-control-lg bg-white"
                placeholder="Type Student Name or Register ID (e.g. Priya or IGP001)..."
                value={searchQuery}
                onChange={(e) => handleSearchStudents(e.target.value)}
              />

              {/* Autocomplete Results List */}
              {eligibleStudents.length > 0 && (
                <div className="search-results-list shadow-sm mt-2">
                  {eligibleStudents.map((st) => (
                    <div
                      key={st.register_id || st.enrollment_id}
                      className="search-result-item"
                      onClick={() => handleSelectStudent(st)}
                    >
                      <div>
                        <strong>{st.student_name}</strong> ({st.register_id}) -{" "}
                        <span className="text-muted">{st.course_name}</span>
                      </div>
                      <span className="badge-eligible">
                        <i className="bx bx-check-circle me-1"></i> Assignment & Assessment Completed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Full Page Certificate Generation Form */}
            <form onSubmit={handleGenerateCertificate}>
              <h5 className="mb-3 font-weight-bold" style={{ color: "#0F4C81" }}>
                Student Certificate Details
              </h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label font-weight-bold">Register ID / Student ID:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.register_id}
                    readOnly
                    placeholder="Select an eligible student above"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label font-weight-bold">Student Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.student_name}
                    readOnly
                    placeholder="Select an eligible student above"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label font-weight-bold">Course:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.course_name}
                    readOnly
                    placeholder="Select an eligible student above"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label font-weight-bold">Joining / Starting Date:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.joining_date}
                    readOnly
                    placeholder="Auto-populated"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label font-weight-bold">Assignment Status:</label>
                  <input
                    type="text"
                    className="form-control text-success font-weight-bold"
                    value={formData.assignment_status}
                    readOnly
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label font-weight-bold">Assessment Status:</label>
                  <input
                    type="text"
                    className="form-control text-success font-weight-bold"
                    value={formData.assessment_status}
                    readOnly
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label font-weight-bold">Assignment Score:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.assignment_score}
                    readOnly
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label font-weight-bold">Assessment Score:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.assessment_score}
                    readOnly
                  />
                </div>

                <div className="col-md-12">
                  <label className="form-label font-weight-bold" style={{ color: "#0F4C81", fontSize: "15px" }}>
                    Issue Date:
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-lg"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Page Footer Actions */}
              <div className="mt-4 pt-3 border-top text-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-lg me-3"
                  onClick={() => setViewMode("list")}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ backgroundColor: "#0F4C81", borderColor: "#0F4C81" }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Generating JPG Certificate...
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
      )}

      {/* ========================================================================= */}
      {/* VIEW CERTIFICATE IMAGE MODAL                                              */}
      {/* ========================================================================= */}
      {showViewModal && selectedCert && (
        <div className="cert-modal-overlay">
          <div className="cert-modal-box" style={{ maxWidth: "800px" }}>
            <div className="cert-modal-header">
              <h5 className="cert-modal-title">
                Certificate Preview - {selectedCert.register_id || selectedCert.certificate_id} ({selectedCert.student_name})
              </h5>
              <button className="cert-modal-close" onClick={() => setShowViewModal(false)}>
                &times;
              </button>
            </div>
            <div className="cert-modal-body text-center">
              <img
                src={`${API_URL}${selectedCert.certificate_image}`}
                alt="Certificate JPG"
                className="cert-preview-img mb-3"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${API_URL}/media/certificates/certificate_${selectedCert.register_id}.jpg`;
                }}
              />
              <div className="d-flex justify-content-center gap-3">
                <button
                  className="btn btn-success"
                  onClick={() => handleDownloadCert(selectedCert.register_id)}
                >
                  <i className="bx bx-download me-1"></i> Download JPG
                </button>
                <button
                  className="btn btn-whatsapp"
                  onClick={() => handleWhatsAppShare(selectedCert)}
                >
                  <i className="bx bxl-whatsapp me-1"></i> Share WhatsApp
                </button>
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CERTIFICATE MODAL                                                    */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="cert-modal-overlay">
          <div className="cert-modal-box">
            <div className="cert-modal-header">
              <h5 className="cert-modal-title">Edit Certificate Information</h5>
              <button className="cert-modal-close" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>
            <div className="cert-modal-body">
              <form onSubmit={handleSaveEdit}>
                <div className="mb-3">
                  <label className="form-label">Register ID / Student ID:</label>
                  <input type="text" className="form-control" value={editData.register_id} readOnly />
                </div>

                <div className="mb-3">
                  <label className="form-label">Student Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editData.student_name}
                    onChange={(e) => setEditData({ ...editData, student_name: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Course Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editData.course_name}
                    onChange={(e) => setEditData({ ...editData, course_name: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Issue Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editData.issue_date}
                    onChange={(e) => setEditData({ ...editData, issue_date: e.target.value })}
                    required
                  />
                </div>

                <div className="text-end mt-4">
                  <button type="button" className="btn btn-secondary me-2" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#0F4C81" }} disabled={loading}>
                    {loading ? "Saving..." : "Save & Regenerate Certificate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificate;
