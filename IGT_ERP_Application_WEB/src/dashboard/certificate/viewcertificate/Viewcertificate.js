import React, { useState } from "react";
import "./viewcertificate.css";
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return "http://127.0.0.1:8000";
};

const API_URL = getApiUrl();

const getDownloadUrl = (registerId) => {
  return `${API_URL}/certificate/download_certificate_jpg?register_id=${registerId}`;
};

function Viewcertificate({ toggle, cert }) {
  const [waStatus, setWaStatus] = useState("idle");

  if (!cert) return null;

  const imageUrl = `${API_URL}${cert.certificate_image}${cert.certificate_image?.includes('?') ? '&' : '?'}t=${Date.now()}`;

  const handleDownload = () => {
    const downloadUrl = getDownloadUrl(cert.register_id || cert.certificate_id);
    window.open(downloadUrl, "_blank");
  };

  const handleWhatsApp = async () => {
    setWaStatus("loading");

    let rawPhone = cert.whatsapp_number || cert.phone_number;
    if (!rawPhone || !String(rawPhone).trim()) {
      setWaStatus("error");
      alert(`Student ${cert.student_name || 'Student'} does not have a valid registered WhatsApp number in the database.`);
      setTimeout(() => setWaStatus("idle"), 3000);
      return;
    }

    let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      setWaStatus("error");
      alert("Valid registered WhatsApp number is required.");
      setTimeout(() => setWaStatus("idle"), 3000);
      return;
    }
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    const certId = cert.register_id || cert.certificate_id;
    const recipient = cert.student_name || "Student";
    const course = cert.course_name || "Course";
    const downloadUrl = getDownloadUrl(certId);

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/jpeg": blob })
          ]);
        } catch (clipErr) {
          console.log("Clipboard write image failed:", clipErr);
        }
      }
    } catch (err) {
      console.log("Fetch certificate image blob failed:", err);
    }

    const message = `🎓 *CERTIFICATE OF COMPLETION (JPG FORMAT)*\n\nStudent Name: *${recipient}*\nCourse: *${course}*\nCertificate ID: *${certId}*\n\nDirect JPG Certificate Image Link:\n${downloadUrl}\n\n_(Press Ctrl+V in WhatsApp to paste the JPG image directly!)_`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");

    setWaStatus("sent");
    setTimeout(() => setWaStatus("idle"), 4000);
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
