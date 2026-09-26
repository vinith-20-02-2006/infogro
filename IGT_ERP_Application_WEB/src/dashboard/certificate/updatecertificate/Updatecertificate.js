import React, { useState, useEffect } from "react";
import "./updatecertificate.css";
import CertificateService from "../CertificateService";

function Updatecertificate({ toggle, data, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    certificate_id: "",
    register_id: "",
    student_name: "",
    course_name: "",
    issue_date: "",
    whatsapp_number: "",
  });

  useEffect(() => {
    if (data) {
      let formattedDate = data.raw_issue_date;
      if (!formattedDate && data.issue_date) {
        if (data.issue_date.includes('/')) {
          const parts = data.issue_date.split('/');
          if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        } else {
          formattedDate = data.issue_date;
        }
      }
      if (!formattedDate) {
        formattedDate = new Date().toISOString().split("T")[0];
      }

      const certId = data.certificate_id || data.register_id || "";
      const regId = data.register_id || data.certificate_id || "";

      setEditData({
        certificate_id: certId,
        register_id: regId,
        student_name: data.student_name || "",
        course_name: data.course_name || "",
        issue_date: formattedDate,
        whatsapp_number: data.whatsapp_number || "",
      });
    }
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await CertificateService.updateCertificate(editData);
      if (onSuccess) onSuccess();
      toggle();
    } catch (err) {
      console.error("Update error:", err);
      alert(err.message || "Failed to update certificate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content shadow-lg border-0">
        <div className="popup-header">
          <h4>Edit Certificate Information</h4>
          <button className="close-btn" onClick={toggle}>
            &times;
          </button>
        </div>

        <div className="popup-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label font-weight-bold">Register ID / Student ID:</label>
              <input type="text" className="form-control bg-light" value={editData.register_id} readOnly />
            </div>

            <div className="mb-3">
              <label className="form-label font-weight-bold">Student Name:</label>
              <input
                type="text"
                className="form-control"
                value={editData.student_name}
                onChange={(e) => setEditData({ ...editData, student_name: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label font-weight-bold">Course Name:</label>
              <input
                type="text"
                className="form-control"
                value={editData.course_name}
                onChange={(e) => setEditData({ ...editData, course_name: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label font-weight-bold">WhatsApp Number:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Student WhatsApp number (e.g. 917010835939)"
                value={editData.whatsapp_number}
                onChange={(e) => setEditData({ ...editData, whatsapp_number: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label font-weight-bold">Issue Date:</label>
              <input
                type="date"
                className="form-control"
                value={editData.issue_date}
                onChange={(e) => setEditData({ ...editData, issue_date: e.target.value })}
                required
              />
            </div>

            <div className="popup-footer mt-4 text-end">
              <button type="button" className="btn btn-secondary me-2" onClick={toggle} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ background: "#4F46E5", border: "none" }} disabled={loading}>
                {loading ? "Saving..." : "Save & Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Updatecertificate;
