import React, { useState, useContext } from "react";
import "./viewcertificate.css";
import AuthContext from "../../../services/AuthContext";

function Viewcertificate({ toggle, cert }) {
  const { API_URL } = useContext(AuthContext);
  const [waStatus, setWaStatus] = useState("idle");

  if (!cert) return null;

  const imageUrl = `${API_URL}${cert.certificate_image}${cert.certificate_image?.includes('?') ? '&' : '?'}t=${Date.now()}`;

  const getDownloadUrl = (registerId) => {
    return `${API_URL}/adm/download_certificate_jpg?register_id=${registerId}`;
  };

  const handleDownload = () => {
    const downloadUrl = getDownloadUrl(cert.register_id || cert.certificate_id);
    window.open(downloadUrl, "_blank");
  };

  const handleWhatsApp = async () => {
    setWaStatus("loading");

    try {
      const response = await fetch(`${API_URL}/adm/send_certificate_whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate_id: cert.certificate_id || cert.register_id })
      });

      const res = await response.json();

      if (response.ok && res.success !== false) {
        alert(res.message || "Certificate sent successfully");
        setWaStatus("sent");
      } else {
        alert(res?.message || "Failed to send certificate via WhatsApp.");
        setWaStatus("error");
      }
    } catch (err) {
      console.error("WhatsApp send error:", err);
      alert(err.message || "Failed to send certificate via WhatsApp.");
      setWaStatus("error");
    } finally {
      setTimeout(() => setWaStatus("idle"), 3000);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className="popup-header">
          <h4>Certificate Preview - {cert.register_id || cert.certificate_id} ({cert.student_name})</h4>
          <button className="close-btn" onClick={toggle}>
            &times;
          </button>
        </div>

        <div className="popup-body">
          <img src={imageUrl} alt="Certificate JPG" className="cert-preview-img mb-3 border" />

          <div className="d-flex justify-content-center gap-2 mt-3">
            <button className="btn btn-success" onClick={handleDownload} title="Download JPG">
              <i className="bx bx-download me-1"></i> Download JPG
            </button>

            {waStatus === "loading" && (
              <button className="btn btn-outline-success" style={{ borderColor: "#25D366" }} title="Sending..." disabled>
                <span className="spinner-border spinner-border-sm text-success" role="status"></span>
              </button>
            )}

            {waStatus === "sent" && (
              <button className="btn btn-success" style={{ backgroundColor: "#25D366", borderColor: "#25D366" }} title="Sent!">
                <i className="bx bx-check"></i>
              </button>
            )}

            {waStatus === "error" && (
              <button className="btn btn-danger" onClick={handleWhatsApp} title="Failed / Missing WhatsApp Number">
                <i className="bx bx-error-circle"></i>
              </button>
            )}

            {waStatus === "idle" && (
              <button className="btn btn-action btn-whatsapp" style={{ color: "#25D366", borderColor: "#25D366" }} onClick={handleWhatsApp} title="Share on WhatsApp">
                <i className="bx bxl-whatsapp"></i>
              </button>
            )}

            <button className="btn btn-secondary" onClick={toggle}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Viewcertificate;
