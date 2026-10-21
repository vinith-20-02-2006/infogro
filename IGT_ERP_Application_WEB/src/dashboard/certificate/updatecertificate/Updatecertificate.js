import React, { useState, useEffect, useContext } from "react";
import "./updatecertificate.css";
import AuthContext from "../../../services/AuthContext";

function Updatecertificate({ toggle, data, onSuccess }) {
  const { update, API_URL } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

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

  const [editData, setEditData] = useState({
    certificate_id: "",
    register_id: "",
    student_name: "",
    course_name: "",
    issue_date: "",
    whatsapp_number: "",
    student_photo: "",
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
        student_photo: data.student_photo || "",
      });
    }
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await update(editData, "update_certificate");
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
            {/* Student Photo Profile Preview */}
            <div
              className="d-flex align-items-center gap-3 p-3 mb-3 rounded-3"
              style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE", borderRadius: "12px" }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "2px solid #4F46E5",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 6px rgba(79, 70, 229, 0.15)",
                  flexShrink: 0
                }}
              >
                {editData.student_photo ? (
                  <img
                    src={getPhotoUrl(editData.student_photo)}
                    alt={editData.student_name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  style={{
                    display: editData.student_photo ? "none" : "flex",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "20px",
                    color: "#4F46E5",
                    backgroundColor: "#EEF2FF"
                  }}
                >
                  {editData.student_name ? editData.student_name.charAt(0).toUpperCase() : "S"}
                </div>
              </div>
              <div>
                <h6 className="mb-1 font-weight-bold" style={{ color: "#1E293B" }}>
                  {editData.student_name || "Student"}
                </h6>
                <div className="text-muted small">
                  <span className="badge bg-primary me-2">{editData.register_id}</span>
                  {editData.student_photo ? "Dynamic photo linked" : "Default avatar"}
                </div>
              </div>
            </div>

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
