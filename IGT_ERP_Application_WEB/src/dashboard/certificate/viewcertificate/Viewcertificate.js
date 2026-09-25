import React from "react";
import "./viewcertificate.css";
import CertificateService from "../../../services/CertificateService";

function Viewcertificate({ toggle, cert }) {
  if (!cert) return null;

  const API_URL = CertificateService.getApiUrl();
  const imageUrl = `${API_URL}${cert.certificate_image}${cert.certificate_image?.includes('?') ? '&' : '?'}t=${Date.now()}`;

  const handleDownload = () => {
    const downloadUrl = CertificateService.getDownloadUrl(cert.register_id || cert.certificate_id);
    window.open(downloadUrl, "_blank");
  };

  const handleWhatsApp = async () => {
    let rawPhone = cert.whatsapp_number || cert.phone_number;
    if (!rawPhone || !String(rawPhone).trim()) {
      const enteredPhone = window.prompt(`Enter WhatsApp number for ${cert.student_name || 'Student'}:`, "917010835939");
      if (!enteredPhone || !enteredPhone.trim()) return;
      rawPhone = enteredPhone.trim();
      try {
        await CertificateService.updateCertificate({
          certificate_id: cert.register_id || cert.certificate_id,
          whatsapp_number: rawPhone
        });
        cert.whatsapp_number = rawPhone;
      } catch (e) {
        console.log("Failed to save entered WhatsApp number:", e);
      }
    }
    let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      alert("Valid WhatsApp number is required.");
      return;
    }
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    const certId = cert.register_id || cert.certificate_id;
    const recipient = cert.student_name || "Student";
    const course = cert.course_name || "Course";
    const downloadUrl = CertificateService.getDownloadUrl(certId);

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();

      // 1. Copy JPG image to clipboard for instant Ctrl+V paste in WhatsApp chat
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

    // 2. Directly open WhatsApp chat for student's registered WhatsApp number (without file download)
    const message = `🎓 *CERTIFICATE OF COMPLETION (JPG FORMAT)*\n\nStudent Name: *${recipient}*\nCourse: *${course}*\nCertificate ID: *${certId}*\n\nDirect JPG Certificate Image Link:\n${downloadUrl}\n\n_(Press Ctrl+V in WhatsApp to paste the JPG image directly!)_`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content shadow-lg border-0" style={{ maxWidth: "800px" }}>
        <div className="popup-header">
          <h4>Certificate Preview - {cert.register_id || cert.certificate_id} ({cert.student_name})</h4>
          <button className="close-btn" onClick={toggle}>
            &times;
          </button>
        </div>

        <div className="popup-body text-center">
          <img src={imageUrl} alt="Certificate JPG" className="img-fluid rounded mb-3 shadow-sm border" style={{ maxHeight: "500px" }} />

          <div className="d-flex justify-content-center gap-2 mt-3">
            <button className="btn btn-success" onClick={handleDownload}>
              <i className="bx bx-download me-1"></i> Download JPG
            </button>
            <button className="btn btn-primary" style={{ background: "#25D366", border: "none" }} onClick={handleWhatsApp}>
              <i className="bx bxl-whatsapp me-1"></i> Share WhatsApp
            </button>
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
